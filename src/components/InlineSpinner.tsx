import React, { useEffect, useId } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { gradients } from '../constants/theme';

interface InlineSpinnerProps {
  /** Diameter in px. */
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact spinning teal→lime ring — same conic-style spinner as
 * `LoadingScreen`'s splash ring, scaled down for inline use inside lists
 * (add-friend sheet's "คำขอที่รอ" tab and its infinite-scroll "load more"
 * footer) where the full-screen LoadingScreen would be too heavy.
 */
const InlineSpinner: React.FC<InlineSpinnerProps> = ({ size = 24, strokeWidth = 2.5, style }) => {
  const { colors } = useTheme();
  const spin = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * (250 / 360);

  // Same per-instance gradient-id reasoning as LoadingScreen: react-native-svg
  // resolves <Defs> ids globally, so two spinners mounted at once (e.g. this
  // one plus the pending-tab one) would otherwise collide and one loses its
  // gradient.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `inlineSpinnerGrad-${uid}`;

  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
  }, [spin]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={spinStyle}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0" stopColor={gradients.primary[0]} />
              <Stop offset="1" stopColor={gradients.primary[1]} />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.divider} strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={[arc, circumference - arc]}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default InlineSpinner;
