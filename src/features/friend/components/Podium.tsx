import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../components';
import { spacing } from '../../../constants/theme';

export interface LeaderboardMember {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  steps: number;
  calories: number;
  distance: number;
  points: number;
  isMe: boolean;
  lastActive: string;
}

interface PodiumProps {
  topThree: LeaderboardMember[];
  accentColor?: string;
}

const PodiumItem = ({ member, height, accentColor, isFirst }: { member: LeaderboardMember, height: number, accentColor: string, isFirst?: boolean }) => {
  const avatarBg = member.isMe ? accentColor : '#1e2330';
  const avatarColor = member.isMe ? '#0d0f14' : '#f0f2f5';
  const avatarBorder = member.isMe ? accentColor : `${accentColor}40`;

  return (
    <View style={styles.podiumItemContainer}>
      <View style={styles.avatarWrapper}>
        {isFirst && <AppText style={styles.crown}>👑</AppText>}
        <View style={[styles.avatar, { backgroundColor: avatarBg, borderColor: avatarBorder }]}>
          <AppText style={[styles.avatarText, { color: avatarColor }]}>{member.avatar}</AppText>
        </View>
      </View>
      <AppText style={styles.name} numberOfLines={1}>{member.name.split(" ")[0]}</AppText>
      <AppText style={[styles.points, { color: accentColor }]}>{member.points.toLocaleString()}</AppText>
      
      <View style={[styles.bar, { height, backgroundColor: `${accentColor}15`, borderTopColor: `${accentColor}40` }]}>
        <AppText style={[styles.rankLabel, { color: accentColor }]}>#{member.rank}</AppText>
      </View>
    </View>
  );
};

export function Podium({ topThree, accentColor = '#b0f237' }: PodiumProps) {
  if (topThree.length < 3) return null;

  return (
    <View style={styles.container}>
      <View style={styles.podiumRow}>
        <PodiumItem member={topThree[1]} height={80} accentColor={accentColor} />
        <PodiumItem member={topThree[0]} height={100} accentColor={accentColor} isFirst />
        <PodiumItem member={topThree[2]} height={64} accentColor={accentColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  podiumItemContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  crown: {
    position: 'absolute',
    top: -20,
    fontSize: 18,
    zIndex: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 60,
    color: '#FFFFFF',
  },
  points: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});
