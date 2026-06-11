import api from '../../../services/api';

export interface LeaderboardUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
  department: string;
  rank: number;
}

const leaderboardService = {
  getGlobalLeaderboard: async (limit = 10) => {
    try {
      const response = await api.get(`/leaderboard/global?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('getGlobalLeaderboard error', error);
      throw error;
    }
  },

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
