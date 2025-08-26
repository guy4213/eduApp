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
            className="schedule-list-item grid grid-cols-[64px_1fr] gap-3 items-stretch p-3 bg-white rounded-2xl shadow-sm border border-gray-100"
          >
            {/* Time rail */}
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="text-xs">{startTime}</div>
              <div className="h-4 w-px bg-gray-200 my-1" />
              <div className="text-xs">{endTime}</div>
            </div>

            {/* Card content */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-gray-900 truncate">
                  {item?.lesson?.title}
                </div>
                {isReported ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <Check className="w-4 h-4" /> דווח
                  </span>
                ) : (
                  user.user_metadata.role === "instructor" && (
                    <button
                      onClick={() =>
                        nav(`/lesson-report/${item?.lesson?.id}?courseInstanceId=${item.course_instance_id}`)
                      }
                      className="ml-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-sm transition-colors"
                    >
                      דיווח שיעור
                    </button>
                  )
                )}
              </div>

              <div className="text-[13px] text-gray-600">
                {item?.course_instances?.institution?.name}
              </div>

              {!item?.course_instances?.instructor?.full_name ? (
                <div className="text-red-600 font-semibold text-sm">
                  אין מדריך לקורס הזה
                </div>
              ) : (
                user.user_metadata.role !== "instructor" && (
                  <div className="text-sm text-gray-700">
                    מדריך: <span className="font-medium">{instructorName}</span>
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};