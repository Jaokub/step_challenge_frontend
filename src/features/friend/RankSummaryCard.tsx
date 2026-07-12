import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, GradientText, Skeleton } from '../../components';
import { spacing, borderRadius, gradients, dashboardAccents } from '../../constants/theme';

// Mockup frame 10 "friends" tab rank card — mint gradient, label + a real
// stat line, big #rank on the right. Friends have no steps source yet, so
// the stat line shows total points (real) instead of the mockup's fake
// "ก้าวเดือนนี้" placeholder.
interface RankSummaryCardProps {
  rank?: number;
  totalPoints?: number;
  isLoading?: boolean;
}

export const RankSummaryCard = ({ rank, totalPoints, isLoading = false }: RankSummaryCardProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: gradients.mint[0] }]}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={12} borderRadius={4} />
            <Skeleton width="45%" height={12} borderRadius={4} />
          </View>
          <Skeleton width={40} height={26} borderRadius={4} />
        </View>
      </View>
    );
  }

  if (rank == null) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.mint} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.card}>
        <View style={{ flex: 1 }}>
          <AppText style={[styles.label, { color: dashboardAccents.mintCardLabel }]}>
            {t('groups.rankAmongFriends')}
          </AppText>
          <AppText style={[styles.stat, { color: dashboardAccents.mintCardLabel }]}>
            {t('groups.totalPointsStat', { points: (totalPoints ?? 0).toLocaleString() })}
          </AppText>
        </View>
        <GradientText colors={gradients.statValue} variant="heading-extraBold" style={styles.rankNumber}>
          {`#${rank}`}
        </GradientText>
      </LinearGradient>
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
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  stat: {
    fontSize: 12,
  },
  rankNumber: {
    fontSize: 26,
  },
});
