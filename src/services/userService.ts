import api from './api';

const userService = {
  getUsers: async (params?: { page?: number, limit?: number, search?: string }) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('getUsers error', error);
      throw error;
    }
  },
  getProfile: async (id: string) => {
    try {
      const response = await api.get(`/users/profile/${id}`);
      return response.data;
    } catch (error) {
      console.error('getProfile error', error);
      throw error;
    }
  }
};

export default userService;
