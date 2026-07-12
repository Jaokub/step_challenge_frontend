import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton } from '../../components';
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
  points: number;
  steps?: number;
  distanceKm?: number;
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
  points: 0,
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
  const statLine = !member.isEmpty && member.steps != null
    ? `${member.steps.toLocaleString()}${member.distanceKm != null ? ` · ${member.distanceKm.toFixed(1)} km` : ''}`
    : null;

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
          <AppText variant="heading-bold" style={{ color: colors.onPrimary, fontSize: 15 }}>{member.rank}</AppText>
          <AppText style={[styles.pointsText, { color: colors.onPrimary }]}>{member.points.toLocaleString()} pt</AppText>
        </LinearGradient>
      ) : (
        <View style={[styles.bar, { height, backgroundColor: colors.inputBackground }]}>
          <AppText variant="heading-bold" style={{ color: colors.textSecondary, fontSize: 15 }}>{member.rank}</AppText>
          <AppText style={[styles.pointsText, { color: colors.textSecondary }]}>{member.isEmpty ? '–' : `${member.points.toLocaleString()} pt`}</AppText>
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
    fontWeight: 'bold',
  },
  name: {
    fontSize: 11.5,
    textAlign: 'center',
    maxWidth: 70,
  },
  statLine: {
    fontSize: 10,
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
    fontWeight: '700',
  },
});
