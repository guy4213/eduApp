import { useQueryClient } from '@tanstack/react-query';

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateDashboardData = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
  };

  const invalidateCoursesData = () => {
    queryClient.invalidateQueries({ queryKey: ['courses-data'] });
  };

  const invalidateAllData = () => {
    queryClient.invalidateQueries();
  };

  const refetchDashboardData = () => {
    queryClient.refetchQueries({ queryKey: ['dashboard-data'] });
  };

  const refetchCoursesData = () => {
    queryClient.refetchQueries({ queryKey: ['courses-data'] });
  };

  return {
    invalidateDashboardData,
    invalidateCoursesData,
    invalidateAllData,
    refetchDashboardData,
    refetchCoursesData,
  };
};