import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AppText, AppCard, ScreenHeader } from '../../../src/components';
import { spacing, borderRadius, fontSize } from '../../../src/constants/theme';
import { useAdminDashboard } from '../../../src/features/admin/useAdminDashboard';

export default function AdminRankingScreen() {
  const { type } = useLocalSearchParams();
  const { colors } = useTheme();
  
  // Use existing mock data
  const { topActivities, topGroups, topUsers } = useAdminDashboard();

  let data: any[] = [];
  let title = '';
  let labelKey = '';
  let valueKey = '';
  let icon = '';

  // Generate more mock data based on the limited mock data to simulate a full list
  const generateExtendedMockData = (baseData: any[], count: number) => {
    if (!baseData || baseData.length === 0) return [];
    const extended = [...baseData];
    for (let i = baseData.length; i < count; i++) {
      extended.push({
        ...baseData[i % baseData.length],
        id: `gen_${i}`,
        [labelKey]: `${baseData[i % baseData.length][labelKey]} ${i + 1}`,
      });
    }
    return extended;
  };

  if (type === 'activities') {
    title = 'All Activities Ranking';
    labelKey = 'title';
    valueKey = 'checkIns';
    icon = 'account-group';
    data = generateExtendedMockData(topActivities, 15);
  } else if (type === 'groups') {
    title = 'All Groups Ranking';
    labelKey = 'name';
    valueKey = 'members';
    icon = 'account-multiple';
    data = generateExtendedMockData(topGroups, 15);
  } else if (type === 'users') {
    title = 'All Users Ranking';
    labelKey = 'name';
    valueKey = 'points';
    icon = 'star';
    data = generateExtendedMockData(topUsers, 20);
  }

  const handleItemPress = (item: any) => {
    if (type === 'activities') {
      router.push(`/admin/edit-activity/${item.id}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title={title} 
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/admin/dashboard')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          } 
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppCard style={{ padding: spacing.md, marginHorizontal: spacing.xl, marginBottom: spacing.xl }}>
          {data.map((item, idx) => {
            const isClickable = type === 'activities';
            const Wrapper: any = isClickable ? TouchableOpacity : View;
            return (
              <Wrapper 
                key={item.id} 
                style={[styles.listItem, idx < data.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}
                onPress={isClickable ? () => handleItemPress(item) : undefined}
              >
                <View style={[styles.rankBadge, { backgroundColor: colors.background }]}>
                  <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>{idx + 1}</AppText>
                </View>
                <AppText style={{ flex: 1, fontSize: fontSize.md, color: colors.textPrimary }} numberOfLines={1}>
                  {item[labelKey]}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={icon as any} size={16} color={colors.primary} style={{ marginRight: 4 }} />
                  <AppText style={{ fontSize: fontSize.sm, color: colors.textPrimary }}>{item[valueKey]}</AppText>
                  {isClickable && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: spacing.sm }} />}
                </View>
              </Wrapper>
            );
          })}
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40, paddingTop: spacing.md },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  }
});
