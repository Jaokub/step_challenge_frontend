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

  async getProfile(id: string): Promise<
    ApiResponse<{
      user: User;
      stats: { totalCheckIns: number; totalActivities: number; totalGroups: number };
    }>
  > {
    try {
      const { data } = await api.get<
        ApiResponse<{
          user: User;
          stats: { totalCheckIns: number; totalActivities: number; totalGroups: number };
        }>
      >(`/users/profile/${id}`);
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

  /**
   * Admin only — grant or revoke ADMIN (gap #5, BUILD_PLAN.md Phase 2).
   */
  async updateUserRole(id: string, role: 'ADMIN' | 'STAFF'): Promise<ApiResponse<{ user: User }>> {
    try {
      const { data } = await api.patch<ApiResponse<{ user: User }>>(`/users/${id}/role`, { role });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default userService;
