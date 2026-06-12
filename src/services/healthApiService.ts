import api from './api';

const healthApiService = {
  getHealthSummary: async () => {
    try {
      const response = await api.get('/health/summary');
      return response.data;
    } catch (error) {
      console.error('getHealthSummary error', error);
      throw error;
    }
  },
  getWeeklyChartData: async () => {
    try {
      const response = await api.get('/health/weekly-chart');
      return response.data;
    } catch (error) {
      console.error('getWeeklyChartData error', error);
      throw error;
    }
  }
};

export default healthApiService;
