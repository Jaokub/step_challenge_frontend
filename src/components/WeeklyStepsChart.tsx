import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, spacing, shadows, gradients, dashboardAccents } from '../constants/theme';

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
  const { colors, isDark } = useTheme();

  if (!data || data.length === 0) {
    return null;
  }

  const maxSteps = Math.max(...data.map((d) => d.steps));
  const normalizedMax = maxSteps > 0 ? maxSteps : 1; // Prevent division by zero
  const inactiveBarColor = dashboardAccents.chartBarInactive[isDark ? 'dark' : 'light'];

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
                {isToday ? (
                  <LinearGradient
                    colors={gradients.primary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.bar, { height: `${barHeightPercentage}%` }]}
                  />
                ) : (
                  <View style={[styles.bar, { height: `${barHeightPercentage}%`, backgroundColor: inactiveBarColor }]} />
                )}
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
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 96, // mockup literal
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
    marginBottom: 6, // mockup literal — gap between bar and day label
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 11,
  },
});

export default WeeklyStepsChart;
