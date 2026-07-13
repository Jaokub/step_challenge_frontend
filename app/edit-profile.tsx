import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../src/contexts/ThemeContext';
import { useToast } from '../src/contexts/ToastContext';
import { useAuth } from '../src/contexts/AuthContext';
import { AppText, ScreenHeader, PrimaryButton, OutlineButton } from '../src/components';
import authService from '../src/features/auth/authService';
import userService from '../src/features/auth/userService';
import { queryKeys } from '../src/constants/queryKeys';
import { spacing, fontSize } from '../src/constants/theme';

interface ProfileForm {
  fullName: string;
  nickname: string;
  department: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EditProfileScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: queryKeys.users.me,
    queryFn: async () => {
      const res = await authService.getMe();
      if (!res.success) throw new Error(res.message);
      return res.data.user;
    },
  });

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { isSubmitting: isSavingProfile },
  } = useForm<ProfileForm>({
    defaultValues: { fullName: '', nickname: '', department: '' },
  });

  // Sync the fetched profile into the editable form once it resolves —
  // same pattern as admin/edit-activity/[id].tsx.
  useEffect(() => {
    if (!profile) return;
    resetProfileForm({
      fullName: profile.fullName || '',
      nickname: profile.nickname || '',
      department: profile.department || '',
    });
  }, [profile, resetProfileForm]);

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { isSubmitting: isSavingPassword },
  } = useForm<PasswordForm>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileForm) =>
      userService.updateProfile({
        fullName: values.fullName,
        nickname: values.nickname,
        department: values.department,
      }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordForm) =>
      authService.changePassword(values.currentPassword, values.newPassword),
  });

  const onSubmitProfile = async (values: ProfileForm) => {
    try {
      const res = await updateProfileMutation.mutateAsync(values);
      if (!res.success) throw new Error(res.message);
      // Keep the query cache and the AuthContext copy of `user` (read by
      // other screens via useAuth()) both in sync with the new name.
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profileScreen });
      await refreshUser();
      showToast(t('profile.profileUpdated'), 'success');
    } catch (e: any) {
      showToast(e.message || t('profile.failedToUpdate'), 'error');
    }
  };

  const onSubmitPassword = async (values: PasswordForm) => {
    if (values.newPassword !== values.confirmPassword) {
      showToast(t('profile.passwordsNotMatch'), 'error');
      return;
    }
    if (values.newPassword.length < 6) {
      showToast(t('profile.passwordTooShort'), 'error');
      return;
    }
    try {
      const res = await changePasswordMutation.mutateAsync(values);
      if (!res.success) throw new Error(res.message);
      showToast(t('profile.passwordChanged'), 'success');
      resetPasswordForm();
    } catch (e: any) {
      showToast(e.message || t('profile.failedToChangePassword'), 'error');
    }
  };

  const onProfileInvalid = () => {
    showToast(t('profile.nameRequired'), 'error');
  };

  const onPasswordInvalid = () => {
    showToast(t('profile.fillAllPasswordFields'), 'error');
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

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <AppText style={[styles.sectionTitle, { color: colors.primary }]}>{t('profile.profileInformation')}</AppText>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('auth.fullName')}</AppText>
          <Controller
            control={profileControl}
            name="fullName"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                value={value}
                onChangeText={onChange}
                placeholder={t('profile.johnDoe')}
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.nickname')}</AppText>
          <Controller
            control={profileControl}
            name="nickname"
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                value={value}
                onChangeText={onChange}
                placeholder={t('profile.nickname')}
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('auth.department')}</AppText>
          <Controller
            control={profileControl}
            name="department"
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                value={value}
                onChangeText={onChange}
                placeholder={t('profile.compEng')}
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
        </View>

        <PrimaryButton
          title={t('profile.saveProfile')}
          onPress={handleProfileSubmit(onSubmitProfile, onProfileInvalid)}
          loading={isSavingProfile || updateProfileMutation.isPending}
          style={{ marginTop: spacing.md }}
        />

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <AppText style={[styles.sectionTitle, { color: colors.primary }]}>{t('profile.changePassword')}</AppText>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.currentPassword')}</AppText>
          <Controller
            control={passwordControl}
            name="currentPassword"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.newPassword')}</AppText>
          <Controller
            control={passwordControl}
            name="newPassword"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.confirmNewPassword')}</AppText>
          <Controller
            control={passwordControl}
            name="confirmPassword"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
        </View>

        <OutlineButton
          title={t('profile.changePassword')}
          onPress={handlePasswordSubmit(onSubmitPassword, onPasswordInvalid)}
          loading={isSavingPassword || changePasswordMutation.isPending}
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
