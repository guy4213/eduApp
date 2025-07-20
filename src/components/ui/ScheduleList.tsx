import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // adjust this path
import { useAuth } from "../auth/AuthProvider";



export const ScheduleList: React.FC<any> = ({ lessons }) => {
  const nav = useNavigate();
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
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
  // Create a lookup map for fast access
 const instructorMap = useMemo(() => {
  const map = new Map<string, string>();
  instructors.forEach((instr) => map.set(instr.id, instr.full_name));
  return map;
}, [instructors]);

return (
  <div className="flex flex-col gap-4 px-4 py-6 max-w-4xl mx-auto">
    {lessons.map((item, index) => {
      console.log("lesson CAL",item)
      const instructorName =
        instructorMap.get(item?.course_instances?.instructor?.id) ||
        item?.course_instances?.instructor?.full_name ||
        "שם לא נמצא";

      const startTime = formatTime(item.scheduled_start);
      const endTime = formatTime(item.scheduled_end);

      return (
        <div
          key={index}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          {/* Left: Lesson Info */}
          <div className="flex flex-col gap-1 text-gray-800">
               <div className="text-xl text-gray-500 font-bold">
            {item?.course_instances?.institution?.name}
            </div>
            <div className="text-base font-semibold">{item?.lesson?.title}</div>

            {!item?.course_instances?.instructor?.full_name ? (
              <div className="text-red-600 font-semibold">אין מדריך לקורס הזה</div>
            ) : (
              user.user_metadata.role !== "instructor" && (
                <div className="text-md text-gray-600">
                  מדריך: <span className="font-medium">{instructorName}</span>
                </div>
              )
            )}
         
            <div className="text-sm text-gray-500">
            {endTime}   -   {startTime}
            </div>
          </div>

          {/* Right: Action Button */}
          {user.user_metadata?.role === "instructor" && (
            <button
              onClick={() => nav(`/lesson-report/${item?.lesson?.id}`)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold shadow-sm transition-colors"
            >
              דיווח שיעור
            </button>
          )}
        </div>
      );
    })}
  </div>
);

};
