import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, InlineSpinner } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../constants/theme';
import type { SentFriendRequest } from './friendService';
import { initials, rowStyles } from './addFriendShared';

interface PendingTabProps {
  requests: SentFriendRequest[];
  loading: boolean;
  onCancel: (friendshipId: string) => void;
  cancelingId?: string;
}

// Presentational — AddFriendSheet owns the query/mutation (it already needs
// the request count for the tab-bar label, so the data lives one level up
// instead of being fetched twice).
export default function PendingTab({ requests, loading, onCancel, cancelingId }: PendingTabProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insetBg = isDark ? colors.background : colors.inputBackground;

  return (
    <ScrollView style={rowStyles.list} showsVerticalScrollIndicator={false}>
      <View style={{ gap: spacing.sm }}>
        {loading && (
          <View style={rowStyles.loadingRow}>
            <InlineSpinner size={28} />
          </View>
        )}
        {requests.length === 0 && !loading && (
          <AppText style={[rowStyles.empty, { color: colors.textSecondary }]}>
            {t('friend.pendingRequestsEmpty')}
          </AppText>
        )}
        {requests.map((r) => (
          <View key={r.id} style={rowStyles.row}>
            <View style={[rowStyles.avatar, { backgroundColor: insetBg }]}>
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
              onPress={() => onCancel(r.id)}
              disabled={cancelingId === r.id}
              style={[rowStyles.outlinePill, { backgroundColor: insetBg, borderWidth: 0 }]}
            >
              <AppText style={{ fontSize: 12, fontWeight: '700' as any, color: colors.textSecondary }}>
                {t('friend.cancelAction')}
              </AppText>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
