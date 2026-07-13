import { useTranslation } from 'react-i18next';
import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAdminDashboard } from '../../src/features/admin/useAdminDashboard';
import {
  AdminCoordinatorBanner,
  AdminKpiGrid,
  AdminFacultyStepsCard,
  AdminNavGrid,
} from '../../src/features/admin/AdminDashboardComponents';
import { ScreenHeader, Skeleton } from '../../src/components';
import { spacing, adminAccents } from '../../src/constants/theme';
import activityService from '../../src/features/activity/activityService';

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { kpis, loading } = useAdminDashboard();
  const resolvingCheckin = useRef(false);

  // "Manual check-in" has no single activity in the dashboard's own context,
  // so jump straight to the current ONGOING activity's attendees screen (the
  // actual walk-in check-in use case) — only fall back to the plain list if
  // nothing is ongoing right now.
  const handleManualCheckinPress = async () => {
    if (resolvingCheckin.current) return;
    resolvingCheckin.current = true;
    try {
      const res = await activityService.getActivities({ status: 'ONGOING', limit: 1 });
      const ongoing = res.success ? res.data.activities?.[0] : undefined;
      router.push(ongoing ? `/admin/activities/${ongoing.id}/attendees` : '/admin/activities');
    } catch {
      router.push('/admin/activities');
    } finally {
      resolvingCheckin.current = false;
    }
  };

  // Four distinct KPI accents per mockup frame 1 (teal / blue / lime / orange).
  // teal + orange are brand tokens; blue + lime are mockup-literal accents.
  const kpiItems = [
    { key: 'totalUsers', value: kpis.totalUsers, label: t('admin.kpiTotalUsers'), icon: 'account-group', color: colors.primary, round: true },
    { key: 'checkIns', value: kpis.checkInsThisMonth, label: t('admin.kpiActiveParticipants'), icon: 'walk', color: adminAccents.kpiBlue, round: true },
    { key: 'ongoing', value: kpis.ongoingActivities, label: t('admin.kpiOngoingActivities'), icon: 'calendar-clock', color: adminAccents.kpiLime, round: false },
    { key: 'events', value: kpis.openEvents, label: t('admin.kpiOpenEvents'), icon: 'flag-checkered', color: colors.warning, round: false },
  ];

  const navItems = [
    {
      key: 'activities',
      title: t('admin.manageActivitiesNav'),
      desc: t('admin.manageActivitiesDesc'),
      icon: 'calendar-outline',
      onPress: () => router.push('/admin/activities'),
    },
    {
      key: 'groups',
      title: t('admin.navGroupsTitle'),
      desc: t('admin.navGroupsDesc'),
      icon: 'people-outline',
      disabledNote: t('admin.navComingSoon'),
    },
    {
      key: 'users',
      title: t('admin.navUsersTitle'),
      desc: t('admin.navUsersDesc'),
      icon: 'person-outline',
      onPress: () => router.push('/admin/users'),
    },
    {
      key: 'manualCheckin',
      title: t('admin.navManualCheckinTitle'),
      desc: t('admin.navManualCheckinDesc'),
      icon: 'qr-code-outline',
      onPress: handleManualCheckinPress,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.dashboard')}
          subtitle={t('admin.dashboardSubtitle')}
          rightActions={
            <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 4 }}>
              <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            <Skeleton width="100%" height={60} borderRadius={16} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Skeleton width="47%" height={90} borderRadius={16} />
              <Skeleton width="47%" height={90} borderRadius={16} />
              <Skeleton width="47%" height={90} borderRadius={16} />
              <Skeleton width="47%" height={90} borderRadius={16} />
            </View>
            <Skeleton width="100%" height={110} borderRadius={20} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Skeleton width="47%" height={100} borderRadius={20} />
              <Skeleton width="47%" height={100} borderRadius={20} />
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <AdminCoordinatorBanner colors={colors} />
            <AdminKpiGrid items={kpiItems} colors={colors} />
            <AdminFacultyStepsCard colors={colors} />
            <AdminNavGrid items={navItems} colors={colors} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
});
