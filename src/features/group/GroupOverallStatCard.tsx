import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, gradients, dashboardAccents } from '../../constants/theme';
import type { PeriodBucket } from '../../types';

// Mockup frames 13/15's own-group stat card. Uses the same theme-aware
// surface as the dashboard's ("index" tab) goal card — dark green
// (gradients.goalCard) in dark mode, light mint (gradients.goalCardLight)
// in light mode — instead of a gradient fixed to the light mint palette,
// which read as flat/washed-out against the rest of the (mostly dark) app
// chrome. Backed by GET /groups/:id/overview's `periodStats` field
// (getGroupPeriodStats), the same 3-window aggregation already used for the
// relation previews (RelationGroupCard).
interface GroupOverallStatCardProps {
  stats: { today: PeriodBucket; week: PeriodBucket; month: PeriodBucket } | null;
  isLoading?: boolean;
}

export const GroupOverallStatCard = ({ stats, isLoading = false }: GroupOverallStatCardProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const tone = isDark ? 'dark' : 'light';
  const cardGradient = isDark ? gradients.goalCard : gradients.goalCardLight;
  const cardBorder = dashboardAccents.goalCardBorder[tone];
  const labelColor = dashboardAccents.goalLabel[tone];
  const dividerColor = colors.primary + '33';

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
        colors={cardGradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.card, { borderColor: cardBorder }]}
      >
        {(['today', 'week', 'month'] as const).map((period, i) => (
          <React.Fragment key={period}>
            <View style={styles.col}>
              <AppText style={[styles.label, { color: labelColor }]}>
                {t(`groups.period.${period}`)}
              </AppText>
              <AppText variant="heading-extraBold" style={[styles.value, { color: colors.primary }]}>
                {stats[period].steps.toLocaleString()}
              </AppText>
            </View>
            {i < 2 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
          </React.Fragment>
        ))}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // No horizontal padding here — the screen's ScrollView already applies
  // paddingHorizontal (see group/[id].tsx `content` style); adding it again
  // here inset this card narrower than every sibling card on the same
  // screen (member rows, ranking rows, relation cards).
  container: {
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
