import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AppText from './AppText';
import GradientText from './GradientText';
import { useTheme } from '../contexts/ThemeContext';
import { gradients, englishFonts } from '../constants/theme';

interface LoadingScreenProps {
  /** Overrides the default animated "กำลังโหลด..." caption when provided. */
  message?: string;
}

// Ring geometry — mirrors the mockup's conic-gradient spinner (teal → lime
// arc covering 250° of the ring, remaining 110° left as a faint track).
const RING_SIZE = 104;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_ARC = RING_CIRCUMFERENCE * (250 / 360);

// Glow halo — mockup: inset -24px around the 104px ring (so 152px across),
// radial-gradient(closest-side, primary 28%, accent 8% @70%, transparent).
const GLOW_SIZE = RING_SIZE + 48;

const Dot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.dot, { color }, style]}>.</Animated.Text>
  );
};

/**
 * Brand splash-style loading screen — same ring/glow/wordmark treatment as
 * the approved mockup, but theme-aware: colors are pulled from `useTheme()`
 * so it matches whichever palette (light/dark) the app is currently in,
 * rather than the mockup's dark-only literal values.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { colors } = useTheme();
  const spin = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
    glow.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [spin, glow]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + glow.value * 0.35,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.glow, glowStyle]}>
          <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
            <Defs>
              <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.28} />
                <Stop offset="0.7" stopColor={gradients.primary[1]} stopOpacity={0.08} />
                <Stop offset="1" stopColor={gradients.primary[1]} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#glowGrad)" />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.ringWrap, spinStyle]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0" stopColor={gradients.primary[0]} />
                <Stop offset="1" stopColor={gradients.primary[1]} />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.divider}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="url(#ringGrad)"
              strokeWidth={RING_STROKE}
              strokeDasharray={[RING_ARC, RING_CIRCUMFERENCE - RING_ARC]}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
        </Animated.View>

        <View style={[styles.innerCircle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} />
      </View>

      <View style={styles.textBlock}>
        <GradientText variant="heading-bold" style={styles.title}>
          Step Challenge
        </GradientText>
        <View style={styles.captionRow}>
          <AppText variant="body-medium" style={[styles.caption, { color: colors.textSecondary }]}>
            {message ?? 'กำลังโหลด'}
          </AppText>
          {!message && (
            <View style={styles.dotsRow}>
              <Dot delay={0} color={colors.textSecondary} />
              <Dot delay={200} color={colors.textSecondary} />
              <Dot delay={400} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  iconWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: -24,
    left: -24,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  ringWrap: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    letterSpacing: 0.2,
    // Brand wordmark stays in Sora regardless of UI language (mockup-literal),
    // same reasoning AppText normally applies per-string — this string just
    // never contains Thai, so it needs a manual override here.
    fontFamily: englishFonts.heading.bold,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  caption: {
    fontSize: 15,
  },
  dotsRow: {
    flexDirection: 'row',
  },
  dot: {
    fontSize: 15,
    fontFamily: englishFonts.body.medium,
  },
});

export default LoadingScreen;
