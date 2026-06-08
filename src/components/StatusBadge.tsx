import AppText from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '../constants/theme';

type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeProps {
  status: ActivityStatus;
}

const STATUS_CONFIG: Record<ActivityStatus, { label: string; colorKey: 'primary' | 'success' | 'accent' | 'error' }> = {
  UPCOMING: { label: 'Upcoming', colorKey: 'primary' },
  ONGOING: { label: 'Ongoing', colorKey: 'success' },
  COMPLETED: { label: 'Completed', colorKey: 'accent' },
  CANCELLED: { label: 'Cancelled', colorKey: 'error' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { colors } = useTheme();
  const config = STATUS_CONFIG[status];
  const badgeColor = colors[config.colorKey];
  const textColor = status === 'COMPLETED' ? '#1A1A2E' : '#FFFFFF';

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <AppText style={[styles.label, { color: textColor }]}>
        {config.label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius['2xl'],
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
