import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { gradients, borderRadius } from '../constants/theme';

// Fixed so both segments (any two labels) are always identical width — this
// is what makes ภาษา (ไทย/EN) and ธีม (มืด/สว่าง) the same total pill length
// as each other, and stops the row from jumping when the selection flips.
// 64 comfortably fits the longest label ("สว่าง") at fontSize 12.
const SEGMENT_WIDTH = 64;
const TRACK_PADDING = 3;

interface SegmentedToggleProps {
  /** Exactly two labels, left-to-right. */
  options: [string, string];
  selectedIndex: 0 | 1;
  onChange: (index: 0 | 1) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Two-option pill toggle (mockup: ภาษา ไทย/EN, ธีม มืด/สว่าง). A single
 * gradient highlight slides left/right between two fixed-width segments —
 * matching the mockup's easing intent (`transition: all .25s ease`) while
 * avoiding the layout jump a per-segment crossfade caused when the two
 * labels weren't the same pixel width.
 */
const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ options, selectedIndex, onChange, style }) => {
  const { colors, isDark } = useTheme();
  const progress = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selectedIndex,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, SEGMENT_WIDTH] });
  // colors.inputBackground is identical to colors.card in dark mode (see
  // ActivityCard.tsx's statChipBg for the same workaround), which made the
  // track invisible sitting on the settings card — fall back to the page
  // background in dark mode instead, matching the mockup's literal #0c1013.
  const trackBg = isDark ? colors.background : colors.inputBackground;

  return (
    <View style={[styles.track, { backgroundColor: trackBg }, style]}>
      <Animated.View style={[styles.highlight, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={gradients.primary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {options.map((label, index) => {
        const active = index === selectedIndex;
        return (
          <TouchableOpacity
            key={label}
            activeOpacity={0.8}
            onPress={() => onChange(index as 0 | 1)}
            disabled={active}
            style={styles.segment}
          >
            <AppText variant="body-semiBold" style={[styles.label, { color: active ? colors.onPrimary : colors.textSecondary }]}>
              {label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: TRACK_PADDING,
  },
  highlight: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    width: SEGMENT_WIDTH,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  segment: {
    width: SEGMENT_WIDTH,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
  },
});

export default SegmentedToggle;
