import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState, ErrorState, LoadingScreen, SearchBar, ProgressBar } from '../../../../src/components';
import { spacing, fontSize, borderRadius } from '../../../../src/constants/theme';
import activityService from '../../../../src/features/activity/activityService';
import checkinService from '../../../../src/features/activity/checkinService';
import userService from '../../../../src/features/auth/userService';
import { queryKeys } from '../../../../src/constants/queryKeys';
import type { User } from '../../../../src/types';

type FilterKey = 'all' | 'checkedIn' | 'notCheckedIn';

export default function AdminAttendeesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: activity } = useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: async () => {
      const res = await activityService.getActivityById(id);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: !!id,
  });

  const {
    data: checkinsResult,
    isPending: isLoadingCheckins,
    error: checkinsError,
    refetch: refetchCheckins,
  } = useQuery({
    queryKey: queryKeys.activities.checkins(id),
    queryFn: async () => {
      const res = await checkinService.getCheckinsByActivity(id);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: !!id,
  });

  // Only needed to compute the "ยังไม่เช็คอิน" (not checked-in) filter — the
  // check-ins endpoint only returns who HAS checked in, so we diff against
  // the full user list (same source admin/users already uses).
  const { data: allUsers } = useQuery({
    queryKey: queryKeys.users.list,
    queryFn: async () => {
      const res = await userService.getAllUsers();
      if (!res.success) throw new Error(res.message);
      return res.data.users ?? [];
    },
    enabled: filter === 'notCheckedIn',
  });

  const checkedIn = checkinsResult?.checkIns ?? [];
  const totalCheckedIn = checkinsResult?.totalCheckIns ?? checkedIn.length;
  const checkedInIds = useMemo(() => new Set(checkedIn.map((c) => c.userId)), [checkedIn]);
  const notCheckedIn: User[] = useMemo(
    () => (allUsers ?? []).filter((u) => !checkedInIds.has(u.id)),
    [allUsers, checkedInIds],
  );

  const q = search.trim().toLowerCase();
  const filteredCheckedIn = checkedIn.filter((c) => {
    if (!q) return true;
    return c.user?.fullName?.toLowerCase().includes(q) || c.user?.department?.toLowerCase().includes(q);
  });
  const filteredNotCheckedIn = notCheckedIn.filter((u) => {
    if (!q) return true;
    return u.fullName?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  interface AttendeeRow {
    key: string;
    name?: string;
    dept?: string | null;
    checkedInAt: string | null;
  }

  const rows: AttendeeRow[] =
    filter === 'checkedIn'
      ? filteredCheckedIn.map((c) => ({ key: c.id, name: c.user?.fullName, dept: c.user?.department, checkedInAt: c.checkedInAt }))
      : filter === 'notCheckedIn'
      ? filteredNotCheckedIn.map((u) => ({ key: u.id, name: u.fullName, dept: u.department, checkedInAt: null }))
      : filteredCheckedIn.map((c) => ({ key: c.id, name: c.user?.fullName, dept: c.user?.department, checkedInAt: c.checkedInAt }));

  const isLoading = isLoadingCheckins || (filter === 'notCheckedIn' && !allUsers);

  const renderItem = ({ item }: { item: AttendeeRow }) => (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.avatar, { backgroundColor: colors.textPrimary }]}>
        <AppText variant="body-bold" style={{ color: colors.background, fontSize: fontSize.xs }}>
          {(item.name || '?').charAt(0).toUpperCase()}
        </AppText>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary }} numberOfLines={1}>
          {item.name || t('common.error')}
        </AppText>
        <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary }} numberOfLines={1}>
          {item.dept || '-'}
        </AppText>
      </View>
      {item.checkedInAt ? (
        <AppText style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' as any }}>
          {new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </AppText>
      ) : (
        <View style={[styles.pendingPill, { backgroundColor: colors.inputBackground }]}>
          <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{t('admin.filterNotCheckedIn')}</AppText>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.attendeesTitle')}
          subtitle={activity?.title}
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/admin/activities')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <View style={styles.summaryBlock}>
        <View style={styles.summaryTop}>
          <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.totalCheckedIn')}</AppText>
          <AppText variant="body-bold" style={{ fontSize: fontSize.md, color: colors.textPrimary }}>
            {activity?.maxParticipants
              ? t('admin.checkedInProgress', { checked: totalCheckedIn, total: activity.maxParticipants })
              : t('admin.checkedInCount', { count: totalCheckedIn })}
          </AppText>
        </View>
        {!!activity?.maxParticipants && (
          <ProgressBar progress={Math.min(1, totalCheckedIn / activity.maxParticipants)} />
        )}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'checkedIn', 'notCheckedIn'] as FilterKey[]).map((f) => {
          const active = f === filter;
          const label = f === 'all' ? t('admin.filterAll') : f === 'checkedIn' ? t('admin.filterCheckedIn') : t('admin.filterNotCheckedIn');
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, { backgroundColor: active ? colors.textPrimary : colors.inputBackground }]}
            >
              <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: active ? colors.background : colors.textSecondary }}>
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('admin.searchAttendees')} />
      </View>

      {isLoading ? (
        <LoadingScreen message={t('common.loading')} />
      ) : checkinsError ? (
        <ErrorState title={t('admin.loadError')} message={(checkinsError as any)?.message ?? ''} onRetry={refetchCheckins} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={t('admin.noAttendeesTitle')} subtitle={t('admin.noAttendeesSubtitle')} />
          }
        />
      )}

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
        <View style={styles.footerRow}>
          <View style={[styles.disabledBtn, { backgroundColor: colors.inputBackground }]}>
            <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '700' as any }}>
              {t('admin.manualCheckinAction')}
            </AppText>
          </View>
          <View style={[styles.disabledBtn, { backgroundColor: colors.inputBackground }]}>
            <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '700' as any }}>
              {t('admin.undoCheckinAction')}
            </AppText>
          </View>
        </View>
        <View style={[styles.needsEndpointPill, { backgroundColor: colors.warning + '1A' }]}>
          <AppText style={{ fontSize: fontSize.xs, color: colors.warning, fontWeight: '700' as any, textAlign: 'center' }}>
            {t('admin.manualCheckinNeedsEndpoint')}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBlock: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm - 1, borderRadius: borderRadius.full },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 140, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pendingPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: 36,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  disabledBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  needsEndpointPill: { padding: spacing.sm, borderRadius: borderRadius.md },
});
