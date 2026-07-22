import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, BottomSheet } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { gradients } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import friendService from './friendService';
import SearchTab from './SearchTab';
import PendingTab from './PendingTab';
import InviteTab from './InviteTab';

type Tab = 'search' | 'pending' | 'invite';

interface AddFriendSheetProps {
  visible: boolean;
  onClose: () => void;
}

// Mockup "Friends Popup.dc.html" isAddFriend sheet — replaces the previous
// `router.push('/add-friend')` from the groups screen icon, which 404'd into
// an "Invalid user ID" error because that route is actually the deep-link
// confirm-screen (used by scan.tsx / shared invite links with a real
// `userId` param), not a general add-friend flow. This sheet is the real
// entry point: search/browse (GET /users/search), pending sent requests
// (GET /friends/sent), and invite (QR + copy-ID + copy-link, no share
// sheet). Each tab's own logic lives in its own component — this shell
// just owns the tab bar plus the "คำขอที่รอ" query/mutation, since its
// count feeds the tab label.
export default function AddFriendSheet({ visible, onClose }: AddFriendSheetProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const insetBg = isDark ? colors.background : colors.inputBackground;

  const [tab, setTab] = useState<Tab>('search');
  const [search, setSearch] = useState('');

  const sentQuery = useQuery({
    queryKey: queryKeys.friends.sent,
    queryFn: async () => {
      const res = await friendService.getSentRequests();
      if (!res.success) throw new Error('Failed to load sent requests');
      return res.data;
    },
    enabled: visible,
  });

  const cancelMutation = useMutation({
    mutationFn: (friendshipId: string) => friendService.removeFriend(friendshipId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(t('friend.requestCancelled'), 'success');
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    },
    onError: (err: any) => showToast(err?.message || t('common.error'), 'error'),
  });

  const sentRequests = sentQuery.data ?? [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'search', label: t('friend.searchTab') },
    { key: 'pending', label: t('friend.pendingTab', { count: sentRequests.length }) },
    { key: 'invite', label: t('friend.inviteTab') },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <AppText variant="heading-bold" style={[styles.title, { color: colors.textPrimary }]}>
        {t('friend.addFriend')}
      </AppText>

      <View style={[styles.tabTrack, { backgroundColor: insetBg }]}>
        {tabs.map(({ key, label }) => {
          const active = tab === key;
          return active ? (
            <LinearGradient
              key={key}
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabPill}
            >
              <TouchableOpacity onPress={() => setTab(key)} style={styles.tabPillInner}>
                <AppText style={[styles.tabLabel, { color: colors.onPrimary }]} numberOfLines={1}>
                  {label}
                </AppText>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity key={key} onPress={() => setTab(key)} style={styles.tabPill}>
              <AppText style={[styles.tabLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'search' && <SearchTab active={visible && tab === 'search'} search={search} onChangeSearch={setSearch} />}

      {tab === 'pending' && (
        <PendingTab
          requests={sentRequests}
          loading={sentQuery.isPending}
          onCancel={(id) => cancelMutation.mutate(id)}
          cancelingId={cancelMutation.isPending ? cancelMutation.variables : undefined}
        />
      )}

      {tab === 'invite' && <InviteTab />}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, lineHeight: 22 },
  tabTrack: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  tabPill: { flex: 1, borderRadius: 12, paddingVertical: 10 },
  tabPillInner: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12.5, fontWeight: '700' as any, textAlign: 'center' },
});
