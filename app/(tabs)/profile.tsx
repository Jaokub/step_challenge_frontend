import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import authService from '../../src/features/auth/authService';
import userService from '../../src/features/auth/userService';
import healthApiService from '../../src/services/healthApiService';
import { queryKeys } from '../../src/constants/queryKeys';
import type { User } from '../../src/types';
import { AppText, ScreenHeader, WeeklyStepsChart, Skeleton } from '../../src/components';
import { DailyStepData } from '../../src/components/WeeklyStepsChart';
import { ProfileHeaderCard } from '../../src/features/profile/ProfileHeaderCard';
import { ProfileStatsGrid } from '../../src/features/profile/ProfileStatsGrid';
import { ProfileSettingsCard } from '../../src/features/profile/ProfileSettingsCard';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, isAdmin } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [refreshing, setRefreshing] = useState(false);

  const { data, isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.users.profileScreen,
    queryFn: async () => {
      const result = await authService.getMe();
      if (!result.success) throw new Error('Failed to load profile');
      const user: User = result.data.user;

      // Fetch additional data in parallel
      const [profileData, summaryData, chartData] = await Promise.all([
        userService.getProfile(user.id).catch(() => null),
        healthApiService.getHealthSummary().catch(() => null),
        healthApiService.getWeeklyChartData().catch(() => null)
      ]);

      const month = (summaryData && summaryData.success && summaryData.data.monthlyTotal)
        || { steps: 0, distanceKm: 0, calories: 0, daysWithData: 0 };

      return {
        profile: user,
        stats: (profileData && profileData.success)
          ? profileData.data.stats
          : { totalCheckIns: 0, totalActivities: 0, totalGroups: 0 },
        healthSummary: {
          totalSteps: month.steps,
          distanceKm: month.distanceKm,
          calories: month.calories,
          activeDays: month.daysWithData,
        },
        weeklyChart: (chartData && chartData.success) ? (chartData.data as DailyStepData[]) : [],
      };
    },
  });

  const profile = data?.profile ?? null;
  const stats = data?.stats ?? { totalCheckIns: 0, totalActivities: 0, totalGroups: 0 };
  const healthSummary = data?.healthSummary ?? { totalSteps: 0, distanceKm: 0, calories: 0, activeDays: 0 };
  const weeklyChart = data?.weeklyChart ?? [];
  const avgStepsPerDay = healthSummary.activeDays > 0
    ? Math.round(healthSummary.totalSteps / healthSummary.activeDays)
    : 0;
  const showAppleHealthSync = Platform.OS === 'ios' && !!profile?.syncToken;

  // Silent background refetch every time the tab regains focus,
  // so points/stats update after a check-in elsewhere in the app.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onCopySyncToken = useCallback(() => {
    if (!profile?.syncToken) return;
    Clipboard.setString(profile.syncToken);
    showToast(t('profile.copyDesc'), 'success');
  }, [profile?.syncToken, showToast, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <SafeAreaView edges={['top']} style={{ paddingBottom: 8 }}>
          <ScreenHeader title={t('profile.title')} titleColor={colors.textPrimary} titleSize={26} />
        </SafeAreaView>

        <View style={styles.content}>
          {/* Profile Card */}
          {loading && !profile ? (
            <Skeleton width="100%" height={200} borderRadius={26} style={{ marginBottom: 24 }} />
          ) : (
            <View style={{ marginBottom: 24 }}>
              <ProfileHeaderCard profile={profile} stats={stats} />
            </View>
          )}

          {/* Monthly Stats Grid */}
          <AppText style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile.thisMonthStats')}</AppText>
          {loading && healthSummary.totalSteps === 0 ? (
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} width="48%" height={100} borderRadius={22} style={{ marginBottom: 12 }} />)}
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <ProfileStatsGrid
                totalSteps={healthSummary.totalSteps}
                distanceKm={healthSummary.distanceKm}
                calories={healthSummary.calories}
                avgStepsPerDay={avgStepsPerDay}
              />
            </View>
          )}

          {/* Weekly Steps Chart */}
          {loading && weeklyChart.length === 0 ? (
            <Skeleton width="100%" height={160} borderRadius={24} style={{ marginBottom: 24 }} />
          ) : (
            <View style={{ marginBottom: 24 }}>
              <WeeklyStepsChart data={weeklyChart} title={t('profile.weeklySteps')} />
            </View>
          )}

          {/* Settings */}
          <ProfileSettingsCard
            isAdmin={isAdmin}
            showAppleHealthSync={showAppleHealthSync}
            onCopySyncToken={onCopySyncToken}
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <AppText style={[styles.logoutText, { color: colors.error }]}>{t('Logout')}</AppText>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
