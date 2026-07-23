import { useQuery, keepPreviousData } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Own full ranking + top3/top5 for a group. Permission-gated server-side
 * (self / ancestor), so a 403 here just means the section should render
 * nothing. Sibling/parent/child relation-card data lives in
 * useHierarchyOverview — this hook only ever covers the group's own stats.
 *
 * `placeholderData: keepPreviousData` — /group/[id]'s member-ranking pill
 * changes `startDate`/`endDate`, which changes the query key. Without this,
 * `overview` (and `overview.periodStats`, which the today/week/month stat
 * card reads and which never actually depends on this range) would flash
 * `null` on every pill tap. `isOverviewLoading` (isPending) now only fires
 * on the very first load; use `isOverviewFetching` where a section's values
 * genuinely change with the range (the ranking rows) and should re-skeleton.
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
    placeholderData: keepPreviousData,
  });

  return {
    overview: overviewQuery.data ?? null,
    isOverviewLoading: overviewQuery.isPending,
    isOverviewFetching: overviewQuery.isFetching,
    refetchOverview: overviewQuery.refetch,
  };
}
