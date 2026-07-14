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
  /** Trailing unit rendered smaller/muted next to the value (mockup: "8,780 ก้าว"). */
  unit?: string;
}

/** Flat label-over-number cell — mockup's "สถิติเดือนนี้" grid has no icon chip. */
const StatCell: React.FC<StatCellProps> = ({ label, value, color, unit }) => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.cell,
        // Mockup only puts a hairline border on the light-theme cards, but
        // borderWidth must stay constant (0/1 toggling resizes the box by a
        // pixel and made the whole screen visibly jump on theme switch) —
        // toggle the color to transparent instead.
        { backgroundColor: colors.card, borderColor: isDark ? 'transparent' : colors.cardBorder },
      ]}
    >
      <AppText style={[styles.cellLabel, { color: colors.textSecondary }]}>{label}</AppText>
      <View style={styles.valueRow}>
        <AppText variant="numeric" style={[styles.cellValue, { color: color || colors.textPrimary }]}>
          {value}
        </AppText>
        {/* Mockup literal: unit suffix is its own smaller/muted span, not part
            of the 22px value text. */}
        {unit && (
          <AppText style={[styles.cellUnit, { color: colors.textSecondary }]}> {unit}</AppText>
        )}
      </View>
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
        <StatCell
          label={t('profile.totalSteps')}
          value={totalSteps.toLocaleString()}
          unit={t('profile.stepsUnit')}
          color={colors.primary}
        />
        <StatCell
          label={t('profile.distanceKm')}
          value={distanceKm.toLocaleString()}
          unit={t('dashboard.km')}
          color={dashboardAccents.kmIcon[tone]}
        />
      </View>
      <View style={styles.row}>
        <StatCell
          label={t('profile.calories')}
          value={calories.toLocaleString()}
          unit={t('dashboard.kcal')}
          color={dashboardAccents.kcalIcon[tone]}
        />
        <StatCell
          label={t('profile.avgPerDay')}
          value={avgStepsPerDay.toLocaleString()}
          unit={t('profile.stepsUnit')}
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cellValue: {
    fontSize: 22,
  },
  cellUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProfileStatsGrid;
