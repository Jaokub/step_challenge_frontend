import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  rightActions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleColor?: string;
  titleSize?: number;
  containerPadding?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  rightActions,
  style,
  titleColor,
  titleSize,
  containerPadding = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, containerPadding && styles.defaultPadding, style]}>
      <AppText
        style={[
          styles.title,
          { color: titleColor || colors.textPrimary },
          titleSize ? { fontSize: titleSize } : undefined,
        ]}
      >
        {title}
      </AppText>
      {rightActions && <View style={styles.headerActions}>{rightActions}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultPadding: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default ScreenHeader;
