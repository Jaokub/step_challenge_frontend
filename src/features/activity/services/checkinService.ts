// ============================================================
// Step Challenge Mobile App — Check-In Service
// ============================================================
import api from '../../../services/api';
import type { ApiResponse, CheckIn } from '../../../types';

const checkinService = {
  async checkinWithQR(qrCode: string): Promise<ApiResponse<CheckIn>> {
    try {
      const { data } = await api.post<ApiResponse<CheckIn>>('/checkins/qr', {
        qrCode,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async adminCheckinUser(activityId: string, userId: string): Promise<ApiResponse<CheckIn>> {
    try {
      const { data } = await api.post<ApiResponse<CheckIn>>('/checkins/admin-checkin', {
        activityId,
        userId,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getCheckinHistory(): Promise<ApiResponse<CheckIn[]>> {
    try {
      const { data } = await api.get<ApiResponse<CheckIn[]>>('/checkins/history');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getCheckinsByActivity(
    activityId: string,
  ): Promise<ApiResponse<CheckIn[]>> {
    try {
      const { data } = await api.get<ApiResponse<CheckIn[]>>(
        `/checkins/activity/${activityId}`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async deleteCheckin(id: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(`/checkins/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default checkinService;
