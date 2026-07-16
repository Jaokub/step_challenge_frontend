import api from '../../services/api';
import type { ApiResponse, User } from '../../types';

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

export interface FriendRequest extends Friendship {
  user: User; // The sender of the request
}

// Thinner than `User` — matches the backend's select() for the recipient
// of a request I sent (no totalPoints/role/etc., just what the "คำขอที่รอ"
// row needs).
export interface FriendPreview {
  id: string;
  fullName: string;
  avatarUrl?: string;
  department?: string | null;
}

export interface SentFriendRequest extends Friendship {
  friend: FriendPreview; // The recipient of the request I sent
}

const friendService = {
  async getFriendsList(): Promise<ApiResponse<User[]>> {
    try {
      const { data } = await api.get<ApiResponse<User[]>>('/friends');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getPendingRequests(): Promise<ApiResponse<FriendRequest[]>> {
    try {
      const { data } = await api.get<ApiResponse<FriendRequest[]>>('/friends/requests');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Requests I sent that are still awaiting the other person's response. */
  async getSentRequests(): Promise<ApiResponse<SentFriendRequest[]>> {
    try {
      const { data } = await api.get<ApiResponse<SentFriendRequest[]>>('/friends/sent');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async sendFriendRequest(friendId: string): Promise<ApiResponse<Friendship>> {
    try {
      const { data } = await api.post<ApiResponse<Friendship>>('/friends/request', { friendId });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async acceptFriendRequest(requestId: string): Promise<ApiResponse<Friendship>> {
    try {
      const { data } = await api.put<ApiResponse<Friendship>>(`/friends/request/${requestId}/accept`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async removeFriend(id: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(`/friends/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default friendService;
