import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAdminDashboard } from '../../src/features/admin/hooks/useAdminDashboard';
import { 
  AdminOverviewStats,
  AdminExportBtn,
  AdminTopList
} from '../../src/features/admin/components/AdminDashboardComponents';
import { ScreenHeader, Skeleton } from '../../src/components';

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const {
    stats,
    topUsers,
    topActivities,
    topGroups,
    handleExportCSV,
    loading
  } = useAdminDashboard();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title="Admin Dashboard" 
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          } 
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={{ padding: 20, gap: 24 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Skeleton width="48%" height={80} borderRadius={12} />
              <Skeleton width="48%" height={80} borderRadius={12} />
              <Skeleton width="48%" height={80} borderRadius={12} />
              <Skeleton width="48%" height={80} borderRadius={12} />
            </View>
            <Skeleton width="100%" height={250} borderRadius={16} />
            <Skeleton width="100%" height={250} borderRadius={16} />
          </View>
        ) : (
          <>
            <AdminOverviewStats stats={stats} colors={colors} />
            <AdminExportBtn onExport={handleExportCSV} colors={colors} />
            
            <AdminTopList 
              title="Top 5 Active Users" 
              data={topUsers} 
              labelKey="name" 
              valueKey="points" 
              icon="star" 
              colors={colors} 
              onViewAll={() => router.push('/admin/users')}
            />
            
            <AdminTopList 
              title="Top Activities" 
              data={topActivities.slice(0, 3)} 
              labelKey="title" 
              valueKey="checkIns" 
              icon="account-group" 
              colors={colors}
              onItemPress={(item: any) => router.push(`/admin/edit-activity/${item.id}`)}
              onViewAll={() => router.push('/admin/ranking/activities')}
              actionBtn={
                <TouchableOpacity onPress={() => router.push('/admin/create-activity')}>
                  <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
              }
            />

            <AdminTopList 
              title="Top Groups" 
              data={topGroups.slice(0, 3)} 
              labelKey="name" 
              valueKey="members" 
              icon="account-multiple" 
              colors={colors} 
              onViewAll={() => router.push('/admin/ranking/groups')}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
});
