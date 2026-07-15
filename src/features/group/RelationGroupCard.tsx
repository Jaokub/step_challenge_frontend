import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
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
}

// Shared shell for the frame-13/15 relation cards (BUILD_PLAN.md Phase
// 5.2, mockup v6): กลุ่มแม่ (parent) / กลุ่มพี่น้อง (sibling) — one real
// group, Top-3 MEMBERS — and กลุ่มลูก (children) — an aggregate across all
// child groups, Top-3 SUB-GROUPS + "ดูทั้งหมด". Same card template either way.
export default function RelationGroupCard({ title, stats, top3Label, top3, onPress, onViewAll }: RelationGroupCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <AppText variant="body-bold" style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </AppText>

      <View style={[styles.statRow, { backgroundColor: colors.inputBackground }]}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <View key={period} style={styles.statCol}>
            <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t(`groups.period.${period}`)}
            </AppText>
            <AppText variant="heading-extraBold" style={[styles.statValue, { color: colors.textPrimary }]}>
              {stats[period].steps.toLocaleString()}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.top3Header}>
        <AppText style={[styles.top3Label, { color: colors.textSecondary }]}>{top3Label}</AppText>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <AppText style={[styles.viewAll, { color: colors.primary }]}>{t('groups.viewAll')}</AppText>
          </TouchableOpacity>
        )}
      </View>

      {top3.map((row) => {
        const RowWrapper = row.onPress ? TouchableOpacity : View;
        return (
          <RowWrapper
            key={row.rank}
            {...(row.onPress ? { onPress: row.onPress, activeOpacity: 0.7 } : {})}
            style={[styles.top3Row, { backgroundColor: colors.inputBackground }]}
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
  statRow: { flexDirection: 'row', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4 },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, marginBottom: 2 },
  statValue: { fontSize: 13, lineHeight: 16 },
  top3Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  top3Label: { fontSize: 11, fontWeight: '600' as any },
  viewAll: { fontSize: 11, fontWeight: '700' as any },
  // Mockup: border-radius:14px;padding:9px 11px
  top3Row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 11 },
  top3Rank: { width: 12, fontSize: 12.5, lineHeight: 15 },
  top3Name: { flex: 1, fontSize: 12.5, lineHeight: 15 },
  top3Steps: { fontSize: 12.5, lineHeight: 15 },
});
