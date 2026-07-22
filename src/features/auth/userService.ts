// ============================================================
// Step Challenge Mobile App — User Service
// ============================================================
import api from '../../services/api';
import type { ApiResponse, PaginationInfo, User } from '../../types';

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

// Mirrors the backend's Friendship.status plus the two "no row yet" /
// "they invited me" cases it collapses into one enum for the client.
export type FriendshipStatus = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';

// Thinner than `User` — matches the backend's search select() (no
// totalPoints/role/syncToken/etc.), used by the add-friend search tab.
export interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  department?: string | null;
  avatarUrl?: string;
  /** This user's relationship to the caller — drives the row's button state. */
  friendshipStatus: FriendshipStatus;
}

interface SearchUsersParams {
  /** Omit or pass '' to browse all colleagues instead of filtering. */
  q?: string;
  page?: number;
  limit?: number;
}

const userService = {
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
   * Search users by name/email/id (excludes self) — powers the add-friend
   * sheet's "ค้นหา" tab. `q` is optional: an empty/omitted query browses
   * every colleague (paginated) instead of erroring, so the tab has
   * something to show before the user types anything.
   */
  async searchUsers(
    params: SearchUsersParams = {},
  ): Promise<ApiResponse<{ users: UserSearchResult[]; pagination: PaginationInfo }>> {
    try {
      const { data } = await api.get<
        ApiResponse<{ users: UserSearchResult[]; pagination: PaginationInfo }>
      >('/users/search', {
        params: { q: params.q || undefined, page: params.page, limit: params.limit },
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
