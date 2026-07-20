import { describe, it, expect, vi, beforeEach } from 'vitest';

const initialize = vi.fn();
const requestPermission = vi.fn();
const readRecords = vi.fn();

vi.mock('react-native-health-connect', () => ({
  initialize: (...a: any[]) => initialize(...a),
  requestPermission: (...a: any[]) => requestPermission(...a),
  readRecords: (...a: any[]) => readRecords(...a),
}));

const { GoogleHealthService } = await import('./GoogleHealthService');

const perm = (recordType: string) => ({ accessType: 'read', recordType });
const ALL = [perm('Steps'), perm('Distance'), perm('TotalCaloriesBurned')];

/**
 * Regression coverage for the Android Health Connect integration.
 *
 * **The bug these exist for.** `initHealthConnect` requested THREE
 * permissions and then checked `if (granted.length == 4)`. That condition can
 * never be true — `requestPermission` resolves with the subset of the
 * requested permissions the user granted, so its length is capped at 3. The
 * method therefore always returned `false`, `syncTodayHealthData` bailed at
 * its very first step, and **nothing was ever uploaded from an Android
 * device**. Since `HealthRecord.steps` is the ranking source of truth for
 * every leaderboard in the product, the entire ranking feature was inert on
 * the platform it ships to.
 *
 * Nothing caught it because the mobile side had no test runner at all, and
 * the failure is silent: a `console.warn` and an early return look identical
 * to "the user hasn't granted permissions yet".
 */
describe('GoogleHealthService.initHealthConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initialize.mockResolvedValue(true);
    readRecords.mockResolvedValue({ records: [] });
  });

  it('returns true when every requested permission is granted', async () => {
    requestPermission.mockResolvedValue(ALL);
    const svc = new GoogleHealthService();

    await expect(svc.initHealthConnect()).resolves.toBe(true);
  });

  it('does not depend on a hard-coded permission COUNT', async () => {
    // The original `granted.length == 4` check against 3 requested
    // permissions. If anyone reintroduces a magic number, this fails.
    requestPermission.mockResolvedValue(ALL);
    const svc = new GoogleHealthService();

    const granted = await svc.initHealthConnect();

    expect(granted).toBe(true);
    expect(requestPermission).toHaveBeenCalledTimes(1);
    // Exactly the three permissions we declare — no more, no fewer.
    expect(requestPermission.mock.calls[0][0]).toHaveLength(3);
  });

  it('returns false when the REQUIRED Steps permission is denied', async () => {
    requestPermission.mockResolvedValue([perm('Distance'), perm('TotalCaloriesBurned')]);
    const svc = new GoogleHealthService();

    await expect(svc.initHealthConnect()).resolves.toBe(false);
  });

  it('still succeeds when only the optional permissions are denied', async () => {
    // Steps alone is enough to keep the leaderboards working. Failing the
    // whole sync because the user declined Calories would take the core
    // feature down for a cosmetic metric.
    requestPermission.mockResolvedValue([perm('Steps')]);
    const svc = new GoogleHealthService();

    await expect(svc.initHealthConnect()).resolves.toBe(true);
  });

  it('returns false when Health Connect cannot initialize', async () => {
    initialize.mockResolvedValue(false);
    const svc = new GoogleHealthService();

    await expect(svc.initHealthConnect()).resolves.toBe(false);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('returns false rather than throwing when the native call rejects', async () => {
    initialize.mockRejectedValue(new Error('Health Connect not installed'));
    const svc = new GoogleHealthService();

    await expect(svc.initHealthConnect()).resolves.toBe(false);
  });

  it('caches a successful grant and does not re-prompt', async () => {
    requestPermission.mockResolvedValue(ALL);
    const svc = new GoogleHealthService();

    await svc.initHealthConnect();
    await svc.initHealthConnect();

    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache a failure — a later grant must be able to succeed', async () => {
    // The user can deny, then grant from Settings. A sticky `false` would
    // require an app restart to recover.
    requestPermission.mockResolvedValueOnce([]);
    const svc = new GoogleHealthService();
    await expect(svc.initHealthConnect()).resolves.toBe(false);

    requestPermission.mockResolvedValueOnce(ALL);
    await expect(svc.initHealthConnect()).resolves.toBe(true);
  });
});

describe('GoogleHealthService metric reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sums step counts across all records in the range', async () => {
    readRecords.mockResolvedValue({
      records: [{ count: 1200 }, { count: 3400 }, { count: 56 }],
    });
    const svc = new GoogleHealthService();

    await expect(svc.getSteps('a', 'b')).resolves.toBe(4656);
  });

  it('passes a between-filter with the given range', async () => {
    readRecords.mockResolvedValue({ records: [] });
    const svc = new GoogleHealthService();

    await svc.getSteps('2026-07-19T00:00:00.000Z', '2026-07-19T12:00:00.000Z');

    expect(readRecords).toHaveBeenCalledWith('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: '2026-07-19T00:00:00.000Z',
        endTime: '2026-07-19T12:00:00.000Z',
      },
    });
  });

  it('returns 0 (not NaN) when a record is missing its count', async () => {
    readRecords.mockResolvedValue({ records: [{ count: undefined }, { count: 100 }] });
    const svc = new GoogleHealthService();

    const steps = await svc.getSteps('a', 'b');
    expect(Number.isNaN(steps)).toBe(false);
    expect(steps).toBe(100);
  });

  it('returns 0 rather than throwing when the read fails', async () => {
    readRecords.mockRejectedValue(new Error('permission revoked'));
    const svc = new GoogleHealthService();

    await expect(svc.getSteps('a', 'b')).resolves.toBe(0);
  });

  it('sums distance in kilometres, rounded to 2dp', async () => {
    readRecords.mockResolvedValue({
      records: [{ distance: { inKilometers: 1.234 } }, { distance: { inKilometers: 2.345 } }],
    });
    const svc = new GoogleHealthService();

    await expect(svc.getDistance('a', 'b')).resolves.toBe(3.58);
  });

  it('sums calories in kcal, rounded to 2dp', async () => {
    readRecords.mockResolvedValue({
      records: [{ energy: { inKilocalories: 120.456 } }, { energy: { inKilocalories: 80.1 } }],
    });
    const svc = new GoogleHealthService();

    await expect(svc.getCalories('a', 'b')).resolves.toBe(200.56);
  });
});
