import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { gradients } from '../constants/theme';

interface GradientHeaderProps {
  children?: React.ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const GradientHeader: React.FC<GradientHeaderProps> = ({
  children,
  height = 200,
  style,
}) => {
  const { isDark } = useTheme();
  const headerColors = isDark ? gradients.header : gradients.headerLight;

  return (
    <LinearGradient
      colors={[...headerColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { height }, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
});

export default GradientHeader;
