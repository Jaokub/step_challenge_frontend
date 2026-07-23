// ============================================================
// Step Challenge Mobile App — Group Service
// ============================================================
import api from '../../services/api';
import type {
  ApiResponse,
  AppGroup,
  GroupMember,
  GroupOverview,
  SiblingGroupOverview,
  GroupParentRequest,
  ParentGroupCandidate,
  AdminGroupTreeNode,
  ChildRanking,
  GroupHierarchyOverview,
  RelationPeriod,
} from '../../types';

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

  /**
   * Own overall stats + full ranking + top3/top5. Caller must be a member
   * of the group, or a member of its parent group.
   */
  async getGroupOverview(
    id: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<ApiResponse<GroupOverview>> {
    try {
      const { data } = await api.get<ApiResponse<GroupOverview>>(
        `/groups/${id}/overview`,
        { params },
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Sibling groups' overall stats only (never their member ranking).
   */
  async getGroupSiblings(id: string): Promise<ApiResponse<SiblingGroupOverview[]>> {
    try {
      const { data } = await api.get<ApiResponse<SiblingGroupOverview[]>>(
        `/groups/${id}/siblings`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  // ─── Hierarchy request/approve + admin god-mode (Phase 5) ───────────────

  /** Candidate parent groups for the picker sheet, with a search filter. */
  async getParentCandidates(
    id: string,
    search?: string,
  ): Promise<ApiResponse<{ candidates: ParentGroupCandidate[]; pendingRequestId: string | null }>> {
    try {
      const { data } = await api.get<ApiResponse<{ candidates: ParentGroupCandidate[]; pendingRequestId: string | null }>>(
        `/groups/${id}/parent-candidates`,
        { params: search ? { search } : undefined },
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Request `id` to become a child of `parentGroupId`. */
  async requestParentGroup(id: string, parentGroupId: string): Promise<ApiResponse<GroupParentRequest>> {
    try {
      const { data } = await api.post<ApiResponse<GroupParentRequest>>(`/groups/${id}/parent-request`, {
        parentGroupId,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Incoming requests where `id` is the prospective parent. */
  async getIncomingParentRequests(id: string): Promise<ApiResponse<GroupParentRequest[]>> {
    try {
      const { data } = await api.get<ApiResponse<GroupParentRequest[]>>(`/groups/${id}/parent-requests`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async approveParentRequest(id: string, requestId: string): Promise<ApiResponse<GroupParentRequest>> {
    try {
      const { data } = await api.post<ApiResponse<GroupParentRequest>>(
        `/groups/${id}/parent-requests/${requestId}/approve`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async denyParentRequest(id: string, requestId: string): Promise<ApiResponse<GroupParentRequest>> {
    try {
      const { data } = await api.post<ApiResponse<GroupParentRequest>>(
        `/groups/${id}/parent-requests/${requestId}/deny`,
      );
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Admin-only direct override: set/reassign (id) or detach (null). */
  async setParentGroup(id: string, parentGroupId: string | null): Promise<ApiResponse<AppGroup>> {
    try {
      const { data } = await api.put<ApiResponse<AppGroup>>(`/groups/${id}`, { parentGroupId });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Move the OWNER role to `userId` — coordinator-initiated or admin-override. */
  async transferCoordinator(id: string, userId: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.post<ApiResponse<null>>(`/groups/${id}/transfer-coordinator`, { userId });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /** Admin god-mode: full hierarchy tree (recursive, Phase 5.1). */
  async getAdminGroupTree(): Promise<ApiResponse<AdminGroupTreeNode[]>> {
    try {
      const { data } = await api.get<ApiResponse<AdminGroupTreeNode[]>>('/groups/admin/tree');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  // ─── Hierarchy relation cards + child ranking (Phase 5.2) ────────────────

  /** Direct child groups ranked by this-month steps, plus an aggregate bar — frame 20's full list. */
  async getChildRanking(id: string): Promise<ApiResponse<ChildRanking>> {
    try {
      const { data } = await api.get<ApiResponse<ChildRanking>>(`/groups/${id}/children`);
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  /**
   * Bundled { parent, siblings, children } relation-card data for frames
   * 13/15. Each section ranks its own Top-3 independently, so all three
   * periods are optional/independent query params.
   */
  async getHierarchyOverview(
    id: string,
    periods?: { parentPeriod?: RelationPeriod; siblingsPeriod?: RelationPeriod; childrenPeriod?: RelationPeriod },
  ): Promise<ApiResponse<GroupHierarchyOverview>> {
    try {
      const { data } = await api.get<ApiResponse<GroupHierarchyOverview>>(`/groups/${id}/hierarchy-overview`, {
        params: periods,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default groupService;
