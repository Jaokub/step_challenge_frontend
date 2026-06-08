import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const TRACK_WIDTH = 56;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const THUMB_MARGIN = 3;

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();
  const translateX = useRef(new Animated.Value(isDark ? TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isDark ? TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [isDark]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTheme}
      style={[
        styles.track,
        {
          backgroundColor: isDark ? colors.primary : '#E5E7EB',
        },
      ]}
    >
      {/* Background icons */}
      <View style={styles.iconsRow}>
        <Ionicons
          name="sunny"
          size={14}
          color={isDark ? 'rgba(255,255,255,0.3)' : '#FFC107'}
          style={styles.sunIcon}
        />
        <Ionicons
          name="moon"
          size={14}
          color={isDark ? '#FFC107' : 'rgba(0,0,0,0.2)'}
          style={styles.moonIcon}
        />
      </View>

      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX }],
            backgroundColor: '#FFFFFF',
          },
        ]}
      >
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={14}
          color={isDark ? colors.primary : '#FFC107'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_MARGIN,
    justifyContent: 'center',
  },
  iconsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sunIcon: {},
  moonIcon: {},
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default ThemeToggle;
