import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Skeleton } from '../../components';
import { spacing, borderRadius } from '../../constants/theme';
import { LeaderboardMember } from './Podium';

interface RankSummaryCardProps {
  member?: LeaderboardMember;
  accentColor?: string;
  isGroupTab?: boolean;
  isLoading?: boolean;
}

export const RankSummaryCard = ({ member, accentColor = '#b0f237', isGroupTab = false, isLoading = false }: RankSummaryCardProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View 
          style={[
            styles.card, 
            { 
              backgroundColor: `${accentColor}05`,
              borderColor: `${accentColor}20`,
            }
          ]}
        >
          <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: spacing.sm }} />
          
          <View style={styles.infoContainer}>
            <Skeleton width="30%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <View style={styles.statsRow}>
              <Skeleton width={50} height={12} borderRadius={4} />
              <Skeleton width={40} height={12} borderRadius={4} />
              <Skeleton width={45} height={12} borderRadius={4} />
            </View>
          </View>
          
          <View style={styles.rankContainer}>
            <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={50} height={12} borderRadius={4} />
          </View>
        </View>
      </View>
    );
  }

  if (!member) return null;

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.card, 
          { 
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}40`
          }
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: accentColor }]}>
          <AppText style={styles.avatarText}>{member.avatar}</AppText>
        </View>
        
        <View style={styles.infoContainer}>
          <AppText style={styles.title}>{t('friend.yourRank')}</AppText>
          <View style={styles.statsRow}>
            <AppText style={styles.statText}>{member.steps.toLocaleString()} {t('friend.stepsCount')}</AppText>
            <AppText style={styles.statText}>{member.distance} {t('friend.kmCount')}</AppText>
            <AppText style={styles.statText}>{member.calories} kcal</AppText>
          </View>
        </View>
        
        <View style={styles.rankContainer}>
          <AppText style={[styles.rankNumber, { color: accentColor }]}>#{member.rank}</AppText>
          <AppText style={styles.pointsText}>{member.points.toLocaleString()} pt</AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    height: 78,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d0f14',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statText: {
    fontSize: 12,
    color: '#7a8099',
  },
  rankContainer: {
    alignItems: 'flex-end',
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pointsText: {
    fontSize: 12,
    color: '#7a8099',
  }
});
