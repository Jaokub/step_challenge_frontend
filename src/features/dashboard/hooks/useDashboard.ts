import { useState, useEffect, useCallback, useMemo } from 'react';
import dashboardService from '../services/dashboardService';
import healthService from '../../health/services/healthService';
import type { PersonalDashboard, HealthSummary, HealthRecord } from '../../../types';

type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

const today = new Date();
const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
export const MOCK_DATES = Array.from({length: daysInCurrentMonth}, (_, i) => (i + 1).toString());
export const MOCK_WEEKS = ['Last week', 'This week'];
export const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MOCK_GROUPS = ['Friends', 'Running Club', 'CP Faculty', 'IT Dept', 'Design Team'];

export function useDashboard(colors: any) {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [selectedDate, setSelectedDate] = useState(today.getDate().toString());
  const [selectedWeek, setSelectedWeek] = useState('This week');
  const [selectedMonth, setSelectedMonth] = useState('Jun');
  const [selectedGroup, setSelectedGroup] = useState('Friends');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<PersonalDashboard | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, sumRes, histRes] = await Promise.all([
        dashboardService.getPersonalDashboard(),
        healthService.getHealthSummary(),
        healthService.getHealthHistory({ limit: 100 })
      ]);
      
      if (dashRes.success) setDashboardData(dashRes.data);
      if (sumRes.success) setHealthSummary(sumRes.data);
      if (histRes.success) setHealthHistory(histRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived stats based on timeframe
  const currentStreak = dashboardData?.currentStreak || 0;
  
  const { steps, distance } = useMemo(() => {
    let s = 0;
    let d = 0;

    if (timeframe === 'Daily') {
      if (selectedDate === today.getDate().toString() && healthSummary?.today) {
        s = healthSummary.today.steps;
        d = healthSummary.today.distanceKm;
      } else {
        const record = healthHistory.find(r => new Date(r.recordDate).getDate().toString() === selectedDate);
        if (record) {
          s = record.steps;
          d = record.distanceKm;
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
      }
    } else if (timeframe === 'Monthly') {
      const monthIndex = MOCK_MONTHS.indexOf(selectedMonth);
      if (monthIndex === today.getMonth()) {
        s = healthSummary?.monthlyTotal?.steps || 0;
        d = healthSummary?.monthlyTotal?.distanceKm || 0;
      } else {
        // Aggregate for the specific selected month
        const targetYear = monthIndex > today.getMonth() ? today.getFullYear() - 1 : today.getFullYear();
        const monthRecords = healthHistory.filter(r => {
          const rd = new Date(r.recordDate);
          return rd.getMonth() === monthIndex && rd.getFullYear() === targetYear;
        });
        s = monthRecords.reduce((sum, r) => sum + r.steps, 0);
        d = monthRecords.reduce((sum, r) => sum + r.distanceKm, 0);
      }
    }

    return { steps: s, distance: parseFloat(d.toFixed(2)) };
  }, [timeframe, selectedDate, selectedWeek, selectedMonth, healthSummary, healthHistory]);

  const stats = {
    steps: steps.toString(),
    streak: currentStreak,
    distance
  };
  
  // Transform upcoming activities into events format
  const MOCK_EVENTS = (dashboardData?.upcomingActivities || []).map(act => ({
    id: act.id,
    icon: 'walk',
    title: act.title,
    date: new Date(act.startDate).toLocaleDateString()
  }));

  // We still need a leaderboard formatting. If backend doesn't provide it yet,
  // we could mock it or use an empty array.
  const currentLeaderboard = [
    { id: '1', rank: 1, name: 'Annika', streak: 70, distance: 7.4, rankColor: colors.warning },
    { id: '2', rank: 2, name: 'David', streak: 21, distance: 6.8, rankColor: colors.textCardSecondary },
    { id: '3', rank: 5, name: dashboardData?.user?.fullName || 'You', streak: currentStreak, distance: distance, rankColor: colors.card },
  ];

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
    selectedGroup, setSelectedGroup,
    stats,
    currentLeaderboard,
    MOCK_EVENTS,
    svgProps: { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps },
    loading,
    refreshDashboard: fetchDashboardData
  };
}
