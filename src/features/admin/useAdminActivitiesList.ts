import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import activityService from '../activity/activityService';
import { queryKeys } from '../../constants/queryKeys';
import type { Activity, ActivityStatus } from '../../types';

export type AdminActivityFilter = 'all' | 'upcoming' | 'ongoing' | 'ended';

const STATUS_MAP: Record<Exclude<AdminActivityFilter, 'all'>, ActivityStatus> = {
  upcoming: 'UPCOMING',
  ongoing: 'ONGOING',
  ended: 'COMPLETED',
};

/**
 * Real, unfiltered activities list for the admin console — deliberately does
 * NOT fall back to mock data (see `useActivities`'s mock injection for the
 * member-facing tab). Admins need to see the ground truth.
 */
export function useAdminActivitiesList() {
  const [filter, setFilter] = useState<AdminActivityFilter>('all');

  const { data, isPending, isRefetching, refetch, error } = useQuery({
    queryKey: queryKeys.activities.list(`admin:${filter}`),
    queryFn: async () => {
      const res = await activityService.getActivities({
        limit: 100,
        status: filter !== 'all' ? STATUS_MAP[filter] : undefined,
      });
      if (!res.success) throw new Error('Failed to load activities');
      return res.data.activities ?? [];
    },
  });

  const activities: Activity[] = useMemo(() => data ?? [], [data]);

  return {
    activities,
    filter,
    setFilter,
    loading: isPending,
    refreshing: isRefetching,
    refresh: refetch,
    error: error as Error | null,
  };
}
