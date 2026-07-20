import { useQuery } from '@tanstack/react-query';
import dashboardService from '../dashboard/dashboardService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Admin dashboard KPIs (mockup frame 1). Every number here is backed by a
 * real endpoint — see the `dataGaps` flag for the one metric ("faculty total
 * steps this month") that has no backend aggregate yet. Never fake it; the
 * dashboard screen shows a "needs endpoint" pill instead.
 *
 * ADR-002 (2026-07-19): the fourth KPI used to be "open events", counting
 * UPCOMING+ONGOING rows from the `Event` model via `eventService.getEvents()`.
 * The events surface was retired (Phase 9 / Option C) and no UI has ever
 * created an Event, so that number was structurally always 0. It now counts
 * UPCOMING **activities** instead, which is the nearest meaningful metric and
 * doesn't overlap with the ongoing-activities KPI beside it. This also drops a
 * whole network round-trip: `activitiesByStatus` already comes back on the
 * existing stats query, so no new endpoint was needed.
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

  const kpis = {
    totalUsers: adminQuery.data?.totalUsers ?? 0,
    checkInsThisMonth: adminQuery.data?.checkInsThisMonth ?? 0,
    ongoingActivities: statsQuery.data?.activitiesByStatus?.ONGOING ?? 0,
    upcomingActivities: statsQuery.data?.activitiesByStatus?.UPCOMING ?? 0,
  };

  return {
    kpis,
    loading: adminQuery.isPending || statsQuery.isPending,
    refresh: () => {
      adminQuery.refetch();
      statsQuery.refetch();
    },
  };
}
