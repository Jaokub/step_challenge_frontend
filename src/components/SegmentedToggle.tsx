import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { gradients, borderRadius } from '../constants/theme';

interface SegmentedToggleProps {
  /** Exactly two labels, left-to-right. */
  options: [string, string];
  selectedIndex: 0 | 1;
  onChange: (index: 0 | 1) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Two-option pill toggle (mockup: ภาษา ไทย/EN, ธีม มืด/สว่าง). Each segment
 * crossfades its gradient highlight in/out on change — mirrors the mockup's
 * `transition: all .25s ease` on the pill styles (gradients can't be
 * interpolated directly, so we fade a LinearGradient layer in over the
 * outgoing plain segment instead of snapping between them).
 */
const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ options, selectedIndex, onChange, style }) => {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selectedIndex,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, progress]);

  const opacities = [
    progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
  ];

  return (
    <View style={[styles.track, { backgroundColor: colors.inputBackground }, style]}>
      {options.map((label, index) => {
        const active = index === selectedIndex;
        return (
          <TouchableOpacity
            key={label}
            activeOpacity={0.8}
            onPress={() => onChange(index as 0 | 1)}
            disabled={active}
          >
            <View style={styles.segment}>
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacities[index] }]}>
                <LinearGradient
                  colors={gradients.primary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.full }]}
                />
              </Animated.View>
              {/*
                Same variant/weight in both states on purpose — switching
                between body-bold and body-regular swaps font *files* with
                different glyph widths, which made the whole row visibly
                jump sideways on press. Only the color animates.
              */}
              <AppText variant="body-semiBold" style={[styles.label, { color: active ? colors.onPrimary : colors.textSecondary }]}>
                {label}
              </AppText>
            </View>
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
    padding: 3,
  },
  segment: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
  },
  label: {
    fontSize: 12,
  },
});

export default SegmentedToggle;
