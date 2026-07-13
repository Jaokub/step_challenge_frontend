import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, spacing, shadows } from '../constants/theme';

export interface DailyStepData {
  date: string;
  dayName: string;
  steps: number;
}

interface WeeklyStepsChartProps {
  data: DailyStepData[];
  /** Optional section title rendered inside the card (mockup: "ก้าวรายสัปดาห์"). */
  title?: string;
}

const WeeklyStepsChart: React.FC<WeeklyStepsChartProps> = ({ data, title }) => {
  const { colors } = useTheme();

  if (!data || data.length === 0) {
    return null;
  }

  const maxSteps = Math.max(...data.map((d) => d.steps));
  const normalizedMax = maxSteps > 0 ? maxSteps : 1; // Prevent division by zero

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder, ...shadows.card, shadowColor: colors.cardShadow }]}>
      {title && (
        <AppText variant="body-bold" style={[styles.title, { color: colors.textOnCard }]}>
          {title}
        </AppText>
      )}
      <View style={styles.chartArea}>
        {data.map((day, index) => {
          const isToday = index === data.length - 1;
          const barHeightPercentage = Math.max((day.steps / normalizedMax) * 100, 2); // At least 2% height for visibility

          return (
            <View key={day.date} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${barHeightPercentage}%`,
                      backgroundColor: isToday ? colors.primary : colors.primaryLight + '40', // 40 is hex opacity for ~25%
                    },
                  ]}
                />
              </View>
              <AppText style={[styles.dayLabel, { color: isToday ? colors.primary : colors.textCardSecondary, fontWeight: isToday ? 'bold' : 'normal' }]}>
                {day.dayName}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    minHeight: 160,
  },
  title: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120, // Total height for bars
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bar: {
    width: 24,
    borderRadius: 2,
  },
  dayLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default WeeklyStepsChart;
