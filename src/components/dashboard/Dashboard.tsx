import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import MobileDashboard from "./MobileDashboard";
import MobileNavigation from "../layout/MobileNavigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "./StatsCard";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Clock,
  MapPin,
  Star,
  Award,
  Plus,
  CalendarIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyCalendar } from "../ui/WeeklyCalendar";
import { Lesson } from "../course/CourseLessonsSection";
import { DailyLessonsCard } from "@/components/DailyLessonsCard";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalLessons: number;
  activeStudents: number;
  activeCourses: number;
  monthlyEarnings: number;
  upcomingLessons: any[];
  recentActivity: any[];
}
export interface ClassItem {
  time: string;
  title: string;
  instructor: string;
  booked: number;
  capacity: number;
  avatars: string[];
  status: "available" | "booked";
  date?: string; // optional ISO date for filtering
}
const mockClasses: ClassItem[] = [
  {
    time: "08:00",
    title: "איגרוף שקים",
    instructor: "יוסף חיים בצלאל",
    booked: 11,
    capacity: 14,
    avatars: ["/avatar1.png", "/avatar2.png", "/avatar3.png"],
    status: "available", // ✅ string literal, matches the union
    date: "2025-06-18T08:00:00Z", // example date
  },
  {
    time: "09:05",
    title: "BOXING METCON",
    instructor: "יוסף חיים בצלאל",
    booked: 4,
    capacity: 14,
    avatars: ["/avatar1.png", "/avatar4.png"],
    status: "available",
    date: "2025-06-18T08:00:00Z", // example date
  },
  {
    time: "10:10",
    title: "איגרוף קלאסי",
    instructor: "דביר סלע",
    booked: 10,
    capacity: 14,
    avatars: ["/avatar5.png", "/avatar6.png", "/avatar7.png"],
    status: "booked", // ✅ this is the only other valid value
    date: "2025-06-18T08:00:00Z", // example date
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    activeStudents: 0,
    activeCourses: 0,
    monthlyEarnings: 0,
    upcomingLessons: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<any>();
  const nav=useNavigate();
  useEffect(() => {
    //ADMIN & MANAGER dashboard data fetching
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id);
        // Fetch lessons count
        const { data: lessons } = await supabase.from("lessons").select("*");

        // Fetch courses count
        const { data: courses } = await supabase
          .from("courses")
          .select("*")
          .eq("instructor_id", user.id);

        setUserProfile(profile[0] || null);
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

        setStats({
          totalLessons: thisWeekLessons.length,
          activeStudents: 45,
          activeCourses: courses?.length || 0,
          monthlyEarnings: 4350,
          upcomingLessons: thisWeekLessons.slice(0, 3),
          recentActivity: lessons?.slice(-3) || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const menuItems = [
    {
      icon: Calendar,
      title: "יומן אישי",
      description: "צפייה במערכת השעות והשיעורים הקרובים",
      path: "/calendar",
    },
    {
      icon: BookOpen,
      title: "דיווח שיעור",
      description: "דיווח על שיעור שהתקיים או בתהליך",
      path: "/lesson-report/:id",
    },
    {
      icon: Users,
      title: "קורסים",
      description: "ניהול הקורסים והכיתות שלי",
      path: "/courses",
    },
    {
      icon: BarChart3,
      title: "דוחות ושכר",
      description: "צפייה בדוחות חודשיים וחישוב שכר",
      path: "/reports",
    },
    {
      icon: Settings,
      title: "הגדרות פרופיל",
      description: "עריכת פרטים אישיים והגדרות המערכת",
      path: "/profile",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  console.log("lessons : ", lessons);
  console.log("userPRO: ", userProfile);
  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileDashboard />
        <MobileNavigation />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            {userProfile?.role !== "instructor" ? (
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                ברוך הבא למערכת ניהול המנחים והמרצים
              </h2>
            ) : (
              <h2 className="text-gray-600 text-lg"> ברוכים הבאים </h2>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="תלמידים פעילים"
              value={stats.activeStudents}
              icon={Users}
              color="bg-gradient-to-r from-orange-500 to-red-500"
            />
            <StatsCard
              title="הושלמו"
              value="1"
              icon={Award}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <StatsCard
              title="שיעורים כללים"
              value="3"
              icon={BookOpen}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatsCard
              title="מבוצע בבניינים"
              value="45"
              icon={BarChart3}
              color="bg-gradient-to-r from-purple-500 to-indigo-500"
            />
          </div>
          <div className="lg:col-span-2">
      
          </div>
          {/* Main Dashboard Grid */}
            <DailyLessonsCard
      dateLabel={new Date(Date.now()).toLocaleString().split(",")[0]}
        onAddLesson={() => nav('/courses')}
        lessons={lessons}
      />

          {/* Summary Card */}
          <Card className="bg-gradient-to-l from-yellow-100 to-amber-100 border-yellow-300 shadow-lg mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-yellow-600 mr-3" />
                <span className="text-3xl font-bold text-yellow-800">
                  ₪4,350
                </span>
              </div>
              <p className="text-yellow-700 font-semibold text-lg">סטר נפש</p>
              <p className="text-sm text-yellow-600 mt-2 font-medium">
                🏆 ב-2 שפעילות בלכלי מפיסד התמרמר ב-שירי בפולטי
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                ב שנים ותשרת בצרכים
              </p>
            </CardContent>
          </Card>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-4">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-900">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
