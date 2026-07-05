import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, fontSize, shadows } from '../constants/theme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const Toast: React.FC<ToastProps> = ({ message, type, visible, onHide, duration = 2200 }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });

      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onHide)();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const accentColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.primary;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, { top: insets.top + spacing.sm }, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onHide}
        style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <Ionicons name={ICONS[type]} size={22} color={accentColor} style={styles.icon} />
        <AppText style={[styles.message, { color: colors.textOnCard }]} numberOfLines={2}>
          {message}
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.cardLarge,
  },
  icon: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});

export default Toast;
