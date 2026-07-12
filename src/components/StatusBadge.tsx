import AppText from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../constants/theme';

type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeProps {
  status: ActivityStatus;
}

const STATUS_CONFIG: Record<ActivityStatus, { colorKey: 'primary' | 'success' | 'accent' | 'error' }> = {
  UPCOMING: { colorKey: 'primary' },
  ONGOING: { colorKey: 'success' },
  COMPLETED: { colorKey: 'accent' },
  CANCELLED: { colorKey: 'error' },
};

// Mockup frame 2/4 pill: padding 4x10, full round, 10.5px/700 weight.
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const config = STATUS_CONFIG[status];
  const badgeColor = colors[config.colorKey];
  const textColor = status === 'COMPLETED' ? '#1A1A2E' : '#FFFFFF';

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <AppText style={[styles.label, { color: textColor }]}>
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
