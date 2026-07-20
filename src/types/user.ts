import { Role } from './common';

export type HealthSource = 'GOOGLE_HEALTH' | 'APPLE_HEALTH' | 'MANUAL';

export interface User {
  id: string;
  email: string;
  fullName: string;
  nickname?: string;
  // Nullable: Google-only users have no department until they fill it in
  // via edit-profile (see AuthContext.signInWithGoogle / login.tsx).
  department?: string | null;
  role: Role;
  avatarUrl?: string;
  totalPoints: number;
  syncToken: string;
  stats?: {
    totalCheckIns: number;
    totalActivities: number;
    totalGroups: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  recordDate: string;
  steps: number;
  calories: number;
  distanceKm: number;
  activeMinutes: number;
  source: HealthSource;
  createdAt: string;
}

/**
 * `POST /health/sync` response shape (BUILD_PLAN.md Phase 7 PR 2). Adds
 * `awardedActivityIds` — step-gated activities newly paid out by this sync
 * — on top of the plain HealthRecord. The foreground poller
 * (useStepGoalPolling) reads this to know when to refresh steps-driven
 * queries; per Phase 8 (2026-07-17) it no longer surfaces a celebration
 * toast or any other points-related UI for it.
 */
export interface HealthSyncResult extends HealthRecord {
  awardedActivityIds: string[];
}
