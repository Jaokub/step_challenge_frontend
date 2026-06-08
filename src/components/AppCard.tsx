import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, shadows, spacing } from '../constants/theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
}

const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  onPress,
  padding = spacing.lg,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg, // Make it slightly less aggressive than xl (24px)
    borderWidth: colors.cardBorder !== 'transparent' ? 1 : 0,
    borderColor: colors.cardBorder,
    padding,
    ...shadows.card,
    shadowColor: colors.cardShadow,
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  if (onPress) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[cardStyle, { width: '100%' }]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

export default AppCard;
