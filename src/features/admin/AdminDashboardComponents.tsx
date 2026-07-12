import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText, AppCard } from '../../components';
import { spacing, borderRadius, fontSize } from '../../constants/theme';

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
}

export const AdminKpiGrid = ({ items, colors }: { items: KpiItem[]; colors: any }) => (
  <View style={styles.kpiGrid}>
    {items.map((kpi) => (
      <AppCard key={kpi.key} style={styles.kpiCard}>
        <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '1A' }]}>
          <MaterialCommunityIcons name={kpi.icon as any} size={16} color={colors.primary} />
        </View>
        <AppText variant="heading-bold" style={{ fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm }}>
          {kpi.value.toLocaleString()}
        </AppText>
        <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 15 }}>{kpi.label}</AppText>
      </AppCard>
    ))}
  </View>
);

// Frame 1 — "ก้าวรวมทั้งคณะ (เดือนนี้)" has no backend aggregate today
// (no endpoint sums HealthRecord.steps across every user). Stub + flag
// instead of computing a misleading number client-side.
export const AdminFacultyStepsCard = ({ colors }: any) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.stepsCard, { backgroundColor: colors.inputBackground, borderColor: colors.primary + '30' }]}>
      <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.facultyStepsLabel')}</AppText>
      <AppText variant="heading-bold" style={{ fontSize: fontSize['2xl'], color: colors.textSecondary, marginTop: 4 }}>
        —
      </AppText>
      <View style={[styles.needsEndpointPill, { backgroundColor: colors.warning + '1A' }]}>
        <AppText style={{ fontSize: 10, color: colors.warning, fontWeight: '700' as any }}>
          {t('admin.facultyStepsNeedsEndpoint')}
        </AppText>
      </View>
    </View>
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
  <View style={styles.navGrid}>
    {items.map((nav) => {
      const disabled = !nav.onPress;
      return (
        <TouchableOpacity
          key={nav.key}
          disabled={disabled}
          onPress={nav.onPress}
          style={[styles.navCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: disabled ? 0.6 : 1 }]}
        >
          <View style={[styles.navIcon, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name={nav.icon as any} size={16} color={colors.primary} />
          </View>
          <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>{nav.title}</AppText>
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
);

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  kpiCard: {
    width: '47%',
    padding: spacing.lg,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  needsEndpointPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  navCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.xs,
  },
  navIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
