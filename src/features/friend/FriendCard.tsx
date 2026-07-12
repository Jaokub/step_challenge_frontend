import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, adminAccents } from '../../constants/theme';
import { LeaderboardMember } from './Podium';

interface FriendCardProps {
  member?: LeaderboardMember;
  isLoading?: boolean;
}

// Mockup frame 10 "rest" rows (rank > 3): plain row, no medal styling —
// rank number, dark initials chip, name (+ steps·km if the caller has real
// health data for this row), points right-aligned.
export const FriendCard = ({ member, isLoading = false }: FriendCardProps) => {
  const { colors } = useTheme();

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

      <View style={[styles.avatar, { backgroundColor: adminAccents.avatarBg }]}>
        <AppText variant="body-bold" style={[styles.avatarText, { color: adminAccents.onDark }]}>{member.avatar}</AppText>
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
    color: '#fff',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
  },
  stats: {
    fontSize: 10.5,
    marginTop: 2,
  },
  points: {
    fontSize: 13,
  },
});
