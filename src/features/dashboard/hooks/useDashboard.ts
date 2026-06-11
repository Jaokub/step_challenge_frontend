import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dashboardService from '../services/dashboardService';
import healthService from '../../health/services/healthService';
import leaderboardService from '../../../services/leaderboardService';
import type { PersonalDashboard, HealthSummary, HealthRecord } from '../../../types';
import groupService from '../../group/services/groupService';
import type { AppGroup } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

const today = new Date();
const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
export const MOCK_DATES = Array.from({length: daysInCurrentMonth}, (_, i) => (i + 1).toString());
export const MOCK_WEEKS = ['Last week', 'This week'];
export const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useDashboard(colors: any) {
  const { user } = useAuth();
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
  const leaderboardCache = useRef<Record<string, any[]>>({});

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
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const current = new Date();
      if (timeframe === 'Daily') {
         const day = parseInt(selectedDate);
         const date = new Date(current.getFullYear(), current.getMonth(), day);
         startDateStr = formatDate(date);
         
         const nextDate = new Date(current.getFullYear(), current.getMonth(), day + 1);
         endDateStr = formatDate(nextDate);
      } else if (timeframe === 'Weekly') {
         const currentDay = current.getDay();
         const startOfThisWeek = new Date(current.getFullYear(), current.getMonth(), current.getDate() - currentDay);
         if (selectedWeek === 'This week') {
            startDateStr = formatDate(startOfThisWeek);
            const endOfThisWeek = new Date(startOfThisWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
            endDateStr = formatDate(endOfThisWeek);
         } else {
            const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDateStr = formatDate(startOfLastWeek);
            endDateStr = formatDate(startOfThisWeek);
         }
      } else if (timeframe === 'Monthly') {
         const monthIndex = MOCK_MONTHS.indexOf(selectedMonth);
         const targetYear = monthIndex > current.getMonth() ? current.getFullYear() - 1 : current.getFullYear();
         const startOfMonth = new Date(targetYear, monthIndex, 1);
         startDateStr = formatDate(startOfMonth);
         const endOfMonth = new Date(targetYear, monthIndex + 1, 1);
         endDateStr = formatDate(endOfMonth);
      }

      const params = { startDate: startDateStr, endDate: endDateStr };
      const cacheKey = `${selectedGroupId}_${startDateStr || 'none'}_${endDateStr || 'none'}`;

      if (leaderboardCache.current[cacheKey]) {
        setLeaderboardData(leaderboardCache.current[cacheKey]);
        return;
      }

      let res;
      if (selectedGroupId === 'friends') {
        res = await leaderboardService.getFriendsLeaderboard(params);
      } else if (selectedGroupId) {
        res = await leaderboardService.getGroupLeaderboard(selectedGroupId, params);
      }
      if (res && res.success) {
        let top5Data = res.data.slice(0, 5); // Keep top 5 for dashboard
        
        // Ensure myUser is included so their stats can be rendered and synced
        const myUserData = res.data.find((u: any) => u.id === user?.id);
        if (myUserData && !top5Data.some((u: any) => u.id === myUserData.id)) {
          top5Data.push(myUserData);
        }
        
        leaderboardCache.current[cacheKey] = top5Data;
        setLeaderboardData(top5Data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard', error);
    }
  }, [selectedGroupId, dashboardData, timeframe, selectedDate, selectedWeek, selectedMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Derived stats based on timeframe
  const currentStreak = dashboardData?.currentStreak || 0;
  
  const { steps, distance, calories } = useMemo(() => {
    // Sync with leaderboard data for perfect consistency when possible
    const myLeaderboardUser = leaderboardData.find((u: any) => u.id === user?.id);
    if (myLeaderboardUser && myLeaderboardUser.steps !== undefined) {
      return { 
        steps: myLeaderboardUser.steps || 0, 
        distance: parseFloat(Number(myLeaderboardUser.distance || 0).toFixed(2)), 
        calories: Math.round(myLeaderboardUser.calories || 0) 
      };
    }

    let s = 0;
    let d = 0;
    let c = 0;

    if (timeframe === 'Daily') {
      if (selectedDate === today.getDate().toString() && healthSummary?.today && timeframe === 'Daily') {
        s = healthSummary.today.steps;
        d = healthSummary.today.distanceKm;
        c = healthSummary.today.calories;
      } else {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const targetDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${selectedDate.padStart(2, '0')}`;
        const record = healthHistory.find(r => r.recordDate && r.recordDate.split('T')[0] === targetDateStr);
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

  const sortedLeaderboard = [...leaderboardData].sort((a: any, b: any) => {
    const pointsA = a.points ?? a.totalPoints ?? 0;
    const pointsB = b.points ?? b.totalPoints ?? 0;
    return pointsB - pointsA;
  });

  const currentLeaderboard = sortedLeaderboard.map((u: any, idx: number) => ({
    id: u.id,
    rank: idx + 1,
    name: u.fullName || u.name,
    points: u.points ?? u.totalPoints ?? 0,
    isMe: user?.id === u.id,
    steps: u.steps || 0,
    distance: u.distance || 0,
    calories: u.calories || 0,
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
