// ============================================================
// Step Challenge Mobile App — Health Sync
// Reads today's data via HealthService, then uploads it to
// the backend via POST /health/sync
// ============================================================

import { HealthService } from '../../services/health';
import healthService from './healthService';

/**
 * Builds a "YYYY-MM-DD" string in device local time.
 * The backend's validate middleware requires this exact format.
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface SyncTodayResult {
  awardedActivityIds: string[];
}

/**
 * Initialises Health Connect (requests permissions if needed),
 * reads today's data, then POSTs it to POST /api/v1/health/sync.
 *
 * Auth header is attached automatically by api.ts — no manual token handling needed.
 * The backend upserts, so calling this multiple times in a day is safe.
 *
 * Returns `awardedActivityIds` (BUILD_PLAN.md Phase 7 PR 2) — step-gated
 * activities newly paid out by this sync — or `undefined` if the sync was
 * skipped (no health permission) or its return value wasn't reached.
 * `useDashboard` ignores the return value; `useActiveEventPolling` uses it
 * to fire a celebration toast.
 */
export async function syncTodayHealthData(): Promise<SyncTodayResult | undefined> {
  // 1. Init + permission request (your function — no-ops if already granted)
  const permitted = await HealthService.init();
  if (!permitted) {
    console.warn('[syncTodayHealthData] Health permissions not granted, skipping sync.');
    return undefined;
  }

  // 2. Build time range: midnight today → now
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startTime = startOfDay.toISOString();
  const endTime = now.toISOString();

  // 3. Fetch from Health Connect (your functions)
  const [steps, distanceKm, calories] = await Promise.all([
    HealthService.getSteps(startTime, endTime),
    HealthService.getDistance(startTime, endTime), // already in km
    HealthService.getCalories(startTime, endTime),
  ]);

  // 4. POST to backend
  const result = await healthService.syncHealthData({
    recordDate: toLocalDateString(now), // "YYYY-MM-DD"
    source: 'GOOGLE_HEALTH',
    steps,
    distanceKm,
    calories,
    activeMinutes: 0,
  });

  console.log('[syncTodayHealthData] Success:', result.message);
  return { awardedActivityIds: result.data?.awardedActivityIds ?? [] };
}
