// ============================================================
// Step Challenge Mobile App — Check-In Service
// ============================================================
import api from '../../services/api';
import type { ApiResponse, CheckIn, PaginationInfo } from '../../types';

/** Shape of a successful QR check-in response from the backend. */
export interface QRCheckinResult {
  checkIn: CheckIn;
  pointsAwarded: number;
}

/** Shape of the activity check-ins (attendees) response from the backend. */
export interface ActivityCheckinsResult {
  activity: { id: string; title: string };
  checkIns: CheckIn[];
  totalCheckIns: number;
  pagination?: PaginationInfo;
}

interface PageParams {
  page?: number;
  limit?: number;
}

// Backend caps `?limit=` at 200 for this endpoint (checkin.controller.js
// getActivityCheckIns) — use the max to keep round-trips low.
const CHECKINS_MAX_PAGE_SIZE = 200;

const checkinService = {
  async checkinWithQR(qrCode: string): Promise<ApiResponse<QRCheckinResult>> {
    try {
      const { data } = await api.post<ApiResponse<QRCheckinResult>>('/checkins/qr', {
        qrCode,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async adminCheckinUser(activityId: string, userId: string): Promise<ApiResponse<QRCheckinResult>> {
    try {
      const { data } = await api.post<ApiResponse<QRCheckinResult>>('/checkins/admin-checkin', {
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
    params?: PageParams,
  ): Promise<ApiResponse<ActivityCheckinsResult>> {
    try {
      const { data } = await api.get<ApiResponse<ActivityCheckinsResult>>(
        `/checkins/activity/${activityId}`,
        { params },
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Same as `getCheckinsByActivity` but paginates until every page is
   * fetched, returning the full check-in list in one shot. Calling the
   * single-page version with no params silently truncates at the backend's
   * default limit=50 — any activity with >50 check-ins would render an
   * incomplete attendee list (BUILD_PLAN.md Phase 3.1).
   */
  async getAllCheckinsByActivity(
    activityId: string,
  ): Promise<ApiResponse<ActivityCheckinsResult>> {
    try {
      let page = 1;
      let totalPages = 1;
      let activity: ActivityCheckinsResult['activity'] | undefined;
      let totalCheckIns = 0;
      const checkIns: CheckIn[] = [];

      do {
        const { data } = await api.get<ApiResponse<ActivityCheckinsResult>>(
          `/checkins/activity/${activityId}`,
          { params: { page, limit: CHECKINS_MAX_PAGE_SIZE } },
        );
        if (!data.success) return data;
        activity = data.data.activity;
        totalCheckIns = data.data.totalCheckIns;
        checkIns.push(...data.data.checkIns);
        totalPages = data.data.pagination?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      return {
        success: true,
        data: { activity: activity!, checkIns, totalCheckIns },
        message: 'Activity check-ins retrieved successfully',
      };
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
