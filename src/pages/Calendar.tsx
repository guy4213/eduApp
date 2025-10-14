// Calendar.tsx - Updated version with date context
import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyCalendar } from "@/components/ui/WeeklyCalendar";
import { fetchCombinedSchedules } from "@/utils/scheduleUtils";

const Calendar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  
  // Initialize selectedDate from location state or default to today
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (location.state?.selectedDate) {
      return new Date(location.state.selectedDate);
    }
    return new Date();
  });
  
  const [lessons, setLessons] = useState<any[]>([]);

  const fetchLessonsData = async () => {
    if (!user) return;

    try {
      const combinedSchedules = await fetchCombinedSchedules();
      setLessons(combinedSchedules);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchLessonsData();
  }, [user]);

  // Auto-refresh calendar data every 2 minutes
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing calendar data...');
      fetchLessonsData();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Listen for lesson report updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lessonReportUpdated') {
        console.log('Lesson report updated, refreshing calendar...');
        fetchLessonsData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomEvent = () => {
      console.log('Custom lesson report event, refreshing calendar...');
      fetchLessonsData();
    };
    
    window.addEventListener('lessonReportUpdated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lessonReportUpdated', handleCustomEvent);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6 ">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      <div className="mb-4 sm:mb-8 px-3 sm:px-0 py-4 ">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">יומן אישי</h1>
            <p className="text-sm sm:text-base text-gray-600">צפייה במערכת השעות והשיעורים הקרובים</p>
          </div>
          
          <div className="flex items-center space-x-2">
        
            <button
              onClick={() => {
                console.log('Manual refresh of calendar...');
                fetchLessonsData();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md flex items-center"
            >
              <CalendarIcon className="h-4 w-4 ml-2" />
              רענן יומן
            </button>
          </div>
        </div>
      </div>

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