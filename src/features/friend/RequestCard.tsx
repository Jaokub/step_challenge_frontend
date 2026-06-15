import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../constants/theme';
import type { FriendRequest } from './friendService';

interface RequestCardProps {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (userId: string) => void;
}

export function RequestCard({ request, onAccept, onReject }: RequestCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={styles.info}>
        <View style={styles.avatarContainer}>
          {request.user.avatarUrl ? (
            <Image source={{ uri: request.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.textContainer}>
          <AppText variant="heading-sm" style={{ color: colors.textPrimary }}>
            {request.user.nickname || request.user.fullName}
          </AppText>
          <AppText style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' }}>
            Wants to be friends
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.success + '20' }]} 
          onPress={() => onAccept(request.id)}
        >
          <Ionicons name="checkmark" size={20} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.error + '20' }]} 
          onPress={() => onReject(request.user.id)}
        >
          <Ionicons name="close" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
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
    borderWidth: 1,
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
  actions: {
    flexDirection: 'row', 
    gap: spacing.sm
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
