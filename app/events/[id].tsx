import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { AppText, Skeleton, GradientText, ScreenHeader } from '../../src/components';
import { spacing, borderRadius, layout, fontSize, gradients, dashboardAccents } from '../../src/constants/theme';
import { useEventDetail, useEventLeaderboard } from '../../src/features/event/useEvents';
import EventRankingList from '../../src/features/event/EventRankingList';
import type { EventScope } from '../../src/types';

// Mockup frame 5 has no join/leave affordance at all: reaching this screen
// already implies membership (join happens elsewhere, e.g. the events list),
// and an admin viewing it is staff overseeing the event, not a runner who'd
// join. So this screen is read-only — stats + tabs + ranking, nothing else.
export default function EventDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id);

  const [scope, setScope] = useState<EventScope>('individual');

  const { event, stats, isStatsLoading } = useEventDetail(eventId);
  const { leaderboard, isLoading: isBoardLoading } = useEventLeaderboard(eventId, scope);

  const scopes: EventScope[] = ['individual', 'group'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Mockup frame 5 header: left-aligned back chip + title + monospace
            path caption underneath — same pattern as the admin screens, not
            the centered-title/bare-chevron header this used to have. */}
        <ScreenHeader
          title={event?.title ?? t('events.title')}
          titleSize={16}
          pathSubtitle={`/events/${eventId}`}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/events'))}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event-wide stats — mockup frame 5: mint gradient hero card with a
              gradient-filled step count, never a plain white card. */}
          <LinearGradient
            colors={gradients.mint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderColor: colors.primary + '2E' }]}
          >
            <AppText style={[styles.statLabel, { color: dashboardAccents.mintCardLabel }]}>{t('events.totalSteps')}</AppText>
            {isStatsLoading ? (
              <Skeleton width={140} height={34} borderRadius={borderRadius.sm} />
            ) : (
              <GradientText colors={gradients.statValue} variant="heading-bold" style={styles.statValue}>
                {(stats?.totalSteps ?? 0).toLocaleString()}
              </GradientText>
            )}
            <View style={styles.statRow}>
              <AppText style={[styles.statSub, { color: dashboardAccents.mintCardLabel }]}>
                {t('events.participants', { count: stats?.participantCount ?? 0 })}
              </AppText>
              <AppText style={[styles.statSub, { color: dashboardAccents.mintCardLabel }]}>
                {t('events.groups', { count: stats?.groupCount ?? 0 })}
              </AppText>
            </View>
          </LinearGradient>

          {/* Scope toggle — mockup's activePill is the brand gradient, not a
              flat card-color fill. */}
          <View style={[styles.tabs, { backgroundColor: colors.inputBackground }]}>
            {scopes.map((s) => {
              const active = scope === s;
              return (
                <TouchableOpacity key={s} onPress={() => setScope(s)} style={styles.tabTouchable}>
                  {active ? (
                    <LinearGradient
                      colors={gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.tab}
                    >
                      <AppText style={{ color: colors.onPrimary, fontSize: fontSize.sm, fontWeight: '700' as any }}>
                        {t(`events.scope.${s}`)}
                      </AppText>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tab}>
                      <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' as any }}>
                        {t(`events.scope.${s}`)}
                      </AppText>
                    </View>
                  )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: layout.screenPaddingX, paddingBottom: spacing['4xl'], gap: layout.sectionGap },
  statCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.xl, gap: spacing.xs },
  statLabel: { fontSize: fontSize.sm },
  statValue: { fontSize: fontSize['3xl'] },
  statRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  statSub: { fontSize: fontSize.sm },
  tabs: { flexDirection: 'row', borderRadius: borderRadius.full, padding: 5, gap: 4 }, // mockup frame 5 tab-track
  tabTouchable: { flex: 1 },
  tab: { alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.full },
});
