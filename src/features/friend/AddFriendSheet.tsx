import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { AppText, BottomSheet, SearchBar } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, gradients } from '../../constants/theme';
import { queryKeys } from '../../constants/queryKeys';
import friendService from './friendService';
import userService from '../auth/userService';

type Tab = 'search' | 'pending' | 'invite';

interface AddFriendSheetProps {
  visible: boolean;
  onClose: () => void;
}

const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

// Mockup "Friends Popup.dc.html" isAddFriend sheet — replaces the previous
// `router.push('/add-friend')` from the groups screen icon, which 404'd into
// an "Invalid user ID" error because that route is actually the deep-link
// confirm-screen (used by scan.tsx / shared invite links with a real
// `userId` param), not a general add-friend flow. This sheet is the real
// entry point: search (GET /users/search), pending sent requests
// (GET /friends/sent, new), and invite (QR + copy-ID via expo-clipboard +
// share, no new backend needed).
export default function AddFriendSheet({ visible, onClose }: AddFriendSheetProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insetBg = isDark ? colors.background : colors.inputBackground;

  const [tab, setTab] = useState<Tab>('search');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const trimmedSearch = search.trim();

  const searchQuery = useQuery({
    queryKey: queryKeys.friends.search(trimmedSearch),
    queryFn: async () => {
      const res = await userService.searchUsers(trimmedSearch);
      if (!res.success) throw new Error('Failed to search users');
      return res.data;
    },
    enabled: visible && tab === 'search' && trimmedSearch.length > 0,
  });

  const sentQuery = useQuery({
    queryKey: queryKeys.friends.sent,
    queryFn: async () => {
      const res = await friendService.getSentRequests();
      if (!res.success) throw new Error('Failed to load sent requests');
      return res.data;
    },
    enabled: visible && tab === 'pending',
  });

  const invalidateFriends = () => queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });

  const addMutation = useMutation({
    mutationFn: (friendId: string) => friendService.sendFriendRequest(friendId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(t('friend.requestSentSuccess'), 'success');
        invalidateFriends();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    },
    onError: (err: any) => showToast(err?.message || t('friend.failedToSendRequest'), 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (friendshipId: string) => friendService.removeFriend(friendshipId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(t('friend.requestCancelled'), 'success');
        invalidateFriends();
      } else {
        showToast(res.message || t('common.error'), 'error');
      }
    },
    onError: (err: any) => showToast(err?.message || t('common.error'), 'error'),
  });

  const searchResults = searchQuery.data ?? [];
  const sentRequests = sentQuery.data ?? [];

  // Canonical friend-QR format — must match the parser in the scan screen
  // (same payload MyQRCodeView already uses, kept in sync deliberately).
  const qrPayload = `sc:friend:${user?.id || 'guest'}`;
  const inviteLink = `step-challenge://add-friend?userId=${user?.id}`;

  const handleCopyId = async () => {
    if (!user?.id) return;
    await Clipboard.setStringAsync(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShareLink = async () => {
    try {
      await Share.share({ message: t('scan.shareMessage', { link: inviteLink }), url: inviteLink });
    } catch {
      // user dismissed the share sheet — no-op
    }
  };

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

      {tab === 'search' && (
        <View style={{ gap: spacing.md }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder={t('friend.searchPlaceholder')} />
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <View style={{ gap: spacing.sm }}>
              {!trimmedSearch && (
                <AppText style={[styles.empty, { color: colors.textSecondary }]}>
                  {t('friend.typeToSearch')}
                </AppText>
              )}
              {!!trimmedSearch && searchResults.length === 0 && !searchQuery.isPending && (
                <AppText style={[styles.empty, { color: colors.textSecondary }]}>
                  {t('friend.noUsersFound')}
                </AppText>
              )}
              {searchResults.map((u) => (
                <View key={u.id} style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: insetBg }]}>
                    <AppText variant="body-bold" style={{ fontSize: 13, color: colors.textPrimary }}>
                      {initials(u.fullName)}
                    </AppText>
                  </View>
                  <AppText variant="body-medium" style={{ flex: 1, fontSize: 13.5, color: colors.textPrimary }} numberOfLines={1}>
                    {u.fullName}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => addMutation.mutate(u.id)}
                    disabled={addMutation.isPending}
                    style={[styles.outlinePill, { borderColor: colors.primary }]}
                  >
                    {addMutation.isPending && addMutation.variables === u.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <AppText style={{ fontSize: 12, fontWeight: '700' as any, color: colors.primary }}>
                        {t('friend.addAction')}
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {tab === 'pending' && (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.sm }}>
            {sentRequests.length === 0 && !sentQuery.isPending && (
              <AppText style={[styles.empty, { color: colors.textSecondary }]}>
                {t('friend.pendingRequestsEmpty')}
              </AppText>
            )}
            {sentRequests.map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: insetBg }]}>
                  <AppText variant="body-bold" style={{ fontSize: 13, color: colors.textPrimary }}>
                    {initials(r.friend?.fullName)}
                  </AppText>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="body-medium" style={{ fontSize: 13.5, color: colors.textPrimary }} numberOfLines={1}>
                    {r.friend?.fullName ?? '—'}
                  </AppText>
                  <AppText style={{ fontSize: 11, color: colors.textSecondary }}>
                    {t('friend.awaitingResponse')}
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => cancelMutation.mutate(r.id)}
                  disabled={cancelMutation.isPending}
                  style={[styles.outlinePill, { backgroundColor: insetBg, borderWidth: 0 }]}
                >
                  <AppText style={{ fontSize: 12, fontWeight: '700' as any, color: colors.textSecondary }}>
                    {t('friend.cancelAction')}
                  </AppText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {tab === 'invite' && (
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={styles.qrCard}>
            <QRCode value={qrPayload} size={168} color="#000000" backgroundColor="#FFFFFF" />
          </View>
          <View style={[styles.idRow, { backgroundColor: insetBg }]}>
            <View>
              <AppText style={{ fontSize: 11, color: colors.textSecondary }}>{t('friend.yourId')}</AppText>
              <AppText variant="body-bold" style={{ fontSize: 14, color: colors.textPrimary, marginTop: 2 }}>
                {user?.id ?? '—'}
              </AppText>
            </View>
            <TouchableOpacity onPress={handleCopyId} style={[styles.outlinePill, { backgroundColor: colors.card }]}>
              <AppText style={{ fontSize: 12, fontWeight: '700' as any, color: copied ? colors.primary : colors.textSecondary }}>
                {copied ? t('friend.copiedLabel') : t('friend.copyIdAction')}
              </AppText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleShareLink} style={{ width: '100%' }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shareBtn}>
              <AppText style={{ fontWeight: '700' as any, fontSize: 14, color: colors.onPrimary }}>
                {t('friend.shareInviteLink')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, lineHeight: 22 },
  tabTrack: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  tabPill: { flex: 1, borderRadius: 12, paddingVertical: 10 },
  tabPillInner: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12.5, fontWeight: '700' as any, textAlign: 'center' },
  list: { maxHeight: 320 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  outlinePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRow: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
});
