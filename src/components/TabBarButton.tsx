import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface TabBarButtonProps {
  children?: React.ReactNode;
  onPress?: (e: any) => void;
  onLongPress?: (e: any) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityState?: { selected?: boolean; [key: string]: any };
  [key: string]: any;
}

/**
 * Custom `tabBarButton` for the bottom tab bar (wired via
 * screenOptions.tabBarButton in app/(tabs)/_layout.tsx). React Navigation's
 * default tab touchable has no press feedback beyond the platform ripple —
 * this adds a spring "bulge" (scale up + lift) on press-in that settles
 * back on release, per the B5 mockup follow-up request. Same
 * useSharedValue/withSpring press-scale pattern AppCard.tsx already uses.
 */
const TabBarButton: React.FC<TabBarButtonProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityState,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(1.18, { damping: 10, stiffness: 260 });
    translateY.value = withSpring(-4, { damping: 10, stiffness: 260 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 260 });
    translateY.value = withSpring(0, { damping: 10, stiffness: 260 });
  };

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityState={accessibilityState}
      style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style as any]}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

export default TabBarButton;
