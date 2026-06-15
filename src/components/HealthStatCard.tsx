import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, shadows, spacing } from '../constants/theme';

interface HealthStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const HealthStatCard: React.FC<HealthStatCardProps> = ({
  icon,
  label,
  value,
  color,
  style,
}) => {
  const { colors } = useTheme();
  const iconColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          ...shadows.card,
          shadowColor: colors.cardShadow,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: iconColor + '18' },
        ]}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <AppText 
        style={[styles.label, { color: colors.textCardSecondary }]} 
        numberOfLines={1} 
        adjustsFontSizeToFit
      >
        {label}
      </AppText>
      <AppText 
        style={[styles.value, { color: colors.textOnCard }]} 
        numberOfLines={1} 
        adjustsFontSizeToFit
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'flex-start',
    minWidth: 140,
    minHeight: 116,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xl,
  },
});

export default HealthStatCard;
