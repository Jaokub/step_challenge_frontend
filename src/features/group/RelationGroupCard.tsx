import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AppText, Skeleton } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { gradients, dashboardAccents } from '../../constants/theme';
import type { PeriodBucket } from '../../types';

export interface RelationTop3Item {
  rank: number;
  name: string;
  steps: number;
  onPress?: () => void;
}

interface RelationGroupCardProps {
  title: string;
  stats: { today: PeriodBucket; week: PeriodBucket; month: PeriodBucket };
  top3Label: string;
  top3: RelationTop3Item[];
  /** Tapping the card header navigates to that group's own overview (parent/sibling only). */
  onPress?: () => void;
  /** Child card's "ดูทั้งหมด ›" — opens frame 20's full list. */
  onViewAll?: () => void;
  /**
   * True while this section's period pill is refetching (see
   * useHierarchyOverview's `isHierarchyFetching`). Only the Top-3 rows
   * become skeleton bars — `stats` (today/week/month) don't depend on which
   * pill is selected (that row always shows all three windows regardless),
   * so title/stats stay live the whole time; skeletoning them would just be
   * pointless flicker over numbers that were never going to change.
   * `top3.length` (kept from the previous period via keepPreviousData)
   * decides how many skeleton rows to draw, so the card doesn't resize when
   * real data lands.
   */
  isLoading?: boolean;
}

// Shared shell for the frame-13/15 relation cards (BUILD_PLAN.md Phase
// 5.2, mockup v6): กลุ่มแม่ (parent) / กลุ่มพี่น้อง (sibling) — one real
// group, Top-3 MEMBERS — and กลุ่มลูก (children) — an aggregate across all
// child groups, Top-3 SUB-GROUPS + "ดูทั้งหมด". Same card template either way.
export default function RelationGroupCard({ title, stats, top3Label, top3, onPress, onViewAll, isLoading = false }: RelationGroupCardProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const tone = isDark ? 'dark' : 'light';
  // `colors.card` and `colors.inputBackground` are the same value in dark
  // mode (see ActivityCard's statChipBg comment) — the nested inset boxes
  // below need their own tone-aware background to actually stand out
  // against this card, same fix as the stat chips there.
  const insetBg = isDark ? colors.background : colors.inputBackground;
  // today/week/month row uses the same theme-aware gradient surface as the
  // dashboard ("index" tab) goal card and GroupOverallStatCard, instead of
  // the flat insetBg used by the top3 rows below — keeps this stat row
  // visually consistent with the rest of the app's gradient stat cards.
  const statGradient = isDark ? gradients.goalCard : gradients.goalCardLight;
  const statLabelColor = dashboardAccents.goalLabel[tone];
  const statDivider = colors.primary + '33';

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <AppText variant="body-bold" style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </AppText>

      <LinearGradient colors={statGradient} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.statRow}>
        {(['today', 'week', 'month'] as const).map((period, i) => (
          <React.Fragment key={period}>
            <View style={styles.statCol}>
              <AppText style={[styles.statLabel, { color: statLabelColor }]}>
                {t(`groups.period.${period}`)}
              </AppText>
              <AppText variant="heading-extraBold" style={[styles.statValue, { color: colors.primary }]}>
                {stats[period].steps.toLocaleString()}
              </AppText>
            </View>
            {i < 2 && <View style={[styles.statDivider, { backgroundColor: statDivider }]} />}
          </React.Fragment>
        ))}
      </LinearGradient>

      <View style={styles.top3Header}>
        <AppText style={[styles.top3Label, { color: colors.textSecondary }]}>{top3Label}</AppText>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <AppText style={[styles.viewAll, { color: colors.primary }]}>{t('groups.viewAll')}</AppText>
          </TouchableOpacity>
        )}
      </View>

      {isLoading
        ? Array.from({ length: top3.length || 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={35} borderRadius={14} />
          ))
        : top3.map((row) => {
            const RowWrapper = row.onPress ? TouchableOpacity : View;
            return (
              <RowWrapper
                key={row.rank}
                {...(row.onPress ? { onPress: row.onPress, activeOpacity: 0.7 } : {})}
                style={[styles.top3Row, { backgroundColor: insetBg }]}
              >
                <AppText variant="body-bold" style={[styles.top3Rank, { color: colors.textSecondary }]}>
                  {row.rank}
                </AppText>
                <AppText variant="body-medium" style={[styles.top3Name, { color: colors.textPrimary }]} numberOfLines={1}>
                  {row.name}
                </AppText>
                <AppText variant="body-bold" style={[styles.top3Steps, { color: colors.textPrimary }]}>
                  {row.steps.toLocaleString()}
                </AppText>
              </RowWrapper>
            );
          })}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  // Mockup: border-radius:20px;padding:14px;gap:10px
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  title: { fontSize: 13.5, lineHeight: 16 },
  // Mockup: border-radius:14px;padding:10px 4px
  statRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4 },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 24 },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 15, lineHeight: 17 },
  top3Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  top3Label: { fontSize: 11, fontWeight: '600' as any },
  viewAll: { fontSize: 11, fontWeight: '700' as any },
  // Mockup: border-radius:14px;padding:9px 11px
  top3Row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 11 },
  top3Rank: { width: 12, fontSize: 12.5, lineHeight: 15 },
  top3Name: { flex: 1, fontSize: 12.5, lineHeight: 15 },
  top3Steps: { fontSize: 12.5, lineHeight: 15 },
});
