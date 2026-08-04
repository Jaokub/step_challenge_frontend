/**
 * @module features/group/formatBadgeGroups
 *
 * Turns a member's sub-group list into something that fits on one ranking row.
 *
 * Ranking rows must stay a FIXED height — the skeleton convention in
 * CLAUDE.md requires a loading placeholder to occupy the exact box of its
 * resolved content, and `RelationGroupCard` draws its skeletons at a hardcoded
 * 35px. A member in four sub-groups must therefore not make a row taller or
 * wrap onto a second line, which is what the cap is for.
 *
 * Pure and separate from the row component so it can be tested: the mobile
 * runner is pure-logic only (`environment: 'node'`, no RN transform), so
 * anything importing React is out of reach. Same split as `attendeeRoster.ts`
 * and `parseScannedQR.ts`.
 */

export interface BadgeGroup {
  id: string;
  name: string;
}

export interface FormattedBadges {
  /** Group names to render, already capped. */
  shown: string[];
  /** How many were dropped. 0 when everything fits. */
  overflow: number;
}

/**
 * @param groups - the member's sub-groups, already scoped to the subtree being
 *   viewed and sorted by the backend. Order is preserved; this never re-sorts.
 * @param max - how many names to show before collapsing the rest. Default 2,
 *   which is what both ranking rows use at their current width.
 */
export const formatBadgeGroups = (
  groups: BadgeGroup[] | null | undefined,
  max = 2
): FormattedBadges => {
  const list = Array.isArray(groups) ? groups.filter((g) => g?.name) : [];

  // A non-positive cap would otherwise report every group as overflow and
  // render a bare "+3", which says nothing useful.
  if (max <= 0) return { shown: [], overflow: 0 };

  return {
    shown: list.slice(0, max).map((g) => g.name),
    overflow: Math.max(0, list.length - max),
  };
};

export default formatBadgeGroups;
