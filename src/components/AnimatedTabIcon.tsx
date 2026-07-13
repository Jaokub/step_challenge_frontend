import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AnimatedTabIconProps {
  name: string;
  color: string;
  focused: boolean;
  size: number;
}

/**
 * Tab bar icon — lifts a few pixels (spring, no scale) when its tab becomes
 * focused, plus the small active dot. Mockup footer icons are always the
 * outline/stroke style (fill:none), even the active one — only the stroke
 * color and the dot change — so this never swaps to a filled Ionicons
 * variant like a lot of tab-bar implementations do.
 *
 * Also intentionally does NOT touch `tabBarButton`/the touchable itself —
 * an earlier attempt wrapped the whole tab button in a custom `Pressable`
 * and it broke expo-router's Link-based tab switching (every tab press
 * started showing a full-screen LoadingScreen flash instead of the
 * instant/skeleton-only transition). Animating only the icon on `focused`
 * change avoids going near navigation plumbing.
 */
const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ name, color, focused, size }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(focused ? -4 : 0, { damping: 14, stiffness: 260 });
  }, [focused, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <Ionicons name={`${name}-outline` as any} size={size} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: -10,
  },
});

export default AnimatedTabIcon;
