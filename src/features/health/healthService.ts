// ============================================================
// Step Challenge Mobile App — Health Service
// ============================================================
import api from '../../services/api';
import type {
  ApiResponse,
  HealthRecord,
  HealthSource,
  HealthSummary,
} from '../../types';

interface SyncHealthInput {
  recordDate: string;
  source: HealthSource;
  steps: number;
  calories: number;
  distanceKm: number;
  activeMinutes: number;
}

interface HealthHistoryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

const healthService = {
  async syncHealthData(
    healthData: SyncHealthInput,
  ): Promise<ApiResponse<HealthRecord>> {
    try {
      const { data } = await api.post<ApiResponse<HealthRecord>>(
        '/health/sync',
        healthData,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getHealthHistory(
    params?: HealthHistoryParams,
  ): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const { data } = await api.get<ApiResponse<HealthRecord[]>>(
        '/health/history',
        { params },
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getHealthSummary(): Promise<ApiResponse<HealthSummary>> {
    try {
      const { data } = await api.get<ApiResponse<HealthSummary>>(
        '/health/summary',
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getTodayHealth(): Promise<ApiResponse<HealthRecord | null>> {
    try {
      const { data } = await api.get<ApiResponse<HealthRecord | null>>(
        '/health/today',
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default healthService;
