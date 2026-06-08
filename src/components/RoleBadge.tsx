import AppText from './AppText';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '../constants/theme';
import { Role, GroupMemberRole } from '../types';

type AnyRole = Role | GroupMemberRole;

interface RoleBadgeProps {
  role: AnyRole;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const { colors } = useTheme();

  const getRoleColor = () => {
    switch (role) {
      case 'ADMIN':
      case 'OWNER':
        return colors.primary;
      case 'STAFF':
        return colors.textCardSecondary;
      case 'MEMBER':
        return colors.success || '#10b981';
      default:
        return colors.textCardSecondary;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getRoleColor() }]}>
      <AppText style={styles.label}>
        {role}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: fontSize.xs,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default RoleBadge;
