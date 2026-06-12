import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../../constants/theme';
import type { User } from '../../../types';

interface FriendCardProps {
  friend: User;
  onRemove: (id: string) => void;
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.info}>
        <View style={styles.avatarContainer}>
          {friend.avatarUrl ? (
            <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.textContainer}>
          <AppText variant="heading-sm" style={{ color: colors.textPrimary }}>
            {friend.nickname || friend.fullName}
          </AppText>
          <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
            {friend.department}
          </AppText>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.iconBtn, { backgroundColor: colors.error + '20' }]} 
        onPress={() => onRemove(friend.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    minHeight: 72,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1, 
    marginLeft: spacing.md
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
