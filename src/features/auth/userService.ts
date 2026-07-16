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

// Thinner than `User` — matches the backend's search select() (no
// totalPoints/role/syncToken/etc.), used by the add-friend search tab.
export interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  department?: string | null;
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
   * Same as `getAllUsers` but pages through the full offset-based result
   * (backend defaults to limit=20, capped at 100) until every user is
   * fetched. Calling `getAllUsers()` with no params silently truncates the
   * roster at 20 — any screen using it as the full staff list (e.g. the
   * admin attendees roster) would show an incomplete list + wrong counts
   * for basically any real faculty (BUILD_PLAN.md Phase 3.1).
   */
  async getAllUsersFull(
    params?: Pick<GetAllUsersParams, 'search'>,
  ): Promise<ApiResponse<{ users: User[]; pagination: PaginationInfo }>> {
    try {
      const limit = 100; // backend max for GET /users
      let offset = 0;
      let total = Infinity;
      const users: User[] = [];

      while (offset < total) {
        const { data } = await api.get<
          ApiResponse<{ users: User[]; pagination: PaginationInfo }>
        >('/users', { params: { ...params, limit, offset } });
        if (!data.success) return data;
        users.push(...data.data.users);
        total = data.data.pagination.total;
        offset += limit;
      }

      return {
        success: true,
        data: { users, pagination: { page: 1, limit: users.length, total, totalPages: 1 } },
        message: 'Users retrieved successfully.',
      };
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Search users by name/email (excludes self) — powers the add-friend
   * sheet's "ค้นหา" tab. Backend requires a non-empty `q` (400s otherwise),
   * so callers must not fire this while the search box is empty.
   */
  async searchUsers(q: string): Promise<ApiResponse<UserSearchResult[]>> {
    try {
      const { data } = await api.get<ApiResponse<UserSearchResult[]>>('/users/search', {
        params: { q },
      });
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
