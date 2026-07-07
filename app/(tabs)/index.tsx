import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Skeleton, ErrorState } from '../../src/components';
import { useDashboard } from '../../src/features/dashboard/useDashboard';
import { 
  DashboardHeader, 
  DashboardStats, 
  DashboardLeaderboard, 
  DashboardEvents 
} from '../../src/features/dashboard/DashboardComponents';
import { googleHealthService } from '../../src/services/health/android/GoogleHealthService';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const {
    timeframe, setTimeframe,
    selectedDate, setSelectedDate,
    selectedWeek, setSelectedWeek,
    refMonth, refYear, setRefMonthYear,
    goToPrevMonth, goToNextMonth,
    dayTabs,
    selectedGroupId, setSelectedGroupId,
    userGroups,
    stats,
    currentLeaderboard,
    upcomingEvents,
    svgProps,
    loading,
    error,
    hasData,
    isLeaderboardLoading,
    isStatsLoading,
    refreshDashboard,
  } = useDashboard(colors);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [refreshDashboard]);

  useEffect(() => {
    // Initialise Health Connect once so permissions are ready before the first sync.
    requestAnimationFrame(() => {
      googleHealthService.initHealthConnect().catch(() => {});
    });
  }, []);

  return (
    <LinearGradient colors={[colors.surface, colors.background]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 0.5 }} style={styles.container}>
      <SafeAreaView edges={['top']}>
        <DashboardHeader
          timeframe={timeframe} setTimeframe={setTimeframe}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
          refMonth={refMonth} refYear={refYear} setRefMonthYear={setRefMonthYear}
          goToPrevMonth={goToPrevMonth} goToNextMonth={goToNextMonth}
          dayTabs={dayTabs}
          colors={colors}
          username={user?.nickname || user?.fullName?.split(' ')[0] || 'User'}
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={{ padding: 20, gap: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width="48%" height={120} borderRadius={16} />
              <Skeleton width="48%" height={120} borderRadius={16} />
            </View>
            <Skeleton width="100%" height={200} borderRadius={16} />
            <Skeleton width="100%" height={150} borderRadius={16} />
          </View>
        ) : error && !hasData ? (
          <View style={{ minHeight: 400 }}>
            <ErrorState onRetry={refreshDashboard} />
          </View>
        ) : (
          <>
            <DashboardStats stats={stats} svgProps={svgProps} colors={colors} isLoading={isStatsLoading} timeframe={timeframe} />
            <DashboardLeaderboard 
              leaderboard={currentLeaderboard} 
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              userGroups={userGroups}
              colors={colors}
              isLoading={isLeaderboardLoading}
            />
            <DashboardEvents events={upcomingEvents} colors={colors} />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 30 },
});
