import api from './api';

const activityService = {
  createActivity: async (data: any) => {
    try {
      const response = await api.post('/activities', data);
      return response.data;
    } catch (error) {
      console.error('createActivity error', error);
      throw error;
    }
  }
};

export default activityService;
