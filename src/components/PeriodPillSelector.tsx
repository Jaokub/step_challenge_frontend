import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { gradients } from '../constants/theme';
import type { RelationPeriod } from '../types';

interface PeriodPillSelectorProps {
  value: RelationPeriod;
  onChange: (period: RelationPeriod) => void;
}

const PERIODS: RelationPeriod[] = ['today', 'week', 'month'];
const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };

/**
 * Compact day/week/month segmented pill for ranking sections that need to
 * fit inline next to a header title (the member-ranking row, and each
 * parent/siblings/children relation section on /group/[id]) — smaller and
 * shorter-labeled than TimeframeSelector's Daily/Weekly/Monthly toggle,
 * which is built for a full-width row of its own.
 */
const PeriodPillSelector: React.FC<PeriodPillSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.inputBackground }]}>
      {PERIODS.map((period) => {
        const active = period === value;
        const label = t(`groups.periodShort.${period}`);
        return (
          <TouchableOpacity
            key={period}
            activeOpacity={0.8}
            onPress={() => {
              if (!active) {
                Haptics.selectionAsync();
                onChange(period);
              }
            }}
          >
            {active ? (
              <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.pill}>
                <AppText variant="body-bold" style={{ fontSize: 11, color: colors.onPrimary }}>
                  {label}
                </AppText>
              </LinearGradient>
            ) : (
              <View style={styles.pill}>
                <AppText style={{ fontSize: 11, color: colors.textSecondary }}>{label}</AppText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PeriodPillSelector;
