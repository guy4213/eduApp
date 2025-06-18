import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, BookOpen, BarChart3, Settings, LogOut, Clock, MapPin, Star, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalLessons: number;
  activeStudents: number;
  activeCourses: number;
  monthlyEarnings: number;
  upcomingLessons: any[];
  recentActivity: any[];
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    activeStudents: 0,
    activeCourses: 0,
    monthlyEarnings: 0,
    upcomingLessons: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

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
          activeStudents: 45, // Mock data - would calculate from actual enrollments
          activeCourses: courses?.length || 0,
          monthlyEarnings: 4350, // Mock data - would calculate from actual payments
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

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { icon: Calendar, title: 'יומן אישי', description: 'צפייה במערכת השעות והשיעורים הקרובים', path: '/calendar' },
    { icon: BookOpen, title: 'דיווח שיעור', description: 'דיווח על שיעור שהתקיים או בתהליך', path: '/lesson-report' },
    { icon: Users, title: 'קורסים', description: 'ניהול הקורסים והכיתות שלי', path: '/courses' },
    { icon: BarChart3, title: 'דוחות ושכר', description: 'צפייה בדוחות חודשיים וחישוב שכר', path: '/reports' },
    { icon: Settings, title: 'הגדרות פרופיל', description: 'עריכת פרטים אישיים והגדרות המערכת', path: '/profile' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">מערכת ניהול מנחים</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">שלום, {user?.user_metadata?.full_name || user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>יציאה</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">דשבורד מנהל פדגוגי</h2>
          <p className="text-gray-600">ברוך הבא למערכת ניהול המנחים והמרצים</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="תלמידים פעילים"
            value={stats.activeStudents}
            icon={Users}
            color="bg-orange-500"
          />
          <StatsCard
            title="הושלמו"
            value="1"
            icon={Award}
            color="bg-green-500"
          />
          <StatsCard
            title="שיעורים כללים"
            value="3"
            icon={BookOpen}
            color="bg-blue-500"
          />
          <StatsCard
            title="מבוצע בבניינים"
            value="45"
            icon={BarChart3}
            color="bg-blue-600"
          />
        </div>

        {/* Upcoming Lessons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 ml-2" />
                יומן יומי - 18.6.2025
              </CardTitle>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                הוסף שיעור +
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Lesson 1 */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500">
                  <div className="flex items-center space-x-3">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                      החזר שיעור
                    </Button>
                    <div>
                      <p className="font-medium">בית ספר אשלים ראשון לציון</p>
                      <p className="text-sm text-gray-600">שעת בגו גלי-ח-כ</p>
                      <p className="text-sm text-gray-600">משתתפים: 12 מתלמידים</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-blue-600">09:00-10:30</p>
                    <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">כביש</span>
                    <p className="text-sm text-gray-500 mt-1">תל אביב יפו 21 דקות מכאן</p>
                  </div>
                </div>

                {/* Lesson 2 */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-r-4 border-green-500">
                  <div className="flex items-center space-x-3">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                      דווח מופעים
                    </Button>
                    <div>
                      <p className="font-medium">גימע רמות</p>
                      <p className="text-sm text-gray-600">שעת בגו גלי-ח-כ</p>
                      <p className="text-sm text-gray-600">משתתפים: 12 מתלמידים</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-green-600">11:00-12:30</p>
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">הושלם</span>
                    <p className="text-sm text-gray-500 mt-1">תל אביב יפו 2 דקות מכאן</p>
                  </div>
                </div>

                {/* Lesson 3 */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-r-4 border-purple-500">
                  <div className="flex items-center space-x-3">
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-600">
                      דווח מופעים
                    </Button>
                    <span className="text-sm text-purple-600 font-medium">התחל שיעור</span>
                    <div>
                      <p className="font-medium">דת שלום רמות</p>
                      <p className="text-sm text-gray-600">שעת בגו גלי-א-כ</p>
                      <p className="text-sm text-gray-600">משתתפים: 18 מתלמידים</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-purple-600">14:00-15:30</p>
                    <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">עוד מעט</span>
                    <p className="text-sm text-gray-500 mt-1">תל אביב יפו מקום קבוע</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>ביצועים מדדדים 📊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">דבר כהן</span>
                  <span className="text-right">
                    <div className="text-sm text-gray-600">⭐ שיעורי החירדני 24 מ 4.8</div>
                    <div className="text-sm font-bold">4.8/5</div>
                  </span>
                </div>
                <Progress value={96} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>דירוג כללי</span>
                  <span>96%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">שרה לוי</span>
                  <span className="text-right">
                    <div className="text-sm text-gray-600">⭐ שיעורי החירדני 19 מ 4.5</div>
                    <div className="text-sm font-bold">4.5/5</div>
                  </span>
                </div>
                <Progress value={92} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>דירוג כללי</span>
                  <span>92%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">מיכל אברהם</span>
                  <span className="text-right">
                    <div className="text-sm text-gray-600">⭐ שיעורי החירדני 21 מ 4.3</div>
                    <div className="text-sm font-bold">4.3/5</div>
                  </span>
                </div>
                <Progress value={88} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>דירוג כללי</span>
                  <span>88%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-l from-yellow-100 to-yellow-200 border-yellow-300">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-yellow-600 ml-2" />
              <span className="text-2xl font-bold text-yellow-800">₪4,350</span>
            </div>
            <p className="text-yellow-700 font-medium">סטר נפש</p>
            <p className="text-sm text-yellow-600 mt-2">
              🏆 ב-2 שפעילות בלכלי מפיסד התמרמר ב-שירי בפולטי
            </p>
            <p className="text-xs text-yellow-600 mt-1">ב שנים ותשרת בצרכים</p>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {menuItems.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center">
                  <item.icon className="h-8 w-8 text-primary ml-4" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
