import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dashboardService from '../services/dashboardService';
import healthService from '../../health/services/healthService';
import leaderboardService from '../../leaderboard/services/leaderboardService';
import groupService from '../../group/services/groupService';
import { calculateDateRange, MOCK_MONTHS } from '../utils/dateRangeCalculator';
import { aggregateStats } from '../utils/statsAggregator';
import type { PersonalDashboard, HealthSummary, HealthRecord, AppGroup } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export const MOCK_WEEKS = ['Last week', 'This week'];
export { MOCK_MONTHS };

export function useDashboard(colors: any) {
  const { user } = useAuth();

  // Computed fresh inside the hook so they never go stale across midnight
  const today = new Date();
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const MOCK_DATES = Array.from({ length: daysInCurrentMonth }, (_, i) => (i + 1).toString());

  // ─── Timeframe state ──────────────────────────────────────
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [selectedDate, setSelectedDate] = useState(today.getDate().toString());
  const [selectedWeek, setSelectedWeek] = useState('This week');
  const [selectedMonth, setSelectedMonth] = useState(MOCK_MONTHS[today.getMonth()]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('friends');

  // ─── Data state ───────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<PersonalDashboard | null>(null);
  const [userGroups, setUserGroups] = useState<AppGroup[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const leaderboardCache = useRef<Record<string, any[]>>({});

  // ─── Data fetching ────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, sumRes, histRes, groupsRes] = await Promise.all([
        dashboardService.getPersonalDashboard(),
        healthService.getHealthSummary(),
        healthService.getHealthHistory({ limit: 100 }),
        groupService.getGroups(),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (sumRes.success) setHealthSummary(sumRes.data);
      if (histRes.success) setHealthHistory(histRes.data);
      if (groupsRes?.success) setUserGroups(groupsRes.data);
    } catch (error) {
      console.error('fetchDashboardData error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // Delegate date range calculation to the shared utility — no duplication
      const { startDate, endDate } = calculateDateRange(
        timeframe, selectedDate, selectedWeek, selectedMonth
      );

      const cacheKey = `${selectedGroupId}_${startDate || 'none'}_${endDate || 'none'}`;
      if (leaderboardCache.current[cacheKey]) {
        setLeaderboardData(leaderboardCache.current[cacheKey]);
        return;
      }

      const params = { startDate, endDate };
      const res = selectedGroupId === 'friends'
        ? await leaderboardService.getFriendsLeaderboard(params)
        : await leaderboardService.getGroupLeaderboard(selectedGroupId, params);

      if (!res?.success) return;

      // Keep top 5 but ensure the current user is always included
      let top5 = res.data.slice(0, 5);
      const myData = res.data.find((u: any) => u.id === user?.id);
      if (myData && !top5.some((u: any) => u.id === myData.id)) {
        top5 = [...top5, myData];
      }

      leaderboardCache.current[cacheKey] = top5;
      setLeaderboardData(top5);
    } catch (error) {
      console.error('fetchLeaderboard error:', error);
    }
  // All selection state that drives the date range must be declared as deps
  }, [selectedGroupId, timeframe, selectedDate, selectedWeek, selectedMonth, user?.id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ─── Derived stats ────────────────────────────────────────

  const { steps, distance, calories } = useMemo(() => {
    // Prefer leaderboard data for the current user (ensures consistency with the displayed rank)
    const myLeaderboardUser = leaderboardData.find((u: any) => u.id === user?.id);
    if (myLeaderboardUser?.steps !== undefined) {
      return {
        steps: myLeaderboardUser.steps || 0,
        distance: parseFloat(Number(myLeaderboardUser.distance || 0).toFixed(2)),
        calories: Math.round(myLeaderboardUser.calories || 0),
      };
    }

    const raw = aggregateStats(
      timeframe, selectedDate, selectedWeek, selectedMonth,
      healthSummary, healthHistory
    );
    return {
      steps: raw.steps,
      distance: parseFloat(raw.distance.toFixed(2)),
      calories: Math.round(raw.calories),
    };
  }, [timeframe, selectedDate, selectedWeek, selectedMonth, healthSummary, healthHistory, leaderboardData, user?.id]);

  // ─── Display transforms ───────────────────────────────────

  const stats = { steps: steps.toString(), activeCalories: calories, distance };

  const upcomingEvents = (dashboardData?.upcomingActivities || []).map((act) => ({
    id: act.id,
    icon: 'walk',
    title: act.title,
    date: new Date(act.startDate).toLocaleDateString(),
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
    loading,
    refreshDashboard: fetchDashboardData,
    currentStreak: dashboardData?.currentStreak || 0,
  };
}
