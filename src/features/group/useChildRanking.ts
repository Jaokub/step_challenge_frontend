import { useQuery } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Child groups of `groupId` ranked against each other, plus the members who
 * belong to none of them (ADR-003 `directOnlyMembers`).
 *
 * Backs the full child-group list screen. The per-child relation cards on
 * /group/[id] come from useHierarchyOverview instead — those rank MEMBERS
 * within each child; this ranks the children themselves.
 *
 * No `placeholderData` here, unlike useGroupOverview: this endpoint takes no
 * date range, so nothing changes the query key while the screen is open and
 * there is no pill-tap flash to smooth over.
 */
export function useChildRanking(groupId: string) {
  const childRankingQuery = useQuery({
    queryKey: queryKeys.groups.children(groupId),
    queryFn: async () => {
      const res = await groupService.getChildRanking(groupId);
      if (!res.success) throw new Error('Failed to load child group ranking');
      return res.data;
    },
    enabled: !!groupId,
  });

  return {
    childRanking: childRankingQuery.data ?? null,
    isChildRankingLoading: childRankingQuery.isPending,
    isChildRankingFetching: childRankingQuery.isFetching,
  };
}

export default useChildRanking;
