import { useState, useEffect, useCallback, useMemo } from 'react';
import dashboardService from '../services/dashboardService';
import healthService from '../../health/services/healthService';
import leaderboardService from '../../../services/leaderboardService';
import type { PersonalDashboard, HealthSummary, HealthRecord } from '../../../types';
import groupService from '../../group/services/groupService';
import type { AppGroup } from '../../../types';

type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

const today = new Date();
const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
export const MOCK_DATES = Array.from({length: daysInCurrentMonth}, (_, i) => (i + 1).toString());
export const MOCK_WEEKS = ['Last week', 'This week'];
export const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useDashboard(colors: any) {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [selectedDate, setSelectedDate] = useState(today.getDate().toString());
  const [selectedWeek, setSelectedWeek] = useState('This week');
  const [selectedMonth, setSelectedMonth] = useState('Jun');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('friends');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<PersonalDashboard | null>(null);
  const [userGroups, setUserGroups] = useState<AppGroup[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, sumRes, histRes, groupsRes] = await Promise.all([
        dashboardService.getPersonalDashboard(),
        healthService.getHealthSummary(),
        healthService.getHealthHistory({ limit: 100 }),
        groupService.getGroups()
      ]);
      
      if (dashRes.success) setDashboardData(dashRes.data);
      if (sumRes.success) setHealthSummary(sumRes.data);
      if (histRes.success) setHealthHistory(histRes.data);
      if (groupsRes?.success) setUserGroups(groupsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      let res;
      if (selectedGroupId === 'friends') {
        res = await leaderboardService.getFriendsLeaderboard();
      } else if (selectedGroupId) {
        res = await leaderboardService.getGroupLeaderboard(selectedGroupId);
      }
      if (res && res.success) {
        setLeaderboardData(res.data.slice(0, 5)); // Keep top 5 for dashboard
      }
    } catch (error) {
      console.error('Error fetching leaderboard', error);
    }
  }, [selectedGroupId, dashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Derived stats based on timeframe
  const currentStreak = dashboardData?.currentStreak || 0;
  
  const { steps, distance, calories } = useMemo(() => {
    let s = 0;
    let d = 0;
    let c = 0;

    if (timeframe === 'Daily') {
      if (selectedDate === today.getDate().toString() && healthSummary?.today) {
        s = healthSummary.today.steps;
        d = healthSummary.today.distanceKm;
        c = healthSummary.today.calories;
      } else {
        const record = healthHistory.find(r => new Date(r.recordDate).getDate().toString() === selectedDate);
        if (record) {
          s = record.steps;
          d = record.distanceKm;
          c = record.calories;
        }
      }
    } else if (timeframe === 'Weekly') {
      if (selectedWeek === 'This week') {
        const current = new Date();
        const currentDay = current.getDay(); // 0-6
        const startOfThisWeek = new Date(current.getFullYear(), current.getMonth(), current.getDate() - currentDay);
        
        const thisWeekRecords = healthHistory.filter(r => {
          const rd = new Date(r.recordDate);
          return rd >= startOfThisWeek;
        });
        
        s = thisWeekRecords.reduce((sum, r) => sum + r.steps, 0);
        d = thisWeekRecords.reduce((sum, r) => sum + r.distanceKm, 0);
        c = thisWeekRecords.reduce((sum, r) => sum + r.calories, 0);
      } else if (selectedWeek === 'Last week') {
        // Calculate last week bounds
        const current = new Date();
        const currentDay = current.getDay(); // 0-6
        const startOfThisWeek = new Date(current.getFullYear(), current.getMonth(), current.getDate() - currentDay);
        const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const lastWeekRecords = healthHistory.filter(r => {
          const rd = new Date(r.recordDate);
          return rd >= startOfLastWeek && rd < startOfThisWeek;
        });
        
        s = lastWeekRecords.reduce((sum, r) => sum + r.steps, 0);
        d = lastWeekRecords.reduce((sum, r) => sum + r.distanceKm, 0);
        c = lastWeekRecords.reduce((sum, r) => sum + r.calories, 0);
      }
    } else if (timeframe === 'Monthly') {
      const monthIndex = MOCK_MONTHS.indexOf(selectedMonth);
      if (monthIndex === today.getMonth()) {
        s = healthSummary?.monthlyTotal?.steps || 0;
        d = healthSummary?.monthlyTotal?.distanceKm || 0;
        c = healthSummary?.monthlyTotal?.calories || 0;
      } else {
        // Aggregate for the specific selected month
        const targetYear = monthIndex > today.getMonth() ? today.getFullYear() - 1 : today.getFullYear();
        const monthRecords = healthHistory.filter(r => {
          const rd = new Date(r.recordDate);
          return rd.getMonth() === monthIndex && rd.getFullYear() === targetYear;
        });
        s = monthRecords.reduce((sum, r) => sum + r.steps, 0);
        d = monthRecords.reduce((sum, r) => sum + r.distanceKm, 0);
        c = monthRecords.reduce((sum, r) => sum + r.calories, 0);
      }
    }

    return { steps: s, distance: parseFloat(d.toFixed(2)), calories: Math.round(c) };
  }, [timeframe, selectedDate, selectedWeek, selectedMonth, healthSummary, healthHistory]);

  const stats = {
    steps: steps.toString(),
    activeCalories: calories,
    distance
  };
  
  // Transform upcoming activities into events format
  const upcomingEvents = (dashboardData?.upcomingActivities || []).map(act => ({
    id: act.id,
    icon: 'walk',
    title: act.title,
    date: new Date(act.startDate).toLocaleDateString()
  }));

  const currentLeaderboard = leaderboardData.map((u: any, idx: number) => ({
    id: u.id,
    rank: u.rank,
    name: u.fullName,
    points: u.totalPoints,
    rankColor: idx === 0 ? colors.warning : idx === 1 ? colors.textCardSecondary : colors.card
  }));

  const SV_SIZE = 200;
  const SV_STROKE = 22;
  const SV_RADIUS = (SV_SIZE - SV_STROKE) / 2;
  const SV_CIRCUMFERENCE = 2 * Math.PI * SV_RADIUS;
  
  const dailyGoal = 12000;
  const goal = timeframe === 'Monthly' ? dailyGoal * 30 : timeframe === 'Weekly' ? dailyGoal * 7 : dailyGoal;
  const currentSteps = parseInt(stats.steps, 10);
  const progressRatio = Math.min(Math.max(currentSteps / goal, 0), 1);
  const strokeDashoffset = SV_CIRCUMFERENCE - (progressRatio * SV_CIRCUMFERENCE);

  return {
    timeframe, setTimeframe,
    selectedDate, setSelectedDate,
    selectedWeek, setSelectedWeek,
    selectedMonth, setSelectedMonth,
    selectedGroupId, setSelectedGroupId,
    userGroups,
    stats,
    currentLeaderboard,
    upcomingEvents,
    svgProps: { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps },
    loading,
    refreshDashboard: fetchDashboardData
  };
}
