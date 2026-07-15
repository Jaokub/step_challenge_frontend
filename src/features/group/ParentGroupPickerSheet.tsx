import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText, BottomSheet, SearchBar } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { spacing } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import groupService from './groupService';

interface ParentGroupPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  memberCount: number;
}

// Mockup frame 14 — search candidate parent groups, "ขอเข้าร่วม" sends a
// parent-request that the target group's coordinator (or an admin) must
// approve. Phase 5.1: candidates are no longer restricted to root groups —
// the backend excludes only this group itself and its own descendants
// (would cycle); the remaining MAX_GROUP_DEPTH cap is enforced at submit
// time (a 400 surfaces via the toast if picking a candidate would make the
// tree too deep).
export default function ParentGroupPickerSheet({
  visible,
  onClose,
  groupId,
  groupName,
  memberCount,
}: ParentGroupPickerSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');

  const candidatesQuery = useQuery({
    queryKey: queryKeys.groups.parentCandidates(groupId, search.trim()),
    queryFn: async () => {
      const res = await groupService.getParentCandidates(groupId, search.trim() || undefined);
      if (!res.success) throw new Error('Failed to load candidate groups');
      return res.data;
    },
    enabled: visible,
  });

  const candidates = candidatesQuery.data?.candidates ?? [];
  const hasPending = candidates.some((c) => c.requested);

  const requestMutation = useMutation({
    mutationFn: (parentGroupId: string) => groupService.requestParentGroup(groupId, parentGroupId),
  });

  const handleRequest = async (parentGroupId: string) => {
    try {
      const res = await requestMutation.mutateAsync(parentGroupId);
      if (res.success) {
        showToast(t('groups.parentRequestSent'), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.parentCandidates(groupId, search.trim()) });
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
          {t('groups.selectParentGroup')}
        </AppText>
        <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {groupName} · {t('groups.memberCountLabel', { count: memberCount })}
        </AppText>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder={t('groups.searchGroupPlaceholder')} />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          {candidates.length === 0 && !candidatesQuery.isPending && (
            <AppText style={[styles.empty, { color: colors.textSecondary }]}>
              {t('groups.noParentCandidates')}
            </AppText>
          )}
          {candidates.map((g) => (
            <View key={g.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="body-bold" style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {g.name}
                </AppText>
                <AppText style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {t('groups.memberCountLabel', { count: g.memberCount })}
                </AppText>
              </View>
              {g.requested ? (
                <View style={[styles.pill, { backgroundColor: colors.warning + '1F' }]}>
                  <AppText style={{ fontSize: 11.5, fontWeight: '700' as any, color: colors.warning }}>
                    {t('groups.pendingApproval')}
                  </AppText>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleRequest(g.id)}
                  disabled={hasPending || requestMutation.isPending}
                  style={[styles.pill, { backgroundColor: colors.primary, opacity: hasPending ? 0.4 : 1 }]}
                >
                  <AppText style={{ fontSize: 11.5, fontWeight: '700' as any, color: colors.onPrimary }}>
                    {t('groups.requestToJoin')}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <AppText style={[styles.note, { color: colors.textPrimary, backgroundColor: colors.primary + '14' }]}>
        {t('groups.parentRequestNote')}
      </AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, lineHeight: 20 },
  subtitle: { fontSize: 12, lineHeight: 15, marginTop: 2 },
  list: { maxHeight: 280 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  // Mockup: gap:12px;border-radius:16px;padding:11px 13px
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
  // Mockup: padding:6px 13px;border-radius:10px
  pill: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 10, flexShrink: 0 },
  // Mockup: border-radius:16px;padding:13px 14px
  note: { fontSize: 12.5, lineHeight: 18, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14 },
});
