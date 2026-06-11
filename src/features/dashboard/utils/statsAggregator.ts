import type { HealthRecord, HealthSummary } from '../../../types';
import { MOCK_MONTHS } from './dateRangeCalculator';
import type { Timeframe } from './dateRangeCalculator';

interface AggregatedStats {
  steps: number;
  distance: number;
  calories: number;
}

/**
 * Aggregates steps, distance, and calories from health data based on the selected timeframe.
 * This is a pure function — no side effects, no API calls.
 *
 * @param timeframe - The active timeframe
 * @param selectedDate - Day-of-month string (for Daily)
 * @param selectedWeek - 'This week' | 'Last week' (for Weekly)
 * @param selectedMonth - Month abbreviation e.g. 'Jun' (for Monthly)
 * @param healthSummary - Pre-fetched health summary from the API
 * @param healthHistory - Pre-fetched health history records from the API
 * @returns Aggregated steps, distance (km), and calories
 */
export const aggregateStats = (
  timeframe: Timeframe,
  selectedDate: string,
  selectedWeek: string,
  selectedMonth: string,
  healthSummary: HealthSummary | null,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  const today = new Date();

  if (timeframe === 'Daily') {
    return aggregateDailyStats(selectedDate, today, healthSummary, healthHistory);
  }

  if (timeframe === 'Weekly') {
    return aggregateWeeklyStats(selectedWeek, today, healthHistory);
  }

  if (timeframe === 'Monthly') {
    return aggregateMonthlyStats(selectedMonth, today, healthSummary, healthHistory);
  }

  return { steps: 0, distance: 0, calories: 0 };
};

const aggregateDailyStats = (
  selectedDate: string,
  today: Date,
  healthSummary: HealthSummary | null,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  const isToday = selectedDate === today.getDate().toString();

  if (isToday && healthSummary?.today) {
    return {
      steps: healthSummary.today.steps,
      distance: healthSummary.today.distanceKm,
      calories: healthSummary.today.calories,
    };
  }

  // Bug fix: use filter+sum — a day can have multiple records from different sources
  const pad = (n: number) => n.toString().padStart(2, '0');
  const targetDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${selectedDate.padStart(2, '0')}`;
  const records = healthHistory.filter((r) => r.recordDate?.split('T')[0] === targetDateStr);

  return records.length > 0
    ? sumRecords(records)
    : { steps: 0, distance: 0, calories: 0 };
};

const aggregateWeeklyStats = (
  selectedWeek: string,
  today: Date,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  const currentDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Bug fix: use Monday as week start to match backend getHealthSummary logic
  const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
  const startOfThisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);

  const startBoundary =
    selectedWeek === 'Last week'
      ? new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
      : startOfThisWeek;

  const endBoundary = selectedWeek === 'Last week' ? startOfThisWeek : undefined;

  const records = healthHistory.filter((r) => {
    const rd = new Date(r.recordDate);
    return rd >= startBoundary && (endBoundary === undefined || rd < endBoundary);
  });

  return sumRecords(records);
};

const aggregateMonthlyStats = (
  selectedMonth: string,
  today: Date,
  healthSummary: HealthSummary | null,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  const monthIndex = MOCK_MONTHS.indexOf(selectedMonth);

  if (monthIndex === today.getMonth()) {
    return {
      steps: healthSummary?.monthlyTotal?.steps || 0,
      distance: healthSummary?.monthlyTotal?.distanceKm || 0,
      calories: healthSummary?.monthlyTotal?.calories || 0,
    };
  }

  const targetYear = monthIndex > today.getMonth() ? today.getFullYear() - 1 : today.getFullYear();
  const records = healthHistory.filter((r) => {
    const rd = new Date(r.recordDate);
    return rd.getMonth() === monthIndex && rd.getFullYear() === targetYear;
  });

  return sumRecords(records);
};

const sumRecords = (records: HealthRecord[]): AggregatedStats => ({
  steps: records.reduce((sum, r) => sum + r.steps, 0),
  distance: records.reduce((sum, r) => sum + r.distanceKm, 0),
  calories: records.reduce((sum, r) => sum + r.calories, 0),
});
