import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import dashboardService from './dashboardService';
import healthService from '../health/healthService';
import { syncTodayHealthData } from '../health/syncHealthData';
import leaderboardService from '../leaderboard/leaderboardService';
import groupService from '../group/groupService';
import { calculateDateRange, addMonthsClamped } from './dateRangeCalculator';
import { aggregateStats } from './statsAggregator';
import { queryKeys } from '../../constants/queryKeys';
import type { PersonalDashboard, HealthSummary, HealthRecord, AppGroup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export interface DayTab {
  day: number;
  weekdayIndex: number; // 0=Sun ... 6=Sat
  isToday: boolean;
}

interface DashboardBundle {
  dashboard: PersonalDashboard | null;
  healthSummary: HealthSummary | null;
  healthHistory: HealthRecord[];
  groups: AppGroup[];
}

export function useDashboard(colors: any) {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const today = new Date();

  // ─── Timeframe + reference-period state ───────────────────
  // A single anchorDate drives all three modes — switching modes keeps context
  // (e.g. pick a day, then tap Weekly to see that day's week).
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [anchorDate, setAnchorDate] = useState(today);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('friends');

  const refMonth = anchorDate.getMonth();
  const refYear = anchorDate.getFullYear();

  // Days in the currently-browsed month, plus per-day metadata for the tab strip.
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

  // Used by the day strip and the month/year picker — both jump within the month,
  // clamping the day so it stays valid (e.g. picking Feb while on the 31st).
  const setAnchorDay = useCallback((day: number) => {
    setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), day));
  }, []);

  const setAnchorMonthYear = useCallback((month: number, year: number) => {
    setAnchorDate((prev) => {
      const daysInTarget = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(prev.getDate(), daysInTarget));
    });
  }, []);

  // ─── Dashboard bundle (dashboard + health + groups) ───────
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.personal,
    queryFn: async (): Promise<DashboardBundle> => {
      await syncTodayHealthData().catch((e) =>
        console.warn('[useDashboard] Health sync failed, continuing:', e)
      );

      const [dashRes, sumRes, histRes, groupsRes] = await Promise.all([
        dashboardService.getPersonalDashboard(),
        healthService.getHealthSummary(),
        healthService.getHealthHistory({ limit: 100 }),
        groupService.getGroups(),
      ]);

      return {
        dashboard: dashRes.success ? dashRes.data || null : null,
        healthSummary: sumRes.success ? sumRes.data || null : null,
        healthHistory: histRes.success ? histRes.data || [] : [],
        groups: groupsRes?.success ? groupsRes.data || [] : [],
      };
    },
  });

  const dashboardData = dashboardQuery.data?.dashboard ?? null;
  const healthSummary = dashboardQuery.data?.healthSummary ?? null;
  const healthHistory = dashboardQuery.data?.healthHistory ?? [];
  const userGroups = dashboardQuery.data?.groups ?? [];

  // ─── Leaderboard ──────────────────────────────────────────
  // Reflects the period the header is currently browsing.
  const { startDate, endDate } = calculateDateRange(timeframe, anchorDate);
  const normalizeDate = (d: string | undefined) =>
    d ? new Date(d).toISOString().split('T')[0] : undefined;

  const leaderboardQuery = useQuery({
    queryKey: queryKeys.leaderboard.scoped(
      selectedGroupId,
      normalizeDate(startDate),
      normalizeDate(endDate)
    ),
    queryFn: async () => {
      const params = { startDate, endDate };
      const res = selectedGroupId === 'friends'
        ? await leaderboardService.getFriendsLeaderboard(params)
        : await leaderboardService.getGroupLeaderboard(selectedGroupId, params);
      if (!res?.success) throw new Error('Failed to load leaderboard');
      return res.data as any[];
    },
  });

  // Keep top 5 but ensure the current user is always included
  const leaderboardData = useMemo(() => {
    const data = leaderboardQuery.data ?? [];
    let top5 = data.slice(0, 5);
    const myData = data.find((u: any) => u.id === user?.id);
    if (myData && !top5.some((u: any) => u.id === myData.id)) {
      top5 = [...top5, myData];
    }
    return top5;
  }, [leaderboardQuery.data, user?.id]);

  // ─── Derived stats ────────────────────────────────────────

  const { steps, distance, calories } = useMemo(() => {
    const raw = aggregateStats(timeframe, anchorDate, healthSummary, healthHistory);
    return {
      steps: raw.steps,
      distance: parseFloat(raw.distance.toFixed(2)),
      calories: Math.round(raw.calories),
    };
  }, [timeframe, anchorDate, healthSummary, healthHistory]);

  // ─── Display transforms ───────────────────────────────────

  const stats = { steps: steps.toString(), activeCalories: calories, distance };

  const upcomingEvents = (dashboardData?.upcomingActivities || []).map((act) => ({
    id: act.id,
    icon: 'walk',
    title: act.title,
    date: formatDate(act.startDate, i18n.language, 'weekday'),
  }));

  const currentLeaderboard = [...leaderboardData]
    .sort((a: any, b: any) => (b.points ?? b.totalPoints ?? 0) - (a.points ?? a.totalPoints ?? 0))
    .map((u: any, idx: number) => ({
      id: u.id,
      rank: idx + 1,
      name: u.fullName || u.name,
      points: u.points ?? u.totalPoints ?? 0,
      isMe: user?.id === u.id,
      steps: u.steps || 0,
      distance: u.distance || 0,
      calories: u.calories || 0,
      rankColor: idx === 0 ? colors.warning : idx === 1 ? colors.textCardSecondary : colors.card,
    }));

  // ─── SVG progress ring props ──────────────────────────────

  const SV_SIZE = 200;
  const SV_STROKE = 22;
  const SV_RADIUS = (SV_SIZE - SV_STROKE) / 2;
  const SV_CIRCUMFERENCE = 2 * Math.PI * SV_RADIUS;
  const dailyGoal = 12000;
  const goal = timeframe === 'Monthly' ? dailyGoal * daysInRefMonth : timeframe === 'Weekly' ? dailyGoal * 7 : dailyGoal;
  const currentSteps = parseInt(stats.steps, 10);
  const progressRatio = Math.min(Math.max(currentSteps / goal, 0), 1);
  const strokeDashoffset = SV_CIRCUMFERENCE - progressRatio * SV_CIRCUMFERENCE;

  return {
    timeframe, setTimeframe,
    anchorDate,
    refMonth, refYear,
    goToPrev, goToNext,
    setAnchorDay, setAnchorMonthYear,
    dayTabs,
    goal,
    selectedGroupId, setSelectedGroupId,
    userGroups,
    stats,
    currentLeaderboard,
    upcomingEvents,
    svgProps: { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps, goal },
    loading: dashboardQuery.isPending,
    error: dashboardQuery.isError,
    hasData: dashboardData !== null,
    // `isPending` only — no cached data yet for this key. Deliberately excludes
    // `isFetching`: that's also true during a background revalidation of data we
    // already have cached (e.g. re-selecting a group/date within staleTime), and
    // swapping the real rows for a full skeleton on every re-visit made the 60s
    // cache (see queryClient.ts) invisible/pointless from the UI's perspective.
    isLeaderboardLoading: leaderboardQuery.isPending,
    // Steps/kcal/km are a synchronous re-slice of `healthHistory`, which is
    // already fully loaded by `dashboardQuery` — switching date/timeframe never
    // triggers a new fetch, so there's nothing to show a skeleton for there.
    // `isPending` only covers the one real gap: the very first load.
    isStatsLoading: dashboardQuery.isPending,
    refreshDashboard: dashboardQuery.refetch,
    currentStreak: dashboardData?.currentStreak || 0,
  };
}
