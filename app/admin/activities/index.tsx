import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../../src/components';
import { useAdminActivitiesList, AdminActivityFilter } from '../../../src/features/admin/useAdminActivitiesList';
import { spacing, fontSize, borderRadius, gradients, adminAccents } from '../../../src/constants/theme';
import { formatDate } from '../../../src/utils/formatDate';
import type { Activity } from '../../../src/types';

const FILTERS: AdminActivityFilter[] = ['all', 'upcoming', 'ongoing', 'ended'];
const CARD_RADIUS = 22; // mockup frame 2 card radius (not borderRadius.xl)

export default function AdminActivitiesListScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activities, filter, setFilter, loading, refreshing, refresh, error } = useAdminActivitiesList();

  const filterLabel = (f: AdminActivityFilter) =>
    f === 'all'
      ? t('admin.filterAll')
      : f === 'upcoming'
      ? t('admin.filterUpcoming')
      : f === 'ongoing'
      ? t('admin.filterOngoing')
      : t('admin.filterEnded');

  // Mockup frame 2 (latest upload): the whole card is the tap target →
  // straight to edit-activity. The per-card Edit/Attendees/QR action row is
  // gone — attendees/QR now live behind the dedicated "Manual check-in"
  // entry point (frame 19, /admin/manual-checkin/select-event) and the QR
  // action inside edit-activity/attendees themselves.
  const renderCard = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/admin/edit-activity/${item.id}`)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
        <View style={styles.titleRow}>
          <AppText variant="body-bold" style={{ flex: 1, fontSize: fontSize.md, lineHeight: 18, color: colors.textPrimary }} numberOfLines={1}>
            {item.title}
          </AppText>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <AppText style={{ flex: 1, fontSize: fontSize.sm - 1, lineHeight: 15, color: colors.textSecondary }} numberOfLines={1}>
            {item.location}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <AppText style={{ flex: 1, fontSize: fontSize.sm - 1, lineHeight: 15, color: colors.textSecondary }} numberOfLines={1}>
            {formatDate(item.startDate, i18n.language)} – {formatDate(item.endDate, i18n.language)}
          </AppText>
        </View>
        {typeof item.participantCount === 'number' && (
          <AppText style={{ fontSize: fontSize.sm - 1, lineHeight: 15, color: colors.primary, fontWeight: '600' as any }}>
            {t('admin.checkedInCount', { count: item.participantCount })}
          </AppText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.activitiesListTitle')}
          titleSize={20}
          pathSubtitle="/admin/activities"
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
          rightActions={
            <TouchableOpacity onPress={() => router.push('/admin/create-activity')}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={20} color={colors.onPrimary} />
              </LinearGradient>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                { backgroundColor: active ? colors.textPrimary : colors.inputBackground },
              ]}
            >
              <AppText
                style={{
                  fontSize: fontSize.sm,
                  lineHeight: 16,
                  fontWeight: '700' as any,
                  color: active ? colors.background : colors.textSecondary,
                }}
              >
                {filterLabel(f)}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton width="100%" height={130} borderRadius={22} />
          <Skeleton width="100%" height={130} borderRadius={22} />
          <Skeleton width="100%" height={130} borderRadius={22} />
        </View>
      ) : error ? (
        <ErrorState title={t('admin.loadError')} message={(error as any)?.message ?? ''} onRetry={refresh} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('admin.noActivitiesTitle')}
              subtitle={t('admin.noActivitiesSubtitle')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  createBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm - 1,
    borderRadius: borderRadius.full,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm, // mockup frame 2 card gap:10
    shadowColor: adminAccents.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
