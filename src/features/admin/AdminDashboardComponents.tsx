import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText, AppCard, PrimaryButton } from '../../components';
import { spacing, borderRadius, fontSize } from '../../constants/theme';

export const AdminOverviewStats = ({ stats, colors }: any) => {
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <AppCard style={[styles.statCardContainer, { flex: 1 }]}>
          <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
          <AppText variant="heading-bold" style={{ fontSize: fontSize['2xl'], color: colors.textPrimary, marginTop: spacing.sm }}>{stats.totalUsers}</AppText>
          <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.totalUsers')}</AppText>
        </AppCard>
        <AppCard style={[styles.statCardContainer, { flex: 1 }]}>
          <MaterialCommunityIcons name="check-decagram" size={24} color={colors.primary} />
          <AppText variant="heading-bold" style={{ fontSize: fontSize['2xl'], color: colors.textPrimary, marginTop: spacing.sm }}>{stats.checkInRate}%</AppText>
          <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.checkInRate')}</AppText>
        </AppCard>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <AppCard style={[styles.statCardContainer, { flex: 1 }]}>
          <MaterialCommunityIcons name="calendar-today" size={24} color={colors.warning} />
          <AppText variant="heading-bold" style={{ fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm }}>{stats.dau} / {stats.wau}</AppText>
          <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.dauWau')}</AppText>
        </AppCard>
        <AppCard style={[styles.statCardContainer, { flex: 1 }]}>
          <MaterialCommunityIcons name="run" size={24} color={colors.warning} />
          <AppText variant="heading-bold" style={{ fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm }}>{stats.activeActivities} / {stats.completedActivities}</AppText>
          <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.activeEnded')}</AppText>
        </AppCard>
      </View>
    </View>
  );
};

export const AdminExportBtn = ({ onExport }: any) => (
  <View style={{ paddingHorizontal: spacing.xl, marginVertical: spacing.md }}>
    <PrimaryButton 
      title="Export Report (CSV)" 
      onPress={onExport} 
      icon="download"
    />
  </View>
);

export const AdminTopList = ({ title, data, icon, valueKey, labelKey, colors, onItemPress, actionBtn, onViewAll }: any) => {
  const { t } = useTranslation();
  return (
  <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
      <AppText variant="heading-bold" style={{ fontSize: fontSize.lg, color: colors.textPrimary }}>{title}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <AppText style={{ fontSize: fontSize.sm, color: colors.primary }}>{t('common.seeAll')}</AppText>
          </TouchableOpacity>
        )}
        {actionBtn}
      </View>
    </View>
    <AppCard style={{ padding: spacing.md }}>
      {data.map((item: any, idx: number) => {
        const Wrapper: any = onItemPress ? TouchableOpacity : View;
        return (
          <Wrapper 
            key={item.id} 
            style={[styles.listItem, idx < data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}
            onPress={onItemPress ? () => onItemPress(item) : undefined}
          >
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
              <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>{idx + 1}</AppText>
            </View>
            <AppText style={{ flex: 1, fontSize: fontSize.md, color: colors.textPrimary }}>{item[labelKey]}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name={icon} size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <AppText style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>{item[valueKey]}</AppText>
              {onItemPress && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: spacing.sm }} />}
            </View>
          </Wrapper>
        );
      })}
    </AppCard>
  </View>
  );
};

const styles = StyleSheet.create({
  statCardContainer: { padding: spacing.lg },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
});
