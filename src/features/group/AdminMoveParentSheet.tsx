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

interface AdminMoveParentSheetProps {
  visible: boolean;
  onClose: () => void;
  child: { id: string; name: string } | null;
}

// Admin god-mode "ย้ายกลุ่มแม่" — reassigns a group's parent directly (no
// request/approve flow, unlike the coordinator picker), reusing the same
// candidates endpoint the coordinator sheet uses (BUILD_PLAN.md Phase 5).
export default function AdminMoveParentSheet({ visible, onClose, child }: AdminMoveParentSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const candidatesQuery = useQuery({
    queryKey: queryKeys.groups.parentCandidates(child?.id ?? '', search.trim()),
    queryFn: async () => {
      const res = await groupService.getParentCandidates(child!.id, search.trim() || undefined);
      if (!res.success) throw new Error('Failed to load candidate groups');
      return res.data;
    },
    enabled: visible && !!child,
  });
  const candidates = candidatesQuery.data?.candidates ?? [];

  const moveMutation = useMutation({
    mutationFn: (parentGroupId: string) => groupService.setParentGroup(child!.id, parentGroupId),
  });

  const handleMove = async (parentGroupId: string) => {
    try {
      const res = await moveMutation.mutateAsync(parentGroupId);
      if (res.success) {
        showToast(t('admin.groupMoved'), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.adminTree });
        setSearch('');
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
          {t('admin.moveParentTitle')}
        </AppText>
        {child && (
          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>{child.name}</AppText>
        )}
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
            <TouchableOpacity
              key={g.id}
              onPress={() => handleMove(g.id)}
              disabled={moveMutation.isPending}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="body-bold" style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {g.name}
                </AppText>
                <AppText style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {t('groups.memberCountLabel', { count: g.memberCount })}
                </AppText>
              </View>
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
  // Matches the coordinator picker's candidate row (mockup frame 14): gap:12px;border-radius:16px;padding:11px 13px
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 16, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 13 },
  rowTitle: { fontSize: 13.5, lineHeight: 16 },
  rowMeta: { fontSize: 11, lineHeight: 14, marginTop: 2 },
});
