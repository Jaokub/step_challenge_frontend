import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useGroups } from '../../src/features/group/useGroups';
import { AppText, ScreenHeader, EmptyState, Skeleton } from '../../src/components';
import { spacing, fontSize, gradients } from '../../src/constants/theme';
import type { AppGroup } from '../../src/types';

const GROUP_CAP = 3;

// Mockup frame 11 "My Groups" (`/(tabs)/groups`). That exact route is
// occupied by the pre-existing Friends & Groups screen (closer to frame 10),
// which we didn't want to tear out — so this ships at `/group/my-groups`
// instead, reachable from a header icon there. See admin-console-styling
// memory for the full note on this deviation.
export default function MyGroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { groups, isLoading, isRefreshing, handleRefresh } = useGroups(true);

  const ownedCount = groups.filter((g) => g.myRole === 'OWNER').length;
  const atCap = ownedCount >= GROUP_CAP;

  const renderItem = ({ item }: { item: AppGroup }) => {
    const isCoordinator = item.myRole === 'OWNER';
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/group/${item.id}`)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <View style={styles.cardTop}>
          <AppText variant="body-bold" style={{ flex: 1, fontSize: fontSize.md, color: colors.textPrimary }} numberOfLines={1}>
            {item.name}
          </AppText>
          {isCoordinator && (
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coordBadge}>
              <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.onPrimary }}>
                {t('groups.coordinatorBadge')}
              </AppText>
            </LinearGradient>
          )}
        </View>
        <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          {t('groups.memberCountLabel', { count: item.memberCount ?? 0 })}
        </AppText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('groups.myGroups')}
          titleSize={20}
          pathSubtitle="/group/my-groups"
          onBack={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/groups'))}
        />
      </SafeAreaView>

      <View style={styles.ctaWrap}>
        {atCap ? (
          <View style={[styles.ctaDisabled, { backgroundColor: colors.inputBackground }]}>
            <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.textSecondary, textAlign: 'center' }}>
              {t('groups.createGroupCapFull')}
            </AppText>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push('/group/create')}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.onPrimary }}>
                {t('groups.createGroupCapPill', { count: ownedCount })}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton width="100%" height={78} borderRadius={20} />
          <Skeleton width="100%" height={78} borderRadius={20} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={t('groups.myGroupsEmptyTitle')}
              subtitle={t('groups.myGroupsEmptySubtitle')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ctaWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  cta: { paddingVertical: 11, borderRadius: 14, alignItems: 'center' },
  ctaDisabled: { paddingVertical: 11, borderRadius: 14, alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.md },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  coordBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
});
