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

interface IncomingParentRequestsSheetProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

// Bottom-sheet twin of ParentGroupPickerSheet — opened from the always-visible
// "คำขอเป็นกลุ่มย่อย" trigger row on group/[id].tsx (same pattern as that
// screen's "ขอเป็นกลุ่มย่อยของ..." row opening ParentGroupPickerSheet).
// Shares its query key with that row so the count badge and the sheet's list
// never disagree / don't double-fetch. Approve sets the requester's
// parentGroupId; deny just closes the request.
export default function IncomingParentRequestsSheet({
  visible,
  onClose,
  groupId,
  groupName,
}: IncomingParentRequestsSheetProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  // `colors.card` == `colors.inputBackground` in dark mode — nested pills
  // need a distinct tone to stand out against this card (see RelationGroupCard).
  const insetBg = isDark ? colors.background : colors.inputBackground;

  const requestsQuery = useQuery({
    queryKey: queryKeys.groups.incomingRequests(groupId),
    queryFn: async () => {
      const res = await groupService.getIncomingParentRequests(groupId);
      if (!res.success) throw new Error('Failed to load incoming requests');
      return res.data;
    },
    enabled: visible,
  });

  const requests = requestsQuery.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.incomingRequests(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.adminTree });
  };

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => groupService.approveParentRequest(groupId, requestId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(t('groups.requestApproved'), 'success');
        invalidate();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    },
    onError: (err: any) => showToast(err?.message || t('common.error'), 'error'),
  });

  const denyMutation = useMutation({
    mutationFn: (requestId: string) => groupService.denyParentRequest(groupId, requestId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(t('groups.requestDenied'), 'success');
        invalidate();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    },
    onError: (err: any) => showToast(err?.message || t('common.error'), 'error'),
  });

  const busy = approveMutation.isPending || denyMutation.isPending;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
        <AppText variant="heading-bold" style={[styles.title, { color: colors.textPrimary }]}>
          {t('groups.incomingParentRequests')}
        </AppText>
        <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>{groupName}</AppText>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          {requests.length === 0 && !requestsQuery.isPending && (
            <AppText style={[styles.empty, { color: colors.textSecondary }]}>
              {t('groups.noIncomingRequests')}
            </AppText>
          )}
          {requests.map((r) => (
            <View key={r.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="body-bold" style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {r.childGroup?.name ?? '—'}
                </AppText>
                <AppText style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {t('groups.memberCountLabel', { count: r.childGroup?.memberCount ?? 0 })}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => approveMutation.mutate(r.id)}
                disabled={busy}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <AppText style={{ fontSize: 11.5, fontWeight: '700' as any, color: colors.onPrimary }}>
                  {t('groups.approveAction')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => denyMutation.mutate(r.id)}
                disabled={busy}
                style={[styles.actionBtn, { backgroundColor: insetBg }]}
              >
                <AppText style={{ fontSize: 11.5, fontWeight: '700' as any, color: colors.textSecondary }}>
                  {t('groups.denyAction')}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, lineHeight: 20 },
  subtitle: { fontSize: 12, lineHeight: 15, marginTop: 2 },
  list: { maxHeight: 320 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  rowTitle: { fontSize: 13.5, lineHeight: 16 },
  rowMeta: { fontSize: 11, lineHeight: 14, marginTop: 2 },
  actionBtn: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10, flexShrink: 0 },
});
