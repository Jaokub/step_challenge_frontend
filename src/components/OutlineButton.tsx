import AppText from './AppText';
import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '../constants/theme';

interface OutlineButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const OutlineButton: React.FC<OutlineButtonProps> = ({
  title,
  onPress,
  color,
  loading = false,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const buttonColor = color ?? colors.primary;
  const disabledColor = colors.textCardSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          borderColor: disabled ? disabledColor : buttonColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={buttonColor} size="small" />
      ) : (
        <AppText
          style={[
            styles.title,
            { color: disabled ? disabledColor : buttonColor },
          ]}
        >
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  title: {
    fontSize: fontSize.md,
  },
});

export default OutlineButton;
