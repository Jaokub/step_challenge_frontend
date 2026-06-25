import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Skeleton } from '../../src/components';
import { useDashboard } from '../../src/features/dashboard/useDashboard';
import { 
  DashboardHeader, 
  DashboardStats, 
  DashboardLeaderboard, 
  DashboardEvents 
} from '../../src/features/dashboard/DashboardComponents';
import { GoogleHealthService, googleHealthService } from '../../src/services/health/android/GoogleHealthService';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
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
    loading,
    isLeaderboardLoading,
    isStatsLoading
  } = useDashboard(colors);

  useEffect(()=>{
    console.log('before init');
    requestAnimationFrame(
      () => {
        (async () => {
          console.log(user);
          await googleHealthService.initHealthConnect();
          console.log('after init');
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);

          const steps = await googleHealthService.getSteps(startOfDay.toISOString(), endOfDay.toISOString());
          const distance = await googleHealthService.getDistance(startOfDay.toISOString(), endOfDay.toISOString());
          const calories = await googleHealthService.getCalories(startOfDay.toISOString(), endOfDay.toISOString());
          console.log(steps);
          console.log(distance);
          console.log(calories);
        })();
      }
    );
  }, []);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <DashboardHeader 
          timeframe={timeframe} setTimeframe={setTimeframe}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          colors={colors}
          username={user?.nickname || user?.fullName?.split(' ')[0] || 'User'}
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
            <DashboardStats stats={stats} svgProps={svgProps} colors={colors} isLoading={isStatsLoading} />
            {/* <Button title='test permission' onPress={() => {
              console.log('before init');
              (async () => {
                console.log(user);
                await googleHealthService.initHealthConnect();
                console.log('after init');
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const steps = await googleHealthService.getSteps(startOfDay.toISOString(), endOfDay.toISOString());
                const distance = await googleHealthService.getDistance(startOfDay.toISOString(), endOfDay.toISOString());
                const calories = await googleHealthService.getCalories(startOfDay.toISOString(), endOfDay.toISOString());
                console.log(steps);
                console.log(distance);
                console.log(calories);
              })();
            }} /> */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 30 },
});
