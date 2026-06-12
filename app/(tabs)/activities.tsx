import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ScreenHeader, HeaderIconButton, AppText } from '../../src/components';
import { spacing } from '../../src/constants/theme';
import { useActivities } from '../../src/features/activity/hooks/useActivities';
import { ActivityCard } from '../../src/features/activity/components/ActivityCard';

export default function ActivitiesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    activities,
    loading,
    refreshing,
    loadingMore,
    refresh,
    fetchInitial,
    loadMore
  } = useActivities();

  useFocusEffect(
    useCallback(() => {
      fetchInitial(filter);
    }, [filter, fetchInitial])
  );

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderListEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
        <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>{t('activities.noActivities', 'ไม่พบกิจกรรม')}</AppText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title={t('activities.title', 'กิจกรรม')}
          rightActions={
            <>
              <HeaderIconButton 
                icon={isSearching ? "close-outline" : "search-outline"} 
                onPress={() => {
                  setIsSearching(!isSearching);
                  if (isSearching) setSearchQuery('');
                }} 
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

        {isSearching && (
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="ค้นหากิจกรรม..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {renderFilter('all', 'ทั้งหมด')}
            {renderFilter('upcoming', 'กำลังจะมาถึง')}
            {renderFilter('ongoing', 'กำลังดำเนินการ')}
            {renderFilter('past', 'ผ่านมาแล้ว')}
          </ScrollView>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refresh(filter)} tintColor={colors.primary} />}
          onEndReached={() => loadMore(filter)}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderListEmpty}
          renderItem={({ item }) => <ActivityCard activity={item} />}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
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
