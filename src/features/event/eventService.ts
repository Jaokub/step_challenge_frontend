// ============================================================
// Step Challenge Mobile App — Event Service
// ============================================================
import api from '../../services/api';
import type {
  ApiResponse,
  EventListItem,
  EventDetail,
  EventLeaderboard,
  EventStats,
  EventScope,
} from '../../types';

const eventService = {
  /** List all events. */
  async getEvents(): Promise<ApiResponse<EventListItem[]>> {
    try {
      const { data } = await api.get<ApiResponse<EventListItem[]>>('/events');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Get one event with the caller's join status. */
  async getEvent(id: string): Promise<ApiResponse<EventDetail>> {
    try {
      const { data } = await api.get<ApiResponse<EventDetail>>(`/events/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Event leaderboard, either individual ranking or group-sum ranking. */
  async getLeaderboard(id: string, scope: EventScope): Promise<ApiResponse<EventLeaderboard>> {
    try {
      const { data } = await api.get<ApiResponse<EventLeaderboard>>(
        `/events/${id}/leaderboard?scope=${scope}`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Event-wide stats (total steps of all participants). */
  async getStats(id: string): Promise<ApiResponse<EventStats>> {
    try {
      const { data } = await api.get<ApiResponse<EventStats>>(`/events/${id}/stats`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Join an event individually. */
  async joinIndividual(id: string): Promise<ApiResponse<{ added: number }>> {
    try {
      const { data } = await api.post<ApiResponse<{ added: number }>>(`/events/${id}/join`, {
        mode: 'INDIVIDUAL',
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Enroll a whole group (caller must be OWNER/ADMIN of the group). */
  async joinGroup(id: string, groupId: string): Promise<ApiResponse<{ added: number }>> {
    try {
      const { data } = await api.post<ApiResponse<{ added: number }>>(`/events/${id}/join`, {
        mode: 'GROUP',
        groupId,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Leave an event. */
  async leave(id: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(`/events/${id}/leave`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default eventService;
