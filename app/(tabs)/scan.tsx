import { AppText } from '../../src/components';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import checkinService from '../../src/features/activity/services/checkinService';
import friendService from '../../src/features/friend/services/friendService';
import { spacing, borderRadius, fontSize } from '../../src/constants/theme';

export default function ScanScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showMyQR, setShowMyQR] = useState(false);

  const qrPayload = JSON.stringify({ type: 'friend', userId: user?.id || 'guest' });

  const handleShareLink = async () => {
    try {
      const link = `step-challenge://add-friend?userId=${user?.id}`;
      await Share.share({
        message: `Add me as a friend on Step Challenge! ${link}`,
        url: link,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      let isFriendQR = false;
      let scannedUserId = null;

      try {
        // Try parsing as JSON (standard App QR)
        const parsed = JSON.parse(data);
        if (parsed.type === 'friend' || parsed.userId) {
          isFriendQR = true;
          scannedUserId = parsed.userId || parsed.id;
        }
      } catch {
        // If not JSON, check if it's a deep link or contains userId
        if (data.includes('add-friend') || data.includes('userId')) {
          isFriendQR = true;
          // Try to extract userId=xxxx
          const match = data.match(/userId[=:'"\s]+([^&"'\s}]+)/i);
          if (match && match[1]) {
            scannedUserId = match[1];
          }
        }
      }

      if (isFriendQR && scannedUserId) {
        await friendService.sendFriendRequest(scannedUserId);
        setResult({ success: true, message: 'Friend request sent successfully!' });
      } else {
        await checkinService.checkinWithQR(data);
        setResult({ success: true, message: t('scan.success') });
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

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.center}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <AppText style={[styles.permissionText, { color: colors.textPrimary }]}>
            {t('scan.permissionRequired')}
          </AppText>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
            <AppText style={styles.buttonText}>Grant Permission</AppText>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (showMyQR) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.topBar, { backgroundColor: 'transparent' }]}>
            <TouchableOpacity onPress={() => setShowMyQR(false)} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <AppText variant="heading-bold" style={[styles.scanTitle, { color: colors.textPrimary }]}>My QR Code</AppText>
            <View style={{ width: 48 }} />
          </View>
          <View style={styles.qrContainer}>
            <View style={[styles.qrCard, { backgroundColor: '#FFFFFF' }]}>
              <QRCode
                value={qrPayload}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={40}
                logoBackgroundColor='transparent'
              />
              <AppText variant="heading-bold" style={{ color: '#000000', marginTop: spacing.xl, fontSize: fontSize.lg }}>
                {user?.fullName || 'User'}
              </AppText>
              <AppText style={{ color: '#666666', marginTop: spacing.xs, fontSize: fontSize.sm }}>
                Show this code to check-in or add friend
              </AppText>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareLink}>
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
              <AppText style={{ color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' }}>Share Link</AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <AppText style={styles.scanTitle}>{t('scan.title')}</AppText>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setTorch(!torch)}
            >
              <Ionicons name={torch ? 'flash' : 'flash-off'} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Scan frame */}
          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.myQrButton} onPress={() => setShowMyQR(true)}>
              <Ionicons name="qr-code" size={20} color="#000" style={{ marginRight: spacing.sm }} />
              <AppText style={{ color: '#000', fontSize: fontSize.md, fontWeight: '600' }}>My QR Code</AppText>
            </TouchableOpacity>
            <AppText style={styles.instruction}>{t('scan.instruction')}</AppText>
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
                <AppText style={styles.buttonText}>{result.success ? 'OK' : t('common.retry')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center', padding: 24 },
  permissionText: { 
    fontSize: 18,
    textAlign: 'center', 
    marginTop: 24,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  topBar: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.md,
  },
  scanTitle: { 
    fontSize: 22, 
    color: '#FFFFFF' 
  },
  iconButton: {
    width: 48, 
    height: 48, 
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  frameContainer: {
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE, 
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute', 
    width: 40, 
    height: 40,
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  bottomSection: {
    paddingBottom: 48, 
    alignItems: 'center',
  },
  myQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    marginBottom: spacing.xl,
  },
  instruction: { 
    fontSize: 16,
    color: '#FFFFFF', 
    textAlign: 'center',
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
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
  resultTitle: { 
    fontSize: 22, 
  },
  resultMessage: { 
    fontSize: 15, 
    textAlign: 'center', 
    marginTop: 8,
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  qrCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6CF7',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    marginTop: spacing['2xl'],
  }
});
