import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import activityService from './activityService';
import { getMockActivities } from './mockActivities';
import { queryKeys } from '../../constants/queryKeys';
import type { Activity, ActivityStatus } from '../../types';

const statusMap: Record<string, ActivityStatus> = {
  upcoming: 'UPCOMING',
  ongoing: 'ONGOING',
  past: 'COMPLETED',
};

export function useActivities(filter: string) {
  const {
    data,
    isPending,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.activities.list(filter),
    queryFn: async ({ pageParam }) => {
      const response = await activityService.getActivities({
        page: pageParam,
        limit: 10,
        status: filter !== 'all' ? statusMap[filter] : undefined,
      });
      if (!response.success) throw new Error('Failed to load activities');
      const page = response.data;

      // No real activities seeded yet — show sample data on the first page
      // so the screen isn't empty. Disappears automatically once the API
      // starts returning real activities.
      if (pageParam === 1 && (!page.activities || page.activities.length === 0)) {
        const mockActivities = getMockActivities(statusMap[filter] ?? 'UPCOMING');
        return {
          activities: mockActivities,
          pagination: { page: 1, limit: mockActivities.length, total: mockActivities.length, totalPages: 1 },
        };
      }

      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (pagination && pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
  });

  const activities: Activity[] = data?.pages.flatMap((page) => page.activities) ?? [];

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isPending) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isPending, fetchNextPage]);

  return {
    activities,
    loading: isPending,
    refreshing: isRefetching && !isFetchingNextPage,
    loadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    refresh,
    loadMore,
  };
}
