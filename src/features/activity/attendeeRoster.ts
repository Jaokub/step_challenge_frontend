/**
 * @module attendeeRoster
 * @description Pure roster-building logic for the admin attendees screen.
 *
 * Extracted from `app/admin/activities/[id]/attendees.tsx` so it can be unit
 * tested — the screen itself is a React Native component and the mobile test
 * setup is deliberately pure-logic only (no RN transform, see
 * `mobile/vitest.config.ts`).
 *
 * ## Why this exists (the bug it fixes)
 *
 * The screen used to build its roster from `userService.getAllUsersFull()` —
 * **every user in the faculty** — so an activity nobody had joined still
 * listed the entire staff directory, each row with a "check this person in"
 * action. The "X / Y checked in" denominator was the faculty headcount and
 * the "not checked in" filter was the whole faculty minus the attendees.
 *
 * The roster is now the activity's own **participants** (enrolled via a
 * coordinator's group cascade or an individual join) unioned with anyone who
 * has actually **checked in**. The union matters: `createCheckIn` does not
 * require a participant row, so a walk-in who scanned the QR without ever
 * enrolling has no `ActivityParticipant` and would silently vanish from the
 * admin's list if we keyed on participants alone.
 */
import type { ActivityParticipant, CheckIn } from '../../types';

export type AttendeeFilterKey = 'all' | 'checkedIn' | 'notCheckedIn';

export interface AttendeeRow {
  key: string;
  userId: string;
  name?: string;
  dept?: string | null;
  checkedInAt: string | null;
  checkInId: string | null;
  /** The group whose cascade enrolled this person, if any. */
  groupName?: string | null;
  /**
   * True when the person has a check-in but no participant row — they
   * scanned the QR without ever being enrolled.
   */
  isWalkIn: boolean;
  /**
   * ADR-001 / BUILD_PLAN.md Phase 7 — null while checked-in-but-goal-not-met
   * on a step-gated activity; set (attendance-only, or goal cleared) once
   * paid. Only meaningful when the activity is step-gated.
   */
  pointsAwardedAt: string | null;
}

/**
 * Build the attendee roster for an activity.
 *
 * Order is stable and intentional: participants first, in the order the API
 * returned them, then walk-ins (checked in without enrolling) appended in
 * check-in order. Keeping walk-ins at the end means the list doesn't reorder
 * under the admin's finger as people scan during a live event.
 *
 * @param participants Activity participants (enrolled), from `GET /activities/:id/participants`.
 * @param checkIns Every check-in for the activity, from the paginate-until-exhausted fetch.
 */
export const buildAttendeeRows = (
  participants: ActivityParticipant[],
  checkIns: CheckIn[],
): AttendeeRow[] => {
  const checkInByUserId = new Map<string, CheckIn>();
  for (const c of checkIns) {
    // First check-in per user wins. There can only be one per [user,
    // activity] server-side, but a duplicate in the payload must not
    // produce two rows for the same person.
    if (!checkInByUserId.has(c.userId)) checkInByUserId.set(c.userId, c);
  }

  const seen = new Set<string>();
  const rows: AttendeeRow[] = [];

  for (const p of participants) {
    if (seen.has(p.userId)) continue; // defensive: duplicate participant rows
    seen.add(p.userId);
    const c = checkInByUserId.get(p.userId);
    rows.push({
      key: p.userId,
      userId: p.userId,
      name: p.user?.fullName,
      dept: p.user?.department ?? null,
      checkedInAt: c?.checkedInAt ?? null,
      checkInId: c?.id ?? null,
      groupName: p.group?.name ?? null,
      isWalkIn: false,
      pointsAwardedAt: c?.pointsAwardedAt ?? null,
    });
  }

  for (const c of checkIns) {
    if (seen.has(c.userId)) continue;
    seen.add(c.userId);
    rows.push({
      key: c.userId,
      userId: c.userId,
      name: c.user?.fullName,
      dept: c.user?.department ?? null,
      checkedInAt: c.checkedInAt,
      checkInId: c.id,
      groupName: null,
      isWalkIn: true,
      pointsAwardedAt: c.pointsAwardedAt ?? null,
    });
  }

  return rows;
};

/** Apply the filter chip and the search box, in that order. */
export const filterAttendeeRows = (
  rows: AttendeeRow[],
  filter: AttendeeFilterKey,
  search: string,
): AttendeeRow[] => {
  const base =
    filter === 'checkedIn'
      ? rows.filter((r) => r.checkedInAt)
      : filter === 'notCheckedIn'
      ? rows.filter((r) => !r.checkedInAt)
      : rows;

  const q = search.trim().toLowerCase();
  if (!q) return base;
  return base.filter(
    (r) => r.name?.toLowerCase().includes(q) || r.dept?.toLowerCase().includes(q),
  );
};

/**
 * The "X / Y checked in" figures.
 *
 * The denominator is the roster size — participants plus walk-ins — not the
 * faculty headcount, and not `maxParticipants`. A cap is what the activity
 * *could* hold; this card is reporting on who is actually expected. Using the
 * cap would make a 50-capacity activity with 3 enrolled people read "1 / 50".
 *
 * Walk-ins are inside the denominator by construction (they're roster rows),
 * so the fraction can never exceed 1 and the progress bar needs no clamp for
 * correctness — only as a defensive measure.
 */
export const summariseAttendance = (rows: AttendeeRow[]) => {
  const total = rows.length;
  const checkedIn = rows.filter((r) => r.checkedInAt).length;
  return {
    checkedIn,
    total,
    /** 0..1, and 0 when the roster is empty (rather than NaN). */
    progress: total > 0 ? Math.min(1, checkedIn / total) : 0,
  };
};

/** Most recent manual (walk-in desk) check-ins, newest first. */
export const recentManualCheckIns = (checkIns: CheckIn[], limit = 5): CheckIn[] =>
  checkIns
    .filter((c) => c.method === 'MANUAL')
    .slice()
    .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime())
    .slice(0, limit);
