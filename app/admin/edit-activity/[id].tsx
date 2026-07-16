import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useToast } from '../../../src/contexts/ToastContext';
import {
  FormInput,
  FormDateField,
  ActivityTypeToggle,
  ActivityType,
  EventDurationToggle,
  EventDuration,
} from '../../../src/features/admin/ActivityFormComponents';
import activityService from '../../../src/features/activity/activityService';
import { queryKeys } from '../../../src/constants/queryKeys';
import { PrimaryButton, OutlineButton, ScreenHeader, CustomModal, LoadingScreen, ErrorState, AppText, statusColors } from '../../../src/components';
import { spacing, fontSize, gradients } from '../../../src/constants/theme';
import type { ActivityStatus } from '../../../src/types';

const STATUS_OPTIONS: ActivityStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

interface EditActivityForm {
  title: string;
  description: string;
  location: string;
  points: string;
  activityType: ActivityType;
  expectedSteps: string;
  totalDistance: string;
  duration: EventDuration;
  startDate: string;
  endDate: string;
  status: ActivityStatus;
}

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

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<EditActivityForm>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      points: '',
      activityType: 'STEP_GATED',
      expectedSteps: '',
      totalDistance: '',
      duration: 'SINGLE_DAY',
      startDate: '',
      endDate: '',
      status: 'UPCOMING',
    },
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!activity) return;
    const startDate = activity.startDate ? activity.startDate.slice(0, 10) : '';
    const endDate = activity.endDate ? activity.endDate.slice(0, 10) : '';
    reset({
      title: activity.title ?? '',
      description: activity.description ?? '',
      location: activity.location ?? '',
      points: activity.points ? String(activity.points) : '',
      // Type is derived, not stored (ADR-001): expectedSteps set = step-gated.
      activityType: activity.expectedSteps != null ? 'STEP_GATED' : 'ATTENDANCE',
      expectedSteps: activity.expectedSteps ? String(activity.expectedSteps) : '',
      totalDistance: activity.totalDistance ? String(activity.totalDistance) : '',
      // Duration is derived too — same date on both ends = single day.
      duration: startDate && startDate === endDate ? 'SINGLE_DAY' : 'MULTI_DAY',
      startDate,
      endDate,
      status: activity.status ?? 'UPCOMING',
    });
  }, [activity, reset]);

  const startDateValue = watch('startDate');
  const statusValue = watch('status');
  const activityType = watch('activityType');
  const duration = watch('duration');

  // Switching to attendance-only clears the step/distance targets so a
  // stale value can't sneak into the payload once the fields are hidden.
  const handleTypeChange = (next: ActivityType) => {
    setValue('activityType', next);
    if (next === 'ATTENDANCE') {
      setValue('expectedSteps', '');
      setValue('totalDistance', '');
    }
  };

  // Single-day keeps endDate silently in sync with startDate (no second
  // field for the admin to forget to set); switching back to multi-day
  // leaves that value in place as a sane starting point for endDate.
  const handleDurationChange = (next: EventDuration) => {
    setValue('duration', next);
    if (next === 'SINGLE_DAY') {
      setValue('endDate', getValues('startDate'));
    }
  };

  const handleSingleDayDateChange = (date: string) => {
    setValue('startDate', date);
    setValue('endDate', date);
  };

  const onSubmit = async (values: EditActivityForm) => {
    try {
      const isStepGated = values.activityType === 'STEP_GATED';
      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        location: values.location,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        points: values.points ? parseInt(values.points, 10) : 0,
        expectedSteps: isStepGated && values.expectedSteps ? parseInt(values.expectedSteps, 10) : null,
        totalDistance: isStepGated && values.totalDistance ? parseFloat(values.totalDistance) : null,
        status: values.status, // accepted by the backend (see updateActivity controller), not in ActivityInput's TS shape
      };
      const res = await activityService.updateActivity(id, payload as any);
      if (!res.success) throw new Error(res.message || t('common.error'));

      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      showToast(t('admin.activityUpdated'), 'success');
      setTimeout(() => router.back(), 800);
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  // Same priority order as the old imperative checks: missing required
  // fields first, then the step-goal rule (step-gated only), then the
  // date-order rule.
  const onInvalid = (errors: FieldErrors<EditActivityForm>) => {
    if (errors.title || errors.location || errors.startDate || errors.endDate?.type === 'required') {
      showToast(t('admin.fillRequiredFields'), 'error');
      return;
    }
    if (errors.expectedSteps) {
      showToast(t('admin.expectedStepsRequired'), 'error');
      return;
    }
    if (errors.endDate) {
      showToast(t('admin.endBeforeStart'), 'error');
    }
  };

  const submit = handleSubmit(onSubmit, onInvalid);

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
          titleSize={17}
          pathSubtitle={`/admin/edit-activity/${id}`}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/activities'))}
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Controller
          control={control}
          name="title"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <FormInput
              label={t('admin.activityTitle')}
              value={value}
              onChangeText={onChange}
              placeholder={t('admin.egCampusRun')}
              colors={colors}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <FormInput
              label={t('admin.activityDescription')}
              value={value}
              onChangeText={onChange}
              placeholder={t('admin.describeActivity')}
              multiline
              colors={colors}
            />
          )}
        />

        <Controller
          control={control}
          name="location"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <FormInput
              label={t('admin.activityLocation')}
              value={value}
              onChangeText={onChange}
              placeholder={t('admin.egLocation')}
              colors={colors}
            />
          )}
        />

        <Controller
          control={control}
          name="activityType"
          render={({ field: { value } }) => (
            <ActivityTypeToggle value={value} onChange={handleTypeChange} colors={colors} />
          )}
        />

        {activityType === 'STEP_GATED' && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="expectedSteps"
                rules={{
                  validate: (v) => activityType !== 'STEP_GATED' || (!!v && parseInt(v, 10) > 0) || 'expectedStepsRequired',
                }}
                render={({ field: { value, onChange } }) => (
                  <FormInput
                    label={t('admin.expectedStepsLabel')}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t('admin.egSteps')}
                    keyboardType="numeric"
                    colors={colors}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="totalDistance"
                render={({ field: { value, onChange } }) => (
                  <FormInput
                    label={t('admin.totalDistanceLabel')}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t('admin.egDistance')}
                    keyboardType="numeric"
                    colors={colors}
                  />
                )}
              />
            </View>
          </View>
        )}

        <Controller
          control={control}
          name="points"
          render={({ field: { value, onChange } }) => (
            <FormInput
              label={t('admin.activityPoints')}
              value={value}
              onChangeText={onChange}
              placeholder={t('admin.egPoints')}
              keyboardType="numeric"
              colors={colors}
            />
          )}
        />

        <Controller
          control={control}
          name="duration"
          render={({ field: { value } }) => (
            <EventDurationToggle value={value} onChange={handleDurationChange} colors={colors} />
          )}
        />

        {duration === 'SINGLE_DAY' ? (
          <Controller
            control={control}
            name="startDate"
            rules={{ required: true }}
            render={({ field: { value } }) => (
              <FormDateField
                label={t('admin.eventDateLabel')}
                value={value}
                onChange={handleSingleDayDateChange}
                colors={colors}
              />
            )}
          />
        ) : (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="startDate"
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <FormDateField label={t('admin.startDate')} value={value} onChange={onChange} colors={colors} />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="endDate"
                rules={{
                  required: true,
                  validate: (v, formValues) =>
                    !formValues.startDate || new Date(v) >= new Date(formValues.startDate) || 'endBeforeStart',
                }}
                render={({ field: { value, onChange } }) => (
                  <FormDateField
                    label={t('admin.endDate')}
                    value={value}
                    onChange={onChange}
                    minimumDate={startDateValue ? new Date(startDateValue) : undefined}
                    colors={colors}
                  />
                )}
              />
            </View>
          </View>
        )}

        <View style={styles.statusSection}>
          <AppText style={[styles.statusLabel, { color: colors.textSecondary }]}>
            {t('admin.activityStatus')}
          </AppText>
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange } }) => (
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = opt === statusValue;
                  // Mockup's editActivityStatusOptions: active uses that status's own
                  // tint/color (teal for ongoing, orange for upcoming, red for
                  // cancelled, grey for completed) — never a flat teal for every status.
                  const { bg, text } = statusColors(opt, colors);
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => onChange(opt)}
                      style={[
                        styles.statusChip,
                        { backgroundColor: active ? bg : colors.inputBackground },
                      ]}
                    >
                      <AppText style={[styles.statusChipText, { color: active ? text : colors.textSecondary }]}>
                        {t(`status.${opt}`)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </View>

        {/* Bottom actions — mockup frame 4: [ยกเลิก | บันทึก] side by side */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.inputBackground }]}
            onPress={() => (router.canGoBack() ? router.back() : router.push('/admin/activities'))}
            disabled={isSubmitting}
          >
            <AppText style={{ fontSize: 14, fontWeight: '700' as any, color: colors.textPrimary }}>
              {t('common.cancel')}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, opacity: isSubmitting ? 0.6 : 1 }} onPress={submit} disabled={isSubmitting}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtn}>
              <AppText style={{ fontSize: 14, fontWeight: '700' as any, color: colors.onPrimary }}>
                {isSubmitting ? t('common.loading') : t('common.save')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.deleteLink}
          onPress={() => setShowDeleteModal(true)}
          disabled={isSubmitting}
        >
          <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.error }}>
            {t('common.delete')}
          </AppText>
        </TouchableOpacity>
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
  row: { flexDirection: 'row', gap: 10 },
  statusSection: { marginBottom: 14 },
  statusLabel: { fontSize: 12, lineHeight: 15, fontWeight: '700' as any, marginBottom: 6 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
  },
  statusChipText: { fontSize: 12, lineHeight: 15, fontWeight: '700' as any },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  deleteLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
