import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { spacing } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import groupService from './groupService';

interface GroupIncomingRequestsSectionProps {
  groupId: string;
}

// Mockup frame 13 "คำขอเป็นกลุ่มย่อย" — a coordinator's incoming requests
// from other groups asking to become their children. Approve sets the
// requester's parentGroupId; deny just closes the request. Faculty Admin
// hits the same endpoints from /admin/groups (override-approve).
export default function GroupIncomingRequestsSection({ groupId }: GroupIncomingRequestsSectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: queryKeys.groups.incomingRequests(groupId),
    queryFn: async () => {
      const res = await groupService.getIncomingParentRequests(groupId);
      if (!res.success) throw new Error('Failed to load incoming requests');
      return res.data;
    },
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

  if (!requestsQuery.isPending && requests.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <AppText variant="body-bold" style={[styles.title, { color: colors.textPrimary }]}>
          {t('groups.incomingParentRequests')}
        </AppText>
        <View style={[styles.countBadge, { backgroundColor: colors.inputBackground }]}>
          <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.textSecondary }}>
            {requests.length}
          </AppText>
        </View>
      </View>

      {requests.map((r) => {
        const busy = approveMutation.isPending || denyMutation.isPending;
        return (
          <View key={r.id} style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="body-bold" style={{ fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
                {r.childGroup?.name ?? '—'}
              </AppText>
              <AppText style={{ fontSize: 11, color: colors.textSecondary }}>
                {t('groups.memberCountLabel', { count: r.childGroup?.memberCount ?? 0 })}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => approveMutation.mutate(r.id)}
              disabled={busy}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            >
              <AppText style={{ fontSize: 11, fontWeight: '700' as any, color: colors.onPrimary }}>
                {t('groups.approveAction')}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => denyMutation.mutate(r.id)}
              disabled={busy}
              style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
            >
              <AppText style={{ fontSize: 11, fontWeight: '700' as any, color: colors.textSecondary }}>
                {t('groups.denyAction')}
              </AppText>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13.5, lineHeight: 16 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  // Mockup: display:flex;align-items:center;gap:10px
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10 },
});
