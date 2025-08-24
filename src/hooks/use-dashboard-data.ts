import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

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
}

export const useDashboardData = () => {
  const { user } = useAuth();

  const fetchDashboardData = async (): Promise<DashboardData> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // Fetch reports for current month
    const { data: reportsData, error: reportsError } = await supabase
      .from("lesson_reports")
      .select("*")
      .gte("created_at", firstDay)
      .lt("created_at", firstDayNextMonth);

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      throw reportsError;
    }

    // Filter reports for current week
    const filterReportsCurrentWeek = (reports: any[]) => {
      const dayOfWeek = now.getDay();
      const sundayStart = new Date(now);
      sundayStart.setHours(0, 0, 0, 0);
      sundayStart.setDate(now.getDate() - dayOfWeek);

      const nextSunday = new Date(sundayStart);
      nextSunday.setDate(sundayStart.getDate() + 7);

      return reports.filter(report => {
        const createdAt = new Date(report.created_at);
        return createdAt >= sundayStart && createdAt < nextSunday;
      });
    };

    const reports = reportsData || [];
    const weeklyReports = filterReportsCurrentWeek(reports);

    // Fetch course instances
    const { data: courses, error: coursesError } = await supabase
      .from("course_instances")
      .select("id");

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      throw coursesError;
    }

    if (!courses || courses.length === 0) {
      return {
        stats: {
          totalLessons: 0,
          activeStudents: 0,
          activeCourses: 0,
          monthlyEarnings: 0,
          rewardsTotal: 0,
          upcomingLessons: [],
          recentActivity: [],
        },
        lessons: [],
        reports,
        weeklyReports,
        monthlySchedules: 0,
      };
    }

    const courseIds = courses.map(c => c.id);

    // Fetch lesson schedules
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
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    // Fetch enrollments for student count
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("course_instances")
      .select("*");

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      throw enrollmentsError;
    }

    const totalActive = enrollments?.reduce(
      (acc, curr) => acc + (curr.max_participants || 0),
      0
    ) || 0;

    // Filter schedules for current month
    const schedulesThisMonth = (schedules || []).filter(s => {
      const start = s.scheduled_start;
      return start >= firstDay && start < firstDayNextMonth;
    });

    const monthlySchedules = schedulesThisMonth.length;

    // Adapt lessons data
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
    const { data: salesLeads, error: salesLeadsError } = await supabase
      .from('sales_leads')
      .select('potential_value, commission_percentage');

    if (salesLeadsError) {
      console.error('Error fetching sales leads:', salesLeadsError);
      // Don't throw error for rewards, just log it
    }

    // Calculate total rewards from sales leads
    const calculateRewardsTotal = (leads: any[]) => {
      const totalPotentialValue = leads.reduce((sum, lead) => {
        return sum + (lead.potential_value || 0);
      }, 0);
      return totalPotentialValue;
    };

    const rewardsTotal = calculateRewardsTotal(salesLeads || []);

    const stats: DashboardStats = {
      totalLessons: adaptedLessons.length,
      activeStudents: totalActive,
      activeCourses: enrollments?.length || 0,
      monthlyEarnings: adaptedLessons.length * 150,
      rewardsTotal,
      upcomingLessons: adaptedLessons.slice(0, 3),
      recentActivity: adaptedLessons.slice(-3),
    };

    return {
      stats,
      lessons: adaptedLessons,
      reports,
      weeklyReports,
      monthlySchedules,
    };
  };

  return useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });
};