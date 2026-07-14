import type { HealthRecord, HealthSummary } from '../../types';
import type { Timeframe } from './dateRangeCalculator';
import { addDays, startOfWeek, sameDay } from './dateRangeCalculator';

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
 * @param anchorDate - The date the header is currently browsing (drives all three modes)
 * @param healthSummary - Pre-fetched health summary from the API
 * @param healthHistory - Pre-fetched health history records from the API
 * @returns Aggregated steps, distance (km), and calories
 */
export const aggregateStats = (
  timeframe: Timeframe,
  anchorDate: Date,
  healthSummary: HealthSummary | null,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  const today = new Date();

  if (timeframe === 'Daily') {
    return aggregateDailyStats(anchorDate, today, healthSummary, healthHistory);
  }

  if (timeframe === 'Weekly') {
    return aggregateWeeklyStats(anchorDate, healthHistory);
  }

  if (timeframe === 'Monthly') {
    return aggregateMonthlyStats(anchorDate, today, healthSummary, healthHistory);
  }

  return { steps: 0, distance: 0, calories: 0 };
};

const pad = (n: number) => n.toString().padStart(2, '0');

const aggregateDailyStats = (
  anchorDate: Date,
  today: Date,
  healthSummary: HealthSummary | null,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  if (sameDay(anchorDate, today) && healthSummary?.today) {
    return {
      steps: healthSummary.today.steps,
      distance: healthSummary.today.distanceKm,
      calories: healthSummary.today.calories,
    };
  }

  // A day can have multiple records from different sources — filter + sum.
  const targetDateStr = `${anchorDate.getFullYear()}-${pad(anchorDate.getMonth() + 1)}-${pad(anchorDate.getDate())}`;
  const records = healthHistory.filter((r) => r.recordDate?.split('T')[0] === targetDateStr);

  return records.length > 0 ? sumRecords(records) : { steps: 0, distance: 0, calories: 0 };
};

const aggregateWeeklyStats = (anchorDate: Date, healthHistory: HealthRecord[]): AggregatedStats => {
  const start = startOfWeek(anchorDate);
  const end = addDays(start, 7);

  const records = healthHistory.filter((r) => {
    const rd = new Date(r.recordDate);
    return rd >= start && rd < end;
  });

  return sumRecords(records);
};

const aggregateMonthlyStats = (
  anchorDate: Date,
  today: Date,
  healthSummary: HealthSummary | null,
  healthHistory: HealthRecord[]
): AggregatedStats => {
  const isCurrentMonth = anchorDate.getMonth() === today.getMonth() && anchorDate.getFullYear() === today.getFullYear();

  if (isCurrentMonth) {
    return {
      steps: healthSummary?.monthlyTotal?.steps || 0,
      distance: healthSummary?.monthlyTotal?.distanceKm || 0,
      calories: healthSummary?.monthlyTotal?.calories || 0,
    };
  }

  const records = healthHistory.filter((r) => {
    const rd = new Date(r.recordDate);
    return rd.getMonth() === anchorDate.getMonth() && rd.getFullYear() === anchorDate.getFullYear();
  });

  return sumRecords(records);
};

const sumRecords = (records: HealthRecord[]): AggregatedStats => ({
  steps: records.reduce((sum, r) => sum + r.steps, 0),
  distance: records.reduce((sum, r) => sum + r.distanceKm, 0),
  calories: records.reduce((sum, r) => sum + r.calories, 0),
});
