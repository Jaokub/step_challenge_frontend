import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupService from './groupService';
import { queryKeys } from '../../constants/queryKeys';
import type { AppGroup, GroupMember } from '../../types';

export function useGroups(active: boolean) {
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: queryKeys.groups.list,
    queryFn: async () => {
      const res = await groupService.getGroups();
      if (!res.success) throw new Error('Failed to load groups');
      return res.data;
    },
    enabled: active,
  });

  // Members live in the query cache (per-group key); this local mirror keeps
  // the same Record shape the screen already renders from, and re-renders
  // when a fetch resolves.
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});

  const fetchGroupMembers = useCallback(
    async (groupId: string, force?: boolean) => {
      try {
        const options = {
          queryKey: queryKeys.groups.members(groupId),
          queryFn: async () => {
            const res = await groupService.getGroupMembers(groupId);
            if (!res.success) throw new Error('Failed to load group members');
            return res.data;
          },
        };
        // fetchQuery refetches when stale; ensureQueryData reuses cache.
        const data = force
          ? await queryClient.fetchQuery({ ...options, staleTime: 0 })
          : await queryClient.ensureQueryData(options);
        setGroupMembers((prev) => ({ ...prev, [groupId]: data }));
      } catch (error: any) {
        console.warn('Error fetching group members:', error);
      }
    },
    [queryClient]
  );

  const handleRefresh = () => {
    setGroupMembers({});
    queryClient.invalidateQueries({ queryKey: [...queryKeys.groups.all, 'members'] });
    groupsQuery.refetch();
  };

  const createMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      groupService.createGroup(name, description),
  });

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => groupService.joinGroup(inviteCode),
  });

  // Both let the error propagate (no Alert.alert — ToastContext is the
  // project-wide feedback convention) so callers can show it their own way.
  const handleCreateGroup = async (groupName: string, groupDesc: string, onSuccess: () => void) => {
    if (!groupName.trim()) return;
    const res = await createMutation.mutateAsync({ name: groupName.trim(), description: groupDesc.trim() });
    if (res?.success) {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    }
  };

  const handleJoinGroup = async (inviteCode: string, onSuccess: () => void) => {
    if (!inviteCode.trim()) return;
    const res = await joinMutation.mutateAsync(inviteCode.trim());
    if (res?.success) {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    }
  };

  const groups: AppGroup[] = groupsQuery.data ?? [];

  return {
    groups,
    groupMembers,
    isLoading: groupsQuery.isPending,
    isRefreshing: groupsQuery.isRefetching,
    isSubmitting: createMutation.isPending || joinMutation.isPending,
    handleRefresh,
    handleCreateGroup,
    handleJoinGroup,
    fetchGroupMembers,
  };
}
