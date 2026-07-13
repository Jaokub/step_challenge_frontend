import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState, ErrorState, Skeleton, SearchBar, StatusBadge } from '../../../src/components';
import { useAdminActivitiesList } from '../../../src/features/admin/useAdminActivitiesList';
import { spacing, fontSize, adminAccents } from '../../../src/constants/theme';
import { formatDate } from '../../../src/utils/formatDate';
import type { Activity } from '../../../src/types';

const CARD_RADIUS = 20; // mockup frame 19 event-card radius

/**
 * Mockup frame 19 — "Manual check-in · select event". Entry point from the
 * dashboard's "Manual check-in" nav card: pick which activity to check
 * walk-in participants into, then jump straight to that activity's
 * attendees (manual check-in) or QR screen.
 */
export default function ManualCheckinSelectEventScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activities, loading, error, refresh } = useAdminActivitiesList();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return activities;
    return activities.filter(
      (a) => a.title?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q),
    );
  }, [activities, q]);

  const renderCard = ({ item }: { item: Activity }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.cardTop}>
        <AppText variant="body-bold" style={{ flex: 1, fontSize: fontSize.md - 0.5, color: colors.textPrimary }} numberOfLines={2}>
          {item.title}
        </AppText>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
        <AppText style={{ flex: 1, fontSize: fontSize.sm - 1, color: colors.textSecondary }} numberOfLines={1}>
          {item.location}
        </AppText>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
        <AppText style={{ flex: 1, fontSize: fontSize.sm - 1, color: colors.textSecondary }} numberOfLines={1}>
          {formatDate(item.startDate, i18n.language)} – {formatDate(item.endDate, i18n.language)}
        </AppText>
      </View>
      {typeof item.participantCount === 'number' && (
        <AppText style={{ fontSize: fontSize.sm - 1, color: colors.primary, fontWeight: '600' as any }}>
          {t('admin.checkedInCount', { count: item.participantCount })}
        </AppText>
      )}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
          onPress={() => router.push(`/admin/activities/${item.id}/attendees`)}
        >
          <AppText style={{ fontSize: fontSize.xs + 0.5, fontWeight: '700' as any, color: colors.textPrimary }}>
            {t('admin.manualCheckinPill')}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
          onPress={() => router.push(`/admin/activities/${item.id}/qr`)}
        >
          <AppText style={{ fontSize: fontSize.xs + 0.5, fontWeight: '700' as any, color: colors.textPrimary }}>
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
          title={t('admin.selectActivityTitle')}
          subtitle={t('admin.manualCheckinSelectSubtitle')}
          titleSize={18}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
        />
      </SafeAreaView>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('admin.searchActivities')} />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton width="100%" height={140} borderRadius={CARD_RADIUS} />
          <Skeleton width="100%" height={140} borderRadius={CARD_RADIUS} />
          <Skeleton width="100%" height={140} borderRadius={CARD_RADIUS} />
        </View>
      ) : error ? (
        <ErrorState title={t('admin.loadError')} message={(error as any)?.message ?? ''} onRetry={refresh} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title={t('admin.noActivitiesTitle')} subtitle={t('admin.noActivitiesSubtitle')} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingVertical: 14, // mockup frame 19 card padding: 14px 16px
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    shadowColor: adminAccents.cardShadow,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6, // mockup frame 19 actions-row gap:6
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    alignItems: 'center',
  },
});
