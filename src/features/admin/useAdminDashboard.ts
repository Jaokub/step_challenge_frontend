import { useQuery } from '@tanstack/react-query';
import dashboardService from '../dashboard/dashboardService';
import { queryKeys } from '../../constants/queryKeys';

export function useAdminDashboard() {
  const { data: adminData, isPending, refetch } = useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: async () => {
      const result = await dashboardService.getAdminDashboard();
      if (!result.success) throw new Error('Failed to load admin dashboard');
      return result.data;
    },
  });

  const stats = {
    totalUsers: adminData?.totalUsers || 0,
    checkInRate: adminData?.participationRate || 0,
    dau: Math.floor((adminData?.totalCheckIns || 0) / 30), // Approx
    wau: Math.floor((adminData?.totalCheckIns || 0) / 4), // Approx
    activeActivities: adminData?.totalActivities || 0,
    completedActivities: 0,
  };

  const topUsers = (adminData?.mostActiveUsers || []).map(u => ({
    id: u.id,
    name: u.fullName,
    points: u.totalPoints
  }));

  const topActivities = (adminData?.mostPopularActivities || []).map(a => ({
    id: a.id,
    title: a.title,
    checkIns: a.participantCount || 0
  }));

  const topGroups = [
    { id: 'g1', name: 'Running Club', members: 45, points: 2100 },
    { id: 'g2', name: 'IT Dept', members: 30, points: 1800 },
  ];

  const handleExportCSV = () => {
    console.log("Exporting CSV...");
    // Real implementation would call API and download file
  };

  return {
    stats,
    topUsers,
    topActivities,
    topGroups,
    handleExportCSV,
    loading: isPending,
    refreshData: refetch
  };
}
