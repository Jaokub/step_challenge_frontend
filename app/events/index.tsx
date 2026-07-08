import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppText, Skeleton, EmptyState } from '../../src/components';
import { spacing, borderRadius, layout, fontSize } from '../../src/constants/theme';
import { useEvents } from '../../src/features/event/useEvents';
import type { EventListItem, EventStatus } from '../../src/types';

const statusTint = (status: EventStatus, colors: any) => {
  switch (status) {
    case 'ONGOING':
      return colors.success;
    case 'UPCOMING':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
};

const formatRange = (start: string, end: string) => {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${new Date(start).toLocaleDateString(undefined, opts)} – ${new Date(end).toLocaleDateString(undefined, opts)}`;
};

export default function EventsListScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { events, isLoading, isRefetching, refetch } = useEvents();

  const renderItem = ({ item }: { item: EventListItem }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/events/${item.id}`)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={styles.cardTop}>
        <AppText numberOfLines={1} variant="heading-bold" style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {item.title}
        </AppText>
        <View style={[styles.badge, { backgroundColor: colors.inputBackground }]}>
          <AppText style={[styles.badgeText, { color: statusTint(item.status, colors) }]}>
            {t(`events.status.${item.status}`)}
          </AppText>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
        <AppText style={[styles.metaText, { color: colors.textSecondary }]}>
          {formatRange(item.startDate, item.endDate)}
        </AppText>
        <Ionicons name="people-outline" size={14} color={colors.textSecondary} style={{ marginLeft: spacing.md }} />
        <AppText style={[styles.metaText, { color: colors.textSecondary }]}>
          {t('events.participants', { count: item.participantCount })}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('events.title')}
          </AppText>
          <View style={{ width: 26 }} />
        </View>

        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={92} borderRadius={borderRadius.lg} />
            ))}
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState icon="trophy-outline" title={t('events.emptyTitle')} subtitle={t('events.emptyMessage')} />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingX,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.xl },
  list: { paddingHorizontal: layout.screenPaddingX, paddingBottom: spacing['4xl'], gap: spacing.md },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: fontSize.lg },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeText: { fontSize: fontSize.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.sm },
});
