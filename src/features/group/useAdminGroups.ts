import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

// Data + mutations for /admin/groups (mockup frame 6, BUILD_PLAN.md Phase
// 5 "admin god-mode"). All four actions (move parent / detach / reassign
// coordinator / delete) plus override-approve reuse the same endpoints a
// coordinator would call — Faculty Admin passes through requireGroupMember
// via the global-role bypass in groupAuth.js, so there's no separate admin
// API surface to maintain here.
export function useAdminGroups() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const treeQuery = useQuery({
    queryKey: queryKeys.groups.adminTree,
    queryFn: async () => {
      const res = await groupService.getAdminGroupTree();
      if (!res.success) throw new Error(t('common.cannotLoadData'));
      return res.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.adminTree });
  };

  const setParentMutation = useMutation({
    mutationFn: ({ groupId, parentGroupId }: { groupId: string; parentGroupId: string | null }) =>
      groupService.setParentGroup(groupId, parentGroupId),
    onSuccess: (res) => res.success && invalidate(),
  });

  const transferMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupService.transferCoordinator(groupId, userId),
    onSuccess: (res) => res.success && invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: string) => groupService.deleteGroup(groupId),
    onSuccess: (res) => res.success && invalidate(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ parentGroupId, requestId }: { parentGroupId: string; requestId: string }) =>
      groupService.approveParentRequest(parentGroupId, requestId),
    onSuccess: (res) => res.success && invalidate(),
  });

  const denyMutation = useMutation({
    mutationFn: ({ parentGroupId, requestId }: { parentGroupId: string; requestId: string }) =>
      groupService.denyParentRequest(parentGroupId, requestId),
    onSuccess: (res) => res.success && invalidate(),
  });

  return {
    trees: treeQuery.data ?? [],
    isLoading: treeQuery.isPending,
    loadError: treeQuery.isError ? t('common.cannotLoadData') : null,
    refetch: treeQuery.refetch,
    moveParent: setParentMutation.mutateAsync,
    isMoving: setParentMutation.isPending,
    transferCoordinator: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
    deleteGroup: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    approveRequest: approveMutation.mutateAsync,
    denyRequest: denyMutation.mutateAsync,
    isResolvingRequest: approveMutation.isPending || denyMutation.isPending,
  };
}
