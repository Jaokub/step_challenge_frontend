import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState, ErrorState, LoadingScreen } from '../../src/components';
import userService from '../../src/features/auth/userService';
import { queryKeys } from '../../src/constants/queryKeys';
import { spacing, fontSize, adminAccents, gradients } from '../../src/constants/theme';

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
    const isAdmin = item.role === 'ADMIN';
    // Mockup frame 8: every row gets a role pill showing the literal role
    // enum (STAFF/ADMIN) — ADMIN is the brand gradient, STAFF is a plain grey
    // pill. The old code only showed a pill for admins/archived users and
    // hid it entirely for regular staff, which doesn't match.
    const roleLabel = item.role || 'STAFF';
    const deptLine = item.isArchived
      ? `${item.department || t('admin.filterNoDept')} · ${t('admin.statusArchived')}`
      : item.department || t('admin.filterNoDept');

    return (
      <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: adminAccents.avatarBg }]}>
          <AppText variant="heading-bold" style={{ color: adminAccents.onDark, fontSize: fontSize.xs }}>
            {item.fullName.charAt(0)}
          </AppText>
        </View>
        <View style={styles.userInfo}>
          <AppText variant="body-bold" style={{ color: colors.textPrimary, fontSize: 13.5 }} numberOfLines={1}>
            {item.fullName}
          </AppText>
          <AppText style={{ color: colors.textSecondary, fontSize: fontSize.xs }} numberOfLines={1}>
            {deptLine}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          {isAdmin ? (
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.roleBadge}>
              <AppText style={{ color: colors.onPrimary, fontSize: 10, fontWeight: '700' as any }}>{roleLabel}</AppText>
            </LinearGradient>
          ) : (
            <View style={[styles.roleBadge, { backgroundColor: colors.inputBackground }]}>
              <AppText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' as any }}>{roleLabel}</AppText>
            </View>
          )}
          <AppText style={{ fontSize: 10, color: colors.primary, fontWeight: '700' as any }}>
            {isAdmin ? t('admin.revokeAdminAction') : t('admin.grantAdminAction')}
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
          titleSize={20}
          pathSubtitle="/admin/users"
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/dashboard'))}
        />
      </SafeAreaView>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBackground }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('admin.searchUsers')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
    height: 46,
    borderRadius: 14,
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
    gap: spacing.md,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0 },
  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
});
