import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { layout } from '../../src/constants/theme';
import { Skeleton, ErrorState } from '../../src/components';
import { useDashboard } from '../../src/features/dashboard/useDashboard';
import {
  DashboardHeader,
  DashboardStats,
  DashboardLeaderboard,
} from '../../src/features/dashboard/DashboardComponents';
import { googleHealthService } from '../../src/services/health/android/GoogleHealthService';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const {
    timeframe, setTimeframe,
    anchorDate,
    refMonth, refYear,
    goToPrev, goToNext,
    setAnchorDay, setAnchorMonthYear,
    dayTabs,
    selectedGroupId, setSelectedGroupId,
    userGroups,
    stats,
    currentLeaderboard,
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
          anchorDate={anchorDate}
          refMonth={refMonth} refYear={refYear}
          goToPrev={goToPrev} goToNext={goToNext}
          setAnchorDay={setAnchorDay} setAnchorMonthYear={setAnchorMonthYear}
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
          <View style={{ paddingHorizontal: layout.screenPaddingX, gap: layout.sectionGap }}>
            {/* goal card */}
            <Skeleton width="100%" height={148} borderRadius={26} />
            {/* stat cards */}
            <View style={{ flexDirection: 'row', gap: layout.cardGap }}>
              <Skeleton width="31.5%" height={108} borderRadius={22} />
              <Skeleton width="31.5%" height={108} borderRadius={22} />
              <Skeleton width="31.5%" height={108} borderRadius={22} />
            </View>
            {/* ranking rows */}
            <View style={{ gap: 10 }}>
              <Skeleton width={120} height={22} borderRadius={6} />
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={64} borderRadius={20} />)}
            </View>
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
