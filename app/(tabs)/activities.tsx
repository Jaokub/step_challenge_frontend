import { AppText } from '../../src/components';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ScreenHeader, HeaderIconButton } from '../../src/components';
import { spacing } from '../../src/constants/theme';
import activityService from '../../src/features/activity/services/activityService';
import type { Activity } from '../../src/types';

export default function ActivitiesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('all');

  const loadActivities = async (pageNumber: number, isRefresh = false) => {
    try {
      // Map filter to valid ActivityStatus or undefined
      const statusMap: Record<string, string> = {
        upcoming: 'UPCOMING',
        ongoing: 'ONGOING',
        past: 'COMPLETED'
      };
      const response = await activityService.getActivities({ page: pageNumber, limit: 10, status: filter !== 'all' ? statusMap[filter] : undefined });
      if (response.success) {
        if (isRefresh) {
          setActivities(response.data.activities);
        } else {
          setActivities(prev => [...prev, ...response.data.activities]);
        }
        setHasMore(response.data.pagination?.page < response.data.pagination?.totalPages);
      }
    } catch (err) {
      console.warn('Activities fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      loadActivities(1, true);
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadActivities(1, true);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadActivities(nextPage);
    }
  };

  const renderFilter = (type: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: colors.card, borderColor: colors.divider },
        filter === type && { backgroundColor: colors.primary, borderColor: colors.primary }
      ]}
      onPress={() => setFilter(type)}
    >
      <AppText style={[
        styles.filterText,
        { color: colors.textSecondary },
        filter === type && { color: '#FFFFFF' }
      ]}>
        {label}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title={t('activities.title')}
          rightActions={
            <>
              <HeaderIconButton 
                icon="search-outline" 
                onPress={() => {}} 
              />
              <HeaderIconButton 
                icon="add" 
                onPress={() => {}} 
                backgroundColor={colors.primary}
                borderColor={colors.primary}
                iconColor="#FFFFFF"
              />
            </>
          }
        />

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {renderFilter('all', 'All')}
            {renderFilter('upcoming', 'Upcoming')}
            {renderFilter('ongoing', 'Ongoing')}
            {renderFilter('past', 'Past')}
          </ScrollView>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>{t('activities.noActivities')}</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.activityCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]} 
              onPress={() => router.push(`/(tabs)/activities`)} // Replace with actual detail route when ready
            >
              <View style={[styles.dateBox, { backgroundColor: colors.primary + '15' }]}>
                <AppText style={[styles.dateMonth, { color: colors.primary }]}>JUN</AppText>
                <AppText style={[styles.dateDay, { color: colors.primary }]}>{new Date(item.startDate).getDate()}</AppText>
              </View>
              <View style={styles.activityInfo}>
                <AppText style={[styles.activityName, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</AppText>
                <AppText style={[styles.activityType, { color: colors.textSecondary }]}>{item.status}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: {
    paddingBottom: spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: spacing.xl,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  dateBox: {
    width: 50,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 20,
    marginTop: -2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    marginBottom: 4,
  },
  activityType: {
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
