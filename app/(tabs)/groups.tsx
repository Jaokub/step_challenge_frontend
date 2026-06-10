import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TextInput, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, GroupCard, PrimaryButton, LoadingScreen, ScreenHeader, HeaderIconButton, CustomModal, AppText } from '../../src/components';
import { spacing, fontSize, borderRadius } from '../../src/constants/theme';
import groupService from '../../src/features/group/services/groupService';
import friendService, { FriendRequest } from '../../src/features/friend/services/friendService';
import { AppGroup, User } from '../../src/types';

export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeSegment, setActiveSegment] = useState<'FRIENDS' | 'GROUPS'>('FRIENDS');

  // Groups State
  const [groups, setGroups] = useState<AppGroup[]>([]);
  const [modalType, setModalType] = useState<'NONE' | 'CREATE' | 'JOIN' | 'REQUESTS'>('NONE');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Friends State
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (activeSegment === 'GROUPS') {
        const res = await groupService.getGroups();
        if (res.success) setGroups(res.data);
      } else {
        const [friendsRes, requestsRes] = await Promise.all([
          friendService.getFriendsList(),
          friendService.getPendingRequests()
        ]);
        if (friendsRes.success) setFriends(friendsRes.data);
        if (requestsRes.success) setRequests(requestsRes.data);
      }
    } catch (error: any) {
      console.warn('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeSegment]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [activeSegment, fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Group Handlers
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await groupService.createGroup(groupName.trim(), groupDesc.trim());
      if (res.success) {
        setModalType('NONE');
        setGroupName('');
        setGroupDesc('');
        handleRefresh();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await groupService.joinGroup(inviteCode.trim());
      if (res.success) {
        setModalType('NONE');
        setInviteCode('');
        handleRefresh();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Friend Handlers
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      handleRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await friendService.removeFriend(friendId);
          handleRefresh();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }}
    ]);
  };

  const handleRejectRequest = async (friendId: string) => {
    try {
      await friendService.removeFriend(friendId);
      handleRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Renders
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
    <View style={[styles.friendCard, { backgroundColor: colors.card }]}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={24} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <AppText variant="heading-sm" style={{ color: colors.textPrimary }}>
            {item.nickname || item.fullName}
          </AppText>
          <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
            {item.department}
          </AppText>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.iconBtn, { backgroundColor: colors.error + '20' }]} 
        onPress={() => handleRemoveFriend(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderRequestCard = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1 }]}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          {item.user.avatarUrl ? (
            <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={24} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <AppText variant="heading-sm" style={{ color: colors.textPrimary }}>
            {item.user.nickname || item.user.fullName}
          </AppText>
          <AppText style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' }}>
            Wants to be friends
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.success + '20' }]} 
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={20} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.error + '20' }]} 
          onPress={() => handleRejectRequest(item.user.id)}
        >
          <Ionicons name="close" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader 
          title="เพื่อนและกลุ่ม"
          rightActions={
            activeSegment === 'GROUPS' ? (
              <>
                <HeaderIconButton icon="enter-outline" onPress={() => setModalType('JOIN')} iconColor={colors.primary} />
                <HeaderIconButton icon="add" onPress={() => setModalType('CREATE')} backgroundColor={colors.primary} iconColor={'#FFFFFF'} />
              </>
            ) : (
              <HeaderIconButton icon="qr-code-outline" onPress={() => router.push('/(tabs)/scan')} iconColor={colors.primary} />
            )
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
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title={t('groups.noGroups')} subtitle="" />}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            requests.length > 0 ? (
              <TouchableOpacity 
                style={styles.requestBanner}
                onPress={() => setModalType('REQUESTS')}
              >
                <View style={styles.badgeContainer}>
                  <Ionicons name="people-circle" size={40} color={colors.primary} />
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <AppText style={styles.badgeText}>{requests.length}</AppText>
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <AppText variant="heading-sm" style={{ color: colors.textPrimary }}>Friend Requests</AppText>
                  <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Tap to view pending requests</AppText>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="person-add-outline" title="No Friends Yet" subtitle="Scan a QR code or share your link to add friends" />}
        />
      )}

      {/* Modals for Groups */}
      <CustomModal visible={modalType === 'CREATE'} onClose={() => setModalType('NONE')} title={t('groups.createGroup')}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.groupName')}
          placeholderTextColor={colors.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
          style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.groupDescription')}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          value={groupDesc}
          onChangeText={setGroupDesc}
        />
        <PrimaryButton title={isSubmitting ? t('common.loading') : t('groups.createGroup')} onPress={handleCreateGroup} disabled={isSubmitting || !groupName.trim()} />
      </CustomModal>

      <CustomModal visible={modalType === 'JOIN'} onClose={() => setModalType('NONE')} title={t('groups.joinGroup')} description={t('groups.enterInviteCode')}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.inviteCode')}
          placeholderTextColor={colors.textSecondary}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton title={isSubmitting ? t('common.loading') : t('groups.joinGroup')} onPress={handleJoinGroup} disabled={isSubmitting || !inviteCode.trim()} />
      </CustomModal>

      <CustomModal visible={modalType === 'REQUESTS'} onClose={() => setModalType('NONE')} title="Friend Requests">
        {requests.map(req => (
          <View key={req.id}>{renderRequestCard({ item: req })}</View>
        ))}
      </CustomModal>
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
  sectionTitle: {
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginTop: spacing.xl,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: fontSize.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
