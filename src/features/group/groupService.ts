// ============================================================
// Step Challenge Mobile App — Group Service
// ============================================================
import api from '../../services/api';
import type { ApiResponse, AppGroup, GroupMember } from '../../types';

// ─── Service ────────────────────────────────────────────────

const groupService = {
  /**
   * List all groups visible to the current user.
   */
  async getGroups(): Promise<ApiResponse<AppGroup[]>> {
    try {
      const { data } = await api.get<ApiResponse<AppGroup[]>>('/groups');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Create a new group owned by the current user.
   */
  async createGroup(
    name: string,
    description?: string,
  ): Promise<ApiResponse<AppGroup>> {
    try {
      const { data } = await api.post<ApiResponse<AppGroup>>('/groups', {
        name,
        description,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Join an existing group using its QR invite code.
   */
  async joinGroup(qrInviteCode: string): Promise<ApiResponse<AppGroup>> {
    try {
      const { data } = await api.post<ApiResponse<AppGroup>>('/groups/join', {
        inviteCode: qrInviteCode,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Fetch a single group by ID including its members.
   */
  async getGroupById(id: string): Promise<ApiResponse<AppGroup>> {
    try {
      const { data } = await api.get<ApiResponse<AppGroup>>(`/groups/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Update a group's name or description.
   */
  async updateGroup(
    id: string,
    updateData: { name?: string; description?: string },
  ): Promise<ApiResponse<AppGroup>> {
    try {
      const { data } = await api.put<ApiResponse<AppGroup>>(
        `/groups/${id}`,
        updateData,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Delete a group. Only the group owner may perform this action.
   */
  async deleteGroup(id: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(`/groups/${id}`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * List all members of a group.
   */
  async getGroupMembers(id: string): Promise<ApiResponse<GroupMember[]>> {
    try {
      const { data } = await api.get<ApiResponse<GroupMember[]>>(
        `/groups/${id}/members`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Get the QR code payload for inviting others to a group.
   */
  async getGroupQRCode(
    id: string,
  ): Promise<ApiResponse<{ inviteCode: string; qrCode: string }>> {
    try {
      const { data } = await api.get<ApiResponse<{ inviteCode: string; qrCode: string }>>(
        `/groups/${id}/qrcode`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Remove a member from a group. Requires OWNER or ADMIN role.
   */
  async removeMember(
    groupId: string,
    userId: string,
  ): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.delete<ApiResponse<null>>(
        `/groups/${groupId}/members/${userId}`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Leave a group voluntarily.
   */
  async leaveGroup(id: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.post<ApiResponse<null>>(
        `/groups/${id}/leave`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default groupService;
