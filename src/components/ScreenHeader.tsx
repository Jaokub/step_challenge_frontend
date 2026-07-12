import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** When provided, renders a back chevron on the left (mockup header style). */
  onBack?: () => void;
  rightActions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleColor?: string;
  titleSize?: number;
  containerPadding?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightActions,
  style,
  titleColor,
  titleSize,
  containerPadding = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, containerPadding && styles.defaultPadding, style]}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={titleColor || colors.textPrimary} />
        </TouchableOpacity>
      )}
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 2,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
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
