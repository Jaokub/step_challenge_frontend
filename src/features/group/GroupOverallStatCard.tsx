import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, gradients, dashboardAccents } from '../../constants/theme';
import type { PeriodBucket } from '../../types';

// Mockup frames 13/15's own-group stat card: mint gradient
// (linear-gradient(150deg,#e8fbf6,#f3fbe9)) with today/week/month steps in
// solid colors.primary (#0d9488) — the exact same treatment as the
// parent/sibling/child relation cards (RelationGroupCard) and frame 20's
// full-list header (children.tsx). Backed by GET /groups/:id/overview's
// `periodStats` field (getGroupPeriodStats), the same 3-window aggregation
// already used for those relation previews.
interface GroupOverallStatCardProps {
  stats: { today: PeriodBucket; week: PeriodBucket; month: PeriodBucket } | null;
  isLoading?: boolean;
}

export const GroupOverallStatCard = ({ stats, isLoading = false }: GroupOverallStatCardProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.mint}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.card, { borderColor: colors.primary + '2E' }]}
      >
        {(['today', 'week', 'month'] as const).map((period, i) => (
          <React.Fragment key={period}>
            <View style={styles.col}>
              <AppText style={[styles.label, { color: dashboardAccents.mintCardLabel }]}>
                {t(`groups.period.${period}`)}
              </AppText>
              <AppText variant="heading-extraBold" style={[styles.value, { color: colors.primary }]}>
                {stats[period].steps.toLocaleString()}
              </AppText>
            </View>
            {i < 2 && <View style={[styles.divider, { backgroundColor: colors.primary + '2E' }]} />}
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
  // Mockup: border-radius:20px;padding:16px;border:1px solid rgba(13,148,136,0.18)
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    lineHeight: 20,
  },
});
