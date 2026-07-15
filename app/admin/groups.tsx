import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../src/contexts/ToastContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
  AppText,
  ScreenHeader,
  LoadingScreen,
  ErrorState,
  EmptyState,
  CustomModal,
  PrimaryButton,
  OutlineButton,
} from '../../src/components';
import { spacing } from '../../src/constants/theme';
import { useAdminGroups } from '../../src/features/group/useAdminGroups';
import AdminGroupTreeCard from '../../src/features/group/AdminGroupTreeCard';
import AdminMoveParentSheet from '../../src/features/group/AdminMoveParentSheet';
import AdminReassignCoordinatorSheet from '../../src/features/group/AdminReassignCoordinatorSheet';
import type { AdminGroupTreeNode } from '../../src/types';

type ChildRef = { id: string; name: string };
type ConfirmAction = { type: 'detach' | 'delete'; child: ChildRef } | null;

// Mockup frame 6 — Faculty Admin's god-mode view of every group. Reuses
// the coordinator-facing endpoints under the hood (BUILD_PLAN.md Phase 5):
// the global-role bypass in groupAuth.js's requireGroupMember is what lets
// an admin who isn't a member of a given group still move/detach/delete it
// or override-approve a pending request.
export default function AdminGroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const {
    trees,
    isLoading,
    loadError,
    refetch,
    moveParent,
    deleteGroup,
    isDeleting,
    approveRequest,
    isResolvingRequest,
  } = useAdminGroups();

  const [moveTarget, setMoveTarget] = useState<ChildRef | null>(null);
  const [coordTarget, setCoordTarget] = useState<ChildRef | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleDetach = (child: ChildRef) => setConfirmAction({ type: 'detach', child });
  const handleDelete = (child: ChildRef) => setConfirmAction({ type: 'delete', child });

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'detach') {
        const res = await moveParent({ groupId: confirmAction.child.id, parentGroupId: null });
        showToast(res.success ? t('admin.groupDetached') : res.message || t('common.error'), res.success ? 'success' : 'error');
      } else {
        const res = await deleteGroup(confirmAction.child.id);
        showToast(res.success ? t('admin.groupDeleted') : res.message || t('common.error'), res.success ? 'success' : 'error');
      }
      setConfirmAction(null);
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  const handleOverrideApprove = async (child: AdminGroupTreeNode, parentId: string) => {
    if (!child.pendingRequestId) return;
    try {
      const res = await approveRequest({ parentGroupId: parentId, requestId: child.pendingRequestId });
      showToast(res.success ? t('groups.requestApproved') : res.message || t('common.error'), res.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.navGroupsTitle')}
          titleSize={20}
          pathSubtitle="/admin/groups"
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
        />
      </SafeAreaView>

      <View style={styles.bannerWrap}>
        <View style={[styles.banner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning + '40' }]}>
          <AppText style={{ fontSize: 11, lineHeight: 16.5, color: colors.warning }}>
            {t('admin.groupsBanner')}
          </AppText>
        </View>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : loadError ? (
        <ErrorState title={t('common.error')} message={loadError} onRetry={refetch} />
      ) : trees.length === 0 ? (
        <EmptyState icon="people" title={t('admin.noGroupsTitle')} subtitle={t('admin.noGroupsSubtitle')} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {trees.map((tree) => (
            <AdminGroupTreeCard
              key={tree.id}
              tree={tree}
              busy={isDeleting || isResolvingRequest}
              onMoveParent={setMoveTarget}
              onDetach={handleDetach}
              onReassignCoordinator={setCoordTarget}
              onDelete={handleDelete}
              onOverrideApprove={(child, parentId) => handleOverrideApprove(child, parentId)}
            />
          ))}
        </ScrollView>
      )}

      <AdminMoveParentSheet visible={!!moveTarget} onClose={() => setMoveTarget(null)} child={moveTarget} />
      <AdminReassignCoordinatorSheet visible={!!coordTarget} onClose={() => setCoordTarget(null)} group={coordTarget} />

      <CustomModal
        visible={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'delete' ? t('admin.actionDeleteGroup') : t('admin.actionDetachParent')}
        description={
          confirmAction?.type === 'delete'
            ? t('groups.confirmDeleteGroup', { name: confirmAction.child.name })
            : confirmAction
            ? t('admin.confirmDetach', { name: confirmAction.child.name })
            : undefined
        }
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <OutlineButton title={t('common.cancel')} onPress={() => setConfirmAction(null)} disabled={isDeleting} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isDeleting ? t('common.loading') : t('common.confirm')}
              onPress={handleConfirm}
              disabled={isDeleting}
              style={confirmAction?.type === 'delete' ? { backgroundColor: colors.error } : undefined}
            />
          </View>
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  // Mockup: border-radius:14px;padding:11px 13px
  banner: { borderRadius: 14, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 13 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.lg },
});
