import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText, BottomSheet, SearchBar } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { spacing, gradients } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import activityService from '../activity/activityService';
import { formatDate } from '../../utils/formatDate';
import type { Activity } from '../../types';

interface EnrollActivitySheetProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  memberCount: number;
}

// Mockup frame 16 — pick an open activity, confirm, POST enroll-group.
// Registration only: enrolling awards no points, members still check in
// individually via QR to earn theirs (BUILD_PLAN.md Phase 4).
export default function EnrollActivitySheet({
  visible,
  onClose,
  groupId,
  groupName,
  memberCount,
}: EnrollActivitySheetProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activitiesQuery = useQuery({
    queryKey: queryKeys.activities.list('open-for-enroll'),
    queryFn: async () => {
      const res = await activityService.getActivities({ limit: 50 });
      if (!res.success) throw new Error('Failed to load activities');
      return res.data.activities;
    },
    enabled: visible,
  });

  const openActivities: Activity[] = (activitiesQuery.data ?? []).filter(
    (a) => a.status === 'UPCOMING' || a.status === 'ONGOING',
  );
  const filtered = openActivities.filter((a) =>
    a.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const enrollMutation = useMutation({
    mutationFn: (activityId: string) => activityService.enrollGroupIntoActivity(activityId, groupId),
  });

  const handleConfirm = async () => {
    if (!selectedId) return;
    try {
      const res = await enrollMutation.mutateAsync(selectedId);
      if (res.success) {
        showToast(t('activity.enrolledGroupToast', { count: res.data.added }), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(selectedId) });
        setSelectedId(null);
        setSearch('');
        onClose();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setSearch('');
    onClose();
  };

  const dateRange = (a: Activity) =>
    `${formatDate(a.startDate, i18n.language)} – ${formatDate(a.endDate, i18n.language)}`;

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View>
        <AppText variant="heading-bold" style={[styles.title, { color: colors.textPrimary }]}>
          {t('groups.enrollGroupIntoActivity')}
        </AppText>
        <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {groupName} · {t('groups.memberCountLabel', { count: memberCount })}
        </AppText>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('groups.searchActivityPlaceholder')}
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          {filtered.length === 0 && !activitiesQuery.isPending && (
            <AppText style={[styles.empty, { color: colors.textSecondary }]}>
              {t('groups.noOpenActivities')}
            </AppText>
          )}
          {filtered.map((a) => {
            const selected = a.id === selectedId;
            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => setSelectedId((prev) => (prev === a.id ? null : a.id))}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="body-bold" style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {a.title}
                  </AppText>
                  <AppText style={[styles.rowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {a.location} · {dateRange(a)}
                  </AppText>
                </View>
                {selected ? (
                  <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
                    <AppText style={{ fontSize: 11.5, fontWeight: '700' as any, color: colors.onPrimary }}>
                      {t('groups.selectChip')}
                    </AppText>
                  </LinearGradient>
                ) : (
                  <View style={[styles.pill, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                    <AppText style={{ fontSize: 11.5, fontWeight: '700' as any, color: colors.textPrimary }}>
                      {t('groups.selectChip')}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <AppText style={[styles.note, { color: colors.textPrimary, backgroundColor: colors.primary + '14' }]}>
        {t('groups.enrollNote', { count: memberCount })}
      </AppText>

      <TouchableOpacity onPress={handleConfirm} disabled={!selectedId || enrollMutation.isPending}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.confirmBtn, { opacity: !selectedId || enrollMutation.isPending ? 0.5 : 1 }]}
        >
          <AppText style={{ fontWeight: '700' as any, fontSize: 14, color: colors.onPrimary }}>
            {enrollMutation.isPending ? t('common.loading') : t('groups.confirmEnrollButton')}
          </AppText>
        </LinearGradient>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, lineHeight: 20 },
  subtitle: { fontSize: 12, lineHeight: 15, marginTop: 2 },
  list: { maxHeight: 260 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  rowTitle: { fontSize: 13.5, lineHeight: 16 },
  rowMeta: { fontSize: 11, lineHeight: 14, marginTop: 2 },
  pill: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 10, flexShrink: 0, borderWidth: 1, borderColor: 'transparent' },
  note: { fontSize: 12.5, lineHeight: 18, borderRadius: 16, padding: 14 },
  confirmBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 16 },
});
