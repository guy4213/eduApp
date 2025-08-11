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
        .from("lesson_reports")
        .select("lesson_schedule_id");

      if (error) {
        console.error("Error fetching reported schedules:", error.message);
        return;
      }

      const idsSet = new Set(
        data?.map((r: { lesson_schedule_id: string }) => r.lesson_schedule_id)
      );

      setReportedScheduleIds(idsSet);
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
    <div className="schedule-list-container flex flex-col gap-4 px-4 py-6 max-w-4xl w-full mx-auto">
      {lessons.map((item, index) => {
        const instructorName =
          instructorMap.get(item?.course_instances?.instructor?.id) ||
          item?.course_instances?.instructor?.full_name ||
          "שם לא נמצא";

        const startTime = formatTime(item.scheduled_start);
        const endTime = formatTime(item.scheduled_end);

        const isReported = reportedScheduleIds.has(item.id);

        return (
          <div
            key={index}
            className="schedule-list-item flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col gap-1 text-gray-800">
              <div className="text-xl text-gray-500 font-bold">
                {item?.course_instances?.institution?.name}
              </div>
              <div className="text-base font-semibold">{item?.lesson?.title}</div>

              {!item?.course_instances?.instructor?.full_name ? (
                <div className="text-red-600 font-semibold">
                  אין מדריך לקורס הזה
                </div>
              ) : (
                user.user_metadata.role !== "instructor" && (
                  <div className="text-md text-gray-600">
                    מדריך: <span className="font-medium">{instructorName}</span>
                  </div>
                )
              )}

              <div className="text-sm text-gray-500">
                {endTime} - {startTime}
              </div>
            </div>

            {isReported ? (
              <button
                disabled
                className="schedule-list-button bg-green-400 rounded-full p-2 flex items-center font-bold cursor-default"
                title="השיעור דווח בהצלחה"
              >
                <Check className="w-5 h-5 ml-1" />
                השיעור דווח בהצלחה
              </button>
            ) : new Date(item.scheduled_end).getTime() > Date.now() ? (
              user.user_metadata.role === "instructor" && (
                <button
                  disabled
                  className="schedule-list-button bg-yellow-400 rounded-full p-2 flex items-center font-bold cursor-default"
                  title="רק לאחר סיום השיעור תוכל לדווח"
                >
                  רק לאחר סיום השיעור תוכל לדווח
                </button>
              )
            ) : (
              user.user_metadata.role === "instructor" && (
                <button
                  onClick={() =>
                    nav(`/lesson-report/${item?.lesson?.id}?scheduleId=${item.id}`)
                  }
                  className="schedule-list-button bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold shadow-sm transition-colors"
                >
                  דיווח שיעור
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};
