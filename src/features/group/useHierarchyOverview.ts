import { useQuery } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

/**
 * Bundled parent/sibling/child relation-card data for /group/[id] (frames
 * 13/15, BUILD_PLAN.md Phase 5.2). One authorized call — never fan out
 * getGroupOverview per relation.
 */
export function useHierarchyOverview(groupId: string) {
  const query = useQuery({
    queryKey: queryKeys.groups.hierarchyOverview(groupId),
    queryFn: async () => {
      const res = await groupService.getHierarchyOverview(groupId);
      if (!res.success) throw new Error('Failed to load group hierarchy overview');
      return res.data;
    },
    enabled: !!groupId,
  });

  return {
    hierarchy: query.data ?? null,
    isHierarchyLoading: query.isPending,
  };
}
