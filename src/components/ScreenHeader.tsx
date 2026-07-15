import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Small monospace route caption under the title (e.g. "/admin/activities"),
   * matching the admin console mockup's dev-path captions. Independent of
   * `subtitle` so existing non-admin screens are unaffected.
   */
  pathSubtitle?: string;
  /** When provided, renders a back chevron on the left (mockup header style). */
  onBack?: () => void;
  /** Render the back button as a grey rounded-square chip (admin mockup style) instead of a bare chevron. */
  backChip?: boolean;
  rightActions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleColor?: string;
  titleSize?: number;
  subtitleSize?: number;
  containerPadding?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  pathSubtitle,
  onBack,
  backChip = false,
  rightActions,
  style,
  titleColor,
  titleSize,
  subtitleSize,
  containerPadding = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, containerPadding && styles.defaultPadding, style]}>
      {onBack && (
        backChip ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backChip, { backgroundColor: colors.inputBackground }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={titleColor || colors.textPrimary} />
          </TouchableOpacity>
        )
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
          <AppText
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
              subtitleSize ? { fontSize: subtitleSize } : undefined,
            ]}
          >
            {subtitle}
          </AppText>
        )}
        {pathSubtitle && (
          <AppText style={[styles.pathSubtitle, { color: colors.textSecondary }]}>
            {pathSubtitle}
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
  backChip: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
  pathSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
});

export default ScreenHeader;
