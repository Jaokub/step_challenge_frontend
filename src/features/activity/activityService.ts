// ============================================================
// Step Challenge Mobile App — Activity Service
// ============================================================
import api from '../../services/api';
import type { Activity, ApiResponse, PaginationInfo } from '../../types';

interface GetActivitiesParams {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface GetMyActivitiesParams {
  page?: number;
  limit?: number;
}

interface ActivityInput {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  imageUrl?: string;
  points: number;
  expectedSteps?: number | null;
  totalDistance?: number | null;
}

const activityService = {
  async getActivities(
    params?: GetActivitiesParams,
  ): Promise<ApiResponse<{ activities: Activity[]; pagination: PaginationInfo }>> {
    try {
      const { data } = await api.get<
        ApiResponse<{ activities: Activity[]; pagination: PaginationInfo }>
      >('/activities', { params });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getActivityById(id: string): Promise<ApiResponse<Activity>> {
    try {
      const { data } = await api.get<ApiResponse<Activity>>(`/activities/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getMyActivities(
    params?: GetMyActivitiesParams,
  ): Promise<ApiResponse<{ activities: Activity[]; pagination: PaginationInfo }>> {
    try {
      const { data } = await api.get<
        ApiResponse<{ activities: Activity[]; pagination: PaginationInfo }>
      >('/activities/my', { params });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async createActivity(activityData: ActivityInput): Promise<ApiResponse<Activity>> {
    try {
      const { data } = await api.post<ApiResponse<Activity>>(
        '/activities',
        activityData,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async updateActivity(
    id: string,
    activityData: Partial<ActivityInput>,
  ): Promise<ApiResponse<Activity>> {
    try {
      const { data } = await api.put<ApiResponse<Activity>>(
        `/activities/${id}`,
        activityData,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async deleteActivity(id: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(`/activities/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default activityService;
