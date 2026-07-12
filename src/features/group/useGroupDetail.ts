import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

// No Alert.alert anywhere in this hook (project convention: destructive
// confirmation → CustomModal, feedback → ToastContext) — both live in the
// screen, which owns the confirm-dialog state. This hook just exposes plain
// mutate functions and query state.
export function useGroupDetail(id: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const groupQuery = useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: async () => {
      const res = await groupService.getGroupById(id);
      if (!res.success) throw new Error('Failed to load group');
      return res.data;
    },
    enabled: !!id,
  });

  const group = groupQuery.data ?? null;
  const loadError = groupQuery.isError
    ? (groupQuery.error as any)?.message || t('common.cannotLoadData')
    : null;

  const invalidateGroup = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.list });
  };

  // Invite QR/code — mockup shows it inline on the page (not behind a
  // "show QR" trigger), so this is fetched eagerly rather than on demand.
  const qrQuery = useQuery({
    queryKey: queryKeys.groups.qrcode(id),
    queryFn: async () => {
      const res = await groupService.getGroupQRCode(id);
      if (!res.success) throw new Error('Failed to load QR code');
      return res.data;
    },
    enabled: !!id,
    staleTime: Infinity, // invite QR doesn't change
  });

  const qrInviteCode = qrQuery.data?.inviteCode ?? null;
  const qrImage = qrQuery.data?.qrCode ?? null;

  const handleShareCode = async () => {
    if (!qrInviteCode) return;
    try {
      await Share.share({
        message: `${t('groups.joinGroup')} ${group?.name}\n\n${t('groups.inviteCode')}: ${qrInviteCode}`,
      });
    } catch (error) {
      console.warn('Error sharing code:', error);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => groupService.updateGroup(id, data),
  });
  const handleUpdateGroup = async (name: string, description: string) => {
    const res = await updateMutation.mutateAsync({ name: name.trim(), description: description.trim() });
    if (res?.success) invalidateGroup();
    return res;
  };

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupService.removeMember(id, userId),
  });
  const handleRemoveMember = async (userId: string) => {
    const res = await removeMemberMutation.mutateAsync(userId);
    if (res?.success) invalidateGroup();
    return res;
  };

  const leaveMutation = useMutation({
    mutationFn: () => groupService.leaveGroup(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
        router.replace('/(tabs)/groups');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupService.deleteGroup(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
        router.replace('/(tabs)/groups');
      }
    },
  });

  return {
    group,
    isLoading: groupQuery.isPending,
    loadError,
    refetchGroup: groupQuery.refetch,
    isQrLoading: qrQuery.isPending,
    qrInviteCode,
    qrImage,
    handleShareCode,
    isUpdating: updateMutation.isPending,
    handleUpdateGroup,
    isRemovingMember: removeMemberMutation.isPending,
    handleRemoveMember,
    isLeaving: leaveMutation.isPending,
    handleLeaveGroup: () => leaveMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
    handleDeleteGroup: () => deleteMutation.mutateAsync(),
  };
}
