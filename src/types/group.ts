import { User } from './user';

export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface GroupTreeRef {
  id: string;
  name: string;
}

export interface ChildGroupRef extends GroupTreeRef {
  memberCount: number;
}

export interface AppGroup {
  id: string;
  name: string;
  description?: string;
  qrInviteCode: string;
  createdById: string;
  createdBy?: User;
  members?: GroupMember[];
  createdAt: string;
  updatedAt: string;
  // Hierarchy (nullable — most groups are flat, no parent/children).
  parentGroupId?: string | null;
  parentGroup?: GroupTreeRef | null;
  childGroups?: ChildGroupRef[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user?: User;
  group?: AppGroup;
}

// ─── Hierarchy overview ────────────────────────────────────────────────────

export interface GroupRankingRow {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  department: string;
  totalPoints: number;
  points: number;
  steps?: number;
  calories?: number;
  distance?: number;
  rank: number;
}

export interface GroupOverallStats {
  totalSteps: number;
  totalCalories: number;
  totalDistanceKm: number;
  totalPoints: number;
  memberCount: number;
}

export interface GroupOverview {
  groupId: string;
  ranking: GroupRankingRow[];
  overallStats: GroupOverallStats;
  top3: GroupRankingRow[];
  top5: GroupRankingRow[];
}

export interface SiblingGroupOverview {
  groupId: string;
  groupName: string;
  overallStats: GroupOverallStats;
}
