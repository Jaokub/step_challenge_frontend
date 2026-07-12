import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, gradients, dashboardAccents } from '../../constants/theme';
import type { GroupOverallStats } from '../../types';

// Mockup frame 10's group-tab stat card shows today/week/month steps, which
// the backend doesn't aggregate by time window for a group. Same mint-card
// shape, but the three columns are real GroupOverallStats fields instead —
// points / steps / members — rather than fabricated time-windowed numbers.
interface GroupOverallStatCardProps {
  stats: GroupOverallStats | null;
  isLoading?: boolean;
}

export const GroupOverallStatCard = ({ stats, isLoading = false }: GroupOverallStatCardProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: gradients.mint[0] }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.col}>
              <Skeleton width={40} height={11} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={50} height={16} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!stats) return null;

  const columns = [
    { label: t('common.points'), value: stats.totalPoints.toLocaleString() },
    { label: t('health.steps'), value: stats.totalSteps.toLocaleString() },
    { label: t('common.members'), value: stats.memberCount.toLocaleString() },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.mint} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.card}>
        {columns.map((col, i) => (
          <React.Fragment key={col.label}>
            <View style={styles.col}>
              <AppText style={[styles.label, { color: dashboardAccents.mintCardLabel }]}>{col.label}</AppText>
              <AppText variant="heading-extraBold" style={[styles.value, { color: colors.primary }]}>{col.value}</AppText>
            </View>
            {i < columns.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
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
    padding: spacing.lg,
    borderRadius: 20, // mockup literal — no existing token matches
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(13,148,136,0.18)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
});
