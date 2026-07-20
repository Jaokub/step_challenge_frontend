import { useState, useEffect, useRef, useMemo } from 'react';
import { AppState } from 'react-native';

/** Local-midnight-stable day key, e.g. "2026-07-19". */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const msUntilNextMidnight = (now: Date) => {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 50);
  return next.getTime() - now.getTime();
};

/**
 * Returns a `Date` for "today" that actually changes when the day does.
 *
 * BUILD_PLAN.md Phase 9, Task 4 — the midnight-rollover fix. `useDashboard`
 * used to compute `const today = new Date()` inline on every render and then
 * feed it into a `useMemo` that deliberately excluded it from the dependency
 * array (there was an `eslint-disable exhaustive-deps` on it, because
 * including a fresh Date object each render would have re-run the memo every
 * single render). The consequence: the day strip's `isToday` highlight was
 * frozen at whatever day it was when the memo last ran. Leave the app open
 * overnight — which a phone app does constantly — and it keeps highlighting
 * yesterday until you happen to change month.
 *
 * Two triggers, because on mobile either one alone is insufficient:
 *  - a timer aimed at the next local midnight, for an app sitting in the
 *    foreground as the day turns;
 *  - an AppState resume check, because a backgrounded/suspended app's timers
 *    are throttled or dropped entirely by the OS, so the overwhelmingly common
 *    case (phone in a pocket overnight, opened in the morning) would otherwise
 *    never fire.
 *
 * The value is stored as a day-key string so re-renders don't produce a new
 * object identity; the returned `Date` is memo-stable for the whole day and
 * therefore safe to put in a dependency array.
 */
export function useToday(): Date {
  const [key, setKey] = useState(() => dayKey(new Date()));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sync = () => {
      const now = new Date();
      const nextKey = dayKey(now);
      // setState with an identical string is a no-op for React, so this is
      // safe to call as often as we like.
      setKey((prev) => (prev === nextKey ? prev : nextKey));

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(sync, msUntilNextMidnight(now));
    };

    sync();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.remove();
    };
  }, []);

  // Reconstructed from the key, memoised on it, so the object identity only
  // changes when the day actually changes — that's what makes it safe to use
  // as a `useMemo` / `useEffect` dependency.
  return useMemo(() => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [key]);
}

export default useToday;
