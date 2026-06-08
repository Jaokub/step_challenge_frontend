import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState, GroupCard, PrimaryButton, LoadingScreen, ScreenHeader, HeaderIconButton, CustomModal } from '../../src/components';
import { spacing, fontSize, borderRadius } from '../../src/constants/theme';
import groupService from '../../src/features/group/services/groupService';
import { AppGroup } from '../../src/types';

export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [groups, setGroups] = useState<AppGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalType, setModalType] = useState<'NONE' | 'CREATE' | 'JOIN'>('NONE');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const res = await groupService.getGroups();
      if (res.success) {
        setGroups(res.data);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGroups();
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('common.error'), t('common.noData'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await groupService.createGroup(groupName.trim(), groupDesc.trim());
      if (res.success) {
        Alert.alert('Success', 'Group created successfully');
        setModalType('NONE');
        setGroupName('');
        setGroupDesc('');
        handleRefresh();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('groups.enterInviteCode'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await groupService.joinGroup(inviteCode.trim());
      if (res.success) {
        Alert.alert('Success', 'Joined group successfully');
        setModalType('NONE');
        setInviteCode('');
        handleRefresh();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupCard = ({ item }: { item: AppGroup }) => {
    const memberRole = item.members?.find(m => m.userId === user?.id)?.role;
    return (
      <GroupCard
        group={{
          id: item.id,
          name: item.name,
          memberCount: item.members?.length || 0,
          role: memberRole === 'OWNER' ? 'ADMIN' : undefined // Map internal OWNER to ADMIN badge for UI
        }}
        onPress={() => router.push(`/group/${item.id}`)}
      />
    );
  };

  if (isLoading) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader 
          title={t('groups.myGroups')}
          rightActions={
            <>
              <HeaderIconButton 
                icon="enter-outline" 
                onPress={() => setModalType('JOIN')} 
                iconColor={colors.primary} 
              />
              <HeaderIconButton 
                icon="add" 
                onPress={() => setModalType('CREATE')} 
                backgroundColor={colors.primary}
                borderColor={colors.primary}
                iconColor={'#FFFFFF'}
              />
            </>
          }
        />
      </SafeAreaView>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('groups.noGroups')}
            subtitle=""
          />
        }
      />

      {/* Modal สำหรับสร้างกลุ่ม */}
      <CustomModal
        visible={modalType === 'CREATE'}
        onClose={() => setModalType('NONE')}
        title={t('groups.createGroup')}
      >
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
        <PrimaryButton 
          title={isSubmitting ? t('common.loading') : t('groups.createGroup')} 
          onPress={handleCreateGroup} 
          disabled={isSubmitting || !groupName.trim()} 
        />
      </CustomModal>

      {/* Modal สำหรับเข้าร่วมกลุ่ม */}
      <CustomModal
        visible={modalType === 'JOIN'}
        onClose={() => setModalType('NONE')}
        title={t('groups.joinGroup')}
        description={t('groups.enterInviteCode')}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.inviteCode')}
          placeholderTextColor={colors.textSecondary}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton 
          title={isSubmitting ? t('common.loading') : t('groups.joinGroup')} 
          onPress={handleJoinGroup} 
          disabled={isSubmitting || !inviteCode.trim()} 
        />
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
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
});
