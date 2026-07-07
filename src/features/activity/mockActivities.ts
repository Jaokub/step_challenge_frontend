// ============================================================
// Step Challenge Mobile App — Mock Activities
// ============================================================
// The backend has no real events seeded yet. This file provides a realistic
// placeholder `Activity` object (shaped exactly like the API response) so
// the Activities screen has something to render. `useActivities` only
// reaches for this when the real API responds with an empty first page —
// as soon as an admin creates real activities, the mock data disappears on
// its own with no code changes needed.
import type { Activity, ActivityStatus } from '../../types';

/** Builds an ISO string for `today + dayOffset` at the given hour/minute. */
function atTime(dayOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const MOCK_ID_PREFIX = 'mock-';

export function isMockActivity(id: string): boolean {
  return id.startsWith(MOCK_ID_PREFIX);
}

const BASE = {
  id: `${MOCK_ID_PREFIX}morning-run`,
  title: 'Morning Run Challenge',
  description:
    'Kick off the day with a 5K run around the Faculty of Engineering. Meet at the main gate — pace groups for every level, water stops every kilometer, and a warm-up led by the sports club before the start.',
  location: 'คณะวิศวฯ',
  qrCode: `${MOCK_ID_PREFIX}morning-run-qr`,
  createdById: `${MOCK_ID_PREFIX}admin`,
  maxParticipants: 60,
  points: 50,
  expectedSteps: 6500,
  totalDistance: 5,
  participantCount: 24,
};

/** Returns one Morning-Run-Challenge-shaped activity, dated/status'd for the requested tab. */
export function getMockActivities(status: ActivityStatus): Activity[] {
  switch (status) {
    case 'ONGOING':
      return [
        {
          ...BASE,
          status: 'ONGOING',
          startDate: atTime(0, 6, 30),
          endDate: atTime(0, 7, 30),
          isCheckedIn: false,
          createdAt: atTime(-3, 9, 0),
          updatedAt: atTime(0, 6, 30),
        },
      ];

    case 'COMPLETED':
      return [
        {
          ...BASE,
          status: 'COMPLETED',
          startDate: atTime(-2, 6, 30),
          endDate: atTime(-2, 7, 30),
          participantCount: 31,
          isCheckedIn: true,
          createdAt: atTime(-5, 9, 0),
          updatedAt: atTime(-2, 7, 30),
        },
      ];

    case 'UPCOMING':
    default:
      return [
        {
          ...BASE,
          status: 'UPCOMING',
          startDate: atTime(0, 6, 30),
          endDate: atTime(0, 7, 30),
          isCheckedIn: false,
          createdAt: atTime(-3, 9, 0),
          updatedAt: atTime(-3, 9, 0),
        },
      ];
  }
}
