import AppText from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../constants/theme';

export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeProps {
  status: ActivityStatus;
}

// Mockup's `statusStyle()`: a soft ~12%-opacity tint background with the
// solid color as text — never a saturated solid pill with white text (that
// was this component's old, mismatched look).
const STATUS_CONFIG: Record<ActivityStatus, { colorKey: 'primary' | 'warning' | 'textSecondary' | 'error'; tint: boolean }> = {
  ONGOING: { colorKey: 'primary', tint: true }, // mockup: rgba(13,148,136,0.12) / #0d9488
  UPCOMING: { colorKey: 'warning', tint: true }, // mockup: rgba(232,134,43,0.12) / #e8862b
  CANCELLED: { colorKey: 'error', tint: true }, // mockup: rgba(179,38,30,0.1) / #b3261e
  COMPLETED: { colorKey: 'textSecondary', tint: false }, // mockup: flat #eef2f0 bg / #6f7d78 text
};

/**
 * Shared status → {bg, text} resolver, exported so any other status pill
 * (e.g. the edit-activity status picker) uses the exact same mockup mapping
 * instead of inventing its own colors.
 */
export const statusColors = (status: ActivityStatus, colors: any) => {
  const config = STATUS_CONFIG[status];
  const text = colors[config.colorKey];
  const bg = config.tint ? text + '1F' : colors.inputBackground;
  return { bg, text };
};

// Mockup frame 2/4 pill: padding 4x10, full round, 10.5px/700 weight.
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { bg, text } = statusColors(status, colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText style={[styles.label, { color: text }]}>
        {t(`status.${status}`)}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});

export default StatusBadge;
