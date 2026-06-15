import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { FormInput, FormDatePicker } from '../../../src/features/admin/ActivityFormComponents';
import { PrimaryButton, ScreenHeader } from '../../../src/components';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function EditActivityScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mock fetching data
  useEffect(() => {
    if (id) {
      setTitle('Campus Fun Run');
      setDescription('Annual campus fun run event');
      setGoal('50000');
      setStartDate('2026-06-10');
      setEndDate('2026-06-10');
    }
  }, [id]);

  const handleUpdate = () => {
    if (!title || !goal || !startDate || !endDate) {
      Alert.alert(t('common.error'), t('admin.fillRequiredFields'));
      return;
    }
    // TODO: Call API to update activity
    Alert.alert('Success', 'Activity updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t('admin.deleteWarningTitle'), t('admin.deleteWarningDesc'), [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          // TODO: Call API to delete
          Alert.alert('Deleted', 'Activity deleted.', [{ text: 'OK', onPress: () => router.back() }]);
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title="Edit Activity" 
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
          onPress={() => setStartDate('2026-06-10')} // Mock date picker
          colors={colors} 
        />

        <FormDatePicker 
          label="End Date *" 
          value={endDate} 
          onPress={() => setEndDate('2026-06-10')} // Mock date picker
          colors={colors} 
        />

        <PrimaryButton 
          title="Update Activity" 
          onPress={handleUpdate} 
          style={{ marginTop: 24 }}
        />

        <View style={{ marginTop: 12 }}>
          <PrimaryButton 
            title="Manage Attendees & Scan QR" 
            onPress={() => router.push(`/admin/activity/${id}/attendees`)} 
            style={{ backgroundColor: colors.success }}
            icon="qr-code"
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <PrimaryButton 
            title="Delete Activity" 
            onPress={handleDelete} 
            style={{ backgroundColor: colors.error }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
});
