import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, shadows, spacing } from '../constants/theme';
import RoleBadge from './RoleBadge';

interface Group {
  id: string;
  name: string;
  memberCount?: number;
  role?: 'ADMIN' | 'STAFF';
}

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          ...shadows.card,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Group icon */}
      <View
        style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '20' }]}
      >
        <Ionicons name="people" size={24} color={colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <AppText
            style={[styles.name, { color: colors.textOnCard }]}
            numberOfLines={1}
          >
            {group.name}
          </AppText>
          {group.role && <RoleBadge role={group.role} />}
        </View>

        {group.memberCount !== undefined && (
          <View style={styles.memberRow}>
            <Ionicons
              name="person-outline"
              size={14}
              color={colors.textCardSecondary}
            />
            <AppText style={[styles.memberText, { color: colors.textCardSecondary }]}>
              {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
            </AppText>
          </View>
        )}
      </View>

      {/* Arrow */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textCardSecondary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fontSize.md,
    flexShrink: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
});

export default GroupCard;
