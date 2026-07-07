import { useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';

export function useGroupDetail(id: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showQrModal, setShowQrModal] = useState(false);

  const groupQuery = useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: async () => {
      const res = await groupService.getGroupById(id);
      if (!res.success) throw new Error('Failed to load group');
      return res.data;
    },
  });

  const group = groupQuery.data ?? null;

  // Preserve old behavior: fetch error → alert, confirm navigates back.
  useEffect(() => {
    if (groupQuery.isError) {
      const error: any = groupQuery.error;
      Alert.alert(t('common.error'), error?.message || t('common.error'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    }
  }, [groupQuery.isError, groupQuery.error, router, t]);

  const qrQuery = useQuery({
    queryKey: queryKeys.groups.qrcode(id),
    queryFn: async () => {
      const res = await groupService.getGroupQRCode(id);
      if (!res.success) throw new Error('Failed to load QR code');
      return res.data;
    },
    enabled: false, // fetched on demand via handleShowQrCode
    staleTime: Infinity, // invite QR doesn't change
  });

  const qrInviteCode = qrQuery.data?.inviteCode ?? null;
  const qrImage = qrQuery.data?.qrCode ?? null;

  const handleShowQrCode = async () => {
    if (qrInviteCode && qrImage) {
      setShowQrModal(true);
      return;
    }
    const { data, error } = await qrQuery.refetch();
    if (data) {
      setShowQrModal(true);
    } else if (error) {
      Alert.alert(t('common.error'), (error as any)?.message || t('common.error'));
    }
  };

  const handleShareCode = async () => {
    if (!qrInviteCode) return;
    try {
      const shareUrl = Linking.createURL(`/(tabs)/groups/join?code=${qrInviteCode}`);
      await Share.share({
        message: `${t('groups.joinGroup')} ${group?.name}\n\n${t('groups.inviteCode')}: ${qrInviteCode}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const leaveMutation = useMutation({
    mutationFn: () => groupService.leaveGroup(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
        router.replace('/(tabs)/groups');
      }
    },
    onError: (error: any) => Alert.alert(t('common.error'), error.message || t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupService.deleteGroup(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
        router.replace('/(tabs)/groups');
      }
    },
    onError: (error: any) => Alert.alert(t('common.error'), error.message || t('common.error')),
  });

  const handleLeaveGroup = () => {
    Alert.alert(
      t('groups.leaveGroup'),
      `${t('common.confirm')} ${t('groups.leaveGroup')} "${group?.name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('groups.leaveGroup'),
          style: 'destructive',
          onPress: () => leaveMutation.mutate(),
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      t('groups.deleteGroup'),
      `${t('common.confirm')} ${t('groups.deleteGroup')} "${group?.name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('groups.deleteGroup'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  return {
    group,
    isLoading: groupQuery.isPending,
    isActionLoading:
      qrQuery.isFetching || leaveMutation.isPending || deleteMutation.isPending,
    qrInviteCode,
    qrImage,
    showQrModal,
    setShowQrModal,
    handleShowQrCode,
    handleShareCode,
    handleLeaveGroup,
    handleDeleteGroup,
  };
}
