import { useQuery } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Hierarchy-aware group stats: own full ranking + top3/top5, and (when
 * `fetchSiblings` is set) sibling groups' overall stats only.
 *
 * Both endpoints are permission-gated server-side (self / ancestor), so a
 * 403 here just means the section should render nothing.
 */
export function useGroupOverview(groupId: string, fetchSiblings: boolean) {
  const overviewQuery = useQuery({
    queryKey: queryKeys.groups.overview(groupId),
    queryFn: async () => {
      const res = await groupService.getGroupOverview(groupId);
      if (!res.success) throw new Error('Failed to load group overview');
      return res.data;
    },
    enabled: !!groupId,
  });

  const siblingsQuery = useQuery({
    queryKey: queryKeys.groups.siblings(groupId),
    queryFn: async () => {
      const res = await groupService.getGroupSiblings(groupId);
      if (!res.success) throw new Error('Failed to load sibling groups');
      return res.data;
    },
    enabled: !!groupId && fetchSiblings,
  });

  return {
    overview: overviewQuery.data ?? null,
    isOverviewLoading: overviewQuery.isPending,
    siblings: siblingsQuery.data ?? [],
    isSiblingsLoading: siblingsQuery.isPending,
  };
}
