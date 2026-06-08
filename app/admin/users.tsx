import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, EmptyState } from '../../src/components';
import { spacing, fontSize } from '../../src/constants/theme';

export default function UsersManagementScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for users
  const [users, setUsers] = useState([
    { id: '1', fullName: 'Annika', department: 'HR', role: 'ADMIN', points: 450, isArchived: false },
    { id: '2', fullName: 'David', department: 'IT', role: 'STAFF', points: 420, isArchived: false },
    { id: '3', fullName: 'John Doe', department: 'Accounting', role: 'STAFF', points: 380, isArchived: false },
    { id: '4', fullName: 'Jane Smith', department: 'Marketing', role: 'STAFF', points: 350, isArchived: false },
    { id: '5', fullName: 'Alice', department: 'IT', role: 'STAFF', points: 310, isArchived: true },
    { id: '6', fullName: 'Bob Johnson', department: 'HR', role: 'STAFF', points: 200, isArchived: false },
    { id: '7', fullName: 'Patrik', department: 'Design', role: 'STAFF', points: 150, isArchived: false },
  ]);

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
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
                <AppText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>ADMIN</AppText>
              </View>
            )}
            {item.isArchived && (
              <View style={[styles.roleBadge, { backgroundColor: colors.textSecondary }]}>
                <AppText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>ARCHIVED</AppText>
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
            {item.points}
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
            placeholder="Search users or department..."
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
