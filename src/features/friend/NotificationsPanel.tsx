import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../constants/theme';
import type { FriendRequest } from './friendService';

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
  requests: FriendRequest[];
  onAccept: (id: string) => void;
  onReject: (userId: string) => void;
}

const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

const ANIM_MS = 180;

// Mockup "Friends Popup.dc.html" isNotif panel — a small card anchored under
// the bell icon (top:78px;right:24px in the mockup), not a centered dialog.
// Replaces the old full-width CustomModal. Scope note: the mockup's panel
// also has a generic "ทั้งหมด" notification feed (challenge/system/rank
// items) — there's no backend model for that yet (only push-notification
// registration exists, no in-app feed), so per the confirmed scope this only
// renders the "คำขอเป็นเพื่อน" section, which already has real data.
export default function NotificationsPanel({ visible, onClose, requests, onAccept, onReject }: NotificationsPanelProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insetBg = isDark ? colors.background : colors.inputBackground;

  const [mounted, setMounted] = useState(visible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const panelProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      overlayOpacity.setValue(0);
      panelProgress.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: ANIM_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(panelProgress, { toValue: 1, duration: ANIM_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: ANIM_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(panelProgress, { toValue: 0, duration: ANIM_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  const panelStyle = {
    opacity: panelProgress,
    transform: [
      { translateY: panelProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
      { scale: panelProgress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <SafeAreaView edges={['top']} style={styles.safeArea} pointerEvents="box-none">
        <Animated.View
          style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.cardBorder }, panelStyle]}
        >
          <View style={styles.header}>
            <AppText variant="body-bold" style={[styles.title, { color: colors.textPrimary }]}>
              {t('friend.notificationsTitle')}
            </AppText>
          </View>

          {requests.length === 0 ? (
            <AppText style={[styles.empty, { color: colors.textSecondary }]}>
              {t('friend.notificationsEmpty')}
            </AppText>
          ) : (
            <>
              <AppText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('friend.friendRequestsSectionLabel')}
              </AppText>
              {requests.map((r) => (
                <View key={r.id} style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: insetBg }]}>
                    <AppText variant="body-bold" style={{ fontSize: 14, color: colors.textPrimary }}>
                      {initials(r.user?.fullName)}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="body-medium" style={{ fontSize: 13.5, color: colors.textPrimary }} numberOfLines={1}>
                      {r.user?.fullName ?? '—'}
                    </AppText>
                    <AppText style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 1 }}>
                      {t('friend.wantsToBeFriends')}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    onPress={() => onReject(r.user.id)}
                    style={[styles.iconBtn, { backgroundColor: insetBg }]}
                  >
                    <Ionicons name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onAccept(r.id)}
                    style={[styles.iconBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="checkmark" size={15} color={colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, alignItems: 'flex-end' },
  panel: {
    position: 'absolute',
    top: 62,
    right: spacing.xl,
    width: 300,
    maxHeight: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    // Elevation/shadow so the floating panel reads above page content.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15.5, lineHeight: 19 },
  sectionLabel: { fontSize: 10.5, fontWeight: '700' as any, letterSpacing: 0.3 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
