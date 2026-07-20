import { describe, it, expect } from 'vitest';
import {
  buildAttendeeRows,
  filterAttendeeRows,
  summariseAttendance,
  recentManualCheckIns,
} from './attendeeRoster';
import type { ActivityParticipant, CheckIn } from '../../types';

/**
 * Regression tests for the admin attendees roster.
 *
 * The bug these exist for: the screen built its roster from the FULL user
 * list, so every account in the faculty appeared as an attendee row on every
 * activity — with a working "check this person in" button — and the
 * "X / Y checked in" denominator was the faculty headcount.
 */

const participant = (
  userId: string,
  overrides: Partial<ActivityParticipant> = {},
): ActivityParticipant => ({
  id: `p-${userId}`,
  activityId: 'act-1',
  userId,
  groupId: null,
  createdAt: '2026-07-20T00:00:00.000Z',
  user: {
    id: userId,
    email: `${userId}@example.com`,
    fullName: `User ${userId}`,
    department: 'Civil',
    role: 'STAFF',
    totalPoints: 0,
    syncToken: 'tok',
  } as ActivityParticipant['user'],
  group: null,
  ...overrides,
});

const checkIn = (userId: string, overrides: Partial<CheckIn> = {}): CheckIn => ({
  id: `c-${userId}`,
  userId,
  activityId: 'act-1',
  checkedInAt: '2026-07-20T02:00:00.000Z',
  method: 'QR',
  pointsAwardedAt: null,
  ...overrides,
});

describe('buildAttendeeRows', () => {
  it('lists the activity\'s participants, not every user in the faculty', () => {
    // The regression itself: two people enrolled, out of a faculty of many.
    const rows = buildAttendeeRows([participant('u1'), participant('u2')], []);

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.userId)).toEqual(['u1', 'u2']);
  });

  it('returns an empty roster for an activity nobody has joined', () => {
    // Previously this rendered the entire staff directory.
    expect(buildAttendeeRows([], [])).toEqual([]);
  });

  it('marks a participant who has checked in, carrying the check-in id for undo', () => {
    const rows = buildAttendeeRows([participant('u1')], [checkIn('u1')]);

    expect(rows[0].checkedInAt).toBe('2026-07-20T02:00:00.000Z');
    expect(rows[0].checkInId).toBe('c-u1');
    expect(rows[0].isWalkIn).toBe(false);
  });

  it('leaves an enrolled-but-absent participant with no check-in', () => {
    const rows = buildAttendeeRows([participant('u1')], []);

    expect(rows[0].checkedInAt).toBeNull();
    expect(rows[0].checkInId).toBeNull();
  });

  it('includes a QR walk-in who checked in without ever enrolling', () => {
    // createCheckIn does not require an ActivityParticipant row, so keying
    // the roster on participants alone would make this person vanish.
    const rows = buildAttendeeRows([participant('u1')], [checkIn('u9')]);

    expect(rows.map((r) => r.userId)).toEqual(['u1', 'u9']);
    expect(rows[1].isWalkIn).toBe(true);
    expect(rows[1].checkedInAt).toBe('2026-07-20T02:00:00.000Z');
  });

  it('does not duplicate someone who is both enrolled and checked in', () => {
    const rows = buildAttendeeRows([participant('u1')], [checkIn('u1')]);

    expect(rows).toHaveLength(1);
  });

  it('orders participants first and appends walk-ins, so the list does not reorder mid-event', () => {
    const rows = buildAttendeeRows(
      [participant('u1'), participant('u2')],
      [checkIn('u9'), checkIn('u2')],
    );

    expect(rows.map((r) => r.userId)).toEqual(['u1', 'u2', 'u9']);
  });

  it('survives a duplicate check-in in the payload without producing two rows', () => {
    const rows = buildAttendeeRows([], [checkIn('u9'), checkIn('u9', { id: 'c-dup' })]);

    expect(rows).toHaveLength(1);
    expect(rows[0].checkInId).toBe('c-u9'); // first wins
  });

  it('carries the enrolling group name through for cascade-enrolled participants', () => {
    const rows = buildAttendeeRows(
      [participant('u1', { groupId: 'g1', group: { id: 'g1', name: 'ภาควิชาโยธา' } })],
      [],
    );

    expect(rows[0].groupName).toBe('ภาควิชาโยธา');
  });

  it('carries pointsAwardedAt through so the step-gated badge can read it', () => {
    const rows = buildAttendeeRows(
      [participant('u1'), participant('u2')],
      [
        checkIn('u1', { pointsAwardedAt: '2026-07-20T05:00:00.000Z' }),
        checkIn('u2', { pointsAwardedAt: null }),
      ],
    );

    expect(rows[0].pointsAwardedAt).toBe('2026-07-20T05:00:00.000Z');
    expect(rows[1].pointsAwardedAt).toBeNull();
  });

  it('tolerates a participant row with no expanded user object', () => {
    const rows = buildAttendeeRows([participant('u1', { user: undefined })], []);

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBeUndefined();
    expect(rows[0].dept).toBeNull();
  });
});

describe('filterAttendeeRows', () => {
  const rows = buildAttendeeRows(
    [participant('u1'), participant('u2'), participant('u3')],
    [checkIn('u1')],
  );

  it('"all" mixes checked-in and not-checked-in people', () => {
    expect(filterAttendeeRows(rows, 'all', '')).toHaveLength(3);
  });

  it('"checkedIn" keeps only people with a check-in', () => {
    const out = filterAttendeeRows(rows, 'checkedIn', '');

    expect(out.map((r) => r.userId)).toEqual(['u1']);
  });

  it('"notCheckedIn" is the roster minus attendees, not the faculty minus attendees', () => {
    const out = filterAttendeeRows(rows, 'notCheckedIn', '');

    expect(out.map((r) => r.userId)).toEqual(['u2', 'u3']);
  });

  it('searches name and department, case-insensitively', () => {
    expect(filterAttendeeRows(rows, 'all', 'USER U2').map((r) => r.userId)).toEqual(['u2']);
    expect(filterAttendeeRows(rows, 'all', 'civil')).toHaveLength(3);
  });

  it('applies the filter before the search', () => {
    const out = filterAttendeeRows(rows, 'checkedIn', 'civil');

    expect(out.map((r) => r.userId)).toEqual(['u1']);
  });

  it('treats a whitespace-only search as no search', () => {
    expect(filterAttendeeRows(rows, 'all', '   ')).toHaveLength(3);
  });

  it('returns nothing when the search matches nobody', () => {
    expect(filterAttendeeRows(rows, 'all', 'zzz')).toEqual([]);
  });
});

describe('summariseAttendance', () => {
  it('divides by the roster size, not the faculty headcount', () => {
    const rows = buildAttendeeRows(
      [participant('u1'), participant('u2'), participant('u3'), participant('u4')],
      [checkIn('u1')],
    );

    expect(summariseAttendance(rows)).toEqual({ checkedIn: 1, total: 4, progress: 0.25 });
  });

  it('counts walk-ins in both the numerator and the denominator', () => {
    // A walk-in adds one checked-in person AND one roster row, so the
    // fraction stays coherent rather than exceeding 1.
    const rows = buildAttendeeRows([participant('u1')], [checkIn('u1'), checkIn('u9')]);

    expect(summariseAttendance(rows)).toEqual({ checkedIn: 2, total: 2, progress: 1 });
  });

  it('reports 0 rather than NaN for an empty roster', () => {
    expect(summariseAttendance([])).toEqual({ checkedIn: 0, total: 0, progress: 0 });
  });

  it('never exceeds 1', () => {
    const rows = buildAttendeeRows([participant('u1'), participant('u2')], [checkIn('u1'), checkIn('u2')]);

    expect(summariseAttendance(rows).progress).toBe(1);
  });
});

describe('recentManualCheckIns', () => {
  it('keeps only manual (walk-in desk) check-ins', () => {
    const out = recentManualCheckIns([
      checkIn('u1', { method: 'QR' }),
      checkIn('u2', { method: 'MANUAL' }),
    ]);

    expect(out.map((c) => c.userId)).toEqual(['u2']);
  });

  it('sorts newest first', () => {
    const out = recentManualCheckIns([
      checkIn('u1', { method: 'MANUAL', checkedInAt: '2026-07-20T01:00:00.000Z' }),
      checkIn('u2', { method: 'MANUAL', checkedInAt: '2026-07-20T03:00:00.000Z' }),
      checkIn('u3', { method: 'MANUAL', checkedInAt: '2026-07-20T02:00:00.000Z' }),
    ]);

    expect(out.map((c) => c.userId)).toEqual(['u2', 'u3', 'u1']);
  });

  it('caps at 5 by default', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      checkIn(`u${i}`, { method: 'MANUAL', checkedInAt: `2026-07-20T0${i}:00:00.000Z` }),
    );

    expect(recentManualCheckIns(many)).toHaveLength(5);
  });

  it('does not mutate the input array', () => {
    const input = [
      checkIn('u1', { method: 'MANUAL', checkedInAt: '2026-07-20T01:00:00.000Z' }),
      checkIn('u2', { method: 'MANUAL', checkedInAt: '2026-07-20T03:00:00.000Z' }),
    ];
    const before = input.map((c) => c.userId);

    recentManualCheckIns(input);

    expect(input.map((c) => c.userId)).toEqual(before);
  });
});
