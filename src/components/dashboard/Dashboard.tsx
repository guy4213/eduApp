import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import MobileDashboard from './MobileDashboard';
import MobileNavigation from '../layout/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, BookOpen, BarChart3, Settings, Clock, MapPin, Star, Award, Plus, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyCalendar } from '../ui/WeeklyCalendar';

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
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch lessons count
        const { data: lessons } = await supabase
          .from('lessons')
          .select('*')
          .eq('instructor_id', user.id);

        // Fetch courses count
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id);

        // Calculate stats
        const thisWeekLessons = lessons?.filter(lesson => {
          const lessonDate = new Date(lesson.scheduled_start);
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return lessonDate >= today && lessonDate <= weekFromNow;
        }) || [];

        setStats({
          totalLessons: thisWeekLessons.length,
          activeStudents: 45,
          activeCourses: courses?.length || 0,
          monthlyEarnings: 4350,
          upcomingLessons: thisWeekLessons.slice(0, 3),
          recentActivity: lessons?.slice(-3) || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const menuItems = [
    { icon: Calendar, title: 'יומן אישי', description: 'צפייה במערכת השעות והשיעורים הקרובים', path: '/calendar' },
    { icon: BookOpen, title: 'דיווח שיעור', description: 'דיווח על שיעור שהתקיים או בתהליך', path: '/lesson-report' },
    { icon: Users, title: 'קורסים', description: 'ניהול הקורסים והכיתות שלי', path: '/courses' },
    { icon: BarChart3, title: 'דוחות ושכר', description: 'צפייה בדוחות חודשיים וחישוב שכר', path: '/reports' },
    { icon: Settings, title: 'הגדרות פרופיל', description: 'עריכת פרטים אישיים והגדרות המערכת', path: '/profile' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">דשבורד מנהל פדגוגי</h2>
            <p className="text-gray-600 text-lg">ברוך הבא למערכת ניהול המנחים והמרצים</p>
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
            <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-gray-500" />
        <span>בחר תאריך:</span>
      </div>

      {/* ✅ Correct usage */}
    <WeeklyCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} classes={mockClasses} />
      </div>
          </div>
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Calendar */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-xl">
                    <Calendar className="h-6 w-6 mr-3" />
                    יומן יומי - 18.6.2025
                  </CardTitle>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף שיעור
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Lesson 1 */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-r-4 border-blue-500 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                        החזר שיעור
                      </Button>
                      <div>
                        <p className="font-semibold text-gray-900">בית ספר אשלים ראשון לציון</p>
                        <p className="text-sm text-gray-600">שעת בגו גלי-ח-כ</p>
                        <p className="text-sm text-gray-600">משתתפים: 12 תלמידים</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-blue-600">09:00-10:30</p>
                      <span className="inline-block px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">כביש</span>
                      <p className="text-sm text-gray-500 mt-1">תל אביב יפו 21 דקות מכאן</p>
                    </div>
                  </div>
                </div>

                {/* Lesson 2 */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-r-4 border-green-500 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        דווח מופעים
                      </Button>
                      <div>
                        <p className="font-semibold text-gray-900">גימע רמות</p>
                        <p className="text-sm text-gray-600">שעת בגו גלי-ח-כ</p>
                        <p className="text-sm text-gray-600">משתתפים: 12 תלמידים</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-green-600">11:00-12:30</p>
                      <span className="inline-block px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">הושלם</span>
                      <p className="text-sm text-gray-500 mt-1">תל אביב יפו 2 דקות מכאן</p>
                    </div>
                  </div>
                </div>

                {/* Lesson 3 */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-r-4 border-purple-500 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Button size="sm" variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                        דווח מופעים
                      </Button>
                      <span className="text-sm text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded">התחל שיעור</span>
                      <div>
                        <p className="font-semibold text-gray-900">דת שלום רמות</p>
                        <p className="text-sm text-gray-600">שעת בגו גלי-א-כ</p>
                        <p className="text-sm text-gray-600">משתתפים: 18 תלמידים</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-purple-600">14:00-15:30</p>
                      <span className="inline-block px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">עוד מעט</span>
                      <p className="text-sm text-gray-500 mt-1">תל אביב יפו מקום קבוע</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Statistics */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl">ביצועים מדדים 📊</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Performance Metrics */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">דבר כהן</span>
                      <div className="text-left">
                        <div className="text-sm text-gray-600 flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 ml-1" />
                          שיעורי החירדני 24 מ 4.8
                        </div>
                        <div className="text-lg font-bold text-gray-900">4.8/5</div>
                      </div>
                    </div>
                    <Progress value={96} className="h-3 bg-gray-200" />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>96%</span>
                      <span>דירוג כללי</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">שרה לוי</span>
                      <div className="text-left">
                        <div className="text-sm text-gray-600 flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 ml-1" />
                          שיעורי החירדני 19 מ 4.5
                        </div>
                        <div className="text-lg font-bold text-gray-900">4.5/5</div>
                      </div>
                    </div>
                    <Progress value={92} className="h-3 bg-gray-200" />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>92%</span>
                      <span>דירוג כללי</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">מיכל אברהם</span>
                      <div className="text-left">
                        <div className="text-sm text-gray-600 flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 ml-1" />
                          שיעורי החירדני 21 מ 4.3
                        </div>
                        <div className="text-lg font-bold text-gray-900">4.3/5</div>
                      </div>
                    </div>
                    <Progress value={88} className="h-3 bg-gray-200" />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>88%</span>
                      <span>דירוג כללי</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-l from-yellow-100 to-amber-100 border-yellow-300 shadow-lg mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-yellow-600 mr-3" />
                <span className="text-3xl font-bold text-yellow-800">₪4,350</span>
              </div>
              <p className="text-yellow-700 font-semibold text-lg">סטר נפש</p>
              <p className="text-sm text-yellow-600 mt-2 font-medium">
                🏆 ב-2 שפעילות בלכלי מפיסד התמרמר ב-שירי בפולטי
              </p>
              <p className="text-xs text-yellow-600 mt-1">ב שנים ותשרת בצרכים</p>
            </CardContent>
          </Card>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-4">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-900">{item.title}</CardTitle>
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
