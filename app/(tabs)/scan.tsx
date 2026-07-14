import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Share, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../src/constants/queryKeys';
import { AppText, ScreenHeader } from '../../src/components';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../src/contexts/ToastContext';
import checkinService from '../../src/features/activity/checkinService';
import friendService from '../../src/features/friend/friendService';
import { spacing, borderRadius, gradients } from '../../src/constants/theme';

type Mode = "scan" | "myqr";

const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };
const SCANLINE_GRAD_START = { x: 0, y: 0 };
const SCANLINE_GRAD_END = { x: 1, y: 0 };

export default function ScanScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [mode, setMode] = useState<Mode>("scan");

  // Both scan outcomes (add-friend vs. check-in) are writes — TanStack
  // mutations instead of a hand-rolled `processing` flag, with cache
  // invalidation owned by each mutation's onSuccess.
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
    if (mode === "scan") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [mode]);

  // Canonical friend-QR format: "sc:friend:<userId>".
  // The scanner below also accepts the legacy JSON/link formats for QR codes
  // that are already printed or screenshotted.
  const qrPayload = `sc:friend:${user?.id || 'guest'}`;
  // Short, human-friendly ID shown under the name on the "My QR" card.
  const shortId = user?.id ? user.id.slice(-8).toUpperCase() : '';

  const handleShareLink = async () => {
    try {
      const link = `step-challenge://add-friend?userId=${user?.id}`;
      await Share.share({
        message: t('scan.shareMessage', { link }),
        url: link,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  // TODO(save-to-gallery): wire up react-native-view-shot + expo-media-library
  // once a new EAS build can ship the native deps — see PROGRESS.md.
  const handleSaveImage = () => {
    showToast(t('scan.saveImageComingSoon'), 'info');
  };

  /** Extract a friend userId from any supported QR payload, or null. */
  const parseFriendQR = (data: string): string | null => {
    // Canonical: sc:friend:<userId>
    const canonical = data.match(/^sc:friend:([\w-]+)$/);
    if (canonical) return canonical[1];

    // Legacy: JSON {type:'friend', userId} or {userId}/{id}
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'friend' || parsed.userId) {
        return parsed.userId || parsed.id || null;
      }
    } catch {
      // Legacy: deep link / URL containing userId
      if (data.includes('add-friend') || data.includes('userId')) {
        const match = data.match(/userId[=:'"\s]+([^&"'\s}]+)/i);
        if (match && match[1]) return match[1];
      }
    }
    return null;
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing || mode !== 'scan') return;
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
        const response = await checkinMutation.mutateAsync(data);
        const pointsAwarded = response.data?.pointsAwarded ?? 0;
        setResult({
          success: true,
          message: pointsAwarded > 0
            ? `${t('scan.success')}  ${t('scan.pointsEarned', { points: pointsAwarded })}`
            : t('scan.success'),
        });
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

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted && mode === 'scan') {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.permissionSafeArea}>
          <TouchableOpacity
            onPress={() => setMode('myqr')}
            style={styles.permissionBackBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={23} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.permissionCenter}>
            <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={[styles.permissionIconBadge, { shadowColor: colors.primary }]}>
              <Ionicons name="camera-outline" size={46} color={colors.onPrimary} />
            </LinearGradient>

            <View style={styles.permissionCopy}>
              <AppText variant="heading-bold" style={[styles.permissionTitle, { color: colors.textPrimary }]}>
                {t('scan.permissionTitle')}
              </AppText>
              <AppText style={[styles.permissionBody, { color: colors.textSecondary }]}>
                {t('scan.permissionBody')}
              </AppText>
            </View>

            <View style={styles.permissionFeatures}>
              <View style={[styles.permissionFeatureRow, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <View style={[styles.permissionFeatureIconBg, { backgroundColor: colors.primary + '24' }]}>
                  <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.permissionFeatureText}>
                  <AppText variant="body-bold" style={[styles.permissionFeatureTitle, { color: colors.textPrimary }]}>
                    {t('scan.permissionFeature1Title')}
                  </AppText>
                  <AppText style={[styles.permissionFeatureDesc, { color: colors.textSecondary }]}>
                    {t('scan.permissionFeature1Desc')}
                  </AppText>
                </View>
              </View>
              <View style={[styles.permissionFeatureRow, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <View style={[styles.permissionFeatureIconBg, { backgroundColor: colors.accent + '2a' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
                </View>
                <View style={styles.permissionFeatureText}>
                  <AppText variant="body-bold" style={[styles.permissionFeatureTitle, { color: colors.textPrimary }]}>
                    {t('scan.permissionFeature2Title')}
                  </AppText>
                  <AppText style={[styles.permissionFeatureDesc, { color: colors.textSecondary }]}>
                    {t('scan.permissionFeature2Desc')}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.permissionActions}>
            <TouchableOpacity onPress={requestPermission} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.permissionPrimaryButton}>
                <AppText variant="body-bold" style={[styles.buttonText, { color: colors.onPrimary }]}>
                  {t('scan.grantPermission')}
                </AppText>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permissionDenyBtn} onPress={() => setMode('myqr')} activeOpacity={0.7}>
              <AppText variant="body-bold" style={[styles.buttonText, { color: colors.textSecondary }]}>
                {t('scan.denyPermission')}
              </AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      <ScreenHeader
        title={t('scan.scanQrCode')}
        titleSize={26}
        subtitle={mode === "scan" ? t('scan.scanSubtitle') : t('scan.myQrSubtitle')}
      />

      <View style={styles.modeContainer}>
        <View style={[styles.modeToggle, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity onPress={() => setMode("scan")} style={styles.modeBtnWrap} activeOpacity={0.85}>
            {mode === "scan" ? (
              <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.modeBtn}>
                <Ionicons name="qr-code-outline" size={16} color={colors.onPrimary} />
                <AppText variant="body-bold" style={[styles.modeText, { color: colors.onPrimary }]}>
                  {t('scan.scanBtn')}
                </AppText>
              </LinearGradient>
            ) : (
              <View style={styles.modeBtn}>
                <Ionicons name="qr-code-outline" size={16} color={colors.textSecondary} />
                <AppText style={[styles.modeText, { color: colors.textSecondary }]}>
                  {t('scan.scanBtn')}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("myqr")} style={styles.modeBtnWrap} activeOpacity={0.85}>
            {mode === "myqr" ? (
              <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.modeBtn}>
                <Ionicons name="person-add-outline" size={16} color={colors.onPrimary} />
                <AppText variant="body-bold" style={[styles.modeText, { color: colors.onPrimary }]}>
                  {t('scan.myQrTab')}
                </AppText>
              </LinearGradient>
            ) : (
              <View style={styles.modeBtn}>
                <Ionicons name="person-add-outline" size={16} color={colors.textSecondary} />
                <AppText style={[styles.modeText, { color: colors.textSecondary }]}>
                  {t('scan.myQrTab')}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {renderHeader()}

        {mode === "scan" ? (
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
        ) : (
          <View style={styles.contentPadding}>
            <View style={[styles.myQrContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
              <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.avatar}>
                <AppText variant="body-bold" style={[styles.avatarText, { color: colors.onPrimary }]}>
                  {user?.fullName?.substring(0,2).toUpperCase() || 'ME'}
                </AppText>
              </LinearGradient>
              <AppText variant="body-bold" style={[styles.myName, { color: colors.textPrimary }]}>
                {user?.nickname || user?.fullName || t('scan.defaultUser')}
              </AppText>
              {!!shortId && (
                <AppText style={[styles.myHandle, { color: colors.textSecondary }]}>
                  {t('scan.idLabel', { id: shortId })}
                </AppText>
              )}

              <View style={styles.qrWhiteBg}>
                <QRCode
                  value={qrPayload}
                  size={160}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.myQrActionsRow}>
              <TouchableOpacity
                style={[styles.saveImageButton, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}
                onPress={handleSaveImage}
                activeOpacity={0.85}
              >
                <Ionicons name="download-outline" size={18} color={colors.textPrimary} />
                <AppText variant="body-bold" style={[styles.buttonText, { color: colors.textPrimary }]}>
                  {t('scan.saveImage')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButtonWrap} onPress={handleShareLink} activeOpacity={0.85}>
                <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.shareButton}>
                  <Ionicons name="share-social" size={18} color={colors.onPrimary} />
                  <AppText variant="body-bold" style={[styles.buttonText, { color: colors.onPrimary }]}>
                    {t('scan.shareLinkBtn')}
                  </AppText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  permissionContainer: { flex: 1 },
  permissionSafeArea: { flex: 1, paddingHorizontal: 28, paddingBottom: 28 },
  permissionBackBtn: { alignSelf: 'flex-start', paddingTop: 6 },
  permissionCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  permissionIconBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  permissionCopy: { alignItems: 'center', gap: 10 },
  permissionTitle: { fontSize: 24, textAlign: 'center' },
  permissionBody: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
  permissionFeatures: { width: '100%', gap: 12, marginTop: 8 },
  permissionFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  permissionFeatureIconBg: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionFeatureText: { flex: 1 },
  permissionFeatureTitle: { fontSize: 14 },
  permissionFeatureDesc: { fontSize: 12, marginTop: 2 },
  permissionActions: { gap: 10 },
  permissionPrimaryButton: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionDenyBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  modeContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
    gap: 4,
  },
  modeBtnWrap: {
    flex: 1,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    gap: 8,
  },
  modeText: { fontSize: 14 },
  contentPadding: { paddingHorizontal: spacing.xl },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
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
  myQrContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 20 },
  myName: { fontSize: 18 },
  myHandle: { fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  qrWhiteBg: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
  },
  myQrActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  shareButtonWrap: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
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
