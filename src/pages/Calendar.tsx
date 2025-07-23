import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyCalendar } from "@/components/ui/WeeklyCalendar";

const Calendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<any>();
  const nav = useNavigate();
  useEffect(() => {
    //ADMIN & MANAGER dashboard data fetching
    const fetchLessonsData = async () => {
      if (!user) return;

      try {
        // Fetch lessons count
        const { data: lessons } = await supabase.from("lesson_schedules")
          .select(`
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

        // Fetch course instances for this instructor
        const { data: courseInstances } = await supabase
          .from("course_instances")
          .select("id, course:course_id(name)")
          .eq("instructor_id", user.id);

        setLessons(lessons || []);

        // Calculate stats
        const thisWeekLessons =
          lessons?.filter((lesson) => {
            const lessonDate = new Date(lesson.scheduled_start);
            const today = new Date();
            const weekFromNow = new Date(
              today.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            return lessonDate >= today && lessonDate <= weekFromNow;
          }) || [];
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchLessonsData();
  }, [user]);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">יומן אישי</h1>
        <p className="text-gray-600">צפייה במערכת השעות והשיעורים הקרובים</p>
      </div>

      <div className="flex justify-center items-center max-w-7xl max-h-7xl mx-auto">
        <div className="w-full">
          {/* Calendar View */}
          <Card className="w-full">
            <CardHeader>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <span>בחר תאריך:</span>
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
