import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { gradients, dashboardAccents } from '../constants/theme';

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const THUMB_MARGIN = 3;

interface SwitchToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/**
 * Plain on/off switch (mockup: "การแจ้งเตือน" row). Distinct from `ThemeToggle`
 * (which bakes in sun/moon icons for the dedicated theme switcher) — this is
 * the generic track+knob shape settings rows use. The knob slides with the
 * exact easing the mockup specifies (`cubic-bezier(.4,0,.2,1)`, 250ms) and
 * the track crossfades grey → gradient instead of snapping, matching the
 * mockup's `transition: background .25s ease` / `transition: left .25s ...`.
 */
const SwitchToggle: React.FC<SwitchToggleProps> = ({ value, onValueChange }) => {
  const { isDark } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_MARGIN, TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN],
  });

  const trackOffColor = dashboardAccents.switchTrackOff[isDark ? 'dark' : 'light'];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <View style={[styles.track, { backgroundColor: trackOffColor }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <LinearGradient
            colors={gradients.primary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trackFill}
          />
        </Animated.View>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  trackFill: {
    flex: 1,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: THUMB_MARGIN,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default SwitchToggle;
