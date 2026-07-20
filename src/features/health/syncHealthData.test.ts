import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const init = vi.fn();
const getSteps = vi.fn();
const getDistance = vi.fn();
const getCalories = vi.fn();

vi.mock('../../services/health', () => ({
  HealthService: {
    init: (...a: any[]) => init(...a),
    getSteps: (...a: any[]) => getSteps(...a),
    getDistance: (...a: any[]) => getDistance(...a),
    getCalories: (...a: any[]) => getCalories(...a),
  },
}));

const syncHealthDataApi = vi.fn();
vi.mock('./healthService', () => ({
  default: { syncHealthData: (...a: any[]) => syncHealthDataApi(...a) },
}));

const { syncTodayHealthData } = await import('./syncHealthData');

/**
 * `syncTodayHealthData` is the single path by which a device's step count
 * reaches the backend, and therefore the only thing that populates
 * `HealthRecord.steps` — which every leaderboard in the product aggregates.
 *
 * It had no coverage, and its first line is a permission gate that silently
 * returns `undefined`. That gate is exactly what a bug in
 * `GoogleHealthService.initHealthConnect` tripped: the sync "worked" in the
 * sense that it never threw, while uploading nothing, forever.
 */
describe('syncTodayHealthData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    init.mockResolvedValue(true);
    getSteps.mockResolvedValue(8421);
    getDistance.mockResolvedValue(6.12);
    getCalories.mockResolvedValue(310.5);
    syncHealthDataApi.mockResolvedValue({ message: 'ok', data: { awardedActivityIds: [] } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips the upload entirely when health permission is not granted', async () => {
    init.mockResolvedValue(false);

    const result = await syncTodayHealthData();

    expect(result).toBeUndefined();
    expect(syncHealthDataApi).not.toHaveBeenCalled();
    expect(getSteps).not.toHaveBeenCalled();
  });

  it('uploads the metrics it read from the platform', async () => {
    await syncTodayHealthData();

    expect(syncHealthDataApi).toHaveBeenCalledTimes(1);
    const payload = syncHealthDataApi.mock.calls[0][0];
    expect(payload.steps).toBe(8421);
    expect(payload.distanceKm).toBe(6.12);
    expect(payload.calories).toBe(310.5);
    expect(payload.source).toBe('GOOGLE_HEALTH');
  });

  it('sends recordDate as a LOCAL YYYY-MM-DD, not a UTC-shifted one', async () => {
    // The backend's validator requires this exact format, and the date
    // decides which Thai day the steps land on. Late-evening Bangkok time is
    // the trap: 2026-07-19 23:30 +07 is already 2026-07-19 16:30 UTC, so a
    // naive toISOString().slice(0,10) would file it under the wrong day near
    // midnight. Pin the local-date behaviour.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 19, 23, 30, 0)); // local 2026-07-19 23:30

    await syncTodayHealthData();

    expect(syncHealthDataApi.mock.calls[0][0].recordDate).toBe('2026-07-19');
  });

  it('zero-pads single-digit months and days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 9, 0, 0)); // local 2026-01-05

    await syncTodayHealthData();

    expect(syncHealthDataApi.mock.calls[0][0].recordDate).toBe('2026-01-05');
  });

  it('reads from local midnight up to now', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 19, 14, 0, 0));

    await syncTodayHealthData();

    const [startTime, endTime] = getSteps.mock.calls[0];
    expect(new Date(startTime).getHours()).toBe(0);
    expect(new Date(startTime).getMinutes()).toBe(0);
    expect(new Date(endTime).getHours()).toBe(14);
    // All three metrics must share one window or the numbers won't reconcile.
    expect(getDistance.mock.calls[0]).toEqual([startTime, endTime]);
    expect(getCalories.mock.calls[0]).toEqual([startTime, endTime]);
  });

  it('returns awardedActivityIds so the poller can celebrate a reached goal', async () => {
    syncHealthDataApi.mockResolvedValue({
      message: 'ok',
      data: { awardedActivityIds: ['act-1', 'act-2'] },
    });

    const result = await syncTodayHealthData();

    expect(result).toEqual({ awardedActivityIds: ['act-1', 'act-2'] });
  });

  it('defaults awardedActivityIds to [] when the backend omits it', async () => {
    syncHealthDataApi.mockResolvedValue({ message: 'ok', data: {} });

    const result = await syncTodayHealthData();

    expect(result).toEqual({ awardedActivityIds: [] });
  });

  it('still uploads steps when optional metrics come back as 0', async () => {
    // Mirrors the degraded-permission case: Steps granted, Distance and
    // Calories denied, so their getters resolve to 0. The step count — the
    // one that actually drives ranking — must still be sent.
    getDistance.mockResolvedValue(0);
    getCalories.mockResolvedValue(0);

    await syncTodayHealthData();

    const payload = syncHealthDataApi.mock.calls[0][0];
    expect(payload.steps).toBe(8421);
    expect(payload.distanceKm).toBe(0);
  });
});
