import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText, BottomSheet } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { spacing } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import groupService from './groupService';

interface AdminReassignCoordinatorSheetProps {
  visible: boolean;
  onClose: () => void;
  group: { id: string; name: string } | null;
}

const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

// Admin god-mode "เปลี่ยนผู้ประสานงาน" — pick any current member of the
// group and hand them the OWNER role (mockup frame 6). Unlike the
// coordinator-initiated transfer sheet, the target doesn't need to already
// be a member on the backend side, but this list only ever shows existing
// members — picking someone outside the group isn't a flow the mockup asks
// for.
export default function AdminReassignCoordinatorSheet({
  visible,
  onClose,
  group,
}: AdminReassignCoordinatorSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: queryKeys.groups.members(group?.id ?? ''),
    queryFn: async () => {
      const res = await groupService.getGroupMembers(group!.id);
      if (!res.success) throw new Error('Failed to load members');
      return res.data;
    },
    enabled: visible && !!group,
  });
  const members = (membersQuery.data ?? []).filter((m) => m.role !== 'OWNER');

  const transferMutation = useMutation({
    mutationFn: (userId: string) => groupService.transferCoordinator(group!.id, userId),
  });

  const handlePick = async (userId: string) => {
    try {
      const res = await transferMutation.mutateAsync(userId);
      if (res.success) {
        showToast(t('groups.coordinatorTransferred'), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.adminTree });
        onClose();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
        <AppText variant="heading-bold" style={[styles.title, { color: colors.textPrimary }]}>
          {t('admin.actionReassignCoordinator')}
        </AppText>
        {group && <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>{group.name}</AppText>}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          {members.length === 0 && !membersQuery.isPending && (
            <AppText style={[styles.empty, { color: colors.textSecondary }]}>
              {t('groups.noEligibleMembers')}
            </AppText>
          )}
          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => m.user && handlePick(m.user.id)}
              disabled={transferMutation.isPending}
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
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, lineHeight: 20 },
  subtitle: { fontSize: 12, lineHeight: 15, marginTop: 2 },
  list: { maxHeight: 300 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 11 },
  avatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowName: { flex: 1, fontSize: 13, lineHeight: 15 },
});
