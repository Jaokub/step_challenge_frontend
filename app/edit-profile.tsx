import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/contexts/ThemeContext';
import { AppText, ScreenHeader, PrimaryButton, OutlineButton } from '../src/components';
import authService from '../src/features/auth/authService';
import userService from '../src/features/auth/userService';
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
      Alert.alert(t('common.error'), t('profile.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      await userService.updateProfile({ fullName, nickname, department });
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('profile.failedToUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('profile.fillAllPasswordFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.passwordsNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profile.passwordTooShort'));
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert(t('common.success'), t('profile.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('profile.failedToChangePassword'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title={t('profile.editProfile')}
          rightActions={
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          } 
        />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={[styles.sectionTitle, { color: colors.primary }]}>{t('profile.profileInformation')}</AppText>
        
        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('auth.fullName')}</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('profile.johnDoe')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.nickname')}</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('profile.nickname')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('auth.department')}</AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            value={department}
            onChangeText={setDepartment}
            placeholder={t('profile.compEng')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <PrimaryButton 
          title={t('profile.saveProfile')} 
          onPress={handleUpdateProfile} 
          loading={loading}
          style={{ marginTop: spacing.md }}
        />

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <AppText style={[styles.sectionTitle, { color: colors.primary }]}>{t('profile.changePassword')}</AppText>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.currentPassword')}</AppText>
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
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.newPassword')}</AppText>
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
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.confirmNewPassword')}</AppText>
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
          title={t('profile.changePassword')} 
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
