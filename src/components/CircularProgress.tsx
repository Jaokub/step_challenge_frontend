import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
  children,
}) => {
  const { colors } = useTheme();
  const progressColor = color ?? colors.primary;
  const bgColor = backgroundColor ?? colors.divider;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = size / 2;
  const innerSize = size - strokeWidth * 2;

  // Calculate rotation for the progress arcs
  const progressDegrees = clampedProgress * 360;

  const renderHalfCircle = (rotation: number, circleColor: string) => (
    <View
      style={[
        styles.halfCircleContainer,
        {
          width: size,
          height: size,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    >
      <View
        style={[
          styles.halfCircle,
          {
            width: size / 2,
            height: size,
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            backgroundColor: circleColor,
          },
        ]}
      />
    </View>
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          },
        ]}
      />

      {/* Progress - First half (0-180 degrees) */}
      {clampedProgress > 0 && (
        <View
          style={[
            styles.progressContainer,
            {
              width: size,
              height: size,
            },
          ]}
        >
          {/* Right half mask */}
          <View
            style={[
              styles.clipHalf,
              {
                width: size / 2,
                height: size,
                left: size / 2,
                overflow: 'hidden',
              },
            ]}
          >
            {renderHalfCircle(
              progressDegrees <= 180 ? progressDegrees - 180 : 0,
              progressColor
            )}
          </View>

          {/* Left half mask - only visible when progress > 50% */}
          {clampedProgress > 0.5 && (
            <View
              style={[
                styles.clipHalf,
                {
                  width: size / 2,
                  height: size,
                  left: 0,
                  overflow: 'hidden',
                },
              ]}
            >
              {renderHalfCircle(
                progressDegrees - 180,
                progressColor
              )}
            </View>
          )}
        </View>
      )}

      {/* Inner circle to create ring effect */}
      <View
        style={[
          styles.innerCircle,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: colors.card,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
  },
  clipHalf: {
    position: 'absolute',
    top: 0,
  },
  halfCircleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  halfCircle: {},
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularProgress;
