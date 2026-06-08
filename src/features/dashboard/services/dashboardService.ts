// ============================================================
// Step Challenge Mobile App — Dashboard Service
// ============================================================
import api from '../../../services/api';
import type {
  AdminDashboard,
  ApiResponse,
  DashboardStats,
  PersonalDashboard,
} from '../../../types';

// ─── Service ────────────────────────────────────────────────

const dashboardService = {
  /**
   * Fetch the personal dashboard for the currently authenticated user.
   */
  async getPersonalDashboard(): Promise<ApiResponse<PersonalDashboard>> {
    try {
      const { data } = await api.get<ApiResponse<PersonalDashboard>>(
        '/dashboard/personal',
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Fetch the admin dashboard with platform-wide metrics. **Admin only.**
   */
  async getAdminDashboard(): Promise<ApiResponse<AdminDashboard>> {
    try {
      const { data } = await api.get<ApiResponse<AdminDashboard>>(
        '/dashboard/admin',
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Fetch aggregated statistics.
   */
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const { data } = await api.get<ApiResponse<DashboardStats>>(
        '/dashboard/stats',
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default dashboardService;
