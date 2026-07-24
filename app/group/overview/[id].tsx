import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, EmptyState, Skeleton, PeriodPillSelector } from '../../../src/components';
import { spacing } from '../../../src/constants/theme';
import { useGroupOverview } from '../../../src/features/group/useGroupOverview';
import { GroupOverallStatCard } from '../../../src/features/group/GroupOverallStatCard';
import { calculateDateRange } from '../../../src/features/dashboard/dateRangeCalculator';
import type { Timeframe } from '../../../src/hooks/useTimeframeNav';
import type { GroupRankingRow, RelationPeriod } from '../../../src/types';

// Same day/week/month pill + date-range mapping as /group/[id]'s own
// member-ranking section (BUILD_PLAN.md Phase 5.2) — this screen's ranking
// list should be re-orderable by the same three windows, not locked to
// all-time like it originally was.
const PERIOD_TO_TIMEFRAME: Record<RelationPeriod, Timeframe> = {
  today: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

/**
 * Read-only "everything a parent group can see" view of a descendant
 * group: its today/week/month stat card + full member ranking. Reachable
 * from each relation card's "ดูทั้งหมด" (children) or whole-card tap
 * (parent/siblings) on /group/[id] — the viewer isn't a member of this
 * group, they're an ancestor (same self/ancestor visibility as the group's
 * own /group/[id] member list, via useGroupOverview's backend endpoint).
 *
 * Pixel-matches the mockup's "อันดับกลุ่มย่อยทั้งหมด" full-list layout
 * (chip back button, title+subtitle header, mint today/week/month stat
 * card, plain rank/name/steps rows) — but ranks this group's own MEMBERS,
 * not sibling/child groups against each other.
 */
export default function GroupDescendantOverviewScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [period, setPeriod] = useState<RelationPeriod>('month');
  const { startDate, endDate } = calculateDateRange(PERIOD_TO_TIMEFRAME[period], new Date());
  const { overview, isOverviewLoading, isOverviewFetching } = useGroupOverview(id, startDate, endDate);
  const ranking = overview?.ranking ?? [];

  const renderRow = (item: GroupRankingRow) => (
    <View key={item.id} style={[styles.rankRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <AppText variant="body-bold" style={[styles.rankNum, { color: colors.textSecondary }]}>
        {item.rank}
      </AppText>
      <AppText variant="body-medium" style={[styles.rankName, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.fullName}
      </AppText>
      <AppText variant="heading-bold" style={[styles.rankSteps, { color: colors.textPrimary }]}>
        {(item.steps ?? 0).toLocaleString()}
      </AppText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/groups'))}
            style={[styles.chip, { backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="chevron-back" size={14} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {name || t('groups.departmentGroups')}
            </AppText>
            <AppText style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('groups.memberRanking')}
            </AppText>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={isOverviewFetching ? ([1, 2, 3] as any) : ranking}
        keyExtractor={(item, index) => (isOverviewFetching ? index.toString() : item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <GroupOverallStatCard stats={overview?.periodStats ?? null} isLoading={isOverviewLoading} />
            <View style={styles.sectionHeaderRow}>
              <AppText variant="body-bold" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('groups.memberRanking')}
              </AppText>
              <PeriodPillSelector value={period} onChange={setPeriod} />
            </View>
          </>
        }
        ListEmptyComponent={
          !isOverviewFetching ? <EmptyState icon="people-outline" title={t('common.noData')} subtitle="" /> : null
        }
        renderItem={({ item }) =>
          isOverviewFetching ? <Skeleton width="100%" height={45} borderRadius={18} /> : renderRow(item)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 6,
  },
  chip: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 14, lineHeight: 17 },
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSubtitle: { fontSize: 11, lineHeight: 13, marginTop: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 18, borderWidth: 1, padding: 11 },
  rankNum: { width: 14, textAlign: 'center', fontSize: 13, lineHeight: 15 },
  rankName: { flex: 1, fontSize: 13, lineHeight: 15 },
  rankSteps: { fontSize: 13, lineHeight: 15 },
});
