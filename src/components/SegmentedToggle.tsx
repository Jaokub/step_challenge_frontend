import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { gradients, borderRadius } from '../constants/theme';

interface SegmentedToggleProps {
  /** Exactly two labels, left-to-right. */
  options: [string, string];
  selectedIndex: 0 | 1;
  onChange: (index: 0 | 1) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Two-option pill toggle (mockup: ภาษา ไทย/EN, ธีม มืด/สว่าง). Active segment
 * fills with the brand teal→lime gradient, matching the admin console's
 * ActiveBg pattern. Reusable anywhere a binary preference needs an inline
 * switcher instead of a full row + chevron.
 */
const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ options, selectedIndex, onChange, style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.inputBackground }, style]}>
      {options.map((label, index) => {
        const active = index === selectedIndex;
        return (
          <TouchableOpacity
            key={label}
            activeOpacity={0.8}
            onPress={() => onChange(index as 0 | 1)}
            disabled={active}
          >
            {active ? (
              <LinearGradient
                colors={gradients.primary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.segment}
              >
                <AppText variant="body-bold" style={[styles.label, { color: colors.onPrimary }]}>
                  {label}
                </AppText>
              </LinearGradient>
            ) : (
              <View style={styles.segment}>
                <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 3,
  },
  segment: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
  },
  label: {
    fontSize: 12,
  },
});

export default SegmentedToggle;
