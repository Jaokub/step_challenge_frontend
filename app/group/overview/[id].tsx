import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { AppText, LoadingScreen, EmptyState, LeaderboardItem } from '../../../src/components';
import { spacing, fontSize } from '../../../src/constants/theme';
import { useGroupOverview } from '../../../src/features/group/useGroupOverview';
import { GroupOverviewSection } from '../../../src/features/group/GroupOverviewSection';
import type { GroupRankingRow } from '../../../src/types';

/**
 * Read-only "everything a parent group can see" view of a descendant group:
 * its overall stats, top3, and full ranking. Reachable only from
 * GroupDescendantsSection (Faculty -> Dept). No member-management actions —
 * the viewer isn't a member of this group, they're an ancestor.
 */
export default function GroupDescendantOverviewScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { overview, isOverviewLoading } = useGroupOverview(id);

  const renderRow = ({ item }: { item: GroupRankingRow }) => (
    <LeaderboardItem
      rank={item.rank}
      user={{ fullName: item.fullName, department: item.department, avatarUrl: item.avatarUrl ?? undefined, steps: item.steps ?? 0 }}
      isCurrentUser={item.id === user?.id}
    />
  );

  if (isOverviewLoading) return <LoadingScreen message={t('common.loading')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {name || t('groups.departmentGroups')}
        </AppText>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <FlatList
        data={overview?.ranking ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <GroupOverviewSection
            overallStats={overview?.overallStats ?? null}
            top3={overview?.top3 ?? []}
            isLoading={isOverviewLoading}
            currentUserId={user?.id}
          />
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title={t('common.noData')} subtitle="" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  listContent: { padding: spacing.xl, paddingBottom: spacing['4xl'] },
});
