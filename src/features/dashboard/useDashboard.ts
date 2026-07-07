import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import dashboardService from './dashboardService';
import healthService from '../health/healthService';
import { syncTodayHealthData } from '../health/syncHealthData';
import leaderboardService from '../leaderboard/leaderboardService';
import groupService from '../group/groupService';
import { calculateDateRange, MOCK_MONTHS } from './dateRangeCalculator';
import { aggregateStats } from './statsAggregator';
import { queryKeys } from '../../constants/queryKeys';
import type { PersonalDashboard, HealthSummary, HealthRecord, AppGroup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export const MOCK_WEEKS = ['Last week', 'This week'];
export { MOCK_MONTHS };

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
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [selectedDate, setSelectedDate] = useState(today.getDate().toString());
  const [selectedWeek, setSelectedWeek] = useState('This week');
  // Reference month/year the header is browsing. Default = current month.
  const [refMonth, setRefMonth] = useState(today.getMonth());
  const [refYear, setRefYear] = useState(today.getFullYear());
  const [selectedGroupId, setSelectedGroupId] = useState<string>('friends');

  const [isStatsLoading, setIsStatsLoading] = useState(false);

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

  // Clamp the selected day so it stays valid when the month shrinks.
  const clampSelectedDay = useCallback(
    (year: number, month: number) => {
      const maxDay = new Date(year, month + 1, 0).getDate();
      setSelectedDate((prev) => {
        const d = parseInt(prev, 10);
        return d > maxDay ? maxDay.toString() : prev;
      });
    },
    []
  );

  const goToPrevMonth = useCallback(() => {
    setRefMonth((m) => {
      const nm = m === 0 ? 11 : m - 1;
      const ny = m === 0 ? refYear - 1 : refYear;
      if (m === 0) setRefYear(ny);
      clampSelectedDay(ny, nm);
      return nm;
    });
  }, [refYear, clampSelectedDay]);

  const goToNextMonth = useCallback(() => {
    setRefMonth((m) => {
      const nm = m === 11 ? 0 : m + 1;
      const ny = m === 11 ? refYear + 1 : refYear;
      if (m === 11) setRefYear(ny);
      clampSelectedDay(ny, nm);
      return nm;
    });
  }, [refYear, clampSelectedDay]);

  const setRefMonthYear = useCallback(
    (month: number, year: number) => {
      setRefMonth(month);
      setRefYear(year);
      clampSelectedDay(year, month);
    },
    [clampSelectedDay]
  );

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
  const { startDate, endDate } = calculateDateRange(
    timeframe,
    selectedDate,
    selectedWeek,
    refYear,
    refMonth
  );
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

  // ─── Skeleton animation timers ────────────────────────────

  useEffect(() => {
    // Big tab changes -> animate the stats section
    setIsStatsLoading(true);
    const timer = setTimeout(() => setIsStatsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [timeframe]);

  useEffect(() => {
    // Small selection changes -> animate TOP ONLY
    setIsStatsLoading(true);
    const timer = setTimeout(() => setIsStatsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedWeek, refMonth, refYear]);

  // ─── Derived stats ────────────────────────────────────────

  const { steps, distance, calories } = useMemo(() => {
    const raw = aggregateStats(
      timeframe, selectedDate, selectedWeek, refYear, refMonth,
      healthSummary, healthHistory
    );
    return {
      steps: raw.steps,
      distance: parseFloat(raw.distance.toFixed(2)),
      calories: Math.round(raw.calories),
    };
  }, [timeframe, selectedDate, selectedWeek, refYear, refMonth, healthSummary, healthHistory]);

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
    selectedDate, setSelectedDate,
    selectedWeek, setSelectedWeek,
    refMonth, refYear, setRefMonthYear,
    goToPrevMonth, goToNextMonth,
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
    isLeaderboardLoading: leaderboardQuery.isPending || leaderboardQuery.isFetching,
    isStatsLoading,
    refreshDashboard: dashboardQuery.refetch,
    currentStreak: dashboardData?.currentStreak || 0,
  };
}
