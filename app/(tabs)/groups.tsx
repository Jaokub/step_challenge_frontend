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

// Helper to convert User to LeaderboardMember for demo purposes
const mapUserToLeaderboardMember = (u: User, index: number, isMe: boolean): LeaderboardMember => ({
  id: u.id,
  rank: index + 1,
  name: u.nickname || u.fullName,
  avatar: u.avatarUrl ? 'IMG' : (u.nickname || u.fullName).substring(0, 2).toUpperCase(),
  steps: u.stats?.totalActivities ? u.stats.totalActivities * 1000 : Math.floor(Math.random() * 10000),
  calories: Math.floor(Math.random() * 1000),
  distance: Number((Math.random() * 10).toFixed(1)),
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
  } = useFriends(activeTab === 'friends');

  const {
    groups,
    isRefreshing: isRefreshingGroups,
    isSubmitting,
    handleRefresh: handleRefreshGroups,
    handleCreateGroup,
    handleJoinGroup
  } = useGroups(activeTab !== 'friends');

  const isGroupTab = activeTab !== 'friends';
  const currentGroup = isGroupTab ? groups.find(g => g.id === activeTab) : null;
  const accentColor = isGroupTab ? '#00e5ff' : '#b0f237'; // Mock color

  // Prepare leaderboard data
  const rawList = isGroupTab ? [] : friends; // For simplicity, only friends have mock members right now, but let's mock groups if needed
  // In real app, `currentGroup.members` would be used.
  
  let leaderboard: LeaderboardMember[] = rawList.map((u, i) => mapUserToLeaderboardMember(u, i, u.id === user?.id))
    .sort((a, b) => b.points - a.points)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  // If leaderboard is empty, insert some mock data to show the design
  if (leaderboard.length === 0) {
    leaderboard = [
      { id: '1', rank: 1, name: 'สมชาย ใจดี', avatar: 'SC', steps: 12540, calories: 980, distance: 9.2, points: 2840, isMe: false, lastActive: '2 ชม. ที่แล้ว' },
      { id: '2', rank: 2, name: 'อรอนงค์', avatar: 'AN', steps: 8432, calories: 623, distance: 6.2, points: 1920, isMe: true, lastActive: 'ออนไลน์' },
      { id: '3', rank: 3, name: 'วิภา รักกีฬา', avatar: 'WP', steps: 7890, calories: 590, distance: 5.8, points: 1780, isMe: false, lastActive: '3 ชม. ที่แล้ว' },
      { id: '4', rank: 4, name: 'ธนา วิ่งเร็ว', avatar: 'TW', steps: 6210, calories: 480, distance: 4.6, points: 1450, isMe: false, lastActive: 'เมื่อวาน' },
    ];
  }

  const myEntry = leaderboard.find(m => m.isMe);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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
              onRefresh={isGroupTab ? handleRefreshGroups : handleRefreshFriends} 
              tintColor={colors.primary} 
            />
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
