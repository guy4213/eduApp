import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthProvider";
import { Check } from "lucide-react";

export const ScheduleList: React.FC<any> = ({ lessons }) => {
  const nav = useNavigate();
  const [instructors, setInstructors] = useState<
    { id: string; full_name: string }[]
  >([]);
  const [reportedScheduleIds, setReportedScheduleIds] = useState<Set<string>>(
    new Set()
  );
  const [reportStatusMap, setReportStatusMap] = useState<Map<string, {isCompleted: boolean, isLessonOk: boolean}>>(
    new Map()
  );
  const { user } = useAuth();

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
    // First, get all reported lesson instances
    const { data: reportedInstances, error: instancesError } = await supabase
      .from("reported_lesson_instances")
      .select(`
        lesson_schedule_id, 
        course_instance_id, 
        lesson_id, 
        scheduled_date,
        lesson_report_id
      `);

    if (instancesError) {
      console.error("Error fetching reported lesson instances:", instancesError.message);
      return;
    }

    // Then, get all lesson reports
    const { data: lessonReports, error: reportsError } = await supabase
      .from("lesson_reports")
      .select(`
        id,
        is_completed,
        is_lesson_ok,
        created_at
      `);

    if (reportsError) {
      console.error("Error fetching lesson reports:", reportsError.message);
      return;
    }

    console.log('ScheduleList: Reported instances:', reportedInstances);
    console.log('ScheduleList: Lesson reports:', lessonReports);

    // Create a map of lesson report data
    const reportsMap = new Map();
    lessonReports?.forEach(report => {
      reportsMap.set(report.id, report);
    });

    if (error) {
      console.error("Error fetching reported lesson instances:", error.message);
      return;
    }

        // Create a set of reported lesson instance IDs and status map
    const reportedIds = new Set<string>();
    const statusMap = new Map<string, {isCompleted: boolean, isLessonOk: boolean}>();
    
    reportedInstances?.forEach((instance: any) => {
      let key = '';
      console.log('ScheduleList: Processing instance:', instance);
      
      if (instance.lesson_schedule_id) {
        // Legacy architecture: use lesson_schedule_id
        key = instance.lesson_schedule_id;
        reportedIds.add(instance.lesson_schedule_id);
        console.log('ScheduleList: Using legacy key:', key);
      } else if (instance.course_instance_id && instance.lesson_id) {
        // New architecture: create a composite key for course_instance_id + lesson_id
        key = `${instance.course_instance_id}_${instance.lesson_id}`;
        reportedIds.add(key);
        console.log('ScheduleList: Using new key:', key);
      }

      // Get the lesson report data
      if (key && instance.lesson_report_id) {
        const report = reportsMap.get(instance.lesson_report_id);
        if (report) {
          console.log('ScheduleList: Setting status for key:', key, 'report:', report);
          statusMap.set(key, {
            isCompleted: report.is_completed !== false, // Default to true if null
            isLessonOk: report.is_lesson_ok || false
          });
        } else {
          console.log('ScheduleList: No lesson report found for lesson_report_id:', instance.lesson_report_id);
        }
      } else {
        console.log('ScheduleList: No lesson_report_id found for key:', key, 'instance:', instance);
      }
    });

    console.log('ScheduleList: Updated reported IDs:', reportedIds);
    console.log('ScheduleList: Updated status map:', statusMap);
    console.log('ScheduleList: Raw data from DB:', reportedInstances);
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

  return (
    <div className="schedule-list-container flex flex-col gap-3 px-2 py-4 sm:px-4 sm:py-6 max-w-4xl w-full mx-auto">
      {/* Manual refresh button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            console.log('Manual refresh of ScheduleList...');
            fetchReportedSchedules();
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          🔄 רענן סטטוס
        </button>
      </div>
      {lessons.map((item, index) => {
        const instructorName =
          instructorMap.get(item?.course_instances?.instructor?.id) ||
          item?.course_instances?.instructor?.full_name ||
          "שם לא נמצא";

        const startTime = formatTime(item.scheduled_start);
        const endTime = formatTime(item.scheduled_end);

        // Check if lesson is reported - handle both old and new architecture
        const compositeKey = item.course_instance_id && item.lesson?.id ? `${item.course_instance_id}_${item.lesson.id}` : '';
        const isReported = reportedScheduleIds.has(item.id) || 
                          (compositeKey && reportedScheduleIds.has(compositeKey));

        // Get lesson status for reported lessons
        // Try multiple key formats to find the status
        let statusKey = '';
        let lessonStatus = null;
        
        // First try the exact item ID
        if (reportedScheduleIds.has(item.id)) {
          statusKey = item.id;
          lessonStatus = reportStatusMap.get(statusKey);
        }
        
        // If not found and we have composite key, try that
        if (!lessonStatus && compositeKey && reportedScheduleIds.has(compositeKey)) {
          statusKey = compositeKey;
          lessonStatus = reportStatusMap.get(statusKey);
        }
        
        // If still not found, try all keys in the map to find a match
        if (!lessonStatus && item.course_instance_id && item.lesson?.id) {
          for (const [key, status] of reportStatusMap.entries()) {
            if (key.includes(item.course_instance_id) && key.includes(item.lesson.id)) {
              statusKey = key;
              lessonStatus = status;
              break;
            }
          }
        }
        
        console.log(`ScheduleList: Lesson ${item.id} - isReported: ${isReported}, statusKey: ${statusKey}, lessonStatus:`, lessonStatus);
        console.log(`ScheduleList: Lesson data:`, {
          id: item.id,
          course_instance_id: item.course_instance_id,
          lesson_id: item.lesson?.id,
          isGenerated: item.id.startsWith('generated-'),
          statusKey,
          reportedScheduleIds: Array.from(reportedScheduleIds),
          reportStatusMap: Array.from(reportStatusMap.entries())
        });

        // Function to render status badge
        const renderStatusBadge = () => {
          if (!isReported) {
            return user.user_metadata.role === "instructor" ? (
              <button
                onClick={() =>
                  nav(`/lesson-report/${item?.lesson?.id}?courseInstanceId=${item.course_instance_id}`)
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

          if (lessonStatus?.isCompleted === false) {
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
            return (
              <span 
                className="inline-flex items-center gap-2 text-base font-bold px-4 py-2 rounded-full text-white"
                style={{backgroundColor: '#FF0000'}}
              >
                ⚠️ לא התנהל כשורה
              </span>
            );
          }

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
                
                {!item?.course_instances?.instructor?.full_name ? (
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