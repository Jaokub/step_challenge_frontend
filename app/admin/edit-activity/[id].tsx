import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { FormInput, FormDateField } from '../../../src/features/admin/ActivityFormComponents';
import activityService from '../../../src/features/activity/activityService';
import { queryKeys } from '../../../src/constants/queryKeys';
import { PrimaryButton, OutlineButton, ScreenHeader, CustomModal, LoadingScreen, ErrorState, AppText } from '../../../src/components';
import { spacing, fontSize } from '../../../src/constants/theme';
import type { ActivityStatus } from '../../../src/types';

const STATUS_OPTIONS: ActivityStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export default function EditActivityScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: activity, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: async () => {
      const res = await activityService.getActivityById(id);
      if (!res.success) throw new Error(res.message || t('admin.loadActivityError'));
      return res.data;
    },
    enabled: !!id,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [points, setPoints] = useState('');
  const [expectedSteps, setExpectedSteps] = useState('');
  const [totalDistance, setTotalDistance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('UPCOMING');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!activity) return;
    setTitle(activity.title ?? '');
    setDescription(activity.description ?? '');
    setLocation(activity.location ?? '');
    setPoints(activity.points ? String(activity.points) : '');
    setExpectedSteps(activity.expectedSteps ? String(activity.expectedSteps) : '');
    setTotalDistance(activity.totalDistance ? String(activity.totalDistance) : '');
    setStartDate(activity.startDate ? activity.startDate.slice(0, 10) : '');
    setEndDate(activity.endDate ? activity.endDate.slice(0, 10) : '');
    setStatus(activity.status ?? 'UPCOMING');
  }, [activity]);

  const handleUpdate = async () => {
    if (!title || !location || !startDate || !endDate) {
      showToast(t('admin.fillRequiredFields'), 'error');
      return;
    }
    if (!expectedSteps && !totalDistance) {
      showToast(t('admin.provideStepsOrDistance'), 'error');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showToast(t('admin.endBeforeStart'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        location,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        points: points ? parseInt(points, 10) : 0,
        expectedSteps: expectedSteps ? parseInt(expectedSteps, 10) : null,
        totalDistance: totalDistance ? parseFloat(totalDistance) : null,
        status, // accepted by the backend (see updateActivity controller), not in ActivityInput's TS shape
      };
      const res = await activityService.updateActivity(id, payload as any);
      if (!res.success) throw new Error(res.message || t('common.error'));

      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      showToast(t('admin.activityUpdated'), 'success');
      setTimeout(() => router.back(), 800);
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await activityService.deleteActivity(id);
      if (!res.success) throw new Error(res.message || t('common.error'));

      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      setShowDeleteModal(false);
      showToast(t('admin.activityDeleted'), 'success');
      setTimeout(() => router.back(), 800);
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isPending) return <LoadingScreen message={t('common.loading')} />;

  if (error || !activity) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState
          title={t('admin.loadActivityError')}
          message={(error as any)?.message ?? ''}
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.editActivity')}
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/admin/dashboard')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <FormInput
          label={t('admin.activityTitle') + ' *'}
          value={title}
          onChangeText={setTitle}
          placeholder={t('admin.egCampusRun')}
          colors={colors}
        />

        <FormInput
          label={t('admin.activityDescription')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('admin.describeActivity')}
          multiline
          colors={colors}
        />

        <FormInput
          label={t('admin.activityLocation') + ' *'}
          value={location}
          onChangeText={setLocation}
          placeholder={t('admin.egLocation')}
          colors={colors}
        />

        <FormInput
          label={t('admin.egSteps')}
          value={expectedSteps}
          onChangeText={setExpectedSteps}
          placeholder={t('admin.egSteps')}
          keyboardType="numeric"
          colors={colors}
        />

        <FormInput
          label={t('admin.egDistance')}
          value={totalDistance}
          onChangeText={setTotalDistance}
          placeholder={t('admin.egDistance')}
          keyboardType="numeric"
          colors={colors}
        />

        <FormInput
          label={t('admin.activityPoints')}
          value={points}
          onChangeText={setPoints}
          placeholder={t('admin.egPoints')}
          keyboardType="numeric"
          colors={colors}
        />

        <FormDateField label={t('admin.startDate') + ' *'} value={startDate} onChange={setStartDate} colors={colors} />
        <FormDateField
          label={t('admin.endDate') + ' *'}
          value={endDate}
          onChange={setEndDate}
          minimumDate={startDate ? new Date(startDate) : undefined}
          colors={colors}
        />

        <View style={{ marginTop: spacing.sm }}>
          <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.sm }}>
            {t('admin.activityStatus')}
          </AppText>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = opt === status;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setStatus(opt)}
                  style={[
                    styles.statusChip,
                    { backgroundColor: active ? colors.primary : colors.inputBackground },
                  ]}
                >
                  <AppText style={{ fontSize: fontSize.xs, fontWeight: '700' as any, color: active ? colors.onPrimary : colors.textSecondary }}>
                    {t(`status.${opt}`)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          title={isSubmitting ? t('common.loading') : t('common.save')}
          onPress={handleUpdate}
          disabled={isSubmitting}
          style={{ marginTop: 24 }}
        />

        <View style={{ marginTop: 12 }}>
          <PrimaryButton
            title={t('admin.actionAttendees')}
            onPress={() => router.push(`/admin/activities/${id}/attendees`)}
            style={{ backgroundColor: colors.success }}
            icon="people-outline"
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <OutlineButton
            title={t('common.delete')}
            onPress={() => setShowDeleteModal(true)}
            color={colors.error}
          />
        </View>
      </ScrollView>

      <CustomModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('admin.deleteWarningTitle')}
        description={t('admin.confirmDeleteActivity')}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setShowDeleteModal(false)} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isDeleting ? t('common.loading') : t('common.delete')}
              onPress={handleDelete}
              disabled={isDeleting}
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
  content: { padding: 20, paddingBottom: 40 },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 1,
    borderRadius: 12,
  },
});
