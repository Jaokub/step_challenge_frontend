import { useTranslation } from 'react-i18next';
import React from 'react';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import {
  FormInput,
  FormDateField,
  ActivityTypeToggle,
  ActivityType,
  EventDurationToggle,
  EventDuration,
} from '../../src/features/admin/ActivityFormComponents';
import activityService from '../../src/features/activity/activityService';
import { queryKeys } from '../../src/constants/queryKeys';
import { AppText, ScreenHeader } from '../../src/components';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../src/constants/theme';

interface CreateActivityForm {
  title: string;
  description: string;
  location: string;
  activityType: ActivityType;
  expectedSteps: string;
  totalDistance: string;
  duration: EventDuration;
  startDate: string;
  endDate: string;
}

export default function CreateActivityScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<CreateActivityForm>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      activityType: 'STEP_GATED',
      expectedSteps: '',
      totalDistance: '',
      // Most activities (campus runs, single check-in events) are one-day —
      // default to the common case.
      duration: 'SINGLE_DAY',
      startDate: '',
      endDate: '',
    },
  });

  const startDateValue = watch('startDate');
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

  const onSubmit = async (values: CreateActivityForm) => {
    try {
      const isStepGated = values.activityType === 'STEP_GATED';
      const res = await activityService.createActivity({
        title: values.title,
        description: values.description,
        location: values.location,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        // `points` deliberately not sent — the field was removed from this
        // form (ranking is by steps, no points appear in the UI). The server
        // applies its own default.
        expectedSteps: isStepGated && values.expectedSteps ? parseInt(values.expectedSteps, 10) : null,
        totalDistance: isStepGated && values.totalDistance ? parseFloat(values.totalDistance) : null,
      });

      if (res && res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.personal });
        showToast(t('admin.activityCreated'), 'success');
        setTimeout(() => router.back(), 1000);
      } else {
        throw new Error(res?.message || 'Failed to create activity');
      }
    } catch (error: any) {
      console.error('Failed to create activity', error);
      showToast(error?.response?.data?.message || error?.message || t('common.error'), 'error');
    }
  };

  // Same priority order as the old imperative checks: missing required
  // fields first, then the step-goal rule (step-gated only), then the
  // date-order rule.
  const onInvalid = (errors: FieldErrors<CreateActivityForm>) => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.createActivityTitle')}
          titleSize={17}
          pathSubtitle="/admin/create-activity"
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
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
              multiline={true}
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

        {/* The "points awarded" field was removed: the product ranks by step
            count only and no points figure appears anywhere in the UI, so
            asking an admin to configure one was misleading. `Activity.points`
            still exists server-side (the dormant ledger reads it) and simply
            takes its default. */}

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

        {/* Bottom actions — mockup frame 3: [ยกเลิก | สร้างกิจกรรม] side by side */}
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
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.createBtn}>
              <AppText style={{ fontSize: 14, fontWeight: '700' as any, color: colors.onPrimary }}>
                {isSubmitting ? t('admin.creating') : t('admin.createActivity')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 10 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  createBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
});
