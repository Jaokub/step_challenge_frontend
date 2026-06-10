import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Skeleton } from '../../src/components';
import { useDashboard } from '../../src/features/dashboard/hooks/useDashboard';
import { 
  DashboardHeader, 
  DashboardStats, 
  DashboardLeaderboard, 
  DashboardEvents 
} from '../../src/features/dashboard/components/DashboardComponents';

export default function DashboardScreen() {
  const { colors } = useTheme();
  
  const {
    timeframe, setTimeframe,
    selectedDate, setSelectedDate,
    selectedWeek, setSelectedWeek,
    selectedMonth, setSelectedMonth,
    selectedGroupId, setSelectedGroupId,
    userGroups,
    stats,
    currentLeaderboard,
    upcomingEvents,
    svgProps,
    loading
  } = useDashboard(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingBottom: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 10 }}>
        <DashboardHeader 
          timeframe={timeframe} setTimeframe={setTimeframe}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          colors={colors}
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={{ padding: 20, gap: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width="48%" height={120} borderRadius={16} />
              <Skeleton width="48%" height={120} borderRadius={16} />
            </View>
            <Skeleton width="100%" height={200} borderRadius={16} />
            <Skeleton width="100%" height={150} borderRadius={16} />
          </View>
        ) : (
          <>
            <DashboardStats stats={stats} svgProps={svgProps} colors={colors} />
            <DashboardLeaderboard 
              leaderboard={currentLeaderboard} 
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              userGroups={userGroups}
              colors={colors} 
            />
            <DashboardEvents events={upcomingEvents} colors={colors} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 30 },
});
