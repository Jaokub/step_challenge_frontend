import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  AppText,
  ScreenHeader,
  StatusBadge,
  LoadingScreen,
  ErrorState,
  CustomModal,
  BottomSheet,
  PrimaryButton,
  OutlineButton,
} from '../../src/components';
import { spacing, gradients, dashboardAccents } from '../../src/constants/theme';
import { queryKeys } from '../../src/constants/queryKeys';
import activityService from '../../src/features/activity/activityService';
import { useGroups } from '../../src/features/group/useGroups';
import { formatDate } from '../../src/utils/formatDate';
import type { Activity } from '../../src/types';

const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

// Mockup frame 17 — participant view. Registration (ActivityParticipant) is
// separate from check-ins/points: enrolling a group or joining here awards
// nothing, members still check in via QR/manual to earn points
// (BUILD_PLAN.md Phase 4).
export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmGroup, setConfirmGroup] = useState<{ id: string; name: string; memberCount: number } | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const { data, isPending, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.activities.detail(id ?? ''),
    queryFn: async () => {
      const response = await activityService.getActivityById(id!);
      if (!response.success) throw new Error('Failed to load activity');
      return response.data;
    },
    enabled: !!id,
  });
  const activity: Activity | null = data ?? null;

  // Groups the caller coordinates — only OWNERs may enroll a group. Awaited
  // alongside the activity query below so the "enroll group" button is
  // present on first render instead of popping in once this fetch resolves.
  const { groups, isLoading: isGroupsLoading } = useGroups(true);
  const myCoordGroups = groups.filter((g) => g.myRole === 'OWNER');

  // GET /activities/:id/participants only allows admins or callers already
  // registered for this activity (activityParticipant.controller.js) — so
  // only fetch once the activity has loaded and that condition is known.
  const canSeeParticipants = isAdmin || !!activity?.myParticipation;
  const participantsQuery = useQuery({
    queryKey: queryKeys.activities.participants(id ?? ''),
    queryFn: async () => {
      const res = await activityService.getActivityParticipants(id!);
      if (!res.success) throw new Error('Failed to load participants');
      return res.data;
    },
    enabled: !!id && canSeeParticipants,
  });
  const participants = participantsQuery.data ?? [];

  const invalidateActivity = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(id ?? '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.participants(id ?? '') });
  };

  const enrollMutation = useMutation({
    mutationFn: (groupId: string) => activityService.enrollGroupIntoActivity(id!, groupId),
  });
  const joinMutation = useMutation({
    mutationFn: () => activityService.joinActivity(id!),
  });
  const leaveMutation = useMutation({
    mutationFn: () => activityService.leaveActivity(id!),
  });

  const handlePickGroup = () => {
    if (myCoordGroups.length === 1) {
      const g = myCoordGroups[0];
      setConfirmGroup({ id: g.id, name: g.name, memberCount: g.memberCount ?? 0 });
    } else {
      setPickerOpen(true);
    }
  };

  const handleEnrollConfirm = async () => {
    if (!confirmGroup) return;
    try {
      const res = await enrollMutation.mutateAsync(confirmGroup.id);
      if (res.success) {
        showToast(t('activity.enrolledGroupToast', { count: res.data.added }), 'success');
        invalidateActivity();
        setConfirmGroup(null);
        setPickerOpen(false);
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const handleJoin = async () => {
    try {
      const res = await joinMutation.mutateAsync();
      if (res.success) {
        showToast(t('activity.joinedActivityToast'), 'success');
        invalidateActivity();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const handleLeaveConfirm = async () => {
    try {
      const res = await leaveMutation.mutateAsync();
      if (res.success) {
        showToast(t('activity.leftActivityToast'), 'success');
        invalidateActivity();
        setLeaveConfirmOpen(false);
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  if (isPending || isGroupsLoading) return <LoadingScreen />;

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']}>
          <ScreenHeader title={t('activities.title')} onBack={() => router.back()} backChip titleSize={16} />
        </SafeAreaView>
        <ErrorState title={t('common.error')} message={t('activity.notFound')} onRetry={refetch} />
      </View>
    );
  }

  const metaParts = [
    activity.location,
    `${formatDate(activity.startDate, i18n.language)} – ${formatDate(activity.endDate, i18n.language)}`,
  ];
  if (activity.expectedSteps) metaParts.push(t('activity.metaSteps', { count: activity.expectedSteps.toLocaleString() }));
  if (activity.totalDistance) metaParts.push(t('activity.metaDistanceKm', { km: activity.totalDistance }));
  metaParts.push(t('activity.metaPoints', { points: activity.points }));

  const isOpenForRegistration = activity.status === 'UPCOMING' || activity.status === 'ONGOING';
  const canRegister = isOpenForRegistration && !activity.myParticipation;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={activity.title}
          pathSubtitle={`/activity/${activity.id}`}
          onBack={() => router.back()}
          backChip
          titleSize={16}
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <StatusBadge status={activity.status} />

        <AppText style={[styles.meta, { color: colors.textSecondary }]}>{metaParts.join(' · ')}</AppText>

        {activity.myParticipation?.groupId && (
          <View style={[styles.enrolledBadge, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '40' }]}>
            <AppText style={{ fontSize: 12.5, fontWeight: '700' as any, color: colors.primary }}>
              {t('activity.groupAlreadyEnrolled', { groupName: activity.myParticipation.groupName })}
            </AppText>
          </View>
        )}

        {canRegister && (
          <TouchableOpacity onPress={handleJoin} disabled={joinMutation.isPending}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.joinBtn, { opacity: joinMutation.isPending ? 0.6 : 1 }]}
            >
              <AppText style={{ fontWeight: '700' as any, fontSize: 13.5, color: colors.onPrimary }}>
                {joinMutation.isPending ? t('common.loading') : t('activity.joinActivityButton')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {myCoordGroups.length > 0 && (
          <TouchableOpacity onPress={handlePickGroup}>
            <View style={[styles.darkBtn, { backgroundColor: colors.textPrimary }]}>
              <AppText style={{ fontWeight: '700' as any, fontSize: 13.5, color: colors.background }}>
                {t('activity.enrollGroupButton')}
              </AppText>
            </View>
          </TouchableOpacity>
        )}

        <View style={[styles.countCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <AppText style={{ fontSize: 12.5, color: colors.textSecondary }}>{t('activity.totalParticipants')}</AppText>
          <AppText variant="heading-bold" style={{ fontSize: 16, color: colors.textPrimary }}>
            {activity.registeredCount ?? 0} {t('activity.people')}
          </AppText>
        </View>

        {canSeeParticipants && participants.length > 0 && (
          <View style={styles.section}>
            <AppText variant="body-bold" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('activity.participantsListTitle')}
            </AppText>
            {participants.map((p) => {
              const avatarBg = dashboardAccents.avatarMuted[isDark ? 'dark' : 'light'];
              const avatarFg = isDark ? '#fff' : colors.textPrimary;
              const metaText = [p.user?.department, p.group?.name ?? t('activity.joinedIndividually')]
                .filter(Boolean)
                .join(' · ');
              return (
                <View key={p.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.memberAvatar, { backgroundColor: avatarBg }]}>
                    <AppText variant="body-bold" style={{ fontSize: 11, color: avatarFg }}>
                      {initials(p.user?.fullName)}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="body-medium" style={{ fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
                      {p.user?.fullName}
                    </AppText>
                    <AppText style={{ fontSize: 11, lineHeight: 14, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
                      {metaText}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activity.myParticipation && (
          <TouchableOpacity onPress={() => setLeaveConfirmOpen(true)}>
            <View style={[styles.leaveBtn, { backgroundColor: colors.inputBackground }]}>
              <AppText style={{ fontWeight: '700' as any, fontSize: 13.5, color: colors.error }}>
                {t('activity.leaveActivityButton')}
              </AppText>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <AppText variant="heading-bold" style={{ fontSize: 17, color: colors.textPrimary }}>
          {t('activity.pickGroupTitle')}
        </AppText>
        <View style={{ gap: spacing.sm }}>
          {myCoordGroups.map((g) => (
            <TouchableOpacity
              key={g.id}
              onPress={() => setConfirmGroup({ id: g.id, name: g.name, memberCount: g.memberCount ?? 0 })}
              style={[styles.pickerRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <AppText variant="body-bold" style={{ flex: 1, fontSize: 13.5, color: colors.textPrimary }}>
                {g.name}
              </AppText>
              <AppText style={{ fontSize: 11, color: colors.textSecondary }}>
                {t('groups.memberCountLabel', { count: g.memberCount ?? 0 })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <CustomModal
        visible={!!confirmGroup}
        onClose={() => setConfirmGroup(null)}
        title={t('activity.enrollGroupButton')}
        description={
          confirmGroup
            ? t('activity.confirmEnrollGroupInActivity', { name: confirmGroup.name, count: confirmGroup.memberCount })
            : undefined
        }
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setConfirmGroup(null)} disabled={enrollMutation.isPending} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={enrollMutation.isPending ? t('common.loading') : t('common.confirm')}
              onPress={handleEnrollConfirm}
              disabled={enrollMutation.isPending}
            />
          </View>
        </View>
      </CustomModal>

      <CustomModal
        visible={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        title={t('activity.leaveActivityButton')}
        description={t('activity.confirmLeaveActivity')}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setLeaveConfirmOpen(false)} disabled={leaveMutation.isPending} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={leaveMutation.isPending ? t('common.loading') : t('common.confirm')}
              onPress={handleLeaveConfirm}
              disabled={leaveMutation.isPending}
              style={{ backgroundColor: colors.error }}
            />
          </View>
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md },
  meta: { fontSize: 12.5, lineHeight: 18 },
  enrolledBadge: { borderRadius: 14, borderWidth: 1, padding: 11 },
  joinBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 16 },
  darkBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 16 },
  countCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  leaveBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 16 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 12 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, lineHeight: 17, marginTop: spacing.xs },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 11 },
  memberAvatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
