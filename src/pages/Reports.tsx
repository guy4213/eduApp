import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, DollarSign, TrendingUp, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import MobileNavigation from '@/components/layout/MobileNavigation';

interface MonthlyReport {
  month: string;
  totalLessons: number;
  totalHours: number;
  totalEarnings: number;
  completedLessons: number;
  cancelledLessons: number;
}

const Reports = () => {
  const { user } = useAuth();
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthStats, setCurrentMonthStats] = useState({
    totalEarnings: 0,
    totalLessons: 0,
    completionRate: 0,
    averageRating: 0
  });

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        // Fetch lesson schedules for this instructor
        const { data: schedules } = await supabase
          .from('lesson_schedules')
          .select(`
            *,
            lesson:lesson_id (
              id,
              title,
              status
            ),
            course_instance:course_instance_id (
              id,
              price_for_instructor,
              instructor_id
            )
          `)
          .eq('course_instance.instructor_id', user.id);

        // Process data for current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentMonthSchedules = schedules?.filter(schedule => {
          if (!schedule.scheduled_start) return false;
          const scheduleDate = new Date(schedule.scheduled_start);
          return scheduleDate.getMonth() === currentMonth && scheduleDate.getFullYear() === currentYear;
        }) || [];

        const completedSchedules = currentMonthSchedules.filter(s => s.lesson?.status === 'completed');
        const totalEarnings = completedSchedules.reduce((sum, schedule) => {
          return sum + (schedule.course_instance?.price_for_instructor || 0);
        }, 0);

        setCurrentMonthStats({
          totalEarnings,
          totalLessons: currentMonthSchedules.length,
          completionRate: currentMonthSchedules.length > 0 ? (completedSchedules.length / currentMonthSchedules.length) * 100 : 0,
          averageRating: 4.8 // Mock data
        });

        // Process data for monthly reports (last 6 months)
        const monthlyData: MonthlyReport[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
          
          const monthSchedules = schedules?.filter(schedule => {
            if (!schedule.scheduled_start) return false;
            const scheduleDate = new Date(schedule.scheduled_start);
            return scheduleDate.getMonth() === date.getMonth() && scheduleDate.getFullYear() === date.getFullYear();
          }) || [];

          const completed = monthSchedules.filter(s => s.lesson?.status === 'completed');
          const cancelled = monthSchedules.filter(s => s.lesson?.status === 'cancelled');
          
          monthlyData.push({
            month,
            totalLessons: monthSchedules.length,
            totalHours: monthSchedules.length * 1.5, // Assuming 1.5 hours per lesson
            totalEarnings: completed.reduce((sum, schedule) => sum + (schedule.course_instance?.price_for_instructor || 0), 0),
            completedLessons: completed.length,
            cancelledLessons: cancelled.length
          });
        }

        setMonthlyReports(monthlyData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

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
            <div className="md:hidden">
            <MobileNavigation />
            </div>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">דוחות ושכר</h1>
            </div>
            <Button className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>ייצוא דוח</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">סיכום חודשי</h2>
          <p className="text-gray-600">צפייה בדוחות ביצועים וחישוב שכר חודשי</p>
        </div>

        {/* Current Month Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">₪{currentMonthStats.totalEarnings.toLocaleString()}</p>
                  <p className="text-gray-600 font-medium">הכנסות החודש</p>
                </div>
                <div className="p-3 rounded-full bg-green-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{currentMonthStats.totalLessons}</p>
                  <p className="text-gray-600 font-medium">שיעורים החודש</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{currentMonthStats.completionRate.toFixed(1)}%</p>
                  <p className="text-gray-600 font-medium">אחוז השלמה</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{currentMonthStats.averageRating}</p>
                  <p className="text-gray-600 font-medium">דירוג ממוצע</p>
                </div>
                <div className="p-3 rounded-full bg-orange-500">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>דוח חודשי מפורט</CardTitle>
            <CardDescription>סיכום פעילות ורווחים ב-6 החודשים האחרונים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="py-3 px-4 font-medium text-gray-900">חודש</th>
                    <th className="py-3 px-4 font-medium text-gray-900">שיעורים</th>
                    <th className="py-3 px-4 font-medium text-gray-900">שעות</th>
                    <th className="py-3 px-4 font-medium text-gray-900">הושלמו</th>
                    <th className="py-3 px-4 font-medium text-gray-900">בוטלו</th>
                    <th className="py-3 px-4 font-medium text-gray-900">הכנסות</th>
                    <th className="py-3 px-4 font-medium text-gray-900">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyReports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{report.month}</td>
                      <td className="py-3 px-4">{report.totalLessons}</td>
                      <td className="py-3 px-4">{report.totalHours}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">{report.completedLessons}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-red-600 font-medium">{report.cancelledLessons}</span>
                      </td>
                      <td className="py-3 px-4 font-bold">₪{report.totalEarnings.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {report.totalLessons > 0 ? (
                          <Badge variant={report.completedLessons / report.totalLessons > 0.8 ? "default" : "secondary"}>
                            {((report.completedLessons / report.totalLessons) * 100).toFixed(0)}% הושלם
                          </Badge>
                        ) : (
                          <Badge variant="outline">אין פעילות</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart Placeholder */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>גרף ביצועים</CardTitle>
            <CardDescription>מגמת הכנסות והשלמת שיעורים לאורך זמן</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">גרף ביצועים יוצג כאן</p>
              <p className="text-sm text-gray-500">אינטגרציה עם ספריית גרפים בפיתוח</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;