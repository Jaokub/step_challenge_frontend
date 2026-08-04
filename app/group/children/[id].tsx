import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, EmptyState, Skeleton, StepsValue } from '../../../src/components';
import { spacing } from '../../../src/constants/theme';
import { useChildRanking } from '../../../src/features/group/useChildRanking';
import type { ChildRankingRow } from '../../../src/types';

/**
 * Full list of a group's child groups, ranked against each other by this
 * month's steps, with a trailing row for members who are in none of them.
 *
 * Deliberately the same template as `app/group/overview/[id].tsx` (chip back
 * button, title + subtitle header, one FlatList of rounded rows, fixed-height
 * skeletons, empty state) — that screen ranks MEMBERS of one group, this ranks
 * the GROUPS beneath one group. Reached from the "ดูทั้งหมด" on the child
 * groups section of /group/[id].
 *
 * ── No stat card at the top, unlike the sibling screen ──
 *
 * `getChildRanking().stats` is the plain sum across the children and is NOT
 * the group's own total: someone who belongs to two child groups is counted
 * in each of them, while the group's real figure counts them once. Putting it
 * in the header would present a number larger than the group's own headline
 * on /group/[id] as if it were the same thing — the display-one-figure,
 * compute-another mistake that ADR-003 exists to avoid. The group's total is
 * shown on /group/[id]; this screen answers "which sub-group is ahead".
 */
export default function GroupChildrenListScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { childRanking, isChildRankingFetching } = useChildRanking(id);
  const ranking = childRanking?.ranking ?? [];
  const directOnly = childRanking?.directOnlyMembers;

  const renderRow = (item: ChildRankingRow) => (
    <TouchableOpacity
      key={item.groupId}
      activeOpacity={0.8}
      onPress={() =>
        router.push(`/group/overview/${item.groupId}?name=${encodeURIComponent(item.groupName)}`)
      }
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <AppText variant="body-bold" style={[styles.rank, { color: colors.textSecondary }]}>
        {item.rank}
      </AppText>
      <AppText
        variant="body-medium"
        style={[styles.name, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {item.groupName}
      </AppText>
      <StepsValue value={item.steps ?? 0} size={13} color={colors.textPrimary} />
    </TouchableOpacity>
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
            <AppText
              variant="heading-bold"
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {name || t('groups.childGroupsSectionTitle')}
            </AppText>
            <AppText style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('groups.childGroupRanking')}
            </AppText>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={isChildRankingFetching ? ([1, 2, 3] as any) : ranking}
        keyExtractor={(item, index) => (isChildRankingFetching ? index.toString() : item.groupId)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isChildRankingFetching ? (
            <EmptyState icon="git-branch-outline" title={t('common.noData')} subtitle="" />
          ) : null
        }
        renderItem={({ item }) =>
          isChildRankingFetching ? <Skeleton width="100%" height={45} borderRadius={18} /> : renderRow(item)
        }
        ListFooterComponent={
          // Members of this group who joined no sub-group. Not a group, so no
          // rank number and not tappable — and hidden entirely in the normal
          // case where everyone belongs to one.
          !isChildRankingFetching && directOnly && directOnly.count > 0 ? (
            <View
              style={[
                styles.row,
                styles.directOnlyRow,
                { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.rank} />
              <AppText
                variant="body-medium"
                style={[styles.name, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {t('groups.noSubgroup')}
              </AppText>
              <StepsValue value={directOnly.month.steps ?? 0} size={13} color={colors.textSecondary} />
            </View>
          ) : null
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
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSubtitle: { fontSize: 11, lineHeight: 13, marginTop: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    padding: 11,
  },
  // Separated from the ranked rows above so it doesn't read as another entry
  // competing for a place.
  directOnlyRow: { marginTop: spacing.sm },
  rank: { width: 14, textAlign: 'center', fontSize: 13, lineHeight: 15 },
  name: { flex: 1, fontSize: 13, lineHeight: 15 },
});
