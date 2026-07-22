import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, gradients } from '../../constants/theme';
import { rowStyles } from './addFriendShared';

const COPIED_FLASH_MS = 1500;

export default function InviteTab() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insetBg = isDark ? colors.background : colors.inputBackground;

  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Canonical friend-QR format — must match the parser in the scan screen.
  const qrPayload = `sc:friend:${user?.id || 'guest'}`;
  const inviteLink = `step-challenge://add-friend?userId=${user?.id}`;

  const handleCopyId = async () => {
    if (!user?.id) return;
    await Clipboard.setStringAsync(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), COPIED_FLASH_MS);
  };

  // Was a Share.share() sheet — there's no real share-target use case for a
  // deep link that only resolves inside this app, so a plain clipboard copy
  // (matching the ID-copy row's pattern) replaces it.
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), COPIED_FLASH_MS);
  };

  return (
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
        <TouchableOpacity onPress={handleCopyId} style={[rowStyles.outlinePill, { backgroundColor: colors.card }]}>
          <AppText style={{ fontSize: 12, fontWeight: '700' as any, color: copiedId ? colors.primary : colors.textSecondary }}>
            {copiedId ? t('friend.copiedLabel') : t('friend.copyIdAction')}
          </AppText>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleCopyLink} style={{ width: '100%' }}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.copyLinkBtn}>
          <AppText style={{ fontWeight: '700' as any, fontSize: 14, color: colors.onPrimary }}>
            {copiedLink ? t('friend.copiedLabel') : t('friend.copyInviteLinkAction')}
          </AppText>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  copyLinkBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
});
