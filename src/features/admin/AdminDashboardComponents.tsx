import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText, GradientText } from '../../components';
import { spacing, fontSize, gradients, dashboardAccents } from '../../constants/theme';

// Frame 1 exact spec (Admin and Group Coor Console Mockups_5.dc.html):
// white cards radius 22 + soft shadow, KPI icon chips in four distinct accents,
// faculty-steps card on the mint teal→lime tint. Values below are mockup-literal
// where they aren't brand tokens (kept in one place, documented).
const CARD_RADIUS = 22;
const STEPS_TINT = gradients.mint; // mockup linear-gradient(150deg,#e8fbf6,#f3fbe9)
const cardShadow = {
  shadowColor: 'rgba(20,32,29,0.25)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 3,
} as const;

// Frame 1 — orange banner: coordinators don't see this admin console at all,
// they use the "My Groups" tab instead. Purely informational copy.
export const AdminCoordinatorBanner = ({ colors }: any) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.banner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning + '40' }]}>
      <AppText style={{ fontSize: fontSize.xs, color: colors.warning, lineHeight: 18 }}>
        {t('admin.coordinatorBanner')}
      </AppText>
    </View>
  );
};

interface KpiItem {
  key: string;
  value: number;
  label: string;
  icon: string;
  color: string; // accent for the icon chip (mockup: teal / blue / lime / orange)
  round?: boolean; // round chip vs squircle (mockup iconShape 50% vs 4px)
}

// Grouped into explicit 2-up rows (rather than relying on flexWrap) so the
// left/right cards in a row always match height and stay aligned even when
// one label wraps to more lines than its neighbor — flexWrap's per-line
// stretch was leaving the right column visibly offset vertically.
const pairUp = <T,>(items: T[]): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
};

export const AdminKpiGrid = ({ items, colors }: { items: KpiItem[]; colors: any }) => (
  <View style={styles.grid}>
    {pairUp(items).map((row, i) => (
      <View key={i} style={styles.gridRow}>
        {row.map((kpi) => (
          <View
            key={kpi.key}
            style={[styles.kpiCard, cardShadow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <View
              style={[
                styles.kpiIcon,
                { backgroundColor: kpi.color + '1F', borderRadius: kpi.round ? 16 : 9 },
              ]}
            >
              <MaterialCommunityIcons name={kpi.icon as any} size={17} color={kpi.color} />
            </View>
            <AppText variant="heading-bold" style={{ fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm }}>
              {kpi.value.toLocaleString()}
            </AppText>
            <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 15 }}>{kpi.label}</AppText>
          </View>
        ))}
      </View>
    ))}
  </View>
);

// Frame 1 — "ก้าวรวมทั้งคณะ (เดือนนี้)" has no backend aggregate today
// (no endpoint sums HealthRecord.steps across every user). Stub + flag
// instead of computing a misleading number client-side. The mint gradient
// surface still matches the mockup.
export const AdminFacultyStepsCard = ({ colors }: any) => {
  const { t } = useTranslation();
  return (
    <LinearGradient
      colors={STEPS_TINT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.stepsCard, { borderColor: colors.primary + '2E' }]}
    >
      <AppText style={{ fontSize: fontSize.sm, color: dashboardAccents.mintCardLabel, fontWeight: '600' as any }}>
        {t('admin.facultyStepsLabel')}
      </AppText>
      {/* Mockup renders this figure as a gradient-filled number (teal→green), never
          a solid color — pull the fill from the central `gradients.statValue` token. */}
      <GradientText colors={gradients.statValue} variant="heading-bold" style={{ fontSize: fontSize['3xl'], marginTop: 4 }}>
        —
      </GradientText>
      <View style={[styles.needsEndpointPill, { backgroundColor: colors.warning + '22' }]}>
        <AppText style={{ fontSize: 10, color: colors.warning, fontWeight: '700' as any }}>
          {t('admin.facultyStepsNeedsEndpoint')}
        </AppText>
      </View>
    </LinearGradient>
  );
};

interface NavCard {
  key: string;
  title: string;
  desc: string;
  icon: string;
  onPress?: () => void;
  disabledNote?: string;
}

export const AdminNavGrid = ({ items, colors }: { items: NavCard[]; colors: any }) => (
  <View style={styles.grid}>
    {pairUp(items).map((row, i) => (
      <View key={i} style={styles.gridRow}>
        {row.map((nav) => {
          const disabled = !nav.onPress;
          return (
            <TouchableOpacity
              key={nav.key}
              disabled={disabled}
              activeOpacity={0.85}
              onPress={nav.onPress}
              style={[styles.navCard, cardShadow, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: disabled ? 0.55 : 1 }]}
            >
              <View style={styles.navTop}>
                <View style={[styles.navIcon, { backgroundColor: colors.inputBackground }]}>
                  <Ionicons name={nav.icon as any} size={16} color={colors.primary} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
              <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary, marginTop: spacing.sm }}>{nav.title}</AppText>
              <AppText style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 14 }}>{nav.desc}</AppText>
              {disabled && nav.disabledNote && (
                <AppText style={{ fontSize: 10, color: colors.warning, fontWeight: '700' as any, marginTop: 2 }}>
                  {nav.disabledNote}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  grid: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch', // right column stretches to match the taller card in the row
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
  },
  needsEndpointPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  navCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  navTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
