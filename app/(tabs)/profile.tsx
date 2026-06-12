import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import authService from '../../src/features/auth/services/authService';
import userService from '../../src/services/userService';
import healthApiService from '../../src/services/healthApiService';
import type { User } from '../../src/types';
import { 
  AppText, 
  SettingsRow, 
  ScreenHeader, 
  HeaderIconButton,
  AvatarCircle,
  HealthStatCard,
  PointsBadge,
  WeeklyStepsChart,
  Skeleton
} from '../../src/components';
import { DailyStepData } from '../../src/components/WeeklyStepsChart';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, isAdmin } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState({ totalCheckIns: 0, totalActivities: 0, totalGroups: 0 });
  const [healthSummary, setHealthSummary] = useState({ 
    totalSteps: 0, 
    distanceKm: 0, 
    calories: 0, 
    activeDays: 0 
  });
  const [weeklyChart, setWeeklyChart] = useState<DailyStepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await authService.getMe();
      if (result.success) {
        const user = result.data.user;
        setProfile(user);
        
        // Fetch additional data in parallel
        const [profileData, summaryData, chartData] = await Promise.all([
          userService.getProfile(user.id).catch(() => null),
          healthApiService.getHealthSummary().catch(() => null),
          healthApiService.getWeeklyChartData().catch(() => null)
        ]);

        if (profileData && profileData.success) {
          setStats(profileData.data.stats);
        }

        if (summaryData && summaryData.success) {
          const month = summaryData.data.monthlyTotal || { steps: 0, distanceKm: 0, calories: 0, daysWithData: 0 };
          setHealthSummary({
            totalSteps: month.steps,
            distanceKm: month.distanceKm,
            calories: month.calories,
            activeDays: month.daysWithData,
          });
        }

        if (chartData && chartData.success) {
          setWeeklyChart(chartData.data);
        }
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
      fetchData();
    }, [fetchData])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        <SafeAreaView edges={['top']} style={{ paddingBottom: 8 }}>
          {/* Header */}
          <ScreenHeader 
            title={t('profile.title')} 
            titleColor={colors.text}
            containerPadding={false}
            style={{ paddingHorizontal: 20, paddingTop: 12 }}
            rightActions={
              <HeaderIconButton 
                icon={isDark ? "sunny" : "moon"} 
                onPress={toggleTheme} 
                iconColor={colors.text}
                backgroundColor={colors.card}
                borderColor={colors.border}
              />
            }
          />
        </SafeAreaView>

        <View style={styles.content}>
          {/* Profile Card */}
          {loading && !profile ? (
            <Skeleton width="100%" height={180} borderRadius={24} style={{ marginBottom: 24 }} />
          ) : (
            <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, shadowColor: colors.cardShadow }]}>
              <View style={styles.profileCardTop}>
                <AvatarCircle uri={profile?.avatarUrl} name={profile?.nickname || profile?.fullName || 'User'} size={72} ringColor={colors.primary} />
                <View style={styles.profileInfo}>
                  <AppText style={[styles.name, { color: colors.text }]}>{profile?.nickname || profile?.fullName || 'User'}</AppText>
                  <AppText style={[styles.email, { color: colors.textSecondary }]}>{profile?.email || ''}</AppText>
                  <View style={{ marginTop: 10 }}>
                    <PointsBadge points={profile?.totalPoints || 0} size="sm" />
                  </View>
                </View>
              </View>
              
              <View style={[styles.miniStatsContainer, { borderTopColor: colors.divider }]}>
                <View style={styles.miniStatItem}>
                  <AppText style={[styles.miniStatValue, { color: colors.text }]}>{stats.totalGroups}</AppText>
                  <AppText style={[styles.miniStatLabel, { color: colors.textSecondary }]}>กลุ่ม</AppText>
                </View>
                <View style={styles.miniStatItem}>
                  <AppText style={[styles.miniStatValue, { color: colors.text }]}>{stats.totalActivities}</AppText>
                  <AppText style={[styles.miniStatLabel, { color: colors.textSecondary }]}>กิจกรรม</AppText>
                </View>
                <View style={styles.miniStatItem}>
                  <AppText style={[styles.miniStatValue, { color: colors.text }]}>{stats.totalCheckIns}</AppText>
                  <AppText style={[styles.miniStatLabel, { color: colors.textSecondary }]}>เช็คอิน</AppText>
                </View>
              </View>
            </View>
          )}

          {/* Achievements Grid */}
          <AppText style={[styles.sectionTitle, { color: colors.text }]}>สถิติเดือนนี้</AppText>
          {loading && healthSummary.totalSteps === 0 ? (
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} width="48%" height={100} borderRadius={16} style={{ marginBottom: 16 }} />)}
            </View>
          ) : (
            <View style={styles.gridContainer}>
              <HealthStatCard style={styles.gridItem} icon="walk" label="จำนวนก้าว" value={healthSummary.totalSteps} color="#b0f237" />
              <HealthStatCard style={styles.gridItem} icon="map" label="ระยะทาง (กม.)" value={healthSummary.distanceKm} color="#06b6d4" />
              <HealthStatCard style={styles.gridItem} icon="flame" label="แคลอรี่" value={healthSummary.calories} color="#f97316" />
              <HealthStatCard style={styles.gridItem} icon="calendar" label="วันที่บันทึก" value={`${healthSummary.activeDays} วัน`} color="#8b5cf6" />
            </View>
          )}

          {/* Weekly Steps Chart */}
          <AppText style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>ก้าวรายสัปดาห์</AppText>
          {loading && weeklyChart.length === 0 ? (
            <Skeleton width="100%" height={160} borderRadius={24} style={{ marginBottom: 24 }} />
          ) : (
            <View style={{ marginBottom: 24 }}>
              <WeeklyStepsChart data={weeklyChart} />
            </View>
          )}

          {/* Menu Items */}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  miniStatsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  miniStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  miniStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
    minWidth: 0, // Override default minWidth to allow 2 columns on small screens
  },
  menuCard: {
    borderRadius: 20,
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
    marginTop: 24,
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
    fontWeight: '600',
  },
});
