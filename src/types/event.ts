// ============================================================
// Step Challenge — Event (step-count competition) types
// ============================================================

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type EventJoinMode = 'INDIVIDUAL' | 'GROUP';
export type EventScope = 'individual' | 'group';

export interface EventListItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: EventStatus;
  participantCount: number;
}

/** A single event, plus the current user's participation state. */
export interface EventDetail extends EventListItem {
  joined: boolean;
  joinMode: EventJoinMode | null;
}

export interface EventIndividualRow {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
  steps: number;
  joinMode: EventJoinMode;
  rank: number;
}

export interface EventGroupRow {
  groupId: string;
  groupName: string;
  totalSteps: number;
  memberCount: number;
  rank: number;
}

export interface EventLeaderboard {
  scope: EventScope;
  ranking: EventIndividualRow[] | EventGroupRow[];
}

export interface EventStats {
  totalSteps: number;
  participantCount: number;
  groupCount: number;
}
