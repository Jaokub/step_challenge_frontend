import AppText from './AppText';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize } from '../constants/theme';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  style,
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    animatedValue.setValue(0);

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(`${prefix}${Math.round(v).toLocaleString()}${suffix}`);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration, prefix, suffix]);

  return (
    <AppText
      style={[
        {
          fontSize: fontSize['3xl'],
          color: colors.textOnCard,
        },
        style,
      ]}
    >
      {displayValue}
    </AppText>
  );
};

export default AnimatedCounter;
