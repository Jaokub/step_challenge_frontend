import { useState, useEffect, useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import groupService from '../services/groupService';
import { AppGroup } from '../../../types';

export function useGroupDetail(id: string) {
  const router = useRouter();
  const { t } = useTranslation();

  const [group, setGroup] = useState<AppGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [qrInviteCode, setQrInviteCode] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchGroupDetail = useCallback(async () => {
    try {
      const res = await groupService.getGroupById(id);
      if (res.success) {
        setGroup(res.data);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'), [
        { text: t('common.confirm'), onPress: () => router.back() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [id, router, t]);

  useEffect(() => {
    fetchGroupDetail();
  }, [fetchGroupDetail]);

  const handleShowQrCode = async () => {
    if (qrInviteCode && qrImage) {
      setShowQrModal(true);
      return;
    }
    
    try {
      setIsActionLoading(true);
      const res = await groupService.getGroupQRCode(id);
      if (res.success) {
        setQrInviteCode(res.data.inviteCode);
        setQrImage(res.data.qrCode);
        setShowQrModal(true);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsActionLoading(false);
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

  const handleLeaveGroup = () => {
    Alert.alert(
      t('groups.leaveGroup'),
      `${t('common.confirm')} ${t('groups.leaveGroup')} "${group?.name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('groups.leaveGroup'), 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsActionLoading(true);
              const res = await groupService.leaveGroup(id);
              if (res.success) {
                router.replace('/(tabs)/groups');
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.error'));
            } finally {
              setIsActionLoading(false);
            }
          }
        }
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
          onPress: async () => {
            try {
              setIsActionLoading(true);
              const res = await groupService.deleteGroup(id);
              if (res.success) {
                router.replace('/(tabs)/groups');
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.error'));
            } finally {
              setIsActionLoading(false);
            }
          }
        }
      ]
    );
  };

  return {
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
  };
}
