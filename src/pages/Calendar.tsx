
// Calendar.tsx - Fixed version
import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyCalendar } from "@/components/ui/WeeklyCalendar";

const Calendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<any[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    const fetchLessonsData = async () => {
      if (!user) return;

      try {
        const { data: lessons } = await supabase
          .from("lesson_schedules")
          .select(`
            id,
            scheduled_start,
            scheduled_end,
            lesson:lesson_id(
              id,
              title
            ),
            course_instances:course_instance_id(
              id,
              institution:institution_id(
                id,
                name
              ),
              instructor:instructor_id(
                id,
                full_name
              )
            )
          `);

        setLessons(lessons || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchLessonsData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">יומן אישי</h1>
        <p className="text-sm sm:text-base text-gray-600">צפייה במערכת השעות והשיעורים הקרובים</p>
      </div>

      {/* Fixed mobile layout */}
      <div className="w-full max-w-7xl mx-auto px-0">
        <div className="w-full">
          <Card className="w-full">
            <CardHeader className="p-3 sm:p-6">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <span className="text-sm sm:text-base">בחר תאריך:</span>
                </div>

                <WeeklyCalendar
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  lessons={lessons}
                />
              </div>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;