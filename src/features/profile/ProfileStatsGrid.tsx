import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { dashboardAccents, spacing } from '../../constants/theme';

interface ProfileStatsGridProps {
  totalSteps: number;
  distanceKm: number;
  calories: number;
  avgStepsPerDay: number;
}

interface StatCellProps {
  label: string;
  value: string;
  color?: string;
}

/** Flat label-over-number cell — mockup's "สถิติเดือนนี้" grid has no icon chip. */
const StatCell: React.FC<StatCellProps> = ({ label, value, color }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.cell, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <AppText style={[styles.cellLabel, { color: colors.textSecondary }]}>{label}</AppText>
      <AppText variant="numeric" style={[styles.cellValue, { color: color || colors.textPrimary }]}>
        {value}
      </AppText>
    </View>
  );
};

export const ProfileStatsGrid: React.FC<ProfileStatsGridProps> = ({
  totalSteps,
  distanceKm,
  calories,
  avgStepsPerDay,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const tone = isDark ? 'dark' : 'light';

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCell label={t('profile.totalSteps')} value={totalSteps.toLocaleString()} color={colors.primary} />
        <StatCell
          label={t('profile.distanceKm')}
          value={distanceKm.toLocaleString()}
          color={dashboardAccents.kmIcon[tone]}
        />
      </View>
      <View style={styles.row}>
        <StatCell
          label={t('profile.calories')}
          value={calories.toLocaleString()}
          color={dashboardAccents.kcalIcon[tone]}
        />
        <StatCell
          label={t('profile.avgPerDay')}
          value={`${avgStepsPerDay.toLocaleString()} ${t('profile.stepsUnit')}`}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cellLabel: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  cellValue: {
    fontSize: 22,
  },
});

export default ProfileStatsGrid;
