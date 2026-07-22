import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, TimeframeSelector } from '../../src/components';
import { spacing } from '../../src/constants/theme';

import { useFriends } from '../../src/features/friend/useFriends';
import leaderboardService from '../../src/features/leaderboard/leaderboardService';
import { queryKeys } from '../../src/constants/queryKeys';
import { FriendCard, EmptyMemberSlot } from '../../src/features/friend/FriendCard';
import { Podium, LeaderboardMember } from '../../src/features/friend/Podium';
import { RankSummaryCard } from '../../src/features/friend/RankSummaryCard';
import { FriendsHeaderSection } from '../../src/features/friend/FriendsHeaderSection';
import NotificationsPanel from '../../src/features/friend/NotificationsPanel';
import AddFriendSheet from '../../src/features/friend/AddFriendSheet';
import { useTimeframeNav } from '../../src/hooks/useTimeframeNav';
import { calculateDateRange } from '../../src/features/dashboard/dateRangeCalculator';

const getInitials = (name: string): string =>
  name.split(' ').map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2);

// Friends tab (split out of the old combined Friends & Groups screen — see
// app/(tabs)/groups.tsx for the My Groups list, which now owns the Groups
// tab). Friends rank by step count via /leaderboard/friends, which includes
// the current user and sorts by steps.
export default function FriendsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [showRequests, setShowRequests] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const {
    requests,
    isRefreshing,
    handleRefresh,
    handleAcceptRequest,
    handleRejectRequest,
  } = useFriends(true);

  // Daily/Weekly/Monthly browsing, same unit as the home dashboard.
  const timeframeNav = useTimeframeNav('Daily');
  const { timeframe, anchorDate } = timeframeNav;
  const { startDate, endDate } = calculateDateRange(timeframe, anchorDate);

  const { data: friendsLbData, isLoading: isLoadingFriendsLb } = useQuery({
    queryKey: queryKeys.leaderboard.scoped('friends', startDate, endDate),
    queryFn: async () => {
      const res = await leaderboardService.getFriendsLeaderboard({ startDate, endDate });
      return (res?.data ?? []) as Array<{ id: string; fullName: string; steps?: number; distance?: number; calories?: number; rank: number }>;
    },
  });

  const friendsLeaderboard: LeaderboardMember[] = useMemo(
    () =>
      (friendsLbData ?? []).map((u) => ({
        id: u.id,
        rank: u.rank,
        name: u.fullName,
        avatar: getInitials(u.fullName),
        steps: u.steps ?? 0,
        distanceKm: u.distance,
        calories: u.calories,
        isMe: u.id === user?.id,
      })),
    [friendsLbData, user]
  );

  const myEntry = friendsLeaderboard.find((m) => m.isMe);
  const topThree = friendsLeaderboard.slice(0, 3);
  const rest = friendsLeaderboard.slice(3);

  const renderHeader = () => (
    <>
      <FriendsHeaderSection
        requestsCount={requests.length}
        onOpenRequests={() => setShowRequests(true)}
        onOpenAddFriend={() => setShowAddFriend(true)}
      />
      <TimeframeSelector {...timeframeNav} />
      <RankSummaryCard rank={myEntry?.rank} steps={myEntry?.steps} isLoading={isLoadingFriendsLb} />
      <Podium topThree={topThree} isLoading={isLoadingFriendsLb} />
    </>
  );

  // Fewer than 4 friends — no rank-4 row exists, so show one greyed-out
  // placeholder slot instead of just cutting the list short.
  const showEmptySlot = !isLoadingFriendsLb && friendsLeaderboard.length > 0 && friendsLeaderboard.length < 4;

  const renderFooter = () => {
    if (isLoadingFriendsLb || !showEmptySlot) return null;
    return (
      <View style={styles.cardContainer}>
        <EmptyMemberSlot rank={4} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={isLoadingFriendsLb ? ([1, 2, 3, 4] as any) : rest}
          keyExtractor={(item, index) => (isLoadingFriendsLb ? index.toString() : item.id)}
          // Pass already-rendered elements, not function references — see
          // the note this pattern was extracted from in the old combined
          // groups.tsx (FlatList treats a function prop here as a component
          // *type*, and a fresh arrow function every render forces a full
          // unmount/remount of the header).
          ListHeaderComponent={renderHeader()}
          ListFooterComponent={renderFooter()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            !isLoadingFriendsLb && friendsLeaderboard.length === 0 ? (
              <EmptyState icon="people-outline" title={t('groups.noData')} />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <FriendCard isLoading={isLoadingFriendsLb} member={isLoadingFriendsLb ? undefined : item} />
            </View>
          )}
        />
      </SafeAreaView>

      <NotificationsPanel
        visible={showRequests}
        onClose={() => setShowRequests(false)}
        requests={requests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
      />

      <AddFriendSheet visible={showAddFriend} onClose={() => setShowAddFriend(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: {
    paddingBottom: spacing['4xl'],
  },
  cardContainer: {
    paddingHorizontal: spacing.xl,
  },
});
