import { useQuery } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Own full ranking + top3/top5 for a group. Permission-gated server-side
 * (self / ancestor), so a 403 here just means the section should render
 * nothing. Sibling/parent/child relation-card data lives in
 * useHierarchyOverview — this hook only ever covers the group's own stats.
 */
export function useGroupOverview(groupId: string, startDate?: string, endDate?: string) {
  const overviewQuery = useQuery({
    queryKey: queryKeys.groups.overview(groupId, startDate, endDate),
    queryFn: async () => {
      const res = await groupService.getGroupOverview(groupId, { startDate, endDate });
      if (!res.success) throw new Error('Failed to load group overview');
      return res.data;
    },
    enabled: !!groupId,
  });

  return {
    overview: overviewQuery.data ?? null,
    isOverviewLoading: overviewQuery.isPending,
    refetchOverview: overviewQuery.refetch,
  };
}
