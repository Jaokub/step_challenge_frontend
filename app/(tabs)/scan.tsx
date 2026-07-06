import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Share, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { AppText, ScreenHeader } from '../../src/components';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import checkinService from '../../src/features/activity/checkinService';
import friendService from '../../src/features/friend/friendService';
import { spacing, borderRadius, fontSize } from '../../src/constants/theme';

type Mode = "scan" | "myqr";

export default function ScanScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [mode, setMode] = useState<Mode>("scan");

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
    setProcessing(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const scannedUserId = parseFriendQR(data);

      if (scannedUserId) {
        await friendService.sendFriendRequest(scannedUserId);
        setResult({ success: true, message: t('scan.friendRequestSent') });
      } else {
        const response = await checkinService.checkinWithQR(data);
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
    } finally {
      setProcessing(false);
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
        <SafeAreaView style={styles.center}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <AppText style={[styles.permissionText, { color: colors.textPrimary }]}>
            {t('scan.permissionRequired')}
          </AppText>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
            <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>{t('scan.grantPermission')}</AppText>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      <ScreenHeader 
        title={t('scan.scanQrCode')} 
        subtitle={t('scan.scanSubtitle')}
      />

      <View style={styles.modeContainer}>
        <View style={[styles.modeToggle, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            onPress={() => setMode("scan")}
            style={[
              styles.modeBtn,
              mode === "scan" ? { backgroundColor: colors.primary } : { backgroundColor: 'transparent' }
            ]}
          >
            <Ionicons name="qr-code-outline" size={16} color={mode === "scan" ? colors.onPrimary : colors.textSecondary} />
            <AppText style={[styles.modeText, { color: mode === "scan" ? colors.onPrimary : colors.textSecondary, fontWeight: mode === 'scan' ? 'bold' : 'normal' }]}>
              {t('scan.scanBtn')}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("myqr")}
            style={[
              styles.modeBtn,
              mode === "myqr" ? { backgroundColor: colors.primary } : { backgroundColor: 'transparent' }
            ]}
          >
            <Ionicons name="person-add-outline" size={16} color={mode === "myqr" ? colors.onPrimary : colors.textSecondary} />
            <AppText style={[styles.modeText, { color: mode === "myqr" ? colors.onPrimary : colors.textSecondary, fontWeight: mode === 'myqr' ? 'bold' : 'normal' }]}>
              {t('scan.myQrTab')}
            </AppText>
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
                  <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                  
                  <Animated.View 
                    style={[
                      styles.scanLine, 
                      { 
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                        transform: [{
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 198] // 200 frame height - 2 line height
                          })
                        }]
                      }
                    ]} 
                  />
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
              <View style={[styles.useCaseCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                <View style={[styles.useCaseIconBg, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="person-add" size={20} color={colors.success} />
                </View>
                <AppText style={[styles.useCaseTitle, { color: colors.textPrimary }]}>{t('scan.addFriendTitle')}</AppText>
                <AppText style={[styles.useCaseDesc, { color: colors.textSecondary }]}>{t('scan.addFriendDesc')}</AppText>
              </View>
              <View style={[styles.useCaseCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                <View style={[styles.useCaseIconBg, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="ticket" size={20} color={colors.primary} />
                </View>
                <AppText style={[styles.useCaseTitle, { color: colors.textPrimary }]}>{t('scan.registerEventTitle')}</AppText>
                <AppText style={[styles.useCaseDesc, { color: colors.textSecondary }]}>{t('scan.registerEventDesc')}</AppText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.contentPadding}>
            <View style={[styles.myQrContainer, { backgroundColor: colors.card, borderColor: colors.divider }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <AppText style={[styles.avatarText, { color: colors.onPrimary }]}>
                  {user?.fullName?.substring(0,2).toUpperCase() || 'ME'}
                </AppText>
              </View>
              <AppText style={[styles.myName, { color: colors.textPrimary }]}>{user?.fullName || t('scan.defaultUser')}</AppText>
              {user?.nickname ? (
                <AppText style={[styles.myHandle, { color: colors.textSecondary }]}>{user.nickname}</AppText>
              ) : (
                <View style={{ marginBottom: spacing.lg }} />
              )}

              <View style={styles.qrWhiteBg}>
                <QRCode
                  value={qrPayload}
                  size={160}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <AppText style={[styles.qrFooterText, { color: colors.textSecondary }]}>{t('scan.shareQrFooter')}</AppText>
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 0 }]} onPress={handleShareLink}>
              <Ionicons name="share-social" size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
              <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>{t('scan.shareLinkBtn')}</AppText>
            </TouchableOpacity>
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
  permissionContainer: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center', padding: 24 },
  permissionText: { fontSize: 18, textAlign: 'center', marginTop: 24 },
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
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
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
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  useCaseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useCaseTitle: { fontSize: 14, fontWeight: '600' },
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
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  myName: { fontSize: 16, fontWeight: '600' },
  myHandle: { fontSize: 14, marginBottom: spacing.lg },
  qrWhiteBg: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  qrFooterText: { fontSize: 12, textAlign: 'center' },
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
