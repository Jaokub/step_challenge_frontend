import { AppText } from '../../src/components';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Platform, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import authService from '../../src/features/auth/services/authService';
import type { User } from '../../src/types';
import { SettingsRow, ScreenHeader, HeaderIconButton } from '../../src/components';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, isAdmin } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const result = await authService.getMe();
      if (result.success) {
        setProfile(result.data.user);
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const mockStats = { totalSteps: 125000, totalDistance: 85.5, currentStreak: 12 };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.primary }]}>
          <ScreenHeader 
            title={t('profile.title')} 
            titleColor="#FFFFFF"
            containerPadding={false}
            style={{ paddingHorizontal: 20, paddingTop: 12 }}
            rightActions={
              <HeaderIconButton 
                icon={isDark ? "sunny" : "moon"} 
                onPress={toggleTheme} 
                iconColor="#FFFFFF"
                backgroundColor="transparent"
                borderColor="transparent"
              />
            }
          />
          
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={colors.primary} />
                </View>
              )}
            </View>
            <AppText style={styles.name}>{profile?.nickname || profile?.fullName || 'User'}</AppText>
            <AppText style={styles.email}>{profile?.email || ''}</AppText>
          </View>
        </SafeAreaView>

        {/* Stats Summary */}
        <View style={styles.content}>
          <View style={[styles.statsCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.textPrimary }]}>{mockStats.totalSteps.toLocaleString()}</AppText>
              <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.stats.steps')}</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.textPrimary }]}>{mockStats.totalDistance} km</AppText>
              <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.stats.distance')}</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.textPrimary }]}>{mockStats.currentStreak}</AppText>
              <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</AppText>
            </View>
          </View>

          {/* Settings Menu */}
          <View style={styles.menuSection}>
            <AppText style={[styles.sectionTitle, { color: colors.primary }]}>{t('settings.title')}</AppText>
            
            <View style={[styles.menuCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <SettingsRow icon="person-outline" label={t('settings.account')} onPress={() => {}} />

              {isAdmin && (
                <SettingsRow 
                  icon="shield-half-outline" 
                  label="แผงควบคุม (Admin Panel)" 
                  onPress={() => router.push('/admin/dashboard')} 
                />
              )}
              
              {Platform.OS === 'ios' && profile?.syncToken && (
                <SettingsRow 
                  icon="fitness-outline" 
                  label="Connect Apple Health" 
                  onPress={() => {
                    Clipboard.setString(profile.syncToken);
                    Alert.alert('คัดลอกสำเร็จ', 'นำ Sync Token ไปวางในคำสั่งลัด (iOS Shortcuts) เพื่อเริ่มซิงค์ข้อมูลก้าวเดิน');
                  }} 
                />
              )}

              <SettingsRow icon="notifications-outline" label={t('settings.notifications')} onPress={() => {}} />
              <SettingsRow icon="lock-closed-outline" label={t('settings.privacy')} onPress={() => {}} />
              <SettingsRow icon="help-circle-outline" label={t('settings.help')} onPress={() => {}} />
            </View>
          </View>

          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <AppText style={[styles.logoutText, { color: colors.error }]}>{t('common.logout')}</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    padding: 3,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 20,
    marginTop: -40,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  menuSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  menuCard: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 8,
  },
});
