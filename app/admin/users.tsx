import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState, ErrorState, LoadingScreen } from '../../src/components';
import userService from '../../src/features/auth/userService';
import { spacing, fontSize } from '../../src/constants/theme';

export default function UsersManagementScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAllUsers();
      if (res && res.success && res.data) {
        setUsers(res.data.users || (res.data as any));
      }
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      setError(err?.response?.data?.message || t('common.cannotLoadData'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
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
            {item.department}
          </AppText>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={12} color={colors.warning} style={{ marginRight: 4 }} />
          <AppText variant="body-bold" style={{ color: colors.textPrimary, fontSize: fontSize.sm }}>
            {item.totalPoints || item.points || 0}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title="Users Management" 
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

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
          title="Error Loading Users" 
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
              title="No users found"
              subtitle="Try adjusting your search query"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
