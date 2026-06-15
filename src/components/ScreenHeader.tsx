import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleColor?: string;
  titleSize?: number;
  containerPadding?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightActions,
  style,
  titleColor,
  titleSize,
  containerPadding = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, containerPadding && styles.defaultPadding, style]}>
      <View style={styles.titleContainer}>
        <AppText
          variant="heading-bold"
          style={[
            styles.title,
            { color: titleColor || colors.textPrimary },
            titleSize ? { fontSize: titleSize } : undefined,
          ]}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </AppText>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
});

export default ScreenHeader;
