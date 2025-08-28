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

  useEffect(() => {
    const fetchReportedSchedules = async () => {
      const { data, error } = await supabase
        .from("reported_lesson_instances")
        .select("lesson_schedule_id, course_instance_id, lesson_id, scheduled_date");

      if (error) {
        console.error("Error fetching reported lesson instances:", error.message);
        return;
      }

      // Create a set of reported lesson instance IDs
      const reportedIds = new Set<string>();
      
      data?.forEach((instance: { lesson_schedule_id: string | null, course_instance_id: string | null, lesson_id: string, scheduled_date: string }) => {
        if (instance.lesson_schedule_id) {
          // Legacy architecture: use lesson_schedule_id
          reportedIds.add(instance.lesson_schedule_id);
        } else if (instance.course_instance_id && instance.lesson_id) {
          // New architecture: create a composite key for course_instance_id + lesson_id
          reportedIds.add(`${instance.course_instance_id}_${instance.lesson_id}`);
        }
      });

      setReportedScheduleIds(reportedIds);
    };

    fetchReportedSchedules();
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
      {lessons.map((item, index) => {
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
                {isReported ? (
                  <span className="inline-flex items-center gap-2 text-base font-bold text-green-700 bg-green-100 px-4 py-2 rounded-full">
                    <Check className="w-5 h-5" /> דווח
                  </span>
                ) : (
                  user.user_metadata.role === "instructor" && (
                    <button
                      onClick={() =>
                        nav(`/lesson-report/${item?.lesson?.id}?courseInstanceId=${item.course_instance_id}`)
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full font-bold text-base transition-colors"
                    >
                      📋 דיווח שיעור
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};