import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import checkinService from '../activity/checkinService';
import { syncTodayHealthData } from './syncHealthData';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { queryKeys } from '../../constants/queryKeys';

// ADR-001 §"Real-time delivery" (BUILD_PLAN.md Phase 7 PR 2) — "real-time"
// here is sync-frequency-bound, not storage-bound: while the app is
// foregrounded and the user has an ONGOING, checked-in, not-yet-paid
// step-gated activity, poll `syncTodayHealthData` on this interval (and on
// every foreground transition) so a goal crossed mid-walk shows up without
// the user having to background/reopen the app or pull the dashboard.
const POLL_INTERVAL_MS = 45_000;
// How far back to look for an active check-in. A user's own check-in
// history is small in practice; 50 comfortably covers "any activity they
// could plausibly still be mid-walk on" without needing a dedicated
// backend filter for this UI-only concern.
const HISTORY_LOOKBACK_LIMIT = 50;

/**
 * Mount once near the app root (inside AuthProvider + ToastProvider). No-ops
 * entirely unless the signed-in user has at least one ONGOING, checked-in,
 * step-gated activity whose goal hasn't been reached yet — most users incur
 * no extra polling at all.
 */
export function useActiveEventPolling() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activeCheckIns } = useQuery({
    queryKey: queryKeys.checkins.activeStepGated,
    queryFn: async () => {
      const res = await checkinService.getCheckinHistory({ limit: HISTORY_LOOKBACK_LIMIT });
      if (!res.success) return [];
      return (res.data.checkIns ?? []).filter(
        (c) => c.activity?.status === 'ONGOING' && c.activity?.expectedSteps != null && !c.pointsAwardedAt,
      );
    },
    enabled: !!user,
    // Keeps the "do I even have an active goal" list itself fresh (e.g. an
    // activity ends, or the user checks into a new one from another screen)
    // independent of the foreground sync poll below.
    refetchInterval: POLL_INTERVAL_MS,
  });

  const hasActiveGoal = (activeCheckIns?.length ?? 0) > 0;

  useEffect(() => {
    if (!user || !hasActiveGoal) return undefined;

    const runSync = async () => {
      try {
        const result = await syncTodayHealthData();
        const awardedIds = result?.awardedActivityIds ?? [];
        if (awardedIds.length === 0) return;

        const titleById = new Map((activeCheckIns ?? []).map((c) => [c.activityId, c.activity?.title ?? '']));
        awardedIds.forEach((activityId) => {
          showToast(t('scan.goalReached', { title: titleById.get(activityId) ?? '' }), 'success');
        });

        // A goal-reached award changes points, streak, and this activity's
        // paid state — refresh everything that displays them (mirrors
        // scan.tsx's checkinMutation invalidations).
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.personal });
        queryClient.invalidateQueries({ queryKey: queryKeys.users.profileScreen });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.checkins.activeStepGated });
      } catch (e) {
        console.warn('[useActiveEventPolling] sync failed', e);
      }
    };

    // Sync immediately on mount/whenever an active goal first appears —
    // don't make the user wait a full interval for the first check.
    runSync();
    intervalRef.current = setInterval(runSync, POLL_INTERVAL_MS);

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        runSync();
        if (!intervalRef.current) intervalRef.current = setInterval(runSync, POLL_INTERVAL_MS);
      } else if (intervalRef.current) {
        // Backgrounded — stop polling; no point syncing health data (or
        // burning battery) for a screen no one is looking at.
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      subscription.remove();
    };
    // activeCheckIns is intentionally excluded — it changes on every
    // refetch (new object identity) and would tear down/rebuild the
    // interval constantly; hasActiveGoal (a boolean) is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasActiveGoal]);
}

export default useActiveEventPolling;
