import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import dashboardService from './dashboardService';
import healthService from '../health/healthService';
import { syncTodayHealthData } from '../health/syncHealthData';
import leaderboardService from '../leaderboard/leaderboardService';
import groupService from '../group/groupService';
import { calculateDateRange, getCurrentDateRange, MOCK_MONTHS } from './dateRangeCalculator';
import { aggregateStats } from './statsAggregator';
import { queryKeys } from '../../constants/queryKeys';
import type { PersonalDashboard, HealthSummary, HealthRecord, AppGroup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export const MOCK_WEEKS = ['Last week', 'This week'];
export { MOCK_MONTHS };

interface DashboardBundle {
  dashboard: PersonalDashboard | null;
  healthSummary: HealthSummary | null;
  healthHistory: HealthRecord[];
  groups: AppGroup[];
}

export function useDashboard(colors: any) {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Computed fresh inside the hook so they never go stale across midnight
  const today = new Date();
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const MOCK_DATES = useMemo(
    () => Array.from({ length: daysInCurrentMonth }, (_, i) => (i + 1).toString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // คำนวณครั้งเดียวต่อ mount cycle; ถ้า app ข้ามเที่ยงคืนให้ remount component แทน
  );

  // ─── Timeframe state ──────────────────────────────────────
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [selectedDate, setSelectedDate] = useState(today.getDate().toString());
  const [selectedWeek, setSelectedWeek] = useState('This week');
  const [selectedMonth, setSelectedMonth] = useState(MOCK_MONTHS[today.getMonth()]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('friends');

  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // ─── Dashboard bundle (dashboard + health + groups) ───────
  // Health sync runs first so the summary/history fetched below reflect the
  // latest device reading. Sync errors are non-fatal — dashboard still loads
  // with stale data.
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
  // Query key carries group + date range, so TanStack Query caches each
  // combination (replaces the old hand-rolled leaderboardCache ref).
  const { startDate, endDate } = getCurrentDateRange(timeframe);
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

  // ─── Skeleton animation timers (unchanged behavior) ───────

  useEffect(() => {
    // Big tab changes -> animate the stats section
    setIsStatsLoading(true);
    const timer = setTimeout(() => setIsStatsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [timeframe]);

  useEffect(() => {
    // Small tab changes -> animate TOP ONLY
    setIsStatsLoading(true);
    const timer = setTimeout(() => setIsStatsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedWeek, selectedMonth]);

  // ─── Derived stats ────────────────────────────────────────

  const { steps, distance, calories } = useMemo(() => {
    const raw = aggregateStats(
      timeframe, selectedDate, selectedWeek, selectedMonth,
      healthSummary, healthHistory
    );
    return {
      steps: raw.steps,
      distance: parseFloat(raw.distance.toFixed(2)),
      calories: Math.round(raw.calories),
    };
  }, [timeframe, selectedDate, selectedWeek, selectedMonth, healthSummary, healthHistory]);

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
  const goal = timeframe === 'Monthly' ? dailyGoal * 30 : timeframe === 'Weekly' ? dailyGoal * 7 : dailyGoal;
  const currentSteps = parseInt(stats.steps, 10);
  const progressRatio = Math.min(Math.max(currentSteps / goal, 0), 1);
  const strokeDashoffset = SV_CIRCUMFERENCE - progressRatio * SV_CIRCUMFERENCE;

  return {
    timeframe, setTimeframe,
    selectedDate, setSelectedDate,
    selectedWeek, setSelectedWeek,
    selectedMonth, setSelectedMonth,
    selectedGroupId, setSelectedGroupId,
    mockDates: MOCK_DATES,
    userGroups,
    stats,
    currentLeaderboard,
    upcomingEvents,
    svgProps: { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps },
    loading: dashboardQuery.isPending,
    error: dashboardQuery.isError,
    hasData: dashboardData !== null,
    isLeaderboardLoading: leaderboardQuery.isPending || leaderboardQuery.isFetching,
    isStatsLoading,
    refreshDashboard: dashboardQuery.refetch,
    currentStreak: dashboardData?.currentStreak || 0,
  };
}
