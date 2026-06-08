import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { FormInput, FormDatePicker } from '../../src/features/admin/components/ActivityFormComponents';
import { PrimaryButton, ScreenHeader } from '../../src/components';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function CreateActivityScreen() {
  const { colors } = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreate = () => {
    if (!title || !goal || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    // TODO: Call API to create activity
    Alert.alert('Success', 'Activity created successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
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
          placeholder="e.g. June Campus Run" 
          colors={colors} 
        />
        
        <FormInput 
          label="Description" 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Describe the activity..." 
          multiline={true}
          colors={colors} 
        />

        <FormInput 
          label="Step Goal *" 
          value={goal} 
          onChangeText={setGoal} 
          placeholder="e.g. 50000" 
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
          title="Create Activity" 
          onPress={handleCreate} 
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
