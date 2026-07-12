import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, dashboardAccents } from '../../constants/theme';
import { LeaderboardMember } from './Podium';

// Group has fewer than 4 real members — no rank-4 row exists yet, but we
// still show one greyed-out slot for it (per user reference screenshot)
// instead of just cutting the list short.
export const EmptyMemberSlot = ({ rank = 4 }: { rank?: number }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <AppText variant="body-bold" style={[styles.rank, { color: colors.textSecondary }]}>{rank}</AppText>
      <View style={[styles.emptyAvatar, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.info} />
      <AppText variant="body-bold" style={[styles.points, { color: colors.textSecondary }]}>—</AppText>
    </View>
  );
};

interface FriendCardProps {
  member?: LeaderboardMember;
  isLoading?: boolean;
}

// Mockup frame 10 "rest" rows (rank > 3): plain row, no medal styling —
// rank number, dark initials chip, name (+ steps·km if the caller has real
// health data for this row), points right-aligned.
export const FriendCard = ({ member, isLoading = false }: FriendCardProps) => {
  const { colors, isDark } = useTheme();
  // Mockup's avatar chip is a fixed dark square (#222b2e) — fine on the
  // mockup's light-only surface, but low-contrast against an already-dark
  // card in dark theme. Use the theme-paired token instead so it reads in
  // both themes (dark: same near-black chip; light: a light-grey chip).
  const avatarBg = dashboardAccents.avatarMuted[isDark ? 'dark' : 'light'];
  const avatarFg = isDark ? '#fff' : colors.textPrimary;

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Skeleton width={14} height={14} borderRadius={4} />
        <Skeleton width={32} height={32} borderRadius={11} />
        <View style={styles.info}>
          <Skeleton width="50%" height={13} borderRadius={4} />
          <Skeleton width="35%" height={11} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={40} height={13} borderRadius={4} />
      </View>
    );
  }

  if (!member) return null;

  const statLine = member.steps != null
    ? `${member.steps.toLocaleString()}${member.distanceKm != null ? ` · ${member.distanceKm.toFixed(1)} km` : ''}`
    : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <AppText variant="body-bold" style={[styles.rank, { color: colors.textSecondary }]}>{member.rank}</AppText>

      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <AppText variant="body-bold" style={[styles.avatarText, { color: avatarFg }]}>{member.avatar}</AppText>
      </View>

      <View style={styles.info}>
        <AppText
          variant="body-medium"
          style={[styles.name, { color: member.isMe ? colors.primary : colors.textPrimary }]}
          numberOfLines={1}
        >
          {member.name}
        </AppText>
        {statLine && (
          <AppText style={[styles.stats, { color: colors.textSecondary }]} numberOfLines={1}>
            {statLine}
          </AppText>
        )}
      </View>

      <AppText variant="body-bold" style={[styles.points, { color: colors.textPrimary }]}>
        {member.points.toLocaleString()}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rank: {
    width: 14,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 15,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    lineHeight: 13,
  },
  emptyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    lineHeight: 15,
  },
  stats: {
    fontSize: 10.5,
    lineHeight: 13,
    marginTop: 2,
  },
  points: {
    fontSize: 13,
    lineHeight: 15,
  },
});
