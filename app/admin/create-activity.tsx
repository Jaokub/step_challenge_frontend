import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import { FormInput, FormDateField } from '../../src/features/admin/ActivityFormComponents';
import activityService from '../../src/features/activity/activityService';
import { PrimaryButton, ScreenHeader } from '../../src/components';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function CreateActivityScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [points, setPoints] = useState('');
  const [expectedSteps, setExpectedSteps] = useState('');
  const [totalDistance, setTotalDistance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    // Required fields
    if (!title || !location || !startDate || !endDate) {
      showToast(t('admin.fillRequiredFields'), 'error');
      return;
    }

    // At least one target (expected steps OR total distance) must be provided
    if (!expectedSteps && !totalDistance) {
      showToast(t('admin.provideStepsOrDistance'), 'error');
      return;
    }

    // endDate must not be before startDate
    if (new Date(endDate) < new Date(startDate)) {
      showToast(t('admin.endBeforeStart'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activityService.createActivity({
        title,
        description,
        location,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        points: points ? parseInt(points, 10) : 0,
        expectedSteps: expectedSteps ? parseInt(expectedSteps, 10) : null,
        totalDistance: totalDistance ? parseFloat(totalDistance) : null,
      });

      if (res && res.success) {
        showToast(t('admin.activityCreated'), 'success');
        setTimeout(() => router.back(), 1000);
      } else {
        throw new Error(res?.message || 'Failed to create activity');
      }
    } catch (error: any) {
      console.error('Failed to create activity', error);
      Alert.alert(t('common.error'), error?.response?.data?.message || error?.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title="Create Activity"
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/admin/dashboard')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <FormInput
          label="Activity Title *"
          value={title}
          onChangeText={setTitle}
          placeholder={t('admin.egCampusRun')}
          colors={colors}
        />

        <FormInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder={t('admin.describeActivity')}
          multiline={true}
          colors={colors}
        />

        <FormInput
          label="Location *"
          value={location}
          onChangeText={setLocation}
          placeholder={t('admin.egLocation')}
          colors={colors}
        />

        <FormInput
          label="Expected Steps"
          value={expectedSteps}
          onChangeText={setExpectedSteps}
          placeholder={t('admin.egSteps')}
          keyboardType="numeric"
          colors={colors}
        />

        <FormInput
          label="Total Distance (km)"
          value={totalDistance}
          onChangeText={setTotalDistance}
          placeholder={t('admin.egDistance')}
          keyboardType="numeric"
          colors={colors}
        />

        <FormInput
          label="Points"
          value={points}
          onChangeText={setPoints}
          placeholder={t('admin.egPoints')}
          keyboardType="numeric"
          colors={colors}
        />

        <FormDateField
          label="Start Date *"
          value={startDate}
          onChange={setStartDate}
          colors={colors}
        />

        <FormDateField
          label="End Date *"
          value={endDate}
          onChange={setEndDate}
          minimumDate={startDate ? new Date(startDate) : undefined}
          colors={colors}
        />

        <PrimaryButton
          title={isSubmitting ? "Creating..." : "Create Activity"}
          onPress={handleCreate}
          disabled={isSubmitting}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
});
