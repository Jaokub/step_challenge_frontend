import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useToast } from '../../../src/contexts/ToastContext';
import userService from '../../../src/features/auth/userService';
import { queryKeys } from '../../../src/constants/queryKeys';
import { AppText, ScreenHeader, LoadingScreen, ErrorState, CustomModal, PrimaryButton, OutlineButton } from '../../../src/components';
import { spacing, fontSize, gradients } from '../../../src/constants/theme';

// Mockup frame 9 "User profile" (`/admin/users/[id]`). The "backend gap ·
// PATCH /users/:id/role" pill from the mockup is gone here — that's exactly
// the endpoint this screen now wires up (gap #5, BUILD_PLAN.md Phase 2).
export default function AdminUserProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.users.profile(id),
    queryFn: async () => {
      const res = await userService.getProfile(id);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: !!id,
  });

  const user = data?.user;
  const isAdmin = user?.role === 'ADMIN';
  const initials = (user?.fullName || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

  const handleToggleRole = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const nextRole = isAdmin ? 'STAFF' : 'ADMIN';
      const res = await userService.updateUserRole(user.id, nextRole);
      if (!res.success) throw new Error(res.message);
      showToast(isAdmin ? t('admin.revokeAdminSuccess') : t('admin.grantAdminSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setShowConfirm(false);
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isPending) return <LoadingScreen message={t('common.loading')} />;

  if (error || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState title={t('admin.loadActivityError')} message={(error as any)?.message ?? ''} onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.userProfileTitle')}
          titleSize={16}
          pathSubtitle={`/admin/users/${id}`}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/users'))}
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <AppText variant="heading-bold" style={{ fontSize: fontSize['2xl'], lineHeight: 28, color: colors.onPrimary }}>
              {initials}
            </AppText>
          </LinearGradient>
          <AppText variant="heading-bold" style={{ fontSize: 19, lineHeight: 23, color: colors.textPrimary }}>
            {user.fullName}
          </AppText>
          <AppText style={{ fontSize: 12.5, lineHeight: 16, color: colors.textSecondary }}>
            {user.email} · {user.department || t('admin.filterNoDept')}
          </AppText>
        </View>

        {isAdmin && (
          <View style={[styles.noteBox, { backgroundColor: colors.inputBackground }]}>
            <AppText style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 16, textAlign: 'center' }}>
              {t('admin.adminAccountExcludedNote')}
            </AppText>
          </View>
        )}

        <View style={[styles.permCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.permTop}>
            <AppText variant="body-bold" style={{ fontSize: 14, lineHeight: 17, color: colors.textPrimary }}>
              {t('admin.permissionLabel')}
            </AppText>
            {isAdmin ? (
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rolePill}>
                <AppText style={{ fontSize: 10.5, lineHeight: 13, fontWeight: '700' as any, color: colors.onPrimary }}>{user.role}</AppText>
              </LinearGradient>
            ) : (
              <View style={[styles.rolePill, { backgroundColor: colors.inputBackground }]}>
                <AppText style={{ fontSize: 10.5, lineHeight: 13, fontWeight: '700' as any, color: colors.textSecondary }}>{user.role}</AppText>
              </View>
            )}
          </View>
          <AppText style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
            {isAdmin ? t('admin.permissionAdminDesc') : t('admin.permissionStaffDesc')}
          </AppText>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: colors.inputBackground }]}
            onPress={() => setShowConfirm(true)}
          >
            <AppText style={{ fontWeight: '700' as any, fontSize: 13, lineHeight: 16, color: isAdmin ? colors.error : colors.primary }}>
              {isAdmin ? t('admin.revokeAdminAction') : t('admin.grantAdminAction')}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={isAdmin ? t('admin.revokeAdminAction') : t('admin.grantAdminAction')}
        description={isAdmin ? t('admin.confirmRevokeAdmin', { name: user.fullName }) : t('admin.confirmGrantAdmin', { name: user.fullName })}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setShowConfirm(false)} disabled={isUpdating} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isUpdating ? t('common.loading') : t('common.confirm')}
              onPress={handleToggleRole}
              disabled={isUpdating}
              style={isAdmin ? { backgroundColor: colors.error } : undefined}
            />
          </View>
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: spacing.lg },
  identity: { alignItems: 'center', gap: 10, paddingVertical: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  noteBox: { borderRadius: 14, padding: spacing.md },
  permCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: spacing.sm },
  permTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  toggleBtn: { alignItems: 'center', padding: spacing.md, borderRadius: 14, marginTop: spacing.xs },
});
