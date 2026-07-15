import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, AppText, CustomModal } from '../../src/components';
import { spacing, borderRadius } from '../../src/constants/theme';

import { useFriends } from '../../src/features/friend/useFriends';
import { useGroups } from '../../src/features/group/useGroups';
import { useGroupOverview } from '../../src/features/group/useGroupOverview';
import { FriendCard, EmptyMemberSlot } from '../../src/features/friend/FriendCard';
import { Podium, LeaderboardMember } from '../../src/features/friend/Podium';
import { RankSummaryCard } from '../../src/features/friend/RankSummaryCard';
import { GroupHeaderSection } from '../../src/features/group/GroupHeaderSection';
import { RequestCard } from '../../src/features/friend/RequestCard';

const getInitials = (name: string): string =>
  name.split(' ').map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2);

// Mockup frame 10 "Friends & Groups". Rebuilt on real data only: friends
// rank by real totalPoints (no steps source for friends yet, so those
// fields are simply omitted rather than faked); group tabs pull the real
// group-overview endpoint (steps/calories/distance/points + full ranking).
export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('friends');
  const [showRequests, setShowRequests] = useState(false);

  const {
    friends,
    requests,
    isLoading: isLoadingFriends,
    isRefreshing: isRefreshingFriends,
    handleRefresh: handleRefreshFriends,
    handleAcceptRequest,
    handleRejectRequest,
  } = useFriends(true);

  const { groups, isRefreshing: isRefreshingGroups, handleRefresh: handleRefreshGroups } = useGroups(true);

  const isGroupTab = activeTab !== 'friends';
  const { overview, isOverviewLoading } = useGroupOverview(isGroupTab ? activeTab : '');

  const friendsLeaderboard: LeaderboardMember[] = useMemo(() => {
    const rows = [...friends, user].filter(Boolean) as typeof friends;
    return rows
      .slice()
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((u, i) => ({
        id: u.id,
        rank: i + 1,
        name: u.nickname || u.fullName,
        avatar: getInitials(u.nickname || u.fullName),
        points: u.totalPoints,
        isMe: u.id === user?.id,
      }));
  }, [friends, user]);

  const groupLeaderboard: LeaderboardMember[] = useMemo(
    () =>
      (overview?.ranking ?? []).map((row) => ({
        id: row.id,
        rank: row.rank,
        name: row.fullName,
        avatar: getInitials(row.fullName),
        points: row.points,
        steps: row.steps,
        distanceKm: row.distance,
        isMe: row.id === user?.id,
      })),
    [overview, user]
  );

  const leaderboard = isGroupTab ? groupLeaderboard : friendsLeaderboard;
  const isLoadingData = isGroupTab ? isOverviewLoading : isLoadingFriends;

  const myEntry = leaderboard.find((m) => m.isMe);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const renderHeader = () => (
    <>
      <GroupHeaderSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        groups={groups}
        requestsCount={requests.length}
        onOpenRequests={() => setShowRequests(true)}
      />
      <RankSummaryCard
        rank={myEntry?.rank}
        totalPoints={myEntry?.points}
        isLoading={isLoadingData}
        label={isGroupTab ? t('groups.rankInGroup') : undefined}
      />
      <Podium topThree={topThree} isLoading={isLoadingData} />
    </>
  );

  // Fewer than 4 real members/friends — no rank-4 row exists, so show one
  // greyed-out placeholder slot instead of just cutting the list short.
  // Applies to both tabs, not just groups.
  const showEmptySlot = !isLoadingData && leaderboard.length > 0 && leaderboard.length < 4;

  const renderFooter = () => {
    if (isLoadingData) return null;
    return (
      <>
        {showEmptySlot && (
          <View style={styles.cardContainer}>
            <EmptyMemberSlot rank={4} />
          </View>
        )}
        {isGroupTab && (
          <TouchableOpacity
            style={[styles.viewGroupBtn, { backgroundColor: colors.textPrimary }]}
            onPress={() => router.push(`/group/${activeTab}`)}
          >
            <AppText style={{ color: colors.background, fontWeight: '700' as any, fontSize: 13.5 }}>
              {t('groups.viewGroupDetail')}
            </AppText>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={isLoadingData ? ([1, 2, 3, 4] as any) : rest}
          keyExtractor={(item, index) => (isLoadingData ? index.toString() : item.id)}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isGroupTab ? isRefreshingGroups : isRefreshingFriends}
              onRefresh={() => (isGroupTab ? handleRefreshGroups() : handleRefreshFriends())}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoadingData && leaderboard.length === 0 ? (
              <EmptyState icon="people-outline" title={t('groups.noData')} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardContainer}>
              <FriendCard isLoading={isLoadingData} member={isLoadingData ? undefined : item} />
            </View>
          )}
        />
      </SafeAreaView>

      <CustomModal visible={showRequests} onClose={() => setShowRequests(false)} title={t('groups.friendRequests')}>
        {requests.length === 0 ? (
          <AppText style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }}>
            {t('groups.noData')}
          </AppText>
        ) : (
          requests.map((req) => (
            <RequestCard key={req.id} request={req} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
          ))
        )}
      </CustomModal>
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
  viewGroupBtn: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    paddingVertical: 13,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
