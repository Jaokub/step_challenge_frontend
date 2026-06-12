// ============================================================
// Step Challenge Mobile App — User Service
// ============================================================
import api from '../../services/api';
import type { ApiResponse, LeaderboardUser, PaginationInfo, User } from '../../types';

interface LeaderboardParams {
  limit?: number;
  offset?: number;
}

interface GetAllUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
}

interface UpdateProfileInput {
  fullName?: string;
  nickname?: string;
  department?: string;
  avatarUrl?: string;
}

const userService = {
  async getLeaderboard(
    params?: LeaderboardParams,
  ): Promise<ApiResponse<LeaderboardUser[]>> {
    try {
      const { data } = await api.get<ApiResponse<LeaderboardUser[]>>(
        '/users/leaderboard',
        { params },
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getProfile(id: string): Promise<ApiResponse<User>> {
    try {
      const { data } = await api.get<ApiResponse<User>>(
        `/users/profile/${id}`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async updateProfile(profileData: UpdateProfileInput): Promise<ApiResponse<User>> {
    try {
      const { data } = await api.put<ApiResponse<User>>(
        '/users/profile',
        profileData,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getAllUsers(
    params?: GetAllUsersParams,
  ): Promise<ApiResponse<{ users: User[]; pagination: PaginationInfo }>> {
    try {
      const { data } = await api.get<
        ApiResponse<{ users: User[]; pagination: PaginationInfo }>
      >('/users', { params });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default userService;
