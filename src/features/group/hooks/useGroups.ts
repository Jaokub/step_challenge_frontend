import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import groupService from '../services/groupService';
import type { AppGroup } from '../../../types';

export function useGroups(active: boolean) {
  const [groups, setGroups] = useState<AppGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await groupService.getGroups();
      if (res.success) setGroups(res.data);
    } catch (error: any) {
      console.warn('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      setIsLoading(true);
      fetchGroups();
    }
  }, [active, fetchGroups]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGroups();
  };

  const handleCreateGroup = async (groupName: string, groupDesc: string, onSuccess: () => void) => {
    if (!groupName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await groupService.createGroup(groupName.trim(), groupDesc.trim());
      if (res.success) {
        onSuccess();
        handleRefresh();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (inviteCode: string, onSuccess: () => void) => {
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await groupService.joinGroup(inviteCode.trim());
      if (res.success) {
        onSuccess();
        handleRefresh();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    groups,
    isLoading,
    isRefreshing,
    isSubmitting,
    handleRefresh,
    handleCreateGroup,
    handleJoinGroup
  };
}
