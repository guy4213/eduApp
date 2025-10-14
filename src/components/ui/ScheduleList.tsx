import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthProvider";
import { Check } from "lucide-react";

export const ScheduleList: React.FC<any> = ({ lessons,selectedDate }) => {
  const nav = useNavigate();
  const [instructors, setInstructors] = useState<
    { id: string; full_name: string }[]
  >([]);
  const [reportedScheduleIds, setReportedScheduleIds] = useState<Set<string>>(
    new Set()
  );
  const [reportStatusMap, setReportStatusMap] = useState<Map<string, {isCompleted: boolean, isLessonOk: boolean, reportId?: string}>>(
    new Map()
  );
  const { user } = useAuth();


const sortedLessons = lessons.sort((a, b) => {
  const timeA = new Date(a.scheduled_start).getTime();
  const timeB = new Date(b.scheduled_start).getTime();
  return timeA - timeB;
});

  useEffect(() => {
    const fetchInstructors = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor");

      if (error) {
        console.error("Error fetching instructors:", error.message);
      } else {
        setInstructors(data || []);
      }
    };

    fetchInstructors();
  }, []);

    const fetchReportedSchedules = async () => {
    // Get lesson reports with their associated reported_lesson_instances
    const { data: lessonReports, error } = await supabase
      .from("lesson_reports")
      .select(`
        id,
        is_completed,
        is_lesson_ok,
        reported_lesson_instances (
          lesson_schedule_id,
          course_instance_id,
          lesson_id,
          scheduled_date
        )
      `);

    if (error) {
      console.error("Error fetching lesson reports:", error.message);
      return;
    }

    // Create a set of reported lesson instance IDs and status map
    const reportedIds = new Set<string>();
    const statusMap = new Map<string, {isCompleted: boolean, isLessonOk: boolean, reportId?: string}>();
    
    lessonReports?.forEach((report: any) => {
      // A lesson report can have multiple reported_lesson_instances
      report.reported_lesson_instances?.forEach((instance: any) => {
        let key = '';
        if (instance.lesson_schedule_id) {
          // Legacy architecture: use lesson_schedule_id
          key = instance.lesson_schedule_id;
          reportedIds.add(instance.lesson_schedule_id);
        } else if (instance.course_instance_id && instance.lesson_id) {
          // New architecture: create a composite key for course_instance_id + lesson_id
          key = `${instance.course_instance_id}_${instance.lesson_id}`;
          reportedIds.add(key);
        }

        // Store the status for this lesson
        if (key) {
          statusMap.set(key, {
            isCompleted: report.is_completed !== false, // Default to true if null
            isLessonOk: report.is_lesson_ok || false,
            reportId: report.id
          });
        }
      });
    });

    setReportedScheduleIds(reportedIds);
    setReportStatusMap(statusMap);
  };

  useEffect(() => {
    fetchReportedSchedules();
    
    // Set up real-time subscription to listen for changes
    const channel = supabase
      .channel('lesson_reports_changes_schedule')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_reports'
        },
        () => {
          console.log('ScheduleList: Lesson report changed, refreshing...');
          fetchReportedSchedules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen for lesson report updates from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lessonReportUpdated') {
        console.log('ScheduleList: Lesson report updated via storage, refreshing...');
        fetchReportedSchedules();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events
    const handleCustomEvent = () => {
      console.log('ScheduleList: Custom lesson report event, refreshing...');
      fetchReportedSchedules();
    };
    
    window.addEventListener('lessonReportUpdated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lessonReportUpdated', handleCustomEvent);
    };
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const instructorMap = useMemo(() => {
    const map = new Map<string, string>();
    instructors.forEach((instr) => map.set(instr.id, instr.full_name));
    return map;
  }, [instructors]);

  // Function to get report ID for a specific lesson
  const getReportIdForLesson = (lessonItem: any) => {
    // Try to find a report that matches this lesson
    let key = '';
    if (lessonItem.id) {
      // Try legacy architecture first
      key = lessonItem.id;
    } else if (lessonItem.course_instance_id && lessonItem.lesson?.id) {
      // Try new architecture
      key = `${lessonItem.course_instance_id}_${lessonItem.lesson.id}`;
    }
    
    if (key && reportStatusMap.has(key)) {
      const status = reportStatusMap.get(key);
      return status?.reportId || null;
    }
    return null;
  };

  return (
    <div className="schedule-list-container flex flex-col gap-3 px-2 py-4 sm:px-4 sm:py-6 max-w-4xl w-full mx-auto">
      {sortedLessons.map((item, index) => {
        console.log('item',item)
        const instructorName =
          instructorMap.get(item?.course_instances?.instructor?.id) ||
          item?.course_instances?.instructor?.full_name ||
          "שם לא נמצא";

        const startTime = formatTime(item.scheduled_start);
        const endTime = formatTime(item.scheduled_end);

        // Check if lesson is reported - handle both old and new architecture
        const isReported = reportedScheduleIds.has(item.id) || 
                          (item.course_instance_id && item.lesson?.id && 
                           reportedScheduleIds.has(`${item.course_instance_id}_${item.lesson.id}`));

        // Get lesson status for reported lessons
        const statusKey = reportedScheduleIds.has(item.id) ? item.id : 
                         (item.course_instance_id && item.lesson?.id ? `${item.course_instance_id}_${item.lesson.id}` : '');
        const lessonStatus = reportStatusMap.get(statusKey);

        // Function to render status badge
        // const renderStatusBadge = () => {
        //   if (!isReported) {
        //     return user.user_metadata.role === "instructor" ? (
        //       <button
        //         onClick={() =>
        //           nav(`/lesson-report/${item?.lesson?.id}?courseInstanceId=${item.course_instance_id}`)
        //         }
        //         className="bg-blue-500 text-white px-4 py-3 rounded-full font-bold text-base transition-colors hover:bg-blue-600 shadow-md"
        //       >
        //         📋 דווח על השיעור
        //       </button>
        //     ) : (
        //       <span className="inline-flex items-center gap-2 text-base font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
        //         📋 טרם דווח
        //       </span>
        //     );
        //   }

        //   if (lessonStatus?.isCompleted === false) {
        //     return (
        //       <span 
        //         className="inline-flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full text-white"
        //         style={{backgroundColor: '#FFA500'}}
        //       >
        //         ❌ לא התקיים
        //       </span>
        //     );
        //   }

        //   if (lessonStatus?.isCompleted === false) {
        //     return (
        //       <span 
        //         className="inline-flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full text-white"
        //         style={{backgroundColor: '#FFA500'}}
        //       >
        //         ❌ לא התקיים
        //       </span>
        //     );
        //   }

        //   if (lessonStatus?.isCompleted && lessonStatus?.isLessonOk === false) {
        //     return (
        //       <span 
        //         className="inline-flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full text-white"
        //         style={{backgroundColor: '#FF0000'}}
        //       >
        //         ⚠️ לא התנהל כשורה
        //       </span>
        //     );
        //   }

        //   return (
        //     <span className="inline-flex items-center gap-2 text-base font-bold text-green-700 bg-green-100 px-4 py-2 rounded-full">
        //       <Check className="w-5 h-5" /> דווח
        //     </span>
        //   );
        // };

const renderStatusBadge = () => {
  // הוסף את זה כדי לדבג מה קורה
  console.log('Debug info:', {
    isReported,
    lessonStatus,
    userRole: user.user_metadata.role,
    itemId: item?.id,
    lessonId: item?.lesson?.id
  });

  // בדיקות הלוגיקה הקיימת
  if (lessonStatus?.isCompleted === false) {
    console.log('Returning: לא התקיים');
    return (
      <span 
        className="inline-flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full text-white"
        style={{backgroundColor: '#FFA500'}}
      >
        ❌ לא התקיים
      </span>
    );
  }

  if (lessonStatus?.isCompleted && lessonStatus?.isLessonOk === false) {
    console.log('Returning: לא התנהל כשורה');
    return (
      <span 
        className="inline-flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full text-white"
        style={{backgroundColor: '#FF0000'}}
      >
        ⚠️ לא התנהל כשורה
      </span>
    );
  }

  if (lessonStatus?.isCompleted === true) {
    console.log('Returning: דווח (completed=true)');
    const canEdit = ['admin', 'pedagogical_manager'].includes(user.user_metadata.role);
    
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 text-base font-bold text-green-700 bg-green-100 px-4 py-2 rounded-full">
          <Check className="w-5 h-5" /> דווח
        </span>
        {canEdit && (
          <button
            onClick={() => {
              // Find the report ID for this lesson
              const reportId = getReportIdForLesson(item);
              console.log('Edit button clicked for item:', item);
              console.log('Report ID found:', reportId);
              console.log('Report status map:', reportStatusMap);
              if (reportId) {
                nav(`/lesson-report/${item?.lesson?.id}?courseInstanceId=${item.course_instance_id}&editReportId=${reportId}`, {
                  state: { selectedDate: selectedDate?.toISOString() }
                });
              } else {
                console.log('No report ID found for this lesson');
              }
            }}
            className="bg-orange-500 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors hover:bg-orange-600 shadow-md"
          >
            ✏️ ערוך
          </button>
        )}
      </div>
    );
  }

  if (!isReported) {
    console.log('Returning: not reported, role:', user.user_metadata.role);
    const canReport = ['instructor', 'admin', 'pedagogical_manager'].includes(user.user_metadata.role);
    
    return canReport ? (
      <button
        onClick={() =>
          nav(`/lesson-report/${item?.lesson?.id}?courseInstanceId=${item.course_instance_id}`, {
              state: { selectedDate: selectedDate?.toISOString() }
         })
        }
        className="bg-blue-500 text-white px-4 py-3 rounded-full font-bold text-base transition-colors hover:bg-blue-600 shadow-md"
      >
        📋 דווח על השיעור
      </button>
    ) : (
      <span className="inline-flex items-center gap-2 text-base font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
        📋 טרם דווח
      </span>
    );
  }

  console.log('Returning: fallback - דווח');
  return (
    <span className="inline-flex items-center gap-2 text-base font-bold text-green-700 bg-green-100 px-4 py-2 rounded-full">
      <Check className="w-5 h-5" /> דווח
    </span>
  );
};

        return (
          <div
            key={index}
            className="p-4 rounded-2xl shadow bg-white border text-right space-y-1"
          >
            <div className="flex justify-between items-start">
              {/* lesson info */}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">
                  📘 {item?.course_instances?.course?.name || "ללא שם קורס"} – שיעור מס׳ {item?.lesson_number || (item?.lesson?.order_index ? item.lesson.order_index + 1 : 1)}
                </h3>
                <p className="text-base mb-1">
                  <span className="font-semibold">📖 שם השיעור:</span> {item?.lesson?.title}
                </p>
                <p className="text-base mb-1">
                  <span className="font-semibold">🏫 מוסד:</span> {item?.course_instances?.institution?.name}
                </p>
                <p className="text-base mb-1">
                  <span className="font-semibold">📚 כיתה:</span> {item?.course_instances?.grade_level}
                </p>
                {!item?.course_instances?.instructor?.full_name && user.user_metadata.role!=="instructor" ? (
                  <p className="text-base mb-1 text-red-600 font-semibold">
                    <span className="font-semibold">👨‍🏫 מדריך:</span> אין מדריך לקורס הזה
                  </p>
                ) : (
                  user.user_metadata.role !== "instructor" && (
                    <p className="text-base mb-1">
                      <span className="font-semibold">👨‍🏫 מדריך:</span> {instructorName}
                    </p>
                  )
                )}
                
                <p className="text-base font-medium text-gray-900 mt-3">
                  🕐 {startTime}-{endTime}
                </p>
              </div>

              {/* lesson action right */}
              <div className="text-left">
                {renderStatusBadge()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};