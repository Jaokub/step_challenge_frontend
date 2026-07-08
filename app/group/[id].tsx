import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { AppText, LoadingScreen, EmptyState, PrimaryButton, OutlineButton, LeaderboardItem } from '../../src/components';
import { spacing, borderRadius, fontSize } from '../../src/constants/theme';
import { useGroupDetail } from '../../src/features/group/useGroupDetail';
import { useGroupOverview } from '../../src/features/group/useGroupOverview';
import { GroupQrModal } from '../../src/features/group/GroupQrModal';
import { GroupOverviewSection } from '../../src/features/group/GroupOverviewSection';
import { GroupSiblingsSection } from '../../src/features/group/GroupSiblingsSection';
import { GroupDescendantsSection } from '../../src/features/group/GroupDescendantsSection';
import { GroupRankingRow } from '../../src/types';

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

  const hasParent = !!group?.parentGroup;
  const hasChildren = (group?.childGroups?.length ?? 0) > 0;
  const { overview, isOverviewLoading, siblings, isSiblingsLoading } = useGroupOverview(id, hasParent);

  // Own full ranking; while it's loading, derive a same-shaped fallback from
  // the already-fetched member list so the screen doesn't flash empty.
  const fallbackRanking: GroupRankingRow[] = (group?.members ?? [])
    .slice()
    .sort((a, b) => (b.user?.totalPoints ?? 0) - (a.user?.totalPoints ?? 0))
    .map((m, idx) => ({
      id: m.user?.id ?? m.id,
      fullName: m.user?.fullName ?? 'User',
      department: m.user?.department ?? '-',
      avatarUrl: m.user?.avatarUrl,
      totalPoints: m.user?.totalPoints ?? 0,
      points: m.user?.totalPoints ?? 0,
      rank: idx + 1,
    }));
  const ranking = overview?.ranking ?? fallbackRanking;

  const renderMember = ({ item }: { item: GroupRankingRow }) => (
    <LeaderboardItem
      rank={item.rank}
      user={{ fullName: item.fullName, department: item.department, avatarUrl: item.avatarUrl ?? undefined, totalPoints: item.points }}
      isCurrentUser={item.id === user?.id}
    />
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
        data={ranking}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
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

            {hasChildren && <GroupDescendantsSection childGroups={group.childGroups ?? []} />}
            {hasParent && <GroupSiblingsSection siblings={siblings} isLoading={isSiblingsLoading} />}

            <GroupOverviewSection
              overallStats={overview?.overallStats ?? null}
              top3={overview?.top3 ?? []}
              isLoading={isOverviewLoading}
              currentUserId={user?.id}
            />
          </>
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
});
