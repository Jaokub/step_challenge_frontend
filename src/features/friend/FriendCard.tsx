import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import { LeaderboardMember } from './Podium';

interface FriendCardProps {
  member: LeaderboardMember;
  accentColor?: string;
  isLast?: boolean;
}

export function FriendCard({ member, accentColor = '#b0f237', isLast = false }: FriendCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const rankColor = member.rank === 1 ? '#FFD700' : member.rank === 2 ? '#C0C0C0' : member.rank === 3 ? '#CD7F32' : '#7a8099';
  const rankLabel = member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : member.rank === 3 ? '🥉' : String(member.rank);

  return (
    <View 
      style={[
        styles.card, 
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider },
        member.isMe && { backgroundColor: `${colors.primary}05` } // bg-primary/5
      ]}
    >
      <AppText style={[styles.rank, { color: rankColor }]}>{rankLabel}</AppText>
      
      <View 
        style={[
          styles.avatar, 
          member.isMe 
            ? { backgroundColor: accentColor } 
            : { backgroundColor: '#1e2330' }
        ]}
      >
        <AppText style={[styles.avatarText, { color: member.isMe ? '#0d0f14' : '#f0f2f5' }]}>
          {member.avatar}
        </AppText>
      </View>
      
      <View style={styles.info}>
        <AppText style={[styles.name, { color: member.isMe ? colors.primary : colors.textPrimary }]} numberOfLines={1}>
          {member.name}
        </AppText>
        <AppText style={styles.stats}>
          {member.steps.toLocaleString()} {t('friend.stepsCount')} · {member.distance} {t('friend.kmCount')}
        </AppText>
      </View>

      <View style={styles.rightContent}>
        <AppText style={[styles.points, { color: member.isMe ? accentColor : '#7a8099' }]}>
          {member.points.toLocaleString()}
        </AppText>
        <AppText style={styles.lastActive}>{member.lastActive}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  rank: {
    width: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
  },
  stats: {
    fontSize: 12,
    color: '#7a8099',
    marginTop: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastActive: {
    fontSize: 12,
    color: '#7a8099',
    marginTop: 2,
  }
});
