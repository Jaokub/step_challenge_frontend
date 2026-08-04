import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { formatBadgeGroups, type BadgeGroup } from '../features/group/formatBadgeGroups';

/**
 * One row of a member ranking: rank, name, the sub-groups they belong to, and
 * their step count.
 *
 * Shared by the group-detail relation cards and the full ranking screen, which
 * rendered near-identical rows before ADR-003 added badges — duplicating the
 * badge markup would have let the two drift.
 *
 * ── Why the badges sit between the name and the steps ──
 *
 * The sketch this came from put them at the far right, after the steps. Steps
 * are the primary figure and every existing row in this app ends with them, so
 * they keep the last position; the badges sit next to the name they qualify.
 *
 * They are on the SAME line rather than a second line under the name (which is
 * how the dashboard leaderboard shows distance/calories) for one reason: a
 * second line would only appear for members who are in a sub-group, so rows
 * within one list would differ in height and the fixed-height skeletons would
 * no longer match their resolved content.
 */

export interface MemberRankRowProps {
  rank: number;
  name: string;
  steps: number;
  /** Sub-groups within the group being viewed. Empty on a leaf group. */
  groups?: BadgeGroup[];
  /** How many group names before collapsing to "+N". */
  maxBadges?: number;
  /** Row-level style overrides so each host keeps its own density. */
  compact?: boolean;
}

export default function MemberRankRow({
  rank,
  name,
  steps,
  groups,
  maxBadges = 2,
  compact = false,
}: MemberRankRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { shown, overflow } = formatBadgeGroups(groups, maxBadges);

  const size = compact ? styles.compact : styles.regular;
  const badgeText = shown.length
    ? shown.join(', ') + (overflow > 0 ? ` ${t('groups.badgeOverflow', { count: overflow })}` : '')
    : null;

  return (
    <>
      <AppText variant="body-bold" style={[styles.rank, size, { color: colors.textSecondary }]}>
        {rank}
      </AppText>
      <AppText
        variant="body-medium"
        style={[styles.name, size, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {name}
      </AppText>
      {badgeText && (
        // Capped width so a long Thai group name can never squeeze the person's
        // own name out of the row. Truncates rather than wrapping.
        <AppText style={[styles.badges, { color: colors.textSecondary }]} numberOfLines={1}>
          {badgeText}
        </AppText>
      )}
      <AppText variant="heading-bold" style={[styles.steps, size, { color: colors.textPrimary }]}>
        {steps.toLocaleString()}
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  regular: { fontSize: 13, lineHeight: 15 },
  compact: { fontSize: 12.5, lineHeight: 15 },
  rank: { width: 14, textAlign: 'center' },
  // flex:1 keeps the steps column right-aligned regardless of name length,
  // matching the rows this replaced.
  name: { flex: 1 },
  // Bounded and shrink-first, so a long Thai group name gives way before the
  // person's own name does. Truncates; never wraps.
  badges: { fontSize: 10.5, lineHeight: 13, maxWidth: '42%', flexShrink: 2 },
  steps: {},
});
