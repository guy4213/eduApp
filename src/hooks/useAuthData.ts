import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Custom hook for fetching user profile data with React Query
export const useUserProfile = () => {
  const { user, isInitialized } = useAuth();
  
  return useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

// Custom hook for fetching dashboard data with React Query
export const useDashboardData = () => {
  const { user, isInitialized } = useAuth();
  
  return useQuery({
    queryKey: ['dashboardData', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      // Fetch reports data
      const { data: reportsData, error: reportsError } = await supabase
        .from("lesson_reports")
        .select("*")
        .gte("created_at", firstDay)
        .lt("created_at", firstDayNextMonth);

      if (reportsError) throw reportsError;

      // Fetch courses data
      const { data: courses, error: coursesError } = await supabase
        .from("course_instances")
        .select("id, max_participants");

      if (coursesError) throw coursesError;

      if (!courses || courses.length === 0) {
        return {
          reports: reportsData || [],
          weeklyReports: [],
          lessons: [],
          stats: {
            totalLessons: 0,
            activeStudents: 0,
            activeCourses: 0,
            monthlyEarnings: 0,
            rewardsTotal: 0,
            upcomingLessons: [],
            recentActivity: [],
          },
          monthlySchedules: 0,
        };
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

      if (schedulesError) throw schedulesError;

      // Filter schedules for current month
      const schedulesThisMonth = schedules.filter(s => {
        const start = s.scheduled_start;
        return start >= firstDay && start < firstDayNextMonth;
      });

      // Calculate weekly reports
      const weeklyReports = filterReportsCurrentWeek(reportsData || []);

      // Calculate total active students
      const totalActive = courses.reduce(
        (acc, curr) => acc + (curr.max_participants || 0),
        0
      );

      // Fetch sales leads for rewards
      const { data: salesLeads } = await supabase
        .from('sales_leads')
        .select('potential_value, commission_percentage');

      const rewardsTotal = (salesLeads || []).reduce((sum, lead) => {
        return sum + (lead.potential_value || 0);
      }, 0);

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

      return {
        reports: reportsData || [],
        weeklyReports,
        lessons: adaptedLessons,
        stats: {
          totalLessons: adaptedLessons.length,
          activeStudents: totalActive,
          activeCourses: courses.length,
          monthlyEarnings: adaptedLessons.length * 150,
          rewardsTotal,
          upcomingLessons: adaptedLessons.slice(0, 3),
          recentActivity: adaptedLessons.slice(-3),
        },
        monthlySchedules: schedulesThisMonth.length,
      };
    },
    enabled: !!user?.id && isInitialized,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

// Helper function to filter reports for current week
function filterReportsCurrentWeek(reports: any[]) {
  const now = new Date();
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
}

// Hook to invalidate and refetch dashboard data
export const useRefreshDashboardData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
  };
};