import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  onPress,
  rightComponent,
}) => {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        { borderBottomColor: colors.divider },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>

      <AppText style={[styles.label, { color: colors.textOnCard }]}>
        {label}
      </AppText>

      <View style={styles.right}>
        {rightComponent ? (
          rightComponent
        ) : (
          <>
            {value && (
              <AppText style={[styles.value, { color: colors.textCardSecondary }]}>
                {value}
              </AppText>
            )}
            {onPress && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textCardSecondary}
                style={styles.arrow}
              />
            )}
          </>
        )}
      </View>
    </View>
  );

  if (onPress && !rightComponent) {
    return (
      <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize.sm,
  },
  arrow: {
    marginLeft: spacing.xs,
  },
});

export default SettingsRow;
