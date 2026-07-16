import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, EmptyState, LoadingScreen } from '../../../src/components';
import { spacing, gradients, dashboardAccents } from '../../../src/constants/theme';
import { useChildRanking } from '../../../src/features/group/useChildRanking';

// Mockup frame 20 — full ranked child-group list, reached from the child
// relation card's "ดูทั้งหมด ›" link on /group/[id] (BUILD_PLAN.md Phase
// 5.2). Header + mint stat card pixel-matched to the mockup's frame-20
// markup: back chip (34/11/#eef2f0), title "อันดับกลุ่มย่อย" + the parent
// group's own name as subtitle (childGroupFull.parentName), and a solid
// (not gradient) #0d9488 stat value with column dividers.
export default function GroupChildrenScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { childRanking, isChildRankingLoading } = useChildRanking(id);

  if (isChildRankingLoading) return <LoadingScreen message={t('common.loading')} />;

  const ranking = childRanking?.ranking ?? [];
  const stats = childRanking?.stats;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push(`/group/${id}`))}
            style={[styles.chip, { backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="chevron-back" size={14} color={colors.textPrimary}/>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <AppText variant="heading-bold" style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {t('groups.childGroupRankingTitle')}
            </AppText>
            {!!name && (
              <AppText style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {name}
              </AppText>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={gradients.mint}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.statCard, { borderColor: colors.primary + '2E' }]}
        >
          {(['today', 'week', 'month'] as const).map((period, i) => (
            <React.Fragment key={period}>
              <View style={styles.statCol}>
                <AppText style={[styles.statLabel, { color: dashboardAccents.mintCardLabel }]}>
                  {t(`groups.period.${period}`)}
                </AppText>
                <AppText variant="heading-extraBold" style={[styles.statValue, { color: colors.primary }]}>
                  {(stats?.[period].steps ?? 0).toLocaleString()}
                </AppText>
              </View>
              {i < 2 && <View style={[styles.statDivider, { backgroundColor: colors.primary + '2E' }]} />}
            </React.Fragment>
          ))}
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
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.md },
  // Mockup frame 20: border-radius:20px;padding:16px;border:1px solid rgba(13,148,136,0.18)
  statCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16 },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32 },
  statLabel: { fontSize: 11, lineHeight: 13, fontWeight: '600' as any, marginBottom: 4 },
  statValue: { fontSize: 17, lineHeight: 20 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, lineHeight: 17 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 18, borderWidth: 1, padding: 11 },
  rankNum: { width: 14, textAlign: 'center', fontSize: 13, lineHeight: 15 },
  rankName: { flex: 1, fontSize: 13, lineHeight: 15 },
  rankSteps: { fontSize: 13, lineHeight: 15 },
});
