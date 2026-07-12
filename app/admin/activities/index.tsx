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
import { spacing, fontSize, borderRadius, gradients } from '../../../src/constants/theme';
import { formatDate } from '../../../src/utils/formatDate';
import type { Activity } from '../../../src/types';

const FILTERS: AdminActivityFilter[] = ['all', 'ongoing', 'ended'];
const CARD_RADIUS = 22; // mockup frame 2 card radius (not borderRadius.xl)

export default function AdminActivitiesListScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activities, filter, setFilter, loading, refreshing, refresh, error } = useAdminActivitiesList();

  const filterLabel = (f: AdminActivityFilter) =>
    f === 'all' ? t('admin.filterAll') : f === 'ongoing' ? t('admin.filterOngoing') : t('admin.filterEnded');

  const renderCard = ({ item }: { item: Activity }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.cardTop}>
        <AppText variant="body-bold" style={{ flex: 1, fontSize: fontSize.md, color: colors.textPrimary }} numberOfLines={2}>
          {item.title}
        </AppText>
        <StatusBadge status={item.status} />
      </View>
      <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
        {item.location} · {formatDate(item.startDate, i18n.language)} – {formatDate(item.endDate, i18n.language)}
      </AppText>
      {typeof item.participantCount === 'number' && (
        <AppText style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' as any }}>
          {t('admin.checkedInCount', { count: item.participantCount })}
        </AppText>
      )}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
          onPress={() => router.push(`/admin/edit-activity/${item.id}`)}
        >
          <AppText style={{ fontSize: fontSize.xs, fontWeight: '700' as any, color: colors.textPrimary }}>
            {t('admin.actionEdit')}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
          onPress={() => router.push(`/admin/activities/${item.id}/attendees`)}
        >
          <AppText style={{ fontSize: fontSize.xs, fontWeight: '700' as any, color: colors.textPrimary }}>
            {t('admin.actionAttendees')}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
          onPress={() => router.push(`/admin/activities/${item.id}/qr`)}
        >
          <AppText style={{ fontSize: fontSize.xs, fontWeight: '700' as any, color: colors.textPrimary }}>
            {t('admin.actionQr')}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
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
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm, // mockup frame 2 card gap:8
    shadowColor: '#14201d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
});
