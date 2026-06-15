import { AppText } from '../src/components';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Alert, Clipboard } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/contexts/ThemeContext';
import {
  AppCard,
  HealthStatCard,
  CircularProgress,
  LoadingScreen,
  EmptyState,
} from '../src/components';
import { spacing, borderRadius, fontSize } from '../src/constants/theme';
import healthService from '../src/features/health/healthService';
import { useAuth } from '../src/contexts/AuthContext';
import type { HealthSummary, HealthRecord } from '../src/types';

export default function HealthScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [history, setHistory] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = useCallback(async () => {
    try {
      const [summaryRes, historyRes] = await Promise.all([
        healthService.getHealthSummary(),
        healthService.getHealthHistory({ limit: 7 }),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
      if (historyRes.success) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      console.warn('Health data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHealthData();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const todayRecord = summary?.today || null;
  const stepsProgress = todayRecord ? Math.min(todayRecord.steps / 10000, 1) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('health.title')}
        </AppText>
        <View style={{ width: 28 }} />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Today's Progress Card */}
        <AppCard style={styles.todayCard}>
          <AppText style={[styles.todayCardTitle, { color: colors.textOnCard }]}>
            {t('health.today')}
          </AppText>
          <View style={styles.circularProgressWrapper}>
            <CircularProgress
              progress={stepsProgress}
              size={150}
              strokeWidth={12}
              color={colors.primary}
            >
              <Ionicons name="footsteps" size={32} color={colors.primary} style={{ marginBottom: 4 }} />
              <AppText style={[styles.stepsCount, { color: colors.textOnCard }]}>
                {todayRecord?.steps.toLocaleString() || '0'}
              </AppText>
              <AppText style={[styles.stepsGoal, { color: colors.textCardSecondary }]}>
                {t('health.stepsPerDay')}
              </AppText>
            </CircularProgress>
          </View>

          <View style={styles.statsGrid}>
            <HealthStatCard
              icon="flame"
              label={t('health.calories')}
              value={`${todayRecord?.calories.toFixed(0) || '0'} kcal`}
              color="#FF5252"
              style={styles.gridStat}
            />
            <HealthStatCard
              icon="navigate"
              label={t('health.distance')}
              value={`${todayRecord?.distanceKm.toFixed(2) || '0.00'} ${t('dashboard.km')}`}
              color="#4CAF50"
              style={styles.gridStat}
            />
            <HealthStatCard
              icon="time"
              label={t('health.activeMinutesLabel')}
              value={`${todayRecord?.activeMinutes || '0'} ${t('health.minutesUnit')}`}
              color="#FFC107"
              style={styles.gridStat}
            />
          </View>
        </AppCard>

        {/* Apple Health Integration (iOS only) */}
        {Platform.OS === 'ios' && user?.syncToken && (
          <AppCard style={[styles.todayCard, { backgroundColor: colors.card }]}>
            <Ionicons name="fitness" size={32} color="#FF2D55" />
            <AppText style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.sm }]}>
              {t('health.appleHealthSync')}
            </AppText>
            <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md }}>
              {t('health.syncTokenDesc')}
            </AppText>
            <TouchableOpacity
              style={[styles.syncTokenBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Clipboard.setString(user.syncToken);
                Alert.alert(t('health.copySuccess'), t('health.copySuccessDesc'));
              }}
            >
              <AppText style={{ color: '#FFF' }}>{t('health.copySyncToken')}</AppText>
            </TouchableOpacity>
          </AppCard>
        )}

        {/* Aggregated Summaries Section */}
        <AppText style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('health.accumulatedStats')}</AppText>
        <View style={styles.summaryGrid}>
          {/* Weekly Average */}
          <AppCard style={styles.summaryCard}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} />
            <AppText style={[styles.summaryLabel, { color: colors.textCardSecondary }]}>
              {t('health.weeklyAverage')}
            </AppText>
            <AppText style={[styles.summaryValue, { color: colors.textOnCard }]}>
              {summary?.weeklyAverage?.steps.toLocaleString() || '0'} {t('health.stepsPerDayUnit')}
            </AppText>
          </AppCard>

          {/* Monthly Total */}
          <AppCard style={styles.summaryCard}>
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <AppText style={[styles.summaryLabel, { color: colors.textCardSecondary }]}>
              {t('health.monthlyTotal')}
            </AppText>
            <AppText style={[styles.summaryValue, { color: colors.textOnCard }]}>
              {summary?.monthlyTotal?.steps.toLocaleString() || '0'} {t('health.stepsUnit')}
            </AppText>
          </AppCard>

          {/* Best Day */}
          {summary?.bestDay && (
            <AppCard style={[styles.summaryCard, { width: '100%' }]}>
              <View style={styles.bestDayHeader}>
                <Ionicons name="trophy" size={20} color="#FFC107" />
                <AppText style={[styles.summaryLabel, { color: colors.textCardSecondary, marginLeft: spacing.xs }]}>
                  {t('health.bestDay')}
                </AppText>
              </View>
              <AppText style={[styles.summaryValue, { color: colors.textOnCard, fontSize: fontSize.lg }]}>
                {summary.bestDay.steps.toLocaleString()} {t('health.stepsUnit')}
              </AppText>
              <AppText style={[styles.bestDayDate, { color: colors.textCardSecondary }]}>
                {t('health.onDate')} {new Date(summary.bestDay.recordDate).toLocaleDateString(t('settings.language') === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </AppText>
            </AppCard>
          )}
        </View>

        {/* History List */}
        <AppText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('health.history7Days')}
        </AppText>
        {history.length > 0 ? (
          <AppCard style={styles.historyCard}>
            {history.map((record, index) => (
              <View
                key={record.id}
                style={[
                  styles.historyItem,
                  index < history.length - 1 && [styles.historyBorder, { borderBottomColor: colors.divider }],
                ]}
              >
                <View style={styles.historyLeft}>
                  <AppText style={[styles.historyDate, { color: colors.textOnCard }]}>
                    {new Date(record.recordDate).toLocaleDateString(t('settings.language') === 'th' ? 'th-TH' : 'en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </AppText>
                  <AppText style={[styles.historySource, { color: colors.textCardSecondary }]}>
                    {t('health.dataSource')}{record.source}
                  </AppText>
                </View>
                <View style={styles.historyRight}>
                  <AppText style={[styles.historySteps, { color: colors.primary }]}>
                    {record.steps.toLocaleString()} {t('health.stepsUnit')}
                  </AppText>
                  <AppText style={[styles.historyCalories, { color: colors.textCardSecondary }]}>
                    {record.calories.toFixed(0)} kcal | {record.distanceKm.toFixed(1)} {t('dashboard.km')}
                  </AppText>
                </View>
              </View>
            ))}
          </AppCard>
        ) : (
          <EmptyState
            icon="heart-dislike-outline"
            title={t('health.noData')}
            subtitle={t('health.noLatestHistory')}
          />
        )}

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  todayCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  todayCardTitle: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  circularProgressWrapper: {
    marginVertical: spacing.md,
  },
  stepsCount: {
    fontSize: fontSize['2xl'],
    marginTop: spacing.xs,
  },
  stepsGoal: {
    fontSize: 10,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  gridStat: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '47%',
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.sm,
  },
  bestDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestDayDate: {
    fontSize: 10,
  },
  historyCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  historyBorder: {
    borderBottomWidth: 1,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: fontSize.sm,
  },
  historySource: {
    fontSize: 10,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historySteps: {
    fontSize: fontSize.sm,
  },
  historyCalories: {
    fontSize: 10,
    marginTop: 2,
  },
  syncTokenBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
});
