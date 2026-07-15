import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import { AppText, LoadingScreen, ErrorState, CustomModal, PrimaryButton, OutlineButton } from '../../src/components';
import { spacing, gradients, dashboardAccents } from '../../src/constants/theme';
import { queryKeys } from '../../src/constants/queryKeys';
import { useGroupDetail } from '../../src/features/group/useGroupDetail';
import { useGroupOverview } from '../../src/features/group/useGroupOverview';
import { GroupOverallStatCard } from '../../src/features/group/GroupOverallStatCard';
import { GroupSiblingsSection } from '../../src/features/group/GroupSiblingsSection';
import EnrollActivitySheet from '../../src/features/group/EnrollActivitySheet';
import ParentGroupPickerSheet from '../../src/features/group/ParentGroupPickerSheet';
import TransferCoordinatorSheet from '../../src/features/group/TransferCoordinatorSheet';
import GroupIncomingRequestsSection from '../../src/features/group/GroupIncomingRequestsSection';
import groupService from '../../src/features/group/groupService';
import type { GroupRankingRow } from '../../src/types';

const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

// Mockup frames 13 (coordinator view) & 15 (member view). Two real backend
// gaps live in the coordinator body — request-parent-group approval flow
// and activity enroll-group — neither has an endpoint yet (see
// ADMIN_REDESIGN.md §6), so both render disabled with the same soft-amber
// "not available yet" treatment used elsewhere in the app instead of
// pretending they work or showing fabricated pending-request data.
export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'leave' | 'delete' | null>(null);
  const [enrollSheetOpen, setEnrollSheetOpen] = useState(false);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);

  const {
    group,
    isLoading,
    loadError,
    refetchGroup,
    isQrLoading,
    qrInviteCode,
    qrImage,
    handleShareCode,
    isUpdating,
    handleUpdateGroup,
    isRemovingMember,
    handleRemoveMember,
    isLeaving,
    handleLeaveGroup,
    isDeleting,
    handleDeleteGroup,
  } = useGroupDetail(id);

  const hasParent = !!group?.parentGroup;
  const { overview, isOverviewLoading, siblings, isSiblingsLoading } = useGroupOverview(id, hasParent);

  // Shares its cache key with ParentGroupPickerSheet's own query (same id,
  // search='') so opening the sheet doesn't re-fetch — just to know whether
  // to show "pending approval" on the trigger row itself.
  const isOwnerForQuery = group?.members?.find((m) => m.user?.id === user?.id)?.role === 'OWNER';
  const parentCandidatesQuery = useQuery({
    queryKey: queryKeys.groups.parentCandidates(id, ''),
    queryFn: async () => {
      const res = await groupService.getParentCandidates(id);
      if (!res.success) throw new Error('Failed to load candidate groups');
      return res.data;
    },
    enabled: isOwnerForQuery,
  });
  const hasPendingParentRequest = !!parentCandidatesQuery.data?.pendingRequestId;

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

  if (isLoading) return <LoadingScreen message={t('common.loading')} />;

  if (loadError || !group) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState title={t('common.error')} message={loadError || t('common.noData')} onRetry={refetchGroup} />
      </View>
    );
  }

  const currentUserRole = group.members?.find((m) => m.user?.id === user?.id)?.role;
  const isOwner = currentUserRole === 'OWNER';
  const coordinator = group.members?.find((m) => m.role === 'OWNER');
  const eligibleTransferMembers = (group.members ?? []).filter((m) => m.role === 'MEMBER');
  const avatarBg = dashboardAccents.avatarMuted[isDark ? 'dark' : 'light'];
  const avatarFg = isDark ? '#fff' : colors.textPrimary;

  const openSettings = () => {
    setEditName(group.name);
    setEditDesc(group.description ?? '');
    setSettingsOpen(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
      const res = await handleUpdateGroup(editName, editDesc);
      if (res?.success) {
        showToast(t('groups.groupUpdated'), 'success');
        setSettingsOpen(false);
      } else {
        showToast(res?.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      const res = await handleRemoveMember(removeTarget.id);
      if (res?.success) {
        showToast(t('groups.memberRemoved'), 'success');
        setRemoveTarget(null);
      } else {
        showToast(res?.message || t('common.error'), 'error');
      }
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const confirmLeaveOrDelete = async () => {
    try {
      const res = confirmAction === 'delete' ? await handleDeleteGroup() : await handleLeaveGroup();
      if (!res?.success) showToast(res?.message || t('common.error'), 'error');
      // On success the hook navigates away — no need to close the modal.
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (settingsOpen ? setSettingsOpen(false) : router.back())}
            style={[styles.chip, { backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="chevron-back" size={14} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {group.name}
            </AppText>
            <AppText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('groups.memberCountLabel', { count: group.members?.length ?? 0 })}
            </AppText>
          </View>
          {isOwner && (
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coordBadge}>
              <AppText style={{ fontSize: 10, lineHeight: 12, fontWeight: '700' as any, color: colors.onPrimary }}>
                {t('groups.coordinatorBadge')}
              </AppText>
            </LinearGradient>
          )}
          {isOwner && (
            <TouchableOpacity
              onPress={openSettings}
              style={[styles.chip, { backgroundColor: colors.inputBackground }]}
            >
              <Ionicons name="settings-outline" size={15} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {settingsOpen ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="body-bold" style={[styles.settingsTitle, { color: colors.textPrimary }]}>
            {t('groups.groupSettings')}
          </AppText>

          <View>
            <AppText style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('groups.groupName')}</AppText>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.inputBox, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
            />
          </View>
          <View>
            <AppText style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('groups.groupDescription')}</AppText>
            <TextInput
              value={editDesc}
              onChangeText={setEditDesc}
              multiline
              textAlignVertical="top"
              style={[styles.inputBox, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
            />
          </View>

          <TouchableOpacity onPress={handleSave} disabled={isUpdating || !editName.trim()}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtn}>
              <AppText style={{ fontWeight: '700' as any, fontSize: 14, color: colors.onPrimary }}>
                {isUpdating ? t('common.loading') : t('common.save')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.dangerZone, { borderTopColor: colors.divider }]}>
            <AppText style={[styles.dangerWarning, { color: colors.textSecondary }]}>
              {t('groups.confirmDeleteGroup', { name: group.name })}
            </AppText>
            <TouchableOpacity
              onPress={() => setConfirmAction('delete')}
              style={[styles.dangerBtn, { backgroundColor: colors.error + '1A' }]}
            >
              <AppText style={{ fontWeight: '700' as any, fontSize: 14, color: colors.error }}>
                {t('groups.deleteGroup')}
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isOwner && (
            <View style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.qrBox, { backgroundColor: colors.inputBackground }]}>
                {qrImage ? (
                  <Image source={{ uri: qrImage }} style={styles.qrImage} resizeMode="contain" />
                ) : isQrLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="qr-code-outline" size={56} color={colors.primary} />
                )}
              </View>
              <View style={[styles.codeBox, { backgroundColor: colors.inputBackground }]}>
                <AppText style={[styles.codeText, { color: colors.textSecondary }]}>
                  {qrInviteCode ?? '——'}
                </AppText>
              </View>
              <TouchableOpacity onPress={handleShareCode} style={{ width: '100%' }}>
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shareBtn}>
                  <AppText style={{ fontWeight: '700' as any, fontSize: 13, color: colors.onPrimary }}>
                    {t('groups.shareInviteLink')}
                  </AppText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {isOwner && (
            <View style={styles.section}>
              <AppText variant="body-bold" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('groups.membersCount', { count: group.members?.length ?? 0 })}
              </AppText>
              {(group.members ?? []).map((m) => (
                <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.memberAvatar, { backgroundColor: avatarBg }]}>
                    <AppText variant="body-bold" style={[styles.memberAvatarText, { color: avatarFg }]}>
                      {initials(m.user?.fullName)}
                    </AppText>
                  </View>
                  <AppText variant="body-medium" style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {m.user?.fullName}
                  </AppText>
                  {m.role !== 'OWNER' && m.user && (
                    <TouchableOpacity
                      onPress={() => setRemoveTarget({ id: m.user!.id, name: m.user!.fullName })}
                      style={[styles.removeChip, { backgroundColor: colors.inputBackground }]}
                    >
                      <AppText style={{ fontSize: 13, lineHeight: 15, color: colors.textSecondary }}>✕</AppText>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {isOwner && <GroupIncomingRequestsSection groupId={id} />}

          {isOwner && (
            <TouchableOpacity onPress={() => setParentPickerOpen(true)}>
              <View
                style={[
                  styles.gapRow,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <AppText style={[styles.gapRowText, { color: colors.textPrimary }]}>
                  {t('groups.requestParentGroup')}
                </AppText>
                {hasPendingParentRequest ? (
                  <View style={[styles.gapBadge, { backgroundColor: colors.warning + '1F' }]}>
                    <AppText style={{ fontSize: 10.5, lineHeight: 13, fontWeight: '700' as any, color: colors.warning }}>
                      {t('groups.pendingApproval')}
                    </AppText>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                )}
              </View>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity onPress={() => setTransferSheetOpen(true)}>
              <View style={[styles.gapRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <AppText style={[styles.gapRowText, { color: colors.textPrimary }]}>
                  {t('groups.transferCoordinatorTitle')}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity onPress={() => setEnrollSheetOpen(true)}>
              <View style={[styles.enrollBtn, { backgroundColor: colors.textPrimary }]}>
                <AppText style={{ fontWeight: '700' as any, fontSize: 13.5, color: colors.background }}>
                  {t('groups.enrollGroupIntoActivity')}
                </AppText>
              </View>
            </TouchableOpacity>
          )}

          {!isOwner && (
            <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <AppText variant="body-bold" style={[styles.descTitle, { color: colors.textPrimary }]}>
                {t('groups.groupDetailsTitle')}
              </AppText>
              <AppText style={[styles.descText, { color: colors.textSecondary }]}>
                {group.description || t('groups.noDescription')}
              </AppText>
              <View style={styles.descInfoRow}>
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.descInfoLabel, { color: colors.textSecondary }]}>
                    {t('groups.coordinatorLabel')}
                  </AppText>
                  <AppText variant="body-bold" style={[styles.descInfoValue, { color: colors.textPrimary }]}>
                    {coordinator?.user?.fullName ?? '-'}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.descInfoLabel, { color: colors.textSecondary }]}>
                    {t('groups.parentGroupLabel')}
                  </AppText>
                  <AppText variant="body-bold" style={[styles.descInfoValue, { color: colors.textPrimary }]}>
                    {group.parentGroup?.name ?? t('groups.parentGroupNone')}
                  </AppText>
                </View>
              </View>
            </View>
          )}

          <GroupOverallStatCard stats={overview?.overallStats ?? null} isLoading={isOverviewLoading} />

          <View style={styles.section}>
            <AppText variant="body-bold" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('groups.memberRanking')}
            </AppText>
            {ranking.map((row) => (
              <View key={row.id} style={[styles.rankRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <AppText variant="body-bold" style={[styles.rankNum, { color: colors.textSecondary }]}>
                  {row.rank}
                </AppText>
                <AppText variant="body-medium" style={[styles.rankName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {row.fullName}
                </AppText>
                <AppText variant="heading-bold" style={[styles.rankSteps, { color: colors.textPrimary }]}>
                  {(row.steps ?? row.points ?? 0).toLocaleString()}
                </AppText>
              </View>
            ))}
          </View>

          {hasParent && <GroupSiblingsSection siblings={siblings} isLoading={isSiblingsLoading} />}

          <TouchableOpacity
            onPress={() => setConfirmAction('leave')}
            style={[styles.leaveBtn, { backgroundColor: colors.inputBackground }]}
          >
            <AppText style={{ fontWeight: '700' as any, fontSize: 13.5, color: colors.error }}>
              {t('groups.leaveGroup')}
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      )}

      <CustomModal
        visible={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={t('groups.membersCount', { count: group.members?.length ?? 0 })}
        description={removeTarget ? t('groups.confirmRemoveMember', { name: removeTarget.name }) : undefined}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setRemoveTarget(null)} disabled={isRemovingMember} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isRemovingMember ? t('common.loading') : t('common.confirm')}
              onPress={confirmRemoveMember}
              disabled={isRemovingMember}
              style={{ backgroundColor: colors.error }}
            />
          </View>
        </View>
      </CustomModal>

      <CustomModal
        visible={confirmAction != null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'delete' ? t('groups.deleteGroup') : t('groups.leaveGroup')}
        description={
          confirmAction === 'delete'
            ? t('groups.confirmDeleteGroup', { name: group.name })
            : t('groups.confirmLeaveGroup', { name: group.name })
        }
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton
              title={t('common.cancel')}
              onPress={() => setConfirmAction(null)}
              disabled={isLeaving || isDeleting}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isLeaving || isDeleting ? t('common.loading') : t('common.confirm')}
              onPress={confirmLeaveOrDelete}
              disabled={isLeaving || isDeleting}
              style={{ backgroundColor: colors.error }}
            />
          </View>
        </View>
      </CustomModal>

      <EnrollActivitySheet
        visible={enrollSheetOpen}
        onClose={() => setEnrollSheetOpen(false)}
        groupId={id}
        groupName={group.name}
        memberCount={group.members?.length ?? 0}
      />

      <ParentGroupPickerSheet
        visible={parentPickerOpen}
        onClose={() => setParentPickerOpen(false)}
        groupId={id}
        groupName={group.name}
        memberCount={group.members?.length ?? 0}
      />

      <TransferCoordinatorSheet
        visible={transferSheetOpen}
        onClose={() => setTransferSheetOpen(false)}
        groupId={id}
        members={eligibleTransferMembers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 6,
  },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSubtitle: { fontSize: 11, lineHeight: 13, marginTop: 1 },
  coordBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, lineHeight: 17 },

  // Settings panel
  settingsTitle: { fontSize: 15, lineHeight: 18 },
  fieldLabel: { fontSize: 12, lineHeight: 15, fontWeight: '700' as any, marginBottom: 6 },
  inputBox: { borderRadius: 16, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14 },
  textArea: { minHeight: 80, fontSize: 13 },
  saveBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
  dangerZone: { borderTopWidth: 1, paddingTop: 16, gap: spacing.sm },
  dangerWarning: { fontSize: 11.5, lineHeight: 15 },
  dangerBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16 },

  // Invite card
  inviteCard: { alignItems: 'center', gap: 10, padding: 16, borderRadius: 20, borderWidth: 1 },
  qrBox: { width: 110, height: 110, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: 90, height: 90 },
  codeBox: { width: '100%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' },
  codeText: { fontSize: 11, lineHeight: 14, fontFamily: 'monospace' },
  shareBtn: { alignItems: 'center', paddingVertical: 11, borderRadius: 14 },

  // Members list
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 11 },
  memberAvatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 11, lineHeight: 13 },
  memberName: { flex: 1, fontSize: 13, lineHeight: 15 },
  removeChip: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  // Backend-gap rows
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  gapRowText: { flex: 1, fontSize: 12.5, lineHeight: 16, fontWeight: '600' as any },
  gapBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  enrollBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 16 },

  // Description card (member view)
  descCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: spacing.sm },
  descTitle: { fontSize: 13.5, lineHeight: 16 },
  descText: { fontSize: 12.5, lineHeight: 18 },
  descInfoRow: { flexDirection: 'row', gap: spacing.lg, marginTop: 2 },
  descInfoLabel: { fontSize: 10.5, lineHeight: 13 },
  descInfoValue: { fontSize: 12.5, lineHeight: 15, marginTop: 2 },

  // Ranking
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 18, borderWidth: 1, padding: 11 },
  rankNum: { width: 14, textAlign: 'center', fontSize: 13, lineHeight: 15 },
  rankName: { flex: 1, fontSize: 13, lineHeight: 15 },
  rankSteps: { fontSize: 13, lineHeight: 15 },

  leaveBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 16, marginTop: spacing.xs },
});
