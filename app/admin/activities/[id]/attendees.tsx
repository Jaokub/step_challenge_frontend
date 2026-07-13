import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useToast } from '../../../../src/contexts/ToastContext';
import {
  AppText,
  ScreenHeader,
  EmptyState,
  ErrorState,
  SearchBar,
  CustomModal,
  PrimaryButton,
  OutlineButton,
  StatusBadge,
  Skeleton,
} from '../../../../src/components';
import { spacing, fontSize, borderRadius, gradients, shadows } from '../../../../src/constants/theme';
import activityService from '../../../../src/features/activity/activityService';
import checkinService from '../../../../src/features/activity/checkinService';
import userService from '../../../../src/features/auth/userService';
import { queryKeys } from '../../../../src/constants/queryKeys';
import type { CheckIn } from '../../../../src/types';

type FilterKey = 'all' | 'checkedIn' | 'notCheckedIn';

interface AttendeeRow {
  key: string;
  userId: string;
  name?: string;
  dept?: string | null;
  checkedInAt: string | null;
  checkInId: string | null;
}

export default function AdminAttendeesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [pendingUndo, setPendingUndo] = useState<AttendeeRow | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  // Position of the selector pill (relative to the screen root), so the
  // dropdown below can anchor directly under it regardless of header height.
  const [selectorLayout, setSelectorLayout] = useState({ y: 0, height: 0 });

  // Reset local filters when switching activities via the picker below.
  useEffect(() => {
    setSearch('');
    setFilter('all');
  }, [id]);

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

  // Full roster — needed for the "ทั้งหมด" (all) tab, which mixes checked-in
  // and not-checked-in people in one list, and for "ยังไม่เช็คอิน" (the
  // check-ins endpoint only returns who HAS checked in).
  const {
    data: allUsers,
    isPending: isLoadingUsers,
  } = useQuery({
    queryKey: queryKeys.users.list,
    queryFn: async () => {
      const res = await userService.getAllUsers();
      if (!res.success) throw new Error(res.message);
      return res.data.users ?? [];
    },
    enabled: !!id,
  });

  const checkedIn = checkinsResult?.checkIns ?? [];
  const totalCheckedIn = checkinsResult?.totalCheckIns ?? checkedIn.length;
  // Denominator for the "X / Y checked in" summary — the activity's own cap
  // if it has one, otherwise the full roster size (real data, not a guess).
  const totalPossible = activity?.maxParticipants ?? allUsers?.length ?? 0;
  const checkedInByUserId = useMemo(
    () => new Map<string, CheckIn>(checkedIn.map((c) => [c.userId, c])),
    [checkedIn],
  );

  const allRows: AttendeeRow[] = useMemo(
    () =>
      (allUsers ?? []).map((u) => {
        const c = checkedInByUserId.get(u.id);
        return {
          key: u.id,
          userId: u.id,
          name: u.fullName,
          dept: u.department,
          checkedInAt: c?.checkedInAt ?? null,
          checkInId: c?.id ?? null,
        };
      }),
    [allUsers, checkedInByUserId],
  );

  const q = search.trim().toLowerCase();
  const rows = useMemo(() => {
    const base =
      filter === 'checkedIn'
        ? allRows.filter((r) => r.checkedInAt)
        : filter === 'notCheckedIn'
        ? allRows.filter((r) => !r.checkedInAt)
        : allRows;
    if (!q) return base;
    return base.filter((r) => r.name?.toLowerCase().includes(q) || r.dept?.toLowerCase().includes(q));
  }, [allRows, filter, q]);

  // "เช็คอินหน้างานล่าสุด" — recent walk-in (manually-recorded) check-ins,
  // most recent first. Real data only: derived from the same check-ins the
  // list above already has (method === 'MANUAL'), not a separate fake feed.
  const recentManualCheckins = useMemo(
    () =>
      checkedIn
        .filter((c) => c.method === 'MANUAL')
        .slice()
        .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime())
        .slice(0, 5),
    [checkedIn],
  );

  const isLoading = isLoadingCheckins || isLoadingUsers;

  // Activity picker — lists other activities so the admin can jump straight
  // to another one's attendee list without going back to /admin/activities.
  // Fetched lazily (only while the picker is open).
  const {
    data: activityOptions,
    isPending: isLoadingActivityOptions,
    error: activityOptionsError,
  } = useQuery({
    queryKey: queryKeys.activities.list('admin-attendees-picker'),
    queryFn: async () => {
      const res = await activityService.getActivities({ limit: 100 });
      if (!res.success) throw new Error(res.message);
      return res.data.activities ?? [];
    },
    enabled: showActivityPicker,
  });

  const handleSelectActivity = (activityId: string) => {
    setShowActivityPicker(false);
    if (activityId === id) return;
    router.replace(`/admin/activities/${activityId}/attendees`);
  };

  const handleCheckIn = async (row: AttendeeRow) => {
    if (processingUserId) return;
    setProcessingUserId(row.userId);
    try {
      const res = await checkinService.adminCheckinUser(id, row.userId);
      if (!res.success) throw new Error(res.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.checkins(id) });
      showToast(t('admin.manualCheckinSuccess'), 'success');
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleConfirmUndo = async () => {
    if (!pendingUndo?.checkInId) return;
    setIsUndoing(true);
    try {
      const res = await checkinService.deleteCheckin(pendingUndo.checkInId);
      if (!res.success) throw new Error(res.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.checkins(id) });
      showToast(t('admin.undoCheckinSuccess'), 'success');
      setPendingUndo(null);
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setIsUndoing(false);
    }
  };

  const renderItem = ({ item }: { item: AttendeeRow }) => {
    const isProcessing = processingUserId === item.userId;
    return (
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
            {item.checkedInAt
              ? ` · ${new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </AppText>
        </View>
        {item.checkedInAt ? (
          <TouchableOpacity
            onPress={() => setPendingUndo(item)}
            style={[styles.actionPill, { backgroundColor: colors.error + '1A' }]}
          >
            <AppText style={{ fontSize: fontSize.xs, fontWeight: '700' as any, color: colors.error }}>
              {t('admin.undoCheckinAction')}
            </AppText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleCheckIn(item)} disabled={isProcessing} style={{ opacity: isProcessing ? 0.6 : 1 }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionPill}>
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <AppText style={{ fontSize: fontSize.xs, fontWeight: '700' as any, color: colors.onPrimary }}>
                  {t('admin.manualCheckinAction')}
                </AppText>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.attendeesTitle')}
          pathSubtitle={`/admin/activities/${id}/attendees`}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/activities'))}
        />
      </SafeAreaView>

      {!!activity?.title && (
        <View
          style={styles.activitySelectorWrap}
          onLayout={(e: LayoutChangeEvent) =>
            setSelectorLayout({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })
          }
        >
          <TouchableOpacity
            style={[styles.activitySelector, { backgroundColor: colors.inputBackground }]}
            onPress={() => setShowActivityPicker((v) => !v)}
            activeOpacity={0.7}
          >
            <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
              {t('admin.attendeesActivityLabel', { title: activity.title })}
            </AppText>
            <Ionicons name={showActivityPicker ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.summaryWrap}>
        <LinearGradient
          colors={gradients.mint}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.summaryBlock, { borderColor: colors.primary + '2E' }]}
        >
          <View style={styles.summaryTop}>
            <AppText style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' as any }}>{t('admin.totalCheckedIn')}</AppText>
            <AppText variant="heading-bold" style={{ fontSize: fontSize.md, color: colors.textPrimary }}>
              {totalPossible
                ? t('admin.checkedInProgress', { checked: totalCheckedIn, total: totalPossible })
                : t('admin.checkedInCount', { count: totalCheckedIn })}
            </AppText>
          </View>
          {/* Mockup frame 7: the progress track is always shown, not just
              when the activity has a hard cap — the denominator is the
              full roster whenever there's no `maxParticipants`. */}
          <View style={[styles.gradientBarTrack, { backgroundColor: colors.primary + '26' }]}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientBarFill,
                { width: `${totalPossible ? Math.min(1, totalCheckedIn / totalPossible) * 100 : 0}%` },
              ]}
            />
          </View>
        </LinearGradient>
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
        // Row skeletons occupy the exact box of a real attendee row (same
        // padding/borderRadius/borderWidth/gap/marginBottom) so the header,
        // summary card, filter chips, and search bar all stay put — only the
        // list body swaps from skeleton to real rows, no full-page reflow.
        <View style={styles.listContent}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Skeleton width={36} height={36} borderRadius={12} />
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <Skeleton width="55%" height={14} borderRadius={4} />
                <Skeleton width="35%" height={11} borderRadius={4} />
              </View>
              <Skeleton width={78} height={30} borderRadius={10} />
            </View>
          ))}
        </View>
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
          ListFooterComponent={
            recentManualCheckins.length ? (
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>
                  {t('admin.recentManualCheckins')}
                </AppText>
                {recentManualCheckins.map((c) => (
                  <View key={c.id} style={[styles.logRow, { backgroundColor: colors.inputBackground }]}>
                    <AppText style={{ flex: 1, fontSize: fontSize.xs, fontWeight: '600' as any, color: colors.textPrimary }} numberOfLines={1}>
                      {c.user?.fullName ?? t('common.error')}
                    </AppText>
                    <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                      {new Date(c.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null
          }
        />
      )}

      <CustomModal
        visible={!!pendingUndo}
        onClose={() => (isUndoing ? undefined : setPendingUndo(null))}
        title={t('admin.undoCheckinConfirmTitle')}
        description={pendingUndo ? t('admin.undoCheckinConfirmDesc', { name: pendingUndo.name ?? '' }) : undefined}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setPendingUndo(null)} disabled={isUndoing} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isUndoing ? t('common.loading') : t('admin.undoCheckinAction')}
              onPress={handleConfirmUndo}
              disabled={isUndoing}
              style={{ backgroundColor: colors.error }}
            />
          </View>
        </View>
      </CustomModal>

      {/* Real inline dropdown (not a popup sheet) — anchored directly under
          the selector pill via its measured layout, with a transparent
          full-screen backdrop that closes it on an outside tap. */}
      {showActivityPicker && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowActivityPicker(false)} />
          <View
            style={[
              styles.dropdown,
              shadows.cardLarge,
              {
                top: selectorLayout.y + selectorLayout.height + 6,
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {isLoadingActivityOptions ? (
              // Skeleton rows occupy the exact box of a real activityOption
              // row (same padding/borderRadius/borderWidth/marginBottom) so
              // the dropdown doesn't resize/jump the moment data arrives.
              <View>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.activityOption, { borderColor: 'transparent' }]}>
                    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                      <Skeleton width="70%" height={16} borderRadius={4} />
                      <Skeleton width="45%" height={12} borderRadius={4} />
                    </View>
                    <Skeleton width={54} height={20} borderRadius={borderRadius.full} />
                  </View>
                ))}
              </View>
            ) : activityOptionsError ? (
              <AppText style={{ fontSize: fontSize.sm, color: colors.error, textAlign: 'center', paddingVertical: spacing.lg }}>
                {(activityOptionsError as any)?.message ?? t('common.error')}
              </AppText>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {(activityOptions ?? []).map((a) => {
                  const isCurrent = a.id === id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => handleSelectActivity(a.id)}
                      style={[
                        styles.activityOption,
                        {
                          backgroundColor: isCurrent ? colors.primary + '14' : 'transparent',
                          borderColor: isCurrent ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary }} numberOfLines={1}>
                          {a.title}
                        </AppText>
                        <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary }} numberOfLines={1}>
                          {new Date(a.startDate).toLocaleDateString()}
                        </AppText>
                      </View>
                      <StatusBadge status={a.status} />
                      {isCurrent && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: spacing.sm }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                {!(activityOptions ?? []).length && (
                  <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }}>
                    {t('admin.noActivitiesTitle')}
                  </AppText>
                )}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  activitySelectorWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  activitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    gap: spacing.sm,
  },
  summaryWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  summaryBlock: { borderRadius: 18, borderWidth: 1, padding: 14, paddingHorizontal: 16, gap: spacing.sm },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  gradientBarTrack: { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden' },
  gradientBarFill: { height: '100%', borderRadius: 99 },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm - 1, borderRadius: borderRadius.full },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18, // mockup frame 7 attendee-row radius
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionPill: {
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderRadius: 14,
  },
  dropdown: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.sm,
    zIndex: 50,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
});
