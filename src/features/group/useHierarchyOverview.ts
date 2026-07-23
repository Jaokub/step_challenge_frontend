import { useQuery, keepPreviousData } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';
import type { RelationPeriod } from '../../types';

interface HierarchyPeriods {
  parentPeriod?: RelationPeriod;
  siblingsPeriod?: RelationPeriod;
  childrenPeriod?: RelationPeriod;
}

/**
 * Bundled parent/sibling/child relation-card data for /group/[id] (frames
 * 13/15, BUILD_PLAN.md Phase 5.2). One authorized call — never fan out
 * getGroupOverview per relation. Each relation card ranks its own Top-3
 * independently (one day/week/month pill per section on the screen), so
 * the three periods are separate and each change refetches via the query key.
 *
 * `placeholderData: keepPreviousData` — flipping any one pill changes the
 * query key (it's still one bundled HTTP call, so a period change refetches
 * everything, not just the touched section). Without this, `hierarchy`
 * would briefly go `null` between periods and every section — including
 * the two the user didn't touch — would flash empty instead of showing a
 * same-shape skeleton. Keeping the previous page's data around lets
 * `[id].tsx` know exactly how many skeleton rows to render per section
 * while `isHierarchyFetching` is true.
 */
export function useHierarchyOverview(groupId: string, periods: HierarchyPeriods = {}) {
  const { parentPeriod, siblingsPeriod, childrenPeriod } = periods;
  const query = useQuery({
    queryKey: queryKeys.groups.hierarchyOverview(groupId, parentPeriod, siblingsPeriod, childrenPeriod),
    queryFn: async () => {
      const res = await groupService.getHierarchyOverview(groupId, periods);
      if (!res.success) throw new Error('Failed to load group hierarchy overview');
      return res.data;
    },
    enabled: !!groupId,
    placeholderData: keepPreviousData,
  });

  return {
    hierarchy: query.data ?? null,
    isHierarchyLoading: query.isPending,
    isHierarchyFetching: query.isFetching,
  };
}
