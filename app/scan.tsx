import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../src/constants/queryKeys';
import { AppText, ScreenHeader, PrimaryButton } from '../src/components';
import { useTheme } from '../src/contexts/ThemeContext';
import checkinService from '../src/features/activity/checkinService';
import friendService from '../src/features/friend/friendService';
import { spacing, borderRadius } from '../src/constants/theme';

const SCANLINE_GRAD_START = { x: 0, y: 0 };
const SCANLINE_GRAD_END = { x: 1, y: 0 };

// Pure camera-scan screen, pushed from the home header's scan icon (see
// useScanAccess) — permission is already resolved before we ever get here,
// so this screen has no permission pre-screen and no "My QR" mode (that
// display already lives in AddFriendSheet's invite tab). The defensive
// !permission.granted branch below only covers the rare case of the OS
// permission being revoked mid-session while this screen is still mounted.
export default function ScanScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [permission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendFriendRequestMutation = useMutation({
    mutationFn: (userId: string) => friendService.sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (qrCode: string) => checkinService.checkinWithQR(qrCode),
    onSuccess: () => {
      // A check-in changes points, streak, and attendance — refresh
      // everything that displays them.
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.personal });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profileScreen });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });

  const processing = sendFriendRequestMutation.isPending || checkinMutation.isPending;

  // useRef so the animated value survives re-renders (a plain `new Animated.Value`
  // here would be recreated every render and the scan line would stutter/reset).
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Canonical friend-QR format: "sc:friend:<userId>".
  // Also accepts the legacy JSON/link formats for QR codes that are already
  // printed or screenshotted.
  const parseFriendQR = (data: string): string | null => {
    const canonical = data.match(/^sc:friend:([\w-]+)$/);
    if (canonical) return canonical[1];

    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'friend' || parsed.userId) {
        return parsed.userId || parsed.id || null;
      }
    } catch {
      if (data.includes('add-friend') || data.includes('userId')) {
        const match = data.match(/userId[=:'"\s]+([^&"'\s}]+)/i);
        if (match && match[1]) return match[1];
      }
    }
    return null;
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const scannedUserId = parseFriendQR(data);

      if (scannedUserId) {
        await sendFriendRequestMutation.mutateAsync(scannedUserId);
        setResult({ success: true, message: t('scan.friendRequestSent') });
      } else {
        // Check-in is an attendance record only — the points economy is
        // dormant and never surfaced in the UI, so the toast just confirms
        // the check-in.
        await checkinMutation.mutateAsync(data);
        setResult({ success: true, message: t('scan.success') });
      }
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || t('scan.failed');
      setResult({ success: false, message: msg });
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  const resetScan = () => {
    setScanned(false);
    setResult(null);
  };

  // Permission was already confirmed before navigating here, via
  // useScanAccess. This only triggers if it gets revoked (e.g. from OS
  // Settings) while the screen is still mounted.
  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScreenHeader title={t('scan.scanQrCode')} titleSize={21} onBack={() => router.back()} />
          <View style={styles.revokedWrap}>
            <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
            <AppText style={[styles.revokedText, { color: colors.textSecondary }]}>
              {t('scan.permissionDeniedBody')}
            </AppText>
            <PrimaryButton title={t('scan.openSettingsAction')} onPress={() => Linking.openSettings()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader
          title={t('scan.scanQrCode')}
          titleSize={21}
          subtitle={t('scan.scanSubtitle')}
          onBack={() => router.back()}
        />

        <View style={styles.contentPadding}>
          <View style={[styles.cameraContainer, { borderColor: colors.divider }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.overlay}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: colors.accent }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: colors.accent }]} />

                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      shadowColor: colors.primary,
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 198] // 200 frame height - 2 line height
                        })
                      }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', colors.primary, 'transparent']}
                    start={SCANLINE_GRAD_START}
                    end={SCANLINE_GRAD_END}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                <View style={styles.cameraCenterIcon}>
                   <Ionicons name="qr-code-outline" size={48} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
              <View style={styles.instructionOverlay}>
                <AppText style={styles.instructionText}>{t('scan.placeQrInFrame')}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.useCasesContainer}>
            <View style={[styles.useCaseCard, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
              <View style={[styles.useCaseIconBg, { backgroundColor: colors.primary + '24' }]}>
                <Ionicons name="person-add" size={22} color={colors.primary} />
              </View>
              <AppText variant="body-bold" style={[styles.useCaseTitle, { color: colors.textPrimary }]}>{t('scan.addFriendTitle')}</AppText>
              <AppText style={[styles.useCaseDesc, { color: colors.textSecondary }]}>{t('scan.addFriendDesc')}</AppText>
            </View>
            <View style={[styles.useCaseCard, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
              <View style={[styles.useCaseIconBg, { backgroundColor: colors.accent + '2a' }]}>
                <Ionicons name="ticket" size={22} color={colors.accent} />
              </View>
              <AppText variant="body-bold" style={[styles.useCaseTitle, { color: colors.textPrimary }]}>{t('scan.registerEventTitle')}</AppText>
              <AppText style={[styles.useCaseDesc, { color: colors.textSecondary }]}>{t('scan.registerEventDesc')}</AppText>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Result overlay */}
      {result && (
        <View style={styles.resultOverlay}>
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <View style={[
              styles.resultIconCircle,
              { backgroundColor: result.success ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Ionicons
                name={result.success ? 'checkmark-circle' : 'close-circle'}
                size={56}
                color={result.success ? colors.success : colors.error}
              />
            </View>
            <AppText variant="heading-bold" style={[styles.resultTitle, { color: colors.textPrimary }]}>
              {result.success ? t('scan.success') : t('scan.failed')}
            </AppText>
            <AppText style={[styles.resultMessage, { color: colors.textSecondary }]}>{result.message}</AppText>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={resetScan}>
              <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>{result.success ? t('common.ok') : t('common.retry')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  revokedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  revokedText: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: spacing.sm },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  contentPadding: { paddingHorizontal: spacing.xl },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: '#000000', // Camera fallback while the feed loads
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  frame: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCenterIcon: {
    position: 'absolute',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderWidth: 2,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  instructionOverlay: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  instructionText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  useCasesContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  useCaseCard: {
    flex: 1,
    padding: 18,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  useCaseIconBg: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useCaseTitle: { fontSize: 15 },
  useCaseDesc: { fontSize: 12 },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  resultCard: {
    alignItems: 'center',
    padding: 32,
    width: '100%',
    borderRadius: 20,
  },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultTitle: { fontSize: 22 },
  resultMessage: { fontSize: 15, textAlign: 'center', marginTop: 8 },
});
