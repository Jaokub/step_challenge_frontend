import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton, StepsValue } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, gradients } from '../../constants/theme';

// steps/distanceKm are only known when the caller has real per-row health
// data (group overview). Friends podium has no steps source yet, so those
// fields are optional — never backfilled with fake numbers.
export interface LeaderboardMember {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  /** Ranking + display metric — step count. */
  steps: number;
  /** Dormant points cache; no longer displayed. */
  points?: number;
  distanceKm?: number;
  calories?: number;
  isMe: boolean;
  /** Rank slot has no real member (group has fewer than this many people). */
  isEmpty?: boolean;
}

// Mockup's `podiumBaseSpec` — literal px sizes, not scaled.
const RANK_GRADIENT: Record<number, readonly [string, string]> = {
  1: gradients.gold,
  2: gradients.silver,
  3: gradients.bronze,
};
const RANK_HEIGHT: Record<number, number> = { 1: 68, 2: 50, 3: 42 };
const RANK_AVATAR: Record<number, number> = { 1: 56, 2: 46, 3: 44 };

interface PodiumProps {
  /** Real members only — need not have all 3 ranks. Missing ranks (1/2/3)
   * are filled in as grey placeholders, matching the mockup's `buildPodium`
   * fallback ("ยังไม่มีสมาชิก" / '–' stats) rather than just omitting them. */
  topThree: LeaderboardMember[];
  isLoading?: boolean;
}

const EMPTY_SLOT = (rank: number): LeaderboardMember => ({
  id: `empty-${rank}`,
  rank,
  name: '',
  avatar: '–',
  steps: 0,
  isMe: false,
  isEmpty: true,
});

const fillSlots = (topThree: LeaderboardMember[]): LeaderboardMember[] =>
  [1, 2, 3].map((rank) => topThree.find((m) => m.rank === rank) ?? EMPTY_SLOT(rank));

const PodiumItem = ({ member }: { member: LeaderboardMember }) => {
  const { colors } = useTheme();
  const height = RANK_HEIGHT[member.rank] ?? 42;
  const avatarSize = RANK_AVATAR[member.rank] ?? 44;
  const rankGradient = member.isEmpty ? null : RANK_GRADIENT[member.rank];
  const statParts: string[] = [];
  if (!member.isEmpty && member.distanceKm != null) statParts.push(`${member.distanceKm.toFixed(1)} km`);
  if (!member.isEmpty && member.calories != null) statParts.push(`${Math.round(member.calories)} kcal`);
  const statLine = statParts.length > 0 ? statParts.join(' · ') : null;

  return (
    <View style={[styles.podiumItemContainer, member.isMe && { transform: [{ translateY: -4 }] }]}>
      <View
        style={[
          styles.avatarWrapper,
          member.isMe && { borderColor: colors.primary, borderWidth: 3, borderRadius: avatarSize / 2 + 3, padding: 3 },
        ]}
      >
        {rankGradient ? (
          <LinearGradient
            colors={rankGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          >
            <AppText style={[styles.avatarText, { color: colors.onPrimary }]}>{member.avatar}</AppText>
          </LinearGradient>
        ) : (
          <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.inputBackground }]}>
            <AppText style={[styles.avatarText, { color: colors.textSecondary }]}>{member.avatar}</AppText>
          </View>
        )}
      </View>

      <AppText
        variant="body-bold"
        style={[styles.name, { color: member.isMe ? colors.primary : colors.textPrimary }]}
        numberOfLines={1}
      >
        {member.isEmpty ? '–' : member.name}
      </AppText>
      {statLine && (
        <AppText style={[styles.statLine, { color: colors.textSecondary }]} numberOfLines={1}>
          {statLine}
        </AppText>
      )}

      {rankGradient ? (
        <LinearGradient
          colors={rankGradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bar, { height }]}
        >
          <AppText variant="heading-bold" style={[styles.rankDigit, { color: colors.onPrimary }]}>{member.rank}</AppText>
          <StepsValue value={member.steps ?? 0} size={10.5} color={colors.onPrimary} unitColor={colors.onPrimary} />
        </LinearGradient>
      ) : (
        <View style={[styles.bar, { height, backgroundColor: colors.inputBackground }]}>
          <AppText variant="heading-bold" style={[styles.rankDigit, { color: colors.textSecondary }]}>{member.rank}</AppText>
          {member.isEmpty ? (
            <AppText style={[styles.pointsText, { color: colors.textSecondary }]}>–</AppText>
          ) : (
            <StepsValue value={member.steps ?? 0} size={10.5} color={colors.textSecondary} unitColor={colors.textSecondary} />
          )}
        </View>
      )}
    </View>
  );
};

export const Podium = ({ topThree, isLoading = false }: PodiumProps) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.podiumRow}>
          {[50, 68, 42].map((h, i) => (
            <View key={i} style={styles.podiumItemContainer}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <Skeleton width={50} height={14} borderRadius={4} style={{ marginTop: spacing.xs }} />
              <Skeleton width="100%" height={h} borderRadius={14} style={{ marginTop: spacing.xs }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (topThree.length === 0) return null;

  const slots = fillSlots(topThree);

  return (
    <View style={styles.container}>
      <View style={styles.podiumRow}>
        <PodiumItem member={slots[1]} />
        <PodiumItem member={slots[0]} />
        <PodiumItem member={slots[2]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
  },
  podiumItemContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 11.5,
    lineHeight: 14,
    textAlign: 'center',
    maxWidth: 70,
  },
  statLine: {
    fontSize: 10,
    lineHeight: 12,
  },
  // AppText's heading-bold variant defaults to a 40px lineHeight (tuned for
  // real headings) — inside these 42-68px-tall bars that overflowed and
  // clipped the "pt" line below it. Override tightly to the digit's actual
  // size.
  rankDigit: {
    fontSize: 15,
    lineHeight: 17,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pointsText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '700',
  },
});
