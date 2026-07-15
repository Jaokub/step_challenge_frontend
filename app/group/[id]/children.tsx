import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, Skeleton, GradientText, ScreenHeader, EmptyState, LoadingScreen } from '../../../src/components';
import { spacing, borderRadius, layout, fontSize, gradients, dashboardAccents } from '../../../src/constants/theme';
import { useChildRanking } from '../../../src/features/group/useChildRanking';

// Mockup frame 20 — full ranked child-group list, reached from the child
// relation card's "ดูทั้งหมด ›" link on /group/[id] (BUILD_PLAN.md Phase
// 5.2). Same mint-hero-card + ranked-row shape as /events/[id], but ranking
// sub-groups by month steps (getChildRanking) instead of ranking members.
export default function GroupChildrenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { childRanking, isChildRankingLoading } = useChildRanking(id);

  if (isChildRankingLoading) return <LoadingScreen message={t('common.loading')} />;

  const ranking = childRanking?.ranking ?? [];
  const stats = childRanking?.stats;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader
          title={t('groups.childGroupsSectionTitle')}
          titleSize={16}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push(`/group/${id}`))}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={gradients.mint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderColor: colors.primary + '2E' }]}
          >
            <View style={styles.statRow}>
              {(['today', 'week', 'month'] as const).map((period) => (
                <View key={period} style={styles.statCol}>
                  <AppText style={[styles.statLabel, { color: dashboardAccents.mintCardLabel }]}>
                    {t(`groups.period.${period}`)}
                  </AppText>
                  <GradientText colors={gradients.statValue} variant="heading-bold" style={styles.statValue}>
                    {(stats?.[period].steps ?? 0).toLocaleString()}
                  </GradientText>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <AppText variant="body-bold" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('groups.childGroupRanking')}
            </AppText>

            {ranking.length === 0 ? (
              <EmptyState icon="people-outline" title={t('common.noData')} subtitle="" />
            ) : (
              ranking.map((row) => (
                <View key={row.groupId} style={[styles.rankRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <AppText variant="body-bold" style={[styles.rankNum, { color: colors.textSecondary }]}>
                    {row.rank}
                  </AppText>
                  <AppText variant="body-medium" style={[styles.rankName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {row.groupName}
                  </AppText>
                  <AppText variant="heading-bold" style={[styles.rankSteps, { color: colors.textPrimary }]}>
                    {row.steps.toLocaleString()}
                  </AppText>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: layout.screenPaddingX, paddingBottom: spacing['4xl'], gap: layout.sectionGap },
  statCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.xl },
  statRow: { flexDirection: 'row' },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  statValue: { fontSize: fontSize['2xl'] },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, lineHeight: 17 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 18, borderWidth: 1, padding: 11 },
  rankNum: { width: 14, textAlign: 'center', fontSize: 13, lineHeight: 15 },
  rankName: { flex: 1, fontSize: 13, lineHeight: 15 },
  rankSteps: { fontSize: 13, lineHeight: 15 },
});
