import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';

interface StepsValueProps {
  /** Raw step count — formatted with thousands separators. */
  value: number;
  /** Font size of the number. The unit renders at ~62% of this. */
  size?: number;
  /** Colour of the number. Defaults to the primary text tone. */
  color?: string;
  /** Colour of the unit suffix. Defaults to the muted secondary tone. */
  unitColor?: string;
  /** Overrides the default localized "steps" unit (e.g. "steps/day"). */
  unit?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A step count with its unit rendered as a smaller, muted trailing span rather
 * than baked into the same string — so "526 steps" reads as a big number with a
 * small label, not two same-sized words. Mirrors the ProfileStatsGrid StatCell
 * pattern (value + unit, baseline-aligned) and is the shared way to render a
 * step figure anywhere a unit is shown alongside it.
 */
export const StepsValue: React.FC<StepsValueProps> = ({
  value,
  size = 15,
  color,
  unitColor,
  unit,
  style,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // Keep both spans on one shared lineHeight so baseline alignment stays put
  // inside fixed-height rows (podium bars, leaderboard rows).
  const lineHeight = Math.round(size * 1.3);
  const unitSize = Math.max(9, Math.round(size * 0.62));

  return (
    <View style={[styles.row, style]}>
      <AppText
        variant="body-bold"
        style={{ fontSize: size, lineHeight, color: color ?? colors.textPrimary }}
      >
        {value.toLocaleString()}
      </AppText>
      <AppText
        style={[
          styles.unit,
          { fontSize: unitSize, lineHeight, color: unitColor ?? colors.textSecondary },
        ]}
      >
        {` ${unit ?? t('common.stepsUnit')}`}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  unit: {
    fontWeight: '600',
  },
});

export default StepsValue;
