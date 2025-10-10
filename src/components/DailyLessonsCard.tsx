import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Check, Plus } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface LessonCardProps {
  id: string;
  title: string;
  instructorName?: string;
  time: string;
  location: string;
  participants: number;
  statusLabel: string;
  color?: "blue" | "green" | "purple"; // הפך ל־אופציונלי
  buttonLabel: string;
  onClick: () => void;
}

interface DailyLessonsCardProps {
  dateLabel: string;
  lessons: LessonCardProps[];
  onAddLesson?: () => void;
}

const statusColors = {
  blue: {
    bg: "from-blue-50 to-blue-100",
    border: "border-blue-500",
    text: "text-blue-600",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
  },
  green: {
    bg: "from-green-50 to-green-100",
    border: "border-green-500",
    text: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
  },
  purple: {
    bg: "from-purple-50 to-purple-100",
    border: "border-purple-500",
    text: "text-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
  },
};

// צבעים זמינים לבחירה
const availableColors = ["blue", "green", "purple"] as const;

// בוחר צבע עקבי לפי מזהה
function getColorById(id: string): typeof availableColors[number] {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return availableColors[sum % availableColors.length];
}

export const DailyLessonsCard: React.FC<any> = ({
  dateLabel,
  lessons,
  onAddLesson,
}) => {

  const [reportedScheduleIds, setReportedScheduleIds] = useState<Set<string>>(new Set());
  const [reportStatusMap, setReportStatusMap] = useState<Map<string, {isCompleted: boolean, isLessonOk: boolean}>>(new Map());

useEffect(() => {
  async function fetchReportedSchedules() {
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
      console.error('Failed to fetch lesson reports:', error);
      return;
    }

    // Create a set of reported lesson instance IDs and status map
    const reportedIds = new Set<string>();
    const statusMap = new Map<string, {isCompleted: boolean, isLessonOk: boolean}>();
    
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
            isLessonOk: report.is_lesson_ok || false
          });
        }
      });
    });
    
    setReportedScheduleIds(reportedIds);
    setReportStatusMap(statusMap);
  }

  fetchReportedSchedules();
  
  // Set up real-time subscription to listen for changes
  const channel = supabase
    .channel('lesson_reports_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lesson_reports'
      },
      () => {
        // Refresh data when lesson reports change
        fetchReportedSchedules();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const filteredClasses = (lessons??[]).filter((c) => {
  console.log("DATE", c.scheduled_start);
  if (!c.scheduled_start) return true;

  const classDate = new Date(c.scheduled_start);
  const selected = new Date(Date.now() -2*24 * 60 * 60 * 1000);
// -*24 * 60 * 60 * 1000
  // Normalize both dates to YYYY-MM-DD strings
  const classDateStr = classDate.toISOString().split("T")[0];
  const selectedDateStr = selected.toISOString().split("T")[0];

  return classDateStr === selectedDateStr;
});

  // Remove duplicates based on course_instance_id and lesson_id
  const uniqueClasses = filteredClasses.filter((lesson, index, self) => {
    const key = `${lesson.course_instance_id}_${lesson.lesson?.id || lesson.lesson_id}`;
    return index === self.findIndex(l => {
      const lKey = `${l.course_instance_id}_${l.lesson?.id || l.lesson_id}`;
      return lKey === key;
    });
  });

  const sortedClasses = uniqueClasses.sort((a, b) => {
  const timeA = new Date(a.scheduled_start).getTime();
  const timeB = new Date(b.scheduled_start).getTime();
  return timeA - timeB;
});
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const nav=useNavigate();
   const [instructors, setInstructors] = useState<{ id: string; full_name: string }[]>([]);
   const {user}=useAuth();
    // Fetch instructors once
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
  
    // Create a lookup map for fast access
const instructorMap = useMemo(() => {
  const lessonInstructorIds = new Set(lessons.map(lesson => lesson.instructor_id));

  const map = new Map<string, string>();
  instructors
    // .filter(instr => lessonInstructorIds.has(instr.id))
    .forEach(instr => map.set(instr.id, instr.full_name));

  return map;
}, [instructors, lessons]);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-xl">
            <Calendar className="h-8 w-6 mr-3" />
            יומן יומי - {dateLabel}
          </CardTitle>
          {onAddLesson && user.user_metadata.role!=="instructor" && (
            <Button
              size="sm"
              onClick={onAddLesson}
              className="bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              צור תכנית לימוד  חדשה
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {sortedClasses.map((lesson,index) => {
          console.log("lesson",lesson)
          const colorKey = lesson.color || getColorById(lesson.id);
          const color = statusColors[colorKey];
          const instructorName = lesson.instructor_id
          ? instructorMap.get(lesson.instructor_id) || "שם לא נמצא"
          : null;
   // Check if lesson is reported - handle both old and new architecture
   const isReported = reportedScheduleIds.has(lesson.id) || 
                     (lesson.course_instance_id && lesson.lesson_id && 
                      reportedScheduleIds.has(`${lesson.course_instance_id}_${lesson.lesson_id}`));

        // Get lesson status for reported lessons
        const statusKey = reportedScheduleIds.has(lesson.id) ? lesson.id : 
                         (lesson.course_instance_id && lesson.lesson_id ? `${lesson.course_instance_id}_${lesson.lesson_id}` : '');
        const lessonStatus = reportStatusMap.get(statusKey);

        // Function to render status badge
        const renderStatusBadge = () => {
          if (!isReported) {
            return user.user_metadata?.role === "instructor" ? (
              <button
                onClick={() => nav(`/lesson-report/${lesson.lesson_id}?courseInstanceId=${lesson.course_instance_id}`)}
                className="bg-blue-500 text-white rounded-full px-4 py-3 font-bold text-base transition-colors hover:bg-blue-600 shadow-md"
              >
                📋 דווח על השיעור
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-base font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                📋 טרם דווח
              </span>
            );
          }

          // בדיקה אם זה שיעור בוטל
          if (lesson?.is_cancelled) {
            return (
              <button
                disabled
                className="rounded-full px-4 py-3 flex items-center font-bold cursor-default text-base text-white"
                style={{backgroundColor: '#FF6B6B'}}
                title="השיעור בוטל"
              >
                ❌ בוטל
              </button>
            );
          }
          
          // בדיקה אם זה שיעור נדחה
          if (lesson?.is_postponed) {
            return (
              <button
                className="rounded-full px-4 py-3 flex items-center font-bold text-base text-white hover:opacity-80 transition-opacity"
                style={{backgroundColor: '#4ECDC4'}}
                title="השיעור נדחה - ניתן לדווח"
                onClick={() => handleLessonClick(lesson)}
              >
                📅 נדחה - טרם דווח
              </button>
            );
          }
          
          // בדיקה אם השיעור לא התקיים
          if (lessonStatus?.isCompleted === false) {
            return (
              <button
                disabled
                className="rounded-full px-4 py-3 flex items-center font-bold cursor-default text-base text-white"
                style={{backgroundColor: '#FFA500'}}
                title="השיעור לא התקיים"
              >
                ❌ לא התקיים
              </button>
            );
          }

          if (lessonStatus?.isCompleted && lessonStatus?.isLessonOk === false) {
            return (
              <button
                disabled
                className="rounded-full px-4 py-3 flex items-center font-bold cursor-default text-base text-white"
                style={{backgroundColor: '#FF0000'}}
                title="השיעור לא התנהל כשורה"
              >
                ⚠️ לא התנהל כשורה
              </button>
            );
          }

          return (
            <button
              disabled
              className="bg-green-400 rounded-full px-4 py-3 flex items-center font-bold cursor-default text-base"
              title="השיעור דווח בהצלחה"
            >
              <Check className="w-6 h-6 ml-2" />
              דווח
            </button>
          );
        };

            return (
           
            <div
              key={lesson.lesson_id}
              className="p-4 rounded-2xl shadow bg-white border text-right space-y-1"
            >
              <div className="flex justify-between items-start">
                {/* lesson info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">
                    📘 {lesson?.course_name} – שיעור מס׳ {lesson?.lesson_number}
                  </h3>
                  <p className="text-base mb-1">
                    <span className="font-semibold">📖 שם השיעור:</span> {lesson?.title}
                  </p>
                  <p className="text-base mb-1">
                    <span className="font-semibold">🏫 מוסד:</span> {lesson?.institution_name}
                  </p>
                     <p className="text-base mb-1">
                  <span className="font-semibold">📚 כיתה:</span> {lesson?.grade_level}
                </p>
                  {user.user_metadata.role !== "instructor" && (
                    <p className="text-base mb-1">
                      <span className="font-semibold">👨‍🏫 מדריך:</span> {instructorName}
                    </p>
                  )}
                  
                  <p className="text-base font-medium text-gray-900 mt-3">
                    🕐 {formatTime(lesson.scheduled_start)}-{formatTime(lesson.scheduled_end)}
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
      </CardContent>
    </Card>
  );
};