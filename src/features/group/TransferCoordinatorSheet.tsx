import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText, BottomSheet, CustomModal, PrimaryButton, OutlineButton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { spacing } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import groupService from './groupService';
import type { GroupMember } from '../../types';

interface TransferCoordinatorSheetProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[]; // MEMBER-role rows only — caller filters
}

const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

// "โอนสิทธิ์ผู้ประสานงาน" — pick a current member, confirm, hand off OWNER.
// BUILD_PLAN.md Phase 5 gap #6: the current coordinator's own OWNER row
// moves to the picked member; the caller becomes a regular member.
export default function TransferCoordinatorSheet({
  visible,
  onClose,
  groupId,
  members,
}: TransferCoordinatorSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);

  const transferMutation = useMutation({
    mutationFn: (userId: string) => groupService.transferCoordinator(groupId, userId),
  });

  const handleConfirm = async () => {
    if (!target) return;
    try {
      const res = await transferMutation.mutateAsync(target.id);
      if (res.success) {
        showToast(t('groups.coordinatorTransferred'), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
        setTarget(null);
        onClose();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const handleClose = () => {
    setTarget(null);
    onClose();
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={handleClose}>
        <View>
          <AppText variant="heading-bold" style={[styles.title, { color: colors.textPrimary }]}>
            {t('groups.transferCoordinatorTitle')}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('groups.transferCoordinatorSubtitle')}
          </AppText>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.sm }}>
            {members.length === 0 && (
              <AppText style={[styles.empty, { color: colors.textSecondary }]}>
                {t('groups.noEligibleMembers')}
              </AppText>
            )}
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => m.user && setTarget({ id: m.user.id, name: m.user.fullName })}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.inputBackground }]}>
                  <AppText variant="body-bold" style={{ fontSize: 11, color: colors.textPrimary }}>
                    {initials(m.user?.fullName)}
                  </AppText>
                </View>
                <AppText variant="body-medium" style={[styles.rowName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {m.user?.fullName}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>

      <CustomModal
        visible={!!target}
        onClose={() => setTarget(null)}
        title={t('groups.transferCoordinatorTitle')}
        description={target ? t('groups.confirmTransferCoordinator', { name: target.name }) : undefined}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setTarget(null)} disabled={transferMutation.isPending} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={transferMutation.isPending ? t('common.loading') : t('common.confirm')}
              onPress={handleConfirm}
              disabled={transferMutation.isPending}
            />
          </View>
        </View>
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, lineHeight: 20 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  list: { maxHeight: 280 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 11 },
  avatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowName: { flex: 1, fontSize: 13, lineHeight: 15 },
});
