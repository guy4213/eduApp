import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // adjust this path
import { useAuth } from "../auth/AuthProvider";

interface ScheduleListProps {
  lessons: any[];
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ lessons }) => {
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

  // Create a lookup map for fast access
  const instructorMap = useMemo(() => {
    const map = new Map<string, string>();
    instructors.forEach((instr) => map.set(instr.id, instr.full_name));
    return map;
  }, [instructors]);

  return (
    <div className="flex flex-col gap-4 px-4">
      {lessons.map((item, index) => {
        const instructorName = item.instructor_id
          ? instructorMap.get(item.instructor_id) || "שם לא נמצא"
          : null;

        return (
          <div
            key={index}
            className="flex p-4 rounded-lg shadow-md justify-between bg-white w-full"
          >
            <div className="flex flex-col gap-2 px-4">
              <div className="text-lg font-semibold">{item.title}</div>
              {!item.instructor_id ? (
                <div className="text-md font-bold">אין מדריך לקורס הזה</div>
              ) : (
               user.user_metadata.role!="instructor"&&  
               <div className="text-lg font-semibold">{instructorName}</div>
              )}
            </div>
            <button
              onClick={() => {
             nav(`/lesson-report/${item.id}`);
              }}
              className="bg-green-300 rounded-full p-2 items-center font-bold"
            >
              דיווח שיעור
            </button>
          </div>
        );
      })}
    </div>
  );
};
