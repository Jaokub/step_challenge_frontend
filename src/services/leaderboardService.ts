import api from './api';

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

  getFriendsLeaderboard: async () => {
    try {
      const response = await api.get('/leaderboard/friends');
      return response.data;
    } catch (error) {
      console.error('getFriendsLeaderboard error', error);
      throw error;
    }
  },

  getGroupLeaderboard: async (groupId: string) => {
    try {
      const response = await api.get(`/leaderboard/group/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('getGroupLeaderboard error', error);
      throw error;
    }
  }
};

export default leaderboardService;
