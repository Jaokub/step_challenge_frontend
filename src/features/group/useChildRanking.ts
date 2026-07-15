import { useQuery } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Full ranked child-group list for /group/[id]/children (mockup frame 20).
 * Same aggregator as the child relation-card preview on /group/[id]
 * (useHierarchyOverview), fetched separately here so the full-list screen
 * isn't blocked on the parent/sibling data the card view also needs.
 */
export function useChildRanking(groupId: string) {
  const query = useQuery({
    queryKey: queryKeys.groups.children(groupId),
    queryFn: async () => {
      const res = await groupService.getChildRanking(groupId);
      if (!res.success) throw new Error('Failed to load child group ranking');
      return res.data;
    },
    enabled: !!groupId,
  });

  return {
    childRanking: query.data ?? null,
    isChildRankingLoading: query.isPending,
  };
}
