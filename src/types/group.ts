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
  // Present on GET /groups (list) responses — the caller's own membership
  // role in this group and its member count. Runtime always sends these on
  // that endpoint; declared optional since other endpoints omit them.
  myRole?: GroupMemberRole;
  memberCount?: number;
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
  // Frame-13/15 mint stat card (today/week/month steps) — distinct from
  // `overallStats` above (all-time points/steps/members, used by the
  // separate frame-10 group-tab overview screen).
  periodStats: { today: PeriodBucket; week: PeriodBucket; month: PeriodBucket };
  top3: GroupRankingRow[];
  top5: GroupRankingRow[];
}

// ─── 3-window relation previews (BUILD_PLAN.md Phase 5.2) ─────────────────

export interface PeriodBucket {
  steps: number;
  calories: number;
  distanceKm: number;
}

export interface PeriodStats {
  today: PeriodBucket;
  week: PeriodBucket;
  month: PeriodBucket;
  memberCount: number;
}

export interface RelationTop3Row {
  rank: number;
  name: string;
  steps: number;
}

// Sibling/parent relation-card data: a group's 3-window stats + a bounded
// Top-3 MEMBERS preview (never the full ranking — D1 privacy rule).
export interface SiblingGroupOverview {
  groupId: string;
  groupName: string;
  overallStats: PeriodStats;
  top3: RelationTop3Row[];
}

export interface ChildRankingRow {
  rank: number;
  groupId: string;
  groupName: string;
  steps: number;
}

// GET /groups/:id/children — frame 20's full list.
export interface ChildRanking {
  stats: { today: PeriodBucket; week: PeriodBucket; month: PeriodBucket };
  ranking: ChildRankingRow[];
}

/** One of the three windows a relation card's Top-3 can be ranked by. */
export type RelationPeriod = 'today' | 'week' | 'month';

// GET /groups/:id/hierarchy-overview — bundled relation-card data for
// frames 13/15. `children` is now one preview PER child group (same shape
// as `siblings`, each with member-level top3) rather than a single
// aggregate card ranking the child groups against each other — that read
// as "wrong" in the UI (rank list showed group names, capped at 3, no way
// to see a child group's own members).
export interface GroupHierarchyOverview {
  parent: SiblingGroupOverview | null;
  siblings: SiblingGroupOverview[];
  children: SiblingGroupOverview[];
}

// ─── Hierarchy request/approve + admin god-mode (BUILD_PLAN.md Phase 5) ───

export type GroupParentRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface GroupParentRequest {
  id: string;
  childGroupId: string;
  parentGroupId: string;
  status: GroupParentRequestStatus;
  requestedById: string;
  createdAt: string;
  resolvedAt?: string | null;
  childGroup?: ChildGroupRef;
}

export interface ParentGroupCandidate {
  id: string;
  name: string;
  memberCount: number;
  requested: boolean;
}

// Phase 5.1: recursive — a node's `children` are the same node shape, N
// levels deep (bounded by the backend's MAX_GROUP_DEPTH). Every root group
// (parentGroupId null) gets one of these; `kind`/`pending*` apply at any
// level, though the UI only gives level-1 (root) nodes the dark-card treatment.
export interface AdminGroupTreeNode {
  id: string;
  name: string;
  kind: 'PARENT' | 'STANDALONE';
  members: number;
  coordinator: string | null;
  childCount: number;
  pending: boolean;
  pendingParent: string | null;
  pendingRequestId: string | null;
  children: AdminGroupTreeNode[];
}
