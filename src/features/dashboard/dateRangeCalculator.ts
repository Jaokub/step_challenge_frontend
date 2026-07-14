/**
 * Calculates the start and end date strings for a given leaderboard timeframe selection.
 * This is a pure function with no side effects.
 *
 * Unit-aware nav: a single `anchorDate` drives all three modes. Switching modes keeps
 * context (e.g. pick a day, then tap Weekly to see that day's week) — see useDashboard.ts.
 */

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

const pad = (n: number) => n.toString().padStart(2, '0');
const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (date: Date, n: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/** Monday-start week, matching the backend's getHealthSummary convention. */
export const startOfWeek = (date: Date): Date => {
  const day = date.getDay(); // 0=Sun ... 6=Sat
  const mondayOffset = day === 0 ? 6 : day - 1;
  return addDays(date, -mondayOffset);
};

/** Steps by whole months, clamping the day so e.g. Jan 31 -> Feb 28. */
export const addMonthsClamped = (date: Date, delta: number): Date => {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, daysInTarget));
  return target;
};

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

/**
 * Given a timeframe and the anchor date the header is currently browsing, returns the
 * corresponding start/end date strings for that unit (day / Mon-Sun week / month).
 */
export const calculateDateRange = (timeframe: Timeframe, anchorDate: Date): DateRange => {
  if (timeframe === 'Daily') {
    return { startDate: formatDate(anchorDate), endDate: formatDate(addDays(anchorDate, 1)) };
  }

  if (timeframe === 'Weekly') {
    const start = startOfWeek(anchorDate);
    return { startDate: formatDate(start), endDate: formatDate(addDays(start, 7)) };
  }

  if (timeframe === 'Monthly') {
    const startOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const endOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1);
    return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
  }

  return { startDate: undefined, endDate: undefined };
};
