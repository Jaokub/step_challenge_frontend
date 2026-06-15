import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText, ScreenHeader, PrimaryButton, OutlineButton } from '../src/components';
import { useTheme } from '../src/contexts/ThemeContext';
import userService from '../src/features/auth/userService';
import friendService from '../src/features/friend/friendService';
import type { User } from '../src/types';
import { spacing, fontSize, borderRadius } from '../src/constants/theme';

export default function AddFriendScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [friendProfile, setFriendProfile] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError(t('friend.invalidUserId'));
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await userService.getProfile(userId);
        if (res.success) {
          setFriendProfile(res.data);
        } else {
          setError(t('friend.userNotFound'));
        }
      } catch (err: any) {
        setError(err?.message || t('friend.failedToFindUser'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSendRequest = async () => {
    if (!userId) return;
    setAdding(true);
    try {
      await friendService.sendFriendRequest(userId);
      Alert.alert(t('common.success'), t('friend.requestSentSuccess'), [
        { text: t('common.ok'), onPress: () => router.replace('/(tabs)/profile') }
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('friend.failedToSendRequest'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title={t('friend.addFriend')} 
          rightActions={
            <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          } 
        />
      </SafeAreaView>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <AppText style={[styles.errorText, { color: colors.error }]}>{error}</AppText>
            <OutlineButton title={t('friend.goBack')} onPress={() => router.replace('/(tabs)/profile')} style={{ marginTop: spacing.xl }} />
          </View>
        ) : friendProfile ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {friendProfile.avatarUrl ? (
                <Image source={{ uri: friendProfile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={48} color={colors.primary} />
                </View>
              )}
            </View>
            <AppText variant="heading-bold" style={[styles.name, { color: colors.textPrimary }]}>
              {friendProfile.nickname || friendProfile.fullName}
            </AppText>
            <AppText style={[styles.department, { color: colors.textSecondary }]}>
              {friendProfile.department}
            </AppText>

            <View style={styles.actionContainer}>
              <PrimaryButton 
                title={t('friend.sendFriendRequest')} 
                onPress={handleSendRequest} 
                loading={adding} 
              />
              <OutlineButton 
                title={t('common.cancel')} 
                onPress={() => router.replace('/(tabs)/profile')} 
                style={{ marginTop: spacing.md }}
                disabled={adding}
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.md,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  profileCard: {
    width: '100%',
    alignItems: 'center',
    padding: spacing['2xl'],
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.xl,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  department: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  actionContainer: {
    width: '100%',
  }
});
