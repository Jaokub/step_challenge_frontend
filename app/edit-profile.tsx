import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/contexts/ThemeContext';
import { AppText, ScreenHeader, PrimaryButton, OutlineButton } from '../src/components';
import authService from '../src/features/auth/services/authService';
import userService from '../src/features/auth/services/userService';
import { spacing, fontSize } from '../src/constants/theme';

const EditProfileScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [department, setDepartment] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getMe();
        if (res.success) {
          setFullName(res.data.user.fullName || '');
          setNickname(res.data.user.nickname || '');
          setDepartment(res.data.user.department || '');
        }
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!fullName) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    setLoading(true);
    try {
      await userService.updateProfile({ fullName, nickname, department });
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title="Edit Profile"
          rightActions={
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          } 
        />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={[styles.sectionTitle, { color: colors.primary }]}>Profile Information</AppText>
        
        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>Full Name</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>Nickname</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Nickname"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>Department</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={department}
            onChangeText={setDepartment}
            placeholder="Computer Engineering"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <PrimaryButton 
          title="Save Profile" 
          onPress={handleUpdateProfile} 
          loading={loading}
          style={{ marginTop: spacing.md }}
        />

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <AppText style={[styles.sectionTitle, { color: colors.primary }]}>Change Password</AppText>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>Current Password</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>New Password</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <OutlineButton 
          title="Change Password" 
          onPress={handleChangePassword} 
          loading={passwordLoading}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: spacing.xs },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },
  sectionTitle: { fontSize: fontSize.lg, marginBottom: spacing.lg, fontWeight: '600' },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: spacing.xl,
  }
});

export default EditProfileScreen;
