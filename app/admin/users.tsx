import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState, ErrorState, LoadingScreen } from '../../src/components';
import userService from '../../src/features/auth/userService';
import { queryKeys } from '../../src/constants/queryKeys';
import { spacing, fontSize } from '../../src/constants/theme';

type RoleFilter = 'all' | 'admin' | 'noDept';

export default function UsersManagementScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const { data, isPending: loading, error: queryError, refetch: fetchUsers } = useQuery({
    queryKey: queryKeys.users.list,
    queryFn: async () => {
      const res = await userService.getAllUsers();
      if (res && res.success && res.data) {
        return (res.data.users || (res.data as any)) as any[];
      }
      throw new Error(t('common.cannotLoadData'));
    },
  });

  const users: any[] = data ?? [];
  const error: string | null = queryError
    ? (queryError as any)?.response?.data?.message || (queryError as any)?.message || t('common.cannotLoadData')
    : null;

  const roleFiltered = users.filter((user) => {
    if (roleFilter === 'admin') return user.role === 'ADMIN';
    if (roleFilter === 'noDept') return !user.department;
    return true;
  });

  const filteredUsers = roleFiltered.filter(user =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.userCard, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'ADMIN' ? colors.warning + '20' : colors.primary + '20' }]}>
          <AppText variant="heading-bold" style={{ color: item.role === 'ADMIN' ? colors.warning : colors.primary, fontSize: fontSize.md }}>
            {item.fullName.charAt(0)}
          </AppText>
        </View>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText variant="heading-bold" style={{ color: colors.textPrimary, fontSize: fontSize.md, marginRight: spacing.xs }}>
              {item.fullName}
            </AppText>
            {item.role === 'ADMIN' && (
              <View style={[styles.roleBadge, { backgroundColor: colors.warning }]}>
                <AppText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>{t('admin.roleAdmin')}</AppText>
              </View>
            )}
            {item.isArchived && (
              <View style={[styles.roleBadge, { backgroundColor: colors.textSecondary }]}>
                <AppText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>{t('admin.statusArchived')}</AppText>
              </View>
            )}
          </View>
          <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
            {item.department || t('admin.filterNoDept')}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={12} color={colors.warning} style={{ marginRight: 4 }} />
            <AppText variant="body-bold" style={{ color: colors.textPrimary, fontSize: fontSize.sm }}>
              {item.totalPoints || item.points || 0}
            </AppText>
          </View>
          <AppText style={{ fontSize: 10, color: colors.textSecondary }}>
            {item.role === 'ADMIN' ? t('admin.revokeAdminAction') : t('admin.grantAdminAction')}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('admin.navUsersTitle')}
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
        />
      </SafeAreaView>

      <View style={styles.filterRow}>
        {(['all', 'admin', 'noDept'] as RoleFilter[]).map((f) => {
          const active = f === roleFilter;
          const label = f === 'all' ? t('admin.filterAll') : f === 'admin' ? t('admin.filterAdminRole') : t('admin.filterNoDept');
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setRoleFilter(f)}
              style={[styles.filterChip, { backgroundColor: active ? colors.textPrimary : colors.inputBackground }]}
            >
              <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: active ? colors.background : colors.textSecondary }}>
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.needsEndpointPill, { backgroundColor: colors.warning + '1A' }]}>
        <AppText style={{ fontSize: 10.5, color: colors.warning, fontWeight: '700' as any, textAlign: 'center' }}>
          {t('admin.roleToggleNeedsEndpoint')}
        </AppText>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('admin.searchUsers')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorState
          title={t('admin.errorLoadingUsers')}
          message={error}
          onRetry={fetchUsers}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="people"
              title={t('admin.noUsersFound')}
              subtitle={t('admin.noUsersFoundSubtitle')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm - 1,
    borderRadius: 999,
  },
  needsEndpointPill: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: { flex: 1 },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
