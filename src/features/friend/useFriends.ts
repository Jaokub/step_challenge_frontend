import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import friendService, { FriendRequest } from './friendService';
import { queryKeys } from '../../constants/queryKeys';
import type { User } from '../../types';

export function useFriends(active: boolean) {
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: queryKeys.friends.list,
    queryFn: async () => {
      const res = await friendService.getFriendsList();
      if (!res.success) throw new Error('Failed to load friends');
      return res.data;
    },
    enabled: active,
  });

  const requestsQuery = useQuery({
    queryKey: queryKeys.friends.requests,
    queryFn: async () => {
      const res = await friendService.getPendingRequests();
      if (!res.success) throw new Error('Failed to load friend requests');
      return res.data;
    },
    enabled: active,
  });

  const invalidateFriends = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => friendService.acceptFriendRequest(requestId),
    onSuccess: () => {
      Alert.alert('Success', 'Friend request accepted!');
      invalidateFriends();
    },
    onError: (error: any) => Alert.alert('Error', error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (friendId: string) => friendService.removeFriend(friendId),
    onSuccess: invalidateFriends,
    onError: (error: any) => Alert.alert('Error', error.message),
  });

  const handleRefresh = () => {
    friendsQuery.refetch();
    requestsQuery.refetch();
  };

  const handleAcceptRequest = (requestId: string) => acceptMutation.mutate(requestId);

  const handleRejectRequest = (friendId: string) => removeMutation.mutate(friendId);

  const handleRemoveFriend = (friendId: string) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMutation.mutate(friendId),
      },
    ]);
  };

  const friends: User[] = friendsQuery.data ?? [];
  const requests: FriendRequest[] = requestsQuery.data ?? [];

  return {
    friends,
    requests,
    isLoading: friendsQuery.isPending || requestsQuery.isPending,
    isRefreshing:
      (friendsQuery.isRefetching || requestsQuery.isRefetching) &&
      !friendsQuery.isPending &&
      !requestsQuery.isPending,
    handleRefresh,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
  };
}
