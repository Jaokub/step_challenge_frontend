import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, gradients, dashboardAccents } from '../../constants/theme';

// Mockup frame 10's "friends" tab rank card, now reused for BOTH tabs (user
// asked to drop the separate group overall-stat card and just show this
// same "your rank" card everywhere) — theme-aware mint/teal card, label +
// a real stat line, big #rank on the right. Friends have no steps source
// yet, so the stat line shows total points (real) instead of the mockup's
// fake "ก้าวเดือนนี้" placeholder.
interface RankSummaryCardProps {
  rank?: number;
  steps?: number;
  isLoading?: boolean;
  /** Overrides the default "rank among friends" label (e.g. for group tabs). */
  label?: string;
}

export const RankSummaryCard = ({ rank, steps, isLoading = false, label }: RankSummaryCardProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const cardGradient = isDark ? gradients.goalCard : gradients.goalCardLight;
  const labelColor = dashboardAccents.goalLabel[isDark ? 'dark' : 'light'];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: cardGradient[0] }]}>
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
      <LinearGradient colors={cardGradient} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.card}>
        <View style={{ flex: 1 }}>
          <AppText style={[styles.label, { color: labelColor }]}>
            {label ?? t('groups.rankAmongFriends')}
          </AppText>
          <AppText style={[styles.stat, { color: labelColor }]}>
            {t('groups.totalStepsStat', { steps: (steps ?? 0).toLocaleString() })}
          </AppText>
        </View>
        <AppText variant="heading-extraBold" style={[styles.rankNumber, { color: colors.primary }]}>
          {`#${rank}`}
        </AppText>
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
    borderRadius: 20, // mockup literal — no existing token matches
  },
  label: {
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stat: {
    fontSize: 12,
    lineHeight: 15,
  },
  rankNumber: {
    fontSize: 26,
    lineHeight: 30,
  },
});
