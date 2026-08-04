import api from '../../services/api';

export interface LeaderboardUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  steps: number;
  totalPoints?: number;
  department: string;
  rank: number;
}

/**
 * ⛔ No `getGlobalLeaderboard` here — the endpoint was deleted on 2026-08-03
 * (TEST_FINDINGS F2), two weeks after `app/leaderboard.tsx`, the only screen
 * that ever called it, was removed on privacy grounds. Every leaderboard is
 * scoped: to your friends, or to a group you can see.
 */
const leaderboardService = {
  getFriendsLeaderboard: async (params?: { startDate?: string, endDate?: string }) => {
    try {
      const activeParams = Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v !== undefined));
      const query = new URLSearchParams(activeParams as any).toString();
      const response = await api.get(`/leaderboard/friends${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('getFriendsLeaderboard error', error);
      throw error;
    }
  },

  getGroupLeaderboard: async (groupId: string, params?: { startDate?: string, endDate?: string }) => {
    try {
      const activeParams = Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v !== undefined));
      const query = new URLSearchParams(activeParams as any).toString();
      const response = await api.get(`/leaderboard/group/${groupId}${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('getGroupLeaderboard error', error);
      throw error;
    }
  }
};

export default leaderboardService;
