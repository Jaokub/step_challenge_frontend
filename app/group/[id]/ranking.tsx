import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { AppText, EmptyState, TimeframeSelector } from '../../../src/components';
import { spacing, borderRadius } from '../../../src/constants/theme';
import { useGroups } from '../../../src/features/group/useGroups';
import { useGroupOverview } from '../../../src/features/group/useGroupOverview';
import { FriendCard, EmptyMemberSlot } from '../../../src/features/friend/FriendCard';
import { Podium, LeaderboardMember } from '../../../src/features/friend/Podium';
import { RankSummaryCard } from '../../../src/features/friend/RankSummaryCard';
import { useTimeframeNav } from '../../../src/hooks/useTimeframeNav';
import { calculateDateRange } from '../../../src/features/dashboard/dateRangeCalculator';

const getInitials = (name: string): string =>
  name.split(' ').map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2);

// Per-group podium/ranking page, reached from the Ranking button on each
// card in the Groups tab (app/(tabs)/groups.tsx). This is the same
// timeframe-scoped ranking view that used to live inline in the old
// combined Friends & Groups screen's group-tab state — now its own route so
// Groups can link straight to a group's ranking without detouring through
// Overview first.
export default function GroupRankingScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Pull the group name from the route param when it was passed in (see
  // groups.tsx), else fall back to the cached groups list.
  const { groups } = useGroups(!name);
  const groupName = name || groups.find((g) => g.id === id)?.name || '';

  const timeframeNav = useTimeframeNav('Daily');
  const { timeframe, anchorDate } = timeframeNav;
  const { startDate, endDate } = calculateDateRange(timeframe, anchorDate);

  const { overview, isOverviewLoading, refetchOverview } = useGroupOverview(id, startDate, endDate);

  const leaderboard: LeaderboardMember[] = useMemo(
    () =>
      (overview?.ranking ?? []).map((row) => ({
        id: row.id,
        rank: row.rank,
        name: row.fullName,
        avatar: getInitials(row.fullName),
        steps: row.steps ?? 0,
        distanceKm: row.distance,
        calories: row.calories,
        isMe: row.id === user?.id,
      })),
    [overview, user]
  );

  const myEntry = leaderboard.find((m) => m.isMe);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const showEmptySlot = !isOverviewLoading && leaderboard.length > 0 && leaderboard.length < 4;

  const renderHeader = () => (
    <>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/groups'))}
          style={[styles.chip, { backgroundColor: colors.inputBackground }]}
        >
          <Ionicons name="chevron-back" size={14} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {t('groups.rankingAction')}
          </AppText>
          {!!groupName && (
            <AppText style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {groupName}
            </AppText>
          )}
        </View>
      </View>

      <TimeframeSelector {...timeframeNav} />
      <RankSummaryCard rank={myEntry?.rank} steps={myEntry?.steps} isLoading={isOverviewLoading} label={t('groups.rankInGroup')} />
      <Podium topThree={topThree} isLoading={isOverviewLoading} />
    </>
  );

  const renderFooter = () => {
    if (isOverviewLoading) return null;
    return (
      <>
        {showEmptySlot && (
          <View style={styles.cardContainer}>
            <EmptyMemberSlot rank={4} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.viewOverviewBtn, { backgroundColor: colors.textPrimary }]}
          onPress={() => router.push(`/group/${id}`)}
        >
          <AppText style={{ color: colors.background, fontWeight: '700' as any, fontSize: 13.5 }}>
            {t('groups.overviewAction')}
          </AppText>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={isOverviewLoading ? ([1, 2, 3, 4] as any) : rest}
          keyExtractor={(item, index) => (isOverviewLoading ? index.toString() : item.id)}
          // Elements, not function refs — a fresh arrow function every render
          // would force a full header unmount/remount (see friends.tsx / the
          // old combined groups.tsx for the same note).
          ListHeaderComponent={renderHeader()}
          ListFooterComponent={renderFooter()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => refetchOverview()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            !isOverviewLoading && leaderboard.length === 0 ? (
              <EmptyState icon="people-outline" title={t('groups.noData')} />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <FriendCard isLoading={isOverviewLoading} member={isOverviewLoading ? undefined : item} />
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 6,
  },
  chip: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSubtitle: { fontSize: 11, lineHeight: 13, marginTop: 1 },
  listContent: { paddingBottom: spacing['4xl'] },
  cardContainer: { paddingHorizontal: spacing.xl },
  viewOverviewBtn: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    paddingVertical: 13,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
