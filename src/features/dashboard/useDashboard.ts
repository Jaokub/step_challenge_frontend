import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import dashboardService from './dashboardService';
import healthService from '../health/healthService';
import { syncTodayHealthData } from '../health/syncHealthData';
import leaderboardService from '../leaderboard/leaderboardService';
import groupService from '../group/groupService';
import { calculateDateRange, getCurrentDateRange, MOCK_MONTHS } from './dateRangeCalculator';
import { aggregateStats } from './statsAggregator';
import type { PersonalDashboard, HealthSummary, HealthRecord, AppGroup } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatDate';

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export const MOCK_WEEKS = ['Last week', 'This week'];
export { MOCK_MONTHS };

// FIX #1: ลบ module-level MOCK_DATES ออก เพราะถูก shadow โดย inner declaration
// และ export ไม่เคยถูกใช้จริง ย้ายมา compute ใน hook เพื่อให้ up-to-date เสมอ
// หาก DashboardComponents ต้องการ MOCK_DATES ให้รับผ่าน return value ของ hook แทน

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

  // ─── Data state ───────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashboardData, setDashboardData] = useState<PersonalDashboard | null>(null);
  const [userGroups, setUserGroups] = useState<AppGroup[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const leaderboardCache = useRef<Record<string, any[]>>({});

  // ─── Data fetching ────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Push today's Health Connect data to the backend first,
      // so the summary/history we fetch below reflects the latest reading.
      // Errors here are non-fatal — dashboard still loads with stale data.
      await syncTodayHealthData().catch((e) =>
        console.warn('[useDashboard] Health sync failed, continuing:', e)
      );

      const [dashRes, sumRes, histRes, groupsRes] = await Promise.all([
        dashboardService.getPersonalDashboard(),
        healthService.getHealthSummary(),
        healthService.getHealthHistory({ limit: 100 }),
        groupService.getGroups(),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data || null);
      if (sumRes.success) setHealthSummary(sumRes.data || null);
      if (histRes.success) setHealthHistory(histRes.data || []);
      if (groupsRes?.success) setUserGroups(groupsRes.data || []);
    } catch (err) {
      console.error('fetchDashboardData error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // FIX: Only show leaderboard skeleton when timeframe changes
      // Small tabs and groups will update silently without skeleton on the leaderboard

      // แทนที่จะ hardcode ด้วย current date เสมอ
      // ทำให้ leaderboard แสดงข้อมูลตรงกับ stats ที่ user เลือก
      const { startDate, endDate } = getCurrentDateRange(timeframe);

      // FIX #3: normalize date string เพื่อป้องกัน cache miss จาก format ต่างกัน
      const normalizeDate = (d: string | undefined) =>
        d ? new Date(d).toISOString().split('T')[0] : 'none';

      const cacheKey = `${selectedGroupId}_${normalizeDate(startDate)}_${normalizeDate(endDate)}`;

      if (leaderboardCache.current[cacheKey]) {
        setLeaderboardData(leaderboardCache.current[cacheKey]);
        setIsLeaderboardLoading(false);
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
    } finally {
      setIsLeaderboardLoading(false);
    }
  // FIX #4: เพิ่ม selectedDate, selectedWeek, selectedMonth เข้า dependency array
  // ให้ครบตามที่ใช้จริงข้างในฟังก์ชัน
  }, [selectedGroupId, timeframe, selectedDate, selectedWeek, selectedMonth, user?.id]);

  useEffect(() => {
    // Big tab changes -> animate BOTH top and bottom
    setIsLeaderboardLoading(true);
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

  useEffect(() => {
    // Group changes -> animate BOTTOM ONLY
    // Since fetchLeaderboard sets isLeaderboardLoading(false) when done,
    // we only need to set it to true here. But wait, fetchLeaderboard doesn't set it to false if it's already fetching?
    // fetchLeaderboard DOES set it to false in `finally`.
    setIsLeaderboardLoading(true);
  }, [selectedGroupId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

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
    loading,
    error,
    hasData: dashboardData !== null,
    isLeaderboardLoading,
    isStatsLoading,
    refreshDashboard: fetchDashboardData,
    currentStreak: dashboardData?.currentStreak || 0,
  };
}
