import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { AppText, LoadingScreen, EmptyState, RoleBadge, PrimaryButton, OutlineButton } from '../../src/components';
import { spacing, borderRadius, fontSize } from '../../src/constants/theme';
import { useGroupDetail } from '../../src/features/group/useGroupDetail';
import { GroupQrModal } from '../../src/features/group/GroupQrModal';
import { GroupMember } from '../../src/types';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const {
    group,
    isLoading,
    isActionLoading,
    qrInviteCode,
    qrImage,
    showQrModal,
    setShowQrModal,
    handleShowQrCode,
    handleShareCode,
    handleLeaveGroup,
    handleDeleteGroup,
  } = useGroupDetail(id);

  const renderMember = ({ item }: { item: GroupMember }) => (
    <View style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.memberAvatar, { backgroundColor: colors.primaryLight + '30' }]}>
        <Ionicons name="person" size={20} color={colors.primary} />
      </View>
      <View style={styles.memberInfo}>
        <AppText variant="body-bold" style={[styles.memberName, { color: colors.textPrimary }]}>
          {item.user?.fullName || 'User'}
          {item.userId === user?.id ? ` (${t('leaderboard.you')})` : ''}
        </AppText>
        <AppText style={[styles.memberDept, { color: colors.textSecondary }]}>
          {item.user?.department || '-'}
        </AppText>
      </View>
      <RoleBadge role={item.role} />
    </View>
  );

  if (isLoading) return <LoadingScreen message={t('common.loading')} />;

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon="alert-circle-outline" title={t('common.error')} subtitle={t('common.noData')} />
      </View>
    );
  }

  const currentUserRole = group.members?.find(m => m.user?.id === user?.id)?.role;
  const isOwner = currentUserRole === 'OWNER';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {group.name}
        </AppText>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <FlatList
        data={group.members || []}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={[styles.groupInfoContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.groupIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="people" size={40} color={colors.primary} />
            </View>
            <AppText variant="heading-bold" style={[styles.groupName, { color: colors.textPrimary }]}>{group.name}</AppText>
            {group.description && (
              <AppText style={[styles.groupDesc, { color: colors.textSecondary }]}>{group.description}</AppText>
            )}
            <View style={styles.statsRow}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <AppText style={[styles.statsText, { color: colors.textSecondary }]}>
                {group.members?.length || 0} {t('common.members')}
              </AppText>
            </View>

            <View style={styles.actionContainer}>
              <PrimaryButton 
                title={t('groups.qrInvite')} 
                onPress={handleShowQrCode} 
                disabled={isActionLoading} 
                icon="qr-code-outline"
              />
              <View style={{height: spacing.sm}} />
              <OutlineButton 
                title={isOwner ? t('groups.deleteGroup') : t('groups.leaveGroup')} 
                onPress={isOwner ? handleDeleteGroup : handleLeaveGroup} 
                disabled={isActionLoading}
                color={colors.error}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title={t('common.noData')} subtitle="" />}
      />

      <GroupQrModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrImage={qrImage}
        qrInviteCode={qrInviteCode}
        onShare={handleShareCode}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  listContent: { padding: spacing.xl, paddingBottom: spacing['4xl'] },
  groupInfoContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  groupIconContainer: {
    width: 80, height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  groupName: { fontSize: 24, marginBottom: spacing.xs, textAlign: 'center' },
  groupDesc: { fontSize: 14, textAlign: 'center', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  statsText: { fontSize: 14, marginLeft: spacing.xs },
  actionContainer: { width: '100%' },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  memberAvatar: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, marginBottom: 2 },
  memberDept: { fontSize: 13 },
});
