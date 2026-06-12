import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import friendService, { FriendRequest } from '../services/friendService';
import type { User } from '../../../types';

export function useFriends(active: boolean) {
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getFriendsList(),
        friendService.getPendingRequests()
      ]);
      
      if (friendsRes.success) setFriends(friendsRes.data);
      if (requestsRes.success) setRequests(requestsRes.data);
    } catch (error: any) {
      console.warn('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      setIsLoading(true);
      fetchFriends();
    }
  }, [active, fetchFriends]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFriends();
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      handleRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectRequest = async (friendId: string) => {
    try {
      await friendService.removeFriend(friendId);
      handleRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await friendService.removeFriend(friendId);
          handleRefresh();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }}
    ]);
  };

  return {
    friends,
    requests,
    isLoading,
    isRefreshing,
    handleRefresh,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend
  };
}
