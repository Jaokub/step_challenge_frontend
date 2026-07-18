import { useState, useMemo, useCallback } from 'react';
import { addMonthsClamped } from '../features/dashboard/dateRangeCalculator';

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export interface DayTab {
  day: number;
  weekdayIndex: number; // 0=Sun ... 6=Sat
  isToday: boolean;
}

/**
 * Daily/Weekly/Monthly timeframe + anchor-date navigation, shared by any
 * screen that needs the home-dashboard's date strip (see DashboardComponents'
 * DashboardHeader, whose nav/toggle/day-strip logic this mirrors 1:1 so both
 * surfaces stay in sync). A single `anchorDate` drives all three modes —
 * switching modes keeps context (e.g. pick a day, then tap Weekly to see that
 * day's week).
 */
export function useTimeframeNav(initial: Timeframe = 'Daily') {
  const today = new Date();
  const [timeframe, setTimeframe] = useState<Timeframe>(initial);
  const [anchorDate, setAnchorDate] = useState(today);

  const refMonth = anchorDate.getMonth();
  const refYear = anchorDate.getFullYear();

  const daysInRefMonth = new Date(refYear, refMonth + 1, 0).getDate();
  const dayTabs: DayTab[] = useMemo(() => {
    return Array.from({ length: daysInRefMonth }, (_, i) => {
      const day = i + 1;
      return {
        day,
        weekdayIndex: new Date(refYear, refMonth, day).getDay(),
        isToday:
          day === today.getDate() &&
          refMonth === today.getMonth() &&
          refYear === today.getFullYear(),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refYear, refMonth, daysInRefMonth]);

  const goToPrev = useCallback(() => {
    setAnchorDate((prev) => {
      if (timeframe === 'Daily') return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1);
      if (timeframe === 'Weekly') return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
      return addMonthsClamped(prev, -1);
    });
  }, [timeframe]);

  const goToNext = useCallback(() => {
    setAnchorDate((prev) => {
      if (timeframe === 'Daily') return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
      if (timeframe === 'Weekly') return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
      return addMonthsClamped(prev, 1);
    });
  }, [timeframe]);

  const setAnchorDay = useCallback((day: number) => {
    setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), day));
  }, []);

  const setAnchorMonthYear = useCallback((month: number, year: number) => {
    setAnchorDate((prev) => {
      const daysInTarget = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(prev.getDate(), daysInTarget));
    });
  }, []);

  return {
    timeframe, setTimeframe,
    anchorDate,
    refMonth, refYear,
    dayTabs,
    goToPrev, goToNext,
    setAnchorDay, setAnchorMonthYear,
  };
}
