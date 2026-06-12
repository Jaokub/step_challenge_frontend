import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, AppText } from '../../src/components';
import { spacing, borderRadius } from '../../src/constants/theme';
import { User } from '../../src/types';

import { useFriends } from '../../src/features/friend/hooks/useFriends';
import { useGroups } from '../../src/features/group/hooks/useGroups';
import { FriendCard } from '../../src/features/friend/components/FriendCard';
import { Podium, LeaderboardMember } from '../../src/features/friend/components/Podium';
import { RankSummaryCard } from '../../src/features/friend/components/RankSummaryCard';
import { GroupActionModals, ModalType } from '../../src/features/group/components/GroupActionModals';

// helper: deterministic number from string id
const hashId = (id: string, mod: number) =>
  Math.abs(id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)) % mod;

// Helper to convert User to LeaderboardMember for demo purposes
const mapUserToLeaderboardMember = (u: User, index: number, isMe: boolean): LeaderboardMember => ({
  id: u.id,
  rank: index + 1,
  name: u.nickname || u.fullName,
  avatar: u.avatarUrl ? 'IMG' : (u.nickname || u.fullName).substring(0, 2).toUpperCase(),
  steps: u.stats?.totalActivities ? u.stats.totalActivities * 1000 : hashId(u.id, 10000),
  calories: hashId(u.id + 'cal', 1000),
  distance: Number((hashId(u.id + 'dist', 100) / 10).toFixed(1)),
  points: u.totalPoints,
  isMe,
  lastActive: 'เมื่อวาน'
});

export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>('friends');
  const [modalType, setModalType] = useState<ModalType>('NONE');

  const {
    friends,
    requests,
    isRefreshing: isRefreshingFriends,
    handleRefresh: handleRefreshFriends,
    handleAcceptRequest,
    handleRejectRequest,
  } = useFriends(true);

  const {
    groups,
    groupMembers,
    isRefreshing: isRefreshingGroups,
    isSubmitting,
    handleRefresh: handleRefreshGroups,
    handleCreateGroup,
    handleJoinGroup,
    fetchGroupMembers
  } = useGroups(true);

  const isGroupTab = activeTab !== 'friends';

  React.useEffect(() => {
    if (isGroupTab) {
      fetchGroupMembers(activeTab);
    }
  }, [activeTab, isGroupTab, fetchGroupMembers]);

  const currentGroup = isGroupTab ? groups.find(g => g.id === activeTab) : null;
  const accentColor = isGroupTab ? '#00e5ff' : '#b0f237'; // Mock color

  // Prepare leaderboard data
  const rawList = isGroupTab 
    ? (groupMembers[activeTab] || []).map(m => m.user).filter(Boolean) as User[]
    : friends;
  
  const leaderboard: LeaderboardMember[] = rawList.map((u, i) => mapUserToLeaderboardMember(u, i, u.id === user?.id))
    .sort((a, b) => b.points - a.points)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const myEntry = leaderboard.find(m => m.isMe);
  const totalCount = leaderboard.length;
  const topThree = leaderboard.slice(0, Math.min(3, totalCount));
  const rest = totalCount > 3 ? leaderboard.slice(3) : [];

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>เพื่อนและกลุ่ม</AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setModalType('REQUESTS')} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {requests.length > 0 && (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{requests.length}</AppText>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalType('JOIN')} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="person-add-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'friends' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.divider }
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <AppText style={[styles.tabText, activeTab === 'friends' ? { color: '#fff' } : { color: colors.textPrimary }]}>
              เพื่อน
            </AppText>
          </TouchableOpacity>
          {groups.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.tabPill,
                activeTab === g.id ? { backgroundColor: accentColor, borderColor: accentColor } : { backgroundColor: colors.card, borderColor: colors.divider }
              ]}
              onPress={() => setActiveTab(g.id)}
            >
              <AppText style={[styles.tabText, activeTab === g.id ? { color: '#fff' } : { color: colors.textPrimary }]}>
                {g.name}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {myEntry && <RankSummaryCard member={myEntry} accentColor={accentColor} isGroupTab={isGroupTab} />}
      <Podium topThree={topThree} accentColor={accentColor} />
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={rest}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={isGroupTab ? isRefreshingGroups : isRefreshingFriends} 
              onRefresh={async () => {
                if (isGroupTab) {
                  handleRefreshGroups();
                  await fetchGroupMembers(activeTab, true);
                } else {
                  handleRefreshFriends();
                }
              }}
              tintColor={colors.primary} 
            />
          }
          ListEmptyComponent={
            (!isRefreshingGroups && !isRefreshingFriends && leaderboard.length === 0) ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 }}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <AppText style={{ color: colors.textSecondary, marginTop: 16 }}>ไม่มีข้อมูลในขณะนี้</AppText>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardContainer}>
              <FriendCard 
                member={item} 
                accentColor={accentColor} 
                isLast={index === rest.length - 1} 
              />
            </View>
          )}
        />
      </SafeAreaView>

      <GroupActionModals 
        modalType={modalType}
        onClose={() => setModalType('NONE')}
        isSubmitting={isSubmitting}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
        requests={requests}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: spacing['4xl'],
  },
  cardContainer: {
    paddingHorizontal: spacing.xl,
  }
});
