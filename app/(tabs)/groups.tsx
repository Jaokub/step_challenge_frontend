import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, AppText, Skeleton, ScreenHeader } from '../../src/components';
import { spacing, borderRadius } from '../../src/constants/theme';
import { User } from '../../src/types';

import { useFriends } from '../../src/features/friend/useFriends';
import { useGroups } from '../../src/features/group/useGroups';
import { FriendCard } from '../../src/features/friend/FriendCard';
import { Podium, LeaderboardMember } from '../../src/features/friend/Podium';
import { RankSummaryCard } from '../../src/features/friend/RankSummaryCard';
import { GroupActionModals, ModalType } from '../../src/features/group/GroupActionModals';
import { GroupHeaderSection } from '../../src/features/group/GroupHeaderSection';
import { GroupQrModal } from '../../src/features/group/GroupQrModal';
import groupService from '../../src/features/group/groupService';

// helper: deterministic number from string id
const hashId = (id: string, mod: number) =>
  Math.abs(id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)) % mod;

// Helper to convert User to LeaderboardMember for demo purposes
const mapUserToLeaderboardMember = (u: User, index: number, isMe: boolean, t: any): LeaderboardMember => ({
  id: u.id,
  rank: index + 1,
  name: u.nickname || u.fullName,
  avatar: u.avatarUrl ? 'IMG' : (u.nickname || u.fullName).substring(0, 2).toUpperCase(),
  steps: u.stats?.totalActivities ? u.stats.totalActivities * 1000 : hashId(u.id, 10000),
  calories: hashId(u.id + 'cal', 1000),
  distance: Number((hashId(u.id + 'dist', 100) / 10).toFixed(1)),
  points: u.totalPoints,
  isMe,
  lastActive: t('groups.yesterday')
});

export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>('friends');
  const [modalType, setModalType] = useState<ModalType>('NONE');
  const [qrGroupId, setQrGroupId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrInviteCode, setQrInviteCode] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const {
    friends,
    requests,
    isLoading: isLoadingFriends,
    isRefreshing: isRefreshingFriends,
    handleRefresh: handleRefreshFriends,
    handleAcceptRequest,
    handleRejectRequest,
  } = useFriends(true);

  const {
    groups,
    groupMembers,
    isLoading: isLoadingGroups,
    isRefreshing: isRefreshingGroups,
    isSubmitting,
    handleRefresh: handleRefreshGroups,
    handleCreateGroup,
    handleJoinGroup,
    fetchGroupMembers
  } = useGroups(true);

  const handleShowGroupInvite = async (groupId: string) => {
    setQrGroupId(groupId);
    setShowQrModal(true);
    try {
      const res = await groupService.getGroupQRCode(groupId);
      if (res.success) {
        setQrInviteCode(res.data.inviteCode);
        setQrImage(res.data.qrCode);
      }
    } catch (e) {
      console.warn('Failed to fetch QR code', e);
    }
  };

  const handleShareInvite = async () => {
    if (!qrInviteCode) return;
    try {
      await Share.share({
        message: qrInviteCode,
      });
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  const isGroupTab = activeTab !== 'friends' && activeTab !== 'myGroups';
  const isMyGroupsTab = activeTab === 'myGroups';
  const isLoadingData = isGroupTab 
    ? (isLoadingGroups || !groupMembers[activeTab]) 
    : isLoadingFriends;

  React.useEffect(() => {
    if (isGroupTab && activeTab !== 'myGroups') {
      fetchGroupMembers(activeTab);
    }
  }, [activeTab, isGroupTab, fetchGroupMembers]);

  const currentGroup = isGroupTab ? groups.find(g => g.id === activeTab) : null;
  const accentColor = isGroupTab ? '#00e5ff' : isMyGroupsTab ? '#00e5ff' : '#b0f237'; // Mock color

  // Prepare leaderboard data
  const rawList = isGroupTab 
    ? (groupMembers[activeTab] || []).map(m => m.user).filter(Boolean) as User[]
    : isMyGroupsTab
      ? Object.values(groupMembers).flat().map(m => m.user).filter(Boolean) as User[]
      : [...friends, user].filter(Boolean) as User[];
  
  const leaderboard: LeaderboardMember[] = rawList.map((u, i) => mapUserToLeaderboardMember(u, i, u.id === user?.id, t))
    .sort((a, b) => b.points - a.points)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const myEntry = leaderboard.find(m => m.isMe);
  const totalCount = leaderboard.length;
  const topThree = leaderboard.slice(0, Math.min(3, totalCount));
  const rest = totalCount > 3 ? leaderboard.slice(3) : [];

  const renderHeader = () => (
    <GroupHeaderSection
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      groups={groups}
      requestsCount={requests.length}
      setModalType={setModalType}
      handleShowGroupInvite={handleShowGroupInvite}
      isLoadingData={isLoadingData}
      myEntry={myEntry}
      topThree={topThree}
      isGroupTab={isGroupTab}
      accentColor={accentColor}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={isLoadingData ? ([1, 2, 3, 4] as any) : rest}
          keyExtractor={(item, index) => isLoadingData ? index.toString() : item.id}
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
            (!isLoadingData && !isRefreshingGroups && !isRefreshingFriends && leaderboard.length === 0) ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 }}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <AppText style={{ color: colors.textSecondary, marginTop: 16 }}>{t('groups.noData')}</AppText>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardContainer}>
              {isLoadingData ? (
                <Skeleton height={70} borderRadius={16} style={{ marginBottom: spacing.md }} />
              ) : (
                <FriendCard 
                  member={item} 
                  accentColor={accentColor} 
                  isLast={index === rest.length - 1} 
                />
              )}
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

      <GroupQrModal
        visible={showQrModal}
        onClose={() => { setShowQrModal(false); setQrInviteCode(null); setQrImage(null); }}
        qrImage={qrImage}
        qrInviteCode={qrInviteCode}
        onShare={handleShareInvite} 
        colors={colors as any}
      />
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
  }
});
