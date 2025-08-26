
// Calendar.tsx - Fixed version
import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyCalendar } from "@/components/ui/WeeklyCalendar";
import { fetchCombinedSchedules } from "@/utils/scheduleUtils";

const Calendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<any[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    const fetchLessonsData = async () => {
      if (!user) return;

      try {
        // Use the new combined schedules function that handles both legacy and new formats
        const combinedSchedules = await fetchCombinedSchedules();
        setLessons(combinedSchedules);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchLessonsData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      <div className="mb-4 sm:mb-8 px-3 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">יומן אישי</h1>
        <p className="text-sm sm:text-base text-gray-600">צפייה במערכת השעות והשיעורים הקרובים</p>
      </div>

      {/* Edge-to-edge mobile layout */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="w-full">
          <Card className="w-full rounded-none border-0 shadow-none sm:rounded-xl sm:border sm:shadow">
            <CardHeader className="p-0 sm:p-6">
              <div className="w-full">
                <div className="hidden sm:flex items-center gap-2 mb-4">
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
            <CardContent className="p-0" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;