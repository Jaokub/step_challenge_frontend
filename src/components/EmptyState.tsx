import AppText from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';
import PrimaryButton from './PrimaryButton';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primary + '15' },
        ]}
      >
        <Ionicons name={icon} size={48} color={colors.primary} />
      </View>
      <AppText style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['5xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    marginTop: spacing['2xl'],
    minWidth: 160,
  },
});

export default EmptyState;
