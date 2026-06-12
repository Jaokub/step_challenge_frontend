import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, GroupCard, ScreenHeader, HeaderIconButton, AppText } from '../../src/components';
import { spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { AppGroup, User } from '../../src/types';

import { useFriends } from '../../src/features/friend/hooks/useFriends';
import { useGroups } from '../../src/features/group/hooks/useGroups';
import { FriendCard } from '../../src/features/friend/components/FriendCard';
import { GroupActionModals, ModalType } from '../../src/features/group/components/GroupActionModals';

export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeSegment, setActiveSegment] = useState<'FRIENDS' | 'GROUPS'>('FRIENDS');
  const [modalType, setModalType] = useState<ModalType>('NONE');

  const {
    friends,
    requests,
    isRefreshing: isRefreshingFriends,
    handleRefresh: handleRefreshFriends,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend
  } = useFriends(activeSegment === 'FRIENDS');

  const {
    groups,
    isRefreshing: isRefreshingGroups,
    isSubmitting,
    handleRefresh: handleRefreshGroups,
    handleCreateGroup,
    handleJoinGroup
  } = useGroups(activeSegment === 'GROUPS');

  const renderGroupCard = ({ item }: { item: AppGroup }) => {
    const memberRole = item.members?.find(m => m.userId === user?.id)?.role;
    return (
      <GroupCard
        group={{
          id: item.id,
          name: item.name,
          memberCount: item.members?.length || 0,
          role: memberRole === 'OWNER' ? 'ADMIN' : undefined
        }}
        onPress={() => router.push(`/group/${item.id}`)}
      />
    );
  };

  const renderFriendCard = ({ item }: { item: User }) => (
    <FriendCard friend={item} onRemove={handleRemoveFriend} />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader 
          title="เพื่อนและกลุ่ม"
          rightActions={
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => setModalType('REQUESTS')} 
                style={styles.iconBtnHeader}
              >
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                {requests.length > 0 && (
                  <View style={styles.headerBadge}>
                    <AppText style={styles.headerBadgeText}>{requests.length}</AppText>
                  </View>
                )}
              </TouchableOpacity>
              <HeaderIconButton icon="enter-outline" onPress={() => setModalType('JOIN')} iconColor={colors.primary} />
              <HeaderIconButton icon="add" onPress={() => setModalType('CREATE')} backgroundColor={colors.primary} iconColor={'#FFFFFF'} />
            </View>
          }
        />
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'FRIENDS' && { backgroundColor: colors.primary }]} 
            onPress={() => setActiveSegment('FRIENDS')}
          >
            <AppText style={[styles.segmentText, activeSegment === 'FRIENDS' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              Friends
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'GROUPS' && { backgroundColor: colors.primary }]} 
            onPress={() => setActiveSegment('GROUPS')}
          >
            <AppText style={[styles.segmentText, activeSegment === 'GROUPS' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              Groups
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {activeSegment === 'GROUPS' ? (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshingGroups} onRefresh={handleRefreshGroups} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title={t('groups.noGroups')} subtitle="" />}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshingFriends} onRefresh={handleRefreshFriends} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="person-add-outline" title="No Friends Yet" subtitle="Scan a QR code or share your link to add friends" />}
        />
      )}

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
  safeArea: { paddingBottom: 0 },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  segmentText: {
    fontSize: fontSize.md,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.md,
  },
  iconBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  }
});
