// ============================================================
// Step Challenge Mobile App — Activity Service
// ============================================================
import api from '../../services/api';
import type { Activity, ActivityParticipant, ApiResponse, PaginationInfo } from '../../types';

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

  // ── Registration-only cascade (BUILD_PLAN.md Phase 4) ──────────────────
  // Separate from check-ins/points: signing up here awards nothing, members
  // still have to check in via QR/manual to earn points.

  /** Coordinator (OWNER/ADMIN of groupId) enrolls every current group member. */
  async enrollGroupIntoActivity(activityId: string, groupId: string): Promise<ApiResponse<{ added: number }>> {
    try {
      const { data } = await api.post<ApiResponse<{ added: number }>>(
        `/activities/${activityId}/enroll-group`,
        { groupId },
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Individual self-enroll (no group). */
  async joinActivity(activityId: string): Promise<ApiResponse<{ added: number }>> {
    try {
      const { data } = await api.post<ApiResponse<{ added: number }>>(`/activities/${activityId}/join`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Removes only the caller's own participant row. */
  async leaveActivity(activityId: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(`/activities/${activityId}/leave`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getActivityParticipants(activityId: string): Promise<ApiResponse<ActivityParticipant[]>> {
    try {
      const { data } = await api.get<ApiResponse<ActivityParticipant[]>>(`/activities/${activityId}/participants`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default activityService;
