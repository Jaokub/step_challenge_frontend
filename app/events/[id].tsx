import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import { AppText, Skeleton, PrimaryButton, CustomModal, GradientText } from '../../src/components';
import { spacing, borderRadius, layout, fontSize, gradients } from '../../src/constants/theme';
import { useEventDetail, useEventLeaderboard } from '../../src/features/event/useEvents';
import { useGroups } from '../../src/features/group/useGroups';
import EventRankingList from '../../src/features/event/EventRankingList';
import type { EventScope } from '../../src/types';

export default function EventDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id);

  const [scope, setScope] = useState<EventScope>('individual');
  const [joinModal, setJoinModal] = useState(false);

  const { event, stats, isLoading, isStatsLoading, joinIndividual, joinGroup, leave, isMutating } =
    useEventDetail(eventId);
  const { leaderboard, isLoading: isBoardLoading } = useEventLeaderboard(eventId, scope);
  const { groups } = useGroups(joinModal);

  const handleIndividual = async () => {
    setJoinModal(false);
    try {
      await joinIndividual.mutateAsync();
      showToast(t('events.joinedIndividual'), 'success');
    } catch (e: any) {
      showToast(e?.message || t('events.joinFailed'), 'error');
    }
  };

  const handleGroup = async (groupId: string) => {
    setJoinModal(false);
    try {
      const res = await joinGroup.mutateAsync(groupId);
      showToast(t('events.joinedGroup', { count: res.data?.added ?? 0 }), 'success');
    } catch (e: any) {
      showToast(e?.message || t('events.joinFailed'), 'error');
    }
  };

  const handleLeave = async () => {
    try {
      await leave.mutateAsync();
      showToast(t('events.left'), 'success');
    } catch (e: any) {
      showToast(e?.message || t('events.joinFailed'), 'error');
    }
  };

  const scopes: EventScope[] = ['individual', 'group'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText numberOfLines={1} variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {event?.title ?? t('events.title')}
          </AppText>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event-wide stats — mockup frame 5: mint gradient hero card with a
              gradient-filled step count, never a plain white card. */}
          <LinearGradient
            colors={gradients.mint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderColor: colors.primary + '2E' }]}
          >
            <AppText style={[styles.statLabel, { color: colors.primary }]}>{t('events.totalSteps')}</AppText>
            {isStatsLoading ? (
              <Skeleton width={140} height={34} borderRadius={borderRadius.sm} />
            ) : (
              <GradientText colors={gradients.statValue} variant="heading-bold" style={styles.statValue}>
                {(stats?.totalSteps ?? 0).toLocaleString()}
              </GradientText>
            )}
            <View style={styles.statRow}>
              <AppText style={[styles.statSub, { color: colors.primary }]}>
                {t('events.participants', { count: stats?.participantCount ?? 0 })}
              </AppText>
              <AppText style={[styles.statSub, { color: colors.primary }]}>
                {t('events.groups', { count: stats?.groupCount ?? 0 })}
              </AppText>
            </View>
          </LinearGradient>

          {/* Join / Leave */}
          {isLoading ? (
            <Skeleton width="100%" height={52} borderRadius={borderRadius.lg} />
          ) : event?.joined ? (
            <TouchableOpacity
              onPress={handleLeave}
              disabled={isMutating}
              style={[styles.leaveBtn, { borderColor: colors.cardBorder }]}
            >
              <AppText style={{ color: colors.textSecondary }}>{t('events.leave')}</AppText>
            </TouchableOpacity>
          ) : (
            <PrimaryButton title={t('events.join')} icon="add" loading={isMutating} onPress={() => setJoinModal(true)} />
          )}

          {/* Scope toggle */}
          <View style={[styles.tabs, { backgroundColor: colors.inputBackground }]}>
            {scopes.map((s) => {
              const active = scope === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setScope(s)}
                  style={[styles.tab, active && { backgroundColor: colors.card }]}
                >
                  <AppText style={{ color: active ? colors.textPrimary : colors.textSecondary, fontSize: fontSize.sm }}>
                    {t(`events.scope.${s}`)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <EventRankingList
            scope={scope}
            ranking={leaderboard?.ranking ?? []}
            isLoading={isBoardLoading}
            colors={colors}
            currentUserId={user?.id}
          />
        </ScrollView>
      </SafeAreaView>

      <CustomModal visible={joinModal} onClose={() => setJoinModal(false)} title={t('events.joinTitle')}>
        <TouchableOpacity style={[styles.option, { borderColor: colors.cardBorder }]} onPress={handleIndividual}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          <AppText style={{ color: colors.textPrimary }}>{t('events.joinAsIndividual')}</AppText>
        </TouchableOpacity>

        {groups.length > 0 && (
          <AppText style={[styles.optionHint, { color: colors.textSecondary }]}>{t('events.joinAsGroupHint')}</AppText>
        )}
        {groups.map((g) => (
          <TouchableOpacity key={g.id} style={[styles.option, { borderColor: colors.cardBorder }]} onPress={() => handleGroup(g.id)}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <AppText numberOfLines={1} style={{ color: colors.textPrimary, flex: 1 }}>{g.name}</AppText>
          </TouchableOpacity>
        ))}
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingX,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg },
  content: { paddingHorizontal: layout.screenPaddingX, paddingBottom: spacing['4xl'], gap: layout.sectionGap },
  statCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.xl, gap: spacing.xs },
  statLabel: { fontSize: fontSize.sm },
  statValue: { fontSize: fontSize['3xl'] },
  statRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  statSub: { fontSize: fontSize.sm },
  leaveBtn: { borderWidth: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  tabs: { flexDirection: 'row', borderRadius: borderRadius.full, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  optionHint: { fontSize: fontSize.xs, marginTop: spacing.lg },
});
