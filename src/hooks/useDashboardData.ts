import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalLessons: number;
  activeStudents: number;
  activeCourses: number;
  monthlyEarnings: number;
  rewardsTotal: number;
  upcomingLessons: any[];
  recentActivity: any[];
}

interface DashboardData {
  stats: DashboardStats;
  lessons: any[];
  reports: any[];
  weeklyReports: any[];
  monthlySchedules: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function filterReportsCurrentWeek(reports: any[]) {
  const now = new Date();

  // Get Sunday of current week (start)
  const dayOfWeek = now.getDay();
  const sundayStart = new Date(now);
  sundayStart.setHours(0, 0, 0, 0);
  sundayStart.setDate(now.getDate() - dayOfWeek);

  // Get next Sunday (start of next week)
  const nextSunday = new Date(sundayStart);
  nextSunday.setDate(sundayStart.getDate() + 7);

  return reports.filter(report => {
    const createdAt = new Date(report.created_at);
    return createdAt >= sundayStart && createdAt < nextSunday;
  });
}

export const useDashboardData = (): DashboardData => {
  const { user, initialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    activeStudents: 0,
    activeCourses: 0,
    monthlyEarnings: 0,
    rewardsTotal: 0,
    upcomingLessons: [],
    recentActivity: [],
  });
  
  const [lessons, setLessons] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [monthlySchedules, setMonthlySchedules] = useState<number>(0);

  const fetchDashboardData = async () => {
    // Don't fetch data until auth is fully initialized and user is available
    if (!user || !initialized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      // Fetch reports data
      const { data: reportsData, error: reportsError } = await supabase
        .from("lesson_reports")
        .select("*")
        .gte("created_at", firstDay)
        .lt("created_at", firstDayNextMonth);

      if (reportsError) {
        console.error("Error fetching reports:", reportsError);
        setReports([]);
      } else {
        setReports(reportsData || []);
      }
      
      const reportsThisWeek = filterReportsCurrentWeek(reportsData || []);
      setWeeklyReports(reportsThisWeek);

      // Fetch courses data
      const { data: courses, error: coursesError } = await supabase
        .from("course_instances")
        .select("id");

      if (coursesError) {
        throw new Error(`Failed to fetch courses: ${coursesError.message}`);
      }

      if (!courses || courses.length === 0) {
        console.log("No courses found for instructor");
        setLessons([]);
        setStats({
          totalLessons: 0,
          activeStudents: 0,
          activeCourses: 0,
          monthlyEarnings: 0,
          rewardsTotal: 0,
          upcomingLessons: [],
          recentActivity: [],
        });
        return;
      }

      const courseIds = courses.map(c => c.id);

      // Fetch schedules data
      const { data: schedules, error: schedulesError } = await supabase
        .from("lesson_schedules")
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          lesson:lesson_id (
            id,
            title
          ),
          course_instance:course_instance_id (
            id,
            grade_level,
            institution:institution_id (
              id,
              name
            ),
            instructor:instructor_id (
              id,
              full_name
            )
          )
        `)
        .in("course_instance_id", courseIds);

      if (schedulesError) {
        console.error("Error fetching schedules:", schedulesError);
      }

      // Fetch enrollments data
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("course_instances")
        .select("*");

      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
      }

      // Calculate stats
      const totalActive = (enrollments || []).reduce(
        (acc, curr) => acc + (curr.max_participants || 0),
        0
      );

      const schedulesThisMonth = (schedules || []).filter(s => {
        const start = s.scheduled_start;
        return start >= firstDay && start < firstDayNextMonth;
      });

      setMonthlySchedules(schedulesThisMonth.length);

      const adaptedLessons = (schedules || []).map((s) => ({
        id: s.id,
        institution_name: s.course_instance?.institution?.name || "לא ידוע",
        scheduled_start: s.scheduled_start,
        scheduled_end: s.scheduled_end,
        title: s.lesson?.title || "ללא כותרת",
        instructorName: s.course_instance?.instructor?.full_name || "לא ידוע",
        instructor_id: s.course_instance?.instructor?.id || "לא ידוע",
        lesson_id: s.lesson?.id 
      }));

      // Fetch sales leads for rewards calculation
      const { data: salesLeads, error: salesError } = await supabase
        .from('sales_leads')
        .select('potential_value, commission_percentage');

      if (salesError) {
        console.error("Error fetching sales leads:", salesError);
      }

      // Calculate total rewards from sales leads
      const calculateRewardsTotal = (leads: any[]) => {
        const totalPotentialValue = (leads || []).reduce((sum, lead) => {
          return sum + (lead.potential_value || 0);
        }, 0);
        return totalPotentialValue;
      };

      const rewardsTotal = calculateRewardsTotal(salesLeads || []);

      // Update state
      setLessons(adaptedLessons);
      setStats({
        totalLessons: adaptedLessons.length,
        activeStudents: totalActive,
        activeCourses: (enrollments || []).length,
        monthlyEarnings: adaptedLessons.length * 150,
        rewardsTotal: rewardsTotal,
        upcomingLessons: adaptedLessons.slice(0, 3),
        recentActivity: adaptedLessons.slice(-3),
      });

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
      
      // Set empty state on error to prevent broken UI
      setLessons([]);
      setStats({
        totalLessons: 0,
        activeStudents: 0,
        activeCourses: 0,
        monthlyEarnings: 0,
        rewardsTotal: 0,
        upcomingLessons: [],
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, initialized]);

  return {
    stats,
    lessons,
    reports,
    weeklyReports,
    monthlySchedules,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};