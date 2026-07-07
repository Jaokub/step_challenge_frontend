import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ScreenHeader, HeaderIconButton, AppText } from '../../src/components';
import { spacing, gradients } from '../../src/constants/theme';
import { useActivities } from '../../src/features/activity/useActivities';
import { ActivityCard } from '../../src/features/activity/ActivityCard';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };

export default function ActivitiesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    activities,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore
  } = useActivities(filter);

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const renderListEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
        <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>{t('dashboard.noActivitiesTitle')}</AppText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title={t('tabs.activities')}
          rightActions={
            <>
              <HeaderIconButton 
                icon={isSearching ? "close-outline" : "search-outline"} 
                onPress={() => {
                  setIsSearching(!isSearching);
                  if (isSearching) setSearchQuery('');
                }} 
              />
              <TouchableOpacity onPress={() => {}} activeOpacity={0.85}>
                <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.addButton}>
                  <Ionicons name="add" size={20} color={colors.onPrimary} />
                </LinearGradient>
              </TouchableOpacity>
            </>
          }
        />

        {isSearching && (
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={t('activity.search')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        <View style={styles.filtersContainer}>
          <View style={[styles.filterPillContainer, { backgroundColor: colors.card }]}>
            {(['upcoming', 'ongoing', 'past'] as const).map((type) => {
              const label = type === 'upcoming' ? t('dashboard.upcoming') : type === 'ongoing' ? t('dashboard.ongoingActivities') : t('dashboard.pastActivities');
              const isActive = filter === type;
              return (
                <TouchableOpacity key={type} style={styles.filterPillWrap} activeOpacity={0.8} onPress={() => setFilter(type as any)}>
                  {isActive ? (
                    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.filterPill}>
                      <AppText variant="body-bold" style={[styles.filterText, { color: colors.onPrimary }]}>
                        {label}
                      </AppText>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterPill}>
                      <AppText style={[styles.filterText, { color: colors.textSecondary }]}>{label}</AppText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderListEmpty}
          ListHeaderComponent={
            filter === 'upcoming' && filteredActivities.length > 0 ? (
              <AppText variant="body-semiBold" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('activities.thisWeek')}
              </AppText>
            ) : null
          }
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  filterPillContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 5,
    gap: 4,
  },
  filterPillWrap: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  filterPill: {
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: spacing.md,
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
