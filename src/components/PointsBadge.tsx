import AppText from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '../constants/theme';

type BadgeSize = 'sm' | 'md' | 'lg';

interface PointsBadgeProps {
  points: number;
  size?: BadgeSize;
}

const SIZE_CONFIG: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number; iconSize: number }> = {
  sm: { paddingH: spacing.sm, paddingV: 2, fontSize: fontSize.xs, iconSize: 12 },
  md: { paddingH: spacing.md, paddingV: spacing.xs, fontSize: fontSize.sm, iconSize: 14 },
  lg: { paddingH: spacing.lg, paddingV: spacing.sm, fontSize: fontSize.md, iconSize: 16 },
};

const PointsBadge: React.FC<PointsBadgeProps> = ({ points, size = 'md' }) => {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.accent,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
        },
      ]}
    >
      <Ionicons
        name="star"
        size={config.iconSize}
        color="#1A1A2E"
        style={styles.icon}
      />
      <AppText
        style={[
          styles.label,
          { fontSize: config.fontSize },
        ]}
      >
        {points.toLocaleString()}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius['2xl'],
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    color: '#1A1A2E',
  },
});

export default PointsBadge;
