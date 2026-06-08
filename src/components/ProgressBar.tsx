import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  backgroundColor,
  height = 8,
  style,
}) => {
  const { colors } = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  const barColor = color ?? colors.primary;
  const bgColor = backgroundColor ?? colors.divider;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: bgColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: barColor,
            borderRadius: height / 2,
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default ProgressBar;
