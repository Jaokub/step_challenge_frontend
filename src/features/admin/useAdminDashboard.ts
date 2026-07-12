import { useQuery } from '@tanstack/react-query';
import dashboardService from '../dashboard/dashboardService';
import eventService from '../event/eventService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Admin dashboard KPIs (mockup frame 1). Every number here is backed by a
 * real endpoint — see the `dataGaps` flag for the one metric ("faculty total
 * steps this month") that has no backend aggregate yet. Never fake it; the
 * dashboard screen shows a "needs endpoint" pill instead.
 */
export function useAdminDashboard() {
  const adminQuery = useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: async () => {
      const result = await dashboardService.getAdminDashboard();
      if (!result.success) throw new Error('Failed to load admin dashboard');
      return result.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const result = await dashboardService.getStats();
      if (!result.success) throw new Error('Failed to load dashboard stats');
      return result.data;
    },
  });

  // "เปิดอยู่" (open) = an event participants can still be part of: UPCOMING or ONGOING.
  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: async () => {
      const result = await eventService.getEvents();
      if (!result.success) throw new Error('Failed to load events');
      return result.data;
    },
  });

  const openEventsCount = (eventsQuery.data ?? []).filter(
    (e) => e.status === 'UPCOMING' || e.status === 'ONGOING',
  ).length;

  const kpis = {
    totalUsers: adminQuery.data?.totalUsers ?? 0,
    checkInsThisMonth: adminQuery.data?.checkInsThisMonth ?? 0,
    ongoingActivities: statsQuery.data?.activitiesByStatus?.ONGOING ?? 0,
    openEvents: openEventsCount,
  };

  return {
    kpis,
    loading: adminQuery.isPending || statsQuery.isPending || eventsQuery.isPending,
    refresh: () => {
      adminQuery.refetch();
      statsQuery.refetch();
      eventsQuery.refetch();
    },
  };
}
