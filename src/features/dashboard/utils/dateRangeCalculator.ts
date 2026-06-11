/**
 * Calculates the start and end date strings for a given leaderboard timeframe selection.
 * This is a pure function with no side effects.
 */

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => n.toString().padStart(2, '0');
const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

/**
 * Given a timeframe and its selection state, returns the corresponding start/end date strings.
 *
 * @param timeframe - 'Daily' | 'Weekly' | 'Monthly'
 * @param selectedDate - Day-of-month string (for Daily)
 * @param selectedWeek - 'This week' | 'Last week' (for Weekly)
 * @param selectedMonth - Month abbreviation e.g. 'Jun' (for Monthly)
 * @returns { startDate, endDate } as ISO date strings, or undefined if not applicable
 */
export const calculateDateRange = (
  timeframe: Timeframe,
  selectedDate: string,
  selectedWeek: string,
  selectedMonth: string
): DateRange => {
  const now = new Date();

  if (timeframe === 'Daily') {
    const day = parseInt(selectedDate, 10);
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    const nextDate = new Date(now.getFullYear(), now.getMonth(), day + 1);
    return { startDate: formatDate(date), endDate: formatDate(nextDate) };
  }

  if (timeframe === 'Weekly') {
    const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Use Monday as week start to match backend getHealthSummary logic
    const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);

    if (selectedWeek === 'This week') {
      const endOfThisWeek = new Date(startOfThisWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { startDate: formatDate(startOfThisWeek), endDate: formatDate(endOfThisWeek) };
    }

    const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: formatDate(startOfLastWeek), endDate: formatDate(startOfThisWeek) };
  }

  if (timeframe === 'Monthly') {
    const monthIndex = MOCK_MONTHS.indexOf(selectedMonth);
    const targetYear = monthIndex > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
    const startOfMonth = new Date(targetYear, monthIndex, 1);
    const endOfMonth = new Date(targetYear, monthIndex + 1, 1);
    return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
  }

  return { startDate: undefined, endDate: undefined };
};
