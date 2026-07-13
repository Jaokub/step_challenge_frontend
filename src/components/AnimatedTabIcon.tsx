import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';

interface AnimatedTabIconProps {
  name: string;
  color: string;
  focused: boolean;
  size: number;
}

/**
 * Tab bar icon with a spring "bulge" (scale up + lift, settling back down)
 * that plays whenever the tab becomes focused — the B5 mockup follow-up
 * asked for a raised/pressed feel on the footer.
 *
 * This intentionally does NOT touch `tabBarButton`/the touchable itself —
 * an earlier attempt wrapped the whole tab button in a custom `Pressable`
 * and it broke expo-router's Link-based tab switching (every tab press
 * started showing a full-screen LoadingScreen flash instead of the
 * instant/skeleton-only transition). Animating only the icon on `focused`
 * change gets the same bulge feel without going near navigation plumbing.
 */
const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ name, color, focused, size }) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.22, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 260 })
      );
      translateY.value = withSequence(
        withSpring(-5, { damping: 8, stiffness: 300 }),
        withSpring(0, { damping: 10, stiffness: 260 })
      );
    }
  }, [focused, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <Ionicons name={(focused ? name : `${name}-outline`) as any} size={size} color={color} />
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
