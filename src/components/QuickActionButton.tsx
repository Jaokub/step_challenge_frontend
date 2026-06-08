import AppText from './AppText';
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onPress,
  color,
}) => {
  const { colors } = useTheme();
  const buttonColor = color ?? colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.container}
    >
      <View
        style={[
          styles.circle,
          { backgroundColor: buttonColor + '18' },
        ]}
      >
        <Ionicons name={icon} size={26} color={buttonColor} />
      </View>
      <AppText
        style={[styles.label, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 72,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default QuickActionButton;
