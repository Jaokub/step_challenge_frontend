import { User } from './user';

export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type CheckInMethod = 'QR' | 'MANUAL' | 'GPS';

export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  qrCode: string;
  createdById: string;
  status: ActivityStatus;
  maxParticipants?: number;
  imageUrl?: string;
  points: number;
  expectedSteps?: number | null;
  totalDistance?: number | null;
  // Checked-in count (CheckIn rows) — distinct from `registeredCount` below.
  participantCount?: number;
  // Registered-only count (ActivityParticipant rows — enrolled via a group
  // cascade or self-join, not necessarily checked in yet; BUILD_PLAN.md
  // Phase 4). This is what "total participants" means on /activity/[id],
  // since that screen is about registration, not check-in.
  registeredCount?: number;
  createdBy?: User;
  isCheckedIn?: boolean;
  // Registration-only cascade (BUILD_PLAN.md Phase 4) — separate from
  // check-ins/points. Set on GET /activities/:id only. null when the caller
  // has no ActivityParticipant row for this activity.
  myParticipation?: { groupId: string | null; groupName: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

/** A registered (not necessarily checked-in) member of an activity. */
export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  groupId: string | null;
  createdAt: string;
  user?: User;
  group?: { id: string; name: string } | null;
}

export interface CheckIn {
  id: string;
  userId: string;
  activityId: string;
  checkedInAt: string;
  latitude?: number;
  longitude?: number;
  method: CheckInMethod;
  activity?: Activity;
  user?: User;
}
