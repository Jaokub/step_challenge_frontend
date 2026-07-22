import React from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText, SearchBar, InlineSpinner } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { spacing } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import friendService from './friendService';
import userService, { UserSearchResult } from '../auth/userService';
import { initials, rowStyles } from './addFriendShared';

const PAGE_SIZE = 20;

interface SearchTabProps {
  active: boolean;
  search: string;
  onChangeSearch: (text: string) => void;
}

// Covers both "typed a query" and "browsing everyone" (empty box) through
// the same paginated endpoint — GET /users/search now treats an empty `q`
// as "list everyone" rather than 400ing, so there's no separate branch
// here for the empty-search case any more.
export default function SearchTab({ active, search, onChangeSearch }: SearchTabProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const insetBg = isDark ? colors.background : colors.inputBackground;
  const trimmedSearch = search.trim();

  const searchQuery = useInfiniteQuery({
    queryKey: queryKeys.friends.search(trimmedSearch),
    queryFn: async ({ pageParam }) => {
      const res = await userService.searchUsers({ q: trimmedSearch || undefined, page: pageParam, limit: PAGE_SIZE });
      if (!res.success) throw new Error('Failed to search users');
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled: active,
  });

  const addMutation = useMutation({
    mutationFn: (friendId: string) => friendService.sendFriendRequest(friendId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(t('friend.requestSentSuccess'), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    },
    onError: (err: any) => showToast(err?.message || t('friend.failedToSendRequest'), 'error'),
  });

  const results: UserSearchResult[] = searchQuery.data?.pages.flatMap((p) => p.users) ?? [];

  return (
    <View style={{ gap: spacing.md }}>
      <SearchBar value={search} onChangeText={onChangeSearch} placeholder={t('friend.searchPlaceholder')} />
      <FlatList
        style={rowStyles.list}
        data={results}
        keyExtractor={(u) => u.id}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) searchQuery.fetchNextPage();
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          searchQuery.isPending ? (
            <View style={rowStyles.loadingRow}>
              <InlineSpinner size={28} />
            </View>
          ) : (
            <AppText style={[rowStyles.empty, { color: colors.textSecondary }]}>{t('friend.noUsersFound')}</AppText>
          )
        }
        ListFooterComponent={
          searchQuery.isFetchingNextPage ? (
            <View style={[rowStyles.loadingRow, { paddingVertical: spacing.md }]}>
              <InlineSpinner size={20} />
            </View>
          ) : null
        }
        renderItem={({ item: u }) => {
          // PENDING_RECEIVED intentionally stays clickable — sending a
          // request back to someone who already invited you auto-accepts
          // it (see backend sendFriendRequest), so it behaves like "Add".
          const isFriend = u.friendshipStatus === 'FRIENDS';
          const isPendingSent = u.friendshipStatus === 'PENDING_SENT';
          const disabled = isFriend || isPendingSent;
          const label = isFriend
            ? t('friend.alreadyFriendsAction')
            : isPendingSent
              ? t('friend.awaitingResponse')
              : t('friend.addAction');

          return (
            <View style={rowStyles.row}>
              <View style={[rowStyles.avatar, { backgroundColor: insetBg }]}>
                <AppText variant="body-bold" style={{ fontSize: 13, color: colors.textPrimary }}>
                  {initials(u.fullName)}
                </AppText>
              </View>
              <AppText variant="body-medium" style={{ flex: 1, fontSize: 13.5, color: colors.textPrimary }} numberOfLines={1}>
                {u.fullName}
              </AppText>
              <TouchableOpacity
                onPress={() => addMutation.mutate(u.id)}
                disabled={disabled || addMutation.isPending}
                style={[
                  rowStyles.outlinePill,
                  disabled ? { backgroundColor: insetBg, borderWidth: 0 } : { borderColor: colors.primary },
                ]}
              >
                {addMutation.isPending && addMutation.variables === u.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <AppText
                    style={{ fontSize: 12, fontWeight: '700' as any, color: disabled ? colors.textSecondary : colors.primary }}
                  >
                    {label}
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}
