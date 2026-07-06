import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import { FormInput, FormDatePicker } from '../../src/features/admin/ActivityFormComponents';
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
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title || !goal || !startDate || !endDate) {
      showToast(t('admin.fillRequiredFields'), 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // TODO: this payload predates the current backend contract — the API
      // requires { location, points } and has no "goal" field, so creation
      // may fail server-side validation. The form needs location/points
      // inputs; payload kept as-is (cast) to avoid silently changing behavior.
      const res = await activityService.createActivity({
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        goal: parseInt(goal, 10)
      } as any);
      
      if (res && res.success) {
        showToast(t('admin.activityCreated'), 'success');
        setTimeout(() => router.back(), 1000);
      } else {
        throw new Error(res?.message || 'Failed to create activity');
      }
    } catch (error: any) {
      console.error('Failed to create activity', error);
      Alert.alert(t('common.error'), error?.response?.data?.message || error.message || t('common.error'));
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
          label="Step Goal *" 
          value={goal} 
          onChangeText={setGoal} 
          placeholder={t('admin.egSteps')} 
          keyboardType="numeric"
          colors={colors} 
        />

        <FormDatePicker 
          label="Start Date *" 
          value={startDate} 
          onPress={() => setStartDate('2026-06-01')} // Mock date picker
          colors={colors} 
        />

        <FormDatePicker 
          label="End Date *" 
          value={endDate} 
          onPress={() => setEndDate('2026-06-30')} // Mock date picker
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
