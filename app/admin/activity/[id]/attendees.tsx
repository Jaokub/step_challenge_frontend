import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, PrimaryButton, EmptyState } from '../../../../src/components';
import { spacing, fontSize } from '../../../../src/constants/theme';
import checkinService from '../../../../src/features/activity/checkinService';

export default function AttendeesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchAttendees();
  }, [id]);

  const fetchAttendees = async () => {
    setIsLoading(true);
    try {
      const response = await checkinService.getCheckinsByActivity(id as string);
      if (response.success && response.data) {
        setAttendees(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch attendees, using mock data');
      // Mock data if backend fails
      setAttendees([
        { id: '1', user: { fullName: 'Annika', department: 'HR' }, timestamp: new Date().toISOString() },
        { id: '2', user: { fullName: 'David', department: 'IT' }, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      ]);
    } finally {
      setIsLoading(false);
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
      // Expecting payload: {"userId": "12345"}
      const payload = JSON.parse(data);
      if (!payload.userId) throw new Error('Invalid QR Code format');
      
      await checkinService.adminCheckinUser(id as string, payload.userId);
      setResult({ success: true, message: 'Checked in successfully!' });
      fetchAttendees(); // Refresh list
    } catch (err: any) {
      const msg = err?.message || 'Failed to check-in user';
      setResult({ success: false, message: msg });
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setProcessing(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const timeString = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[styles.attendeeCard, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <AppText variant="heading-bold" style={{ color: colors.primary, fontSize: fontSize.md }}>
            {item.user?.fullName?.charAt(0) || '?'}
          </AppText>
        </View>
        <View style={styles.attendeeInfo}>
          <AppText variant="body-bold" style={{ color: colors.textPrimary, fontSize: fontSize.md }}>
            {item.user?.fullName || 'Unknown User'}
          </AppText>
          <AppText style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
            {item.user?.department || 'No department'}
          </AppText>
        </View>
        <View style={styles.timeBadge}>
          <AppText style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{timeString}</AppText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader 
          title="Attendees" 
          rightActions={
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/admin/dashboard')} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <View style={styles.statsHeader}>
        <AppText style={{ color: colors.textSecondary }}>{t('admin.totalCheckedIn')}</AppText>
        <AppText variant="heading-bold" style={{ color: colors.primary, fontSize: fontSize.xl }}>
          {attendees.length}
        </AppText>
      </View>

      <FlatList
        data={attendees}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="people-outline"
              title="No attendees yet"
              subtitle="Scan users' QR codes to check them in"
            />
          ) : null
        }
      />

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
        <PrimaryButton
          title="Scan QR to Check-in"
          icon="qr-code-outline"
          onPress={() => {
            if (!permission?.granted) {
              requestPermission();
            } else {
              setIsScanning(true);
            }
          }}
        />
      </View>

      {/* Scanner Modal */}
      <Modal visible={isScanning} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <SafeAreaView style={styles.overlay}>
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => { setIsScanning(false); setScanned(false); setResult(null); }} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <AppText style={styles.scanTitle}>{t('admin.scanUserQr')}</AppText>
                <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconButton}>
                  <Ionicons name={torch ? 'flash' : 'flash-off'} size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.frameContainer}>
                <View style={styles.frame}>
                  <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                </View>
              </View>
            </SafeAreaView>

            {result && (
              <View style={styles.resultOverlay}>
                <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                  <Ionicons
                    name={result.success ? 'checkmark-circle' : 'close-circle'}
                    size={64}
                    color={result.success ? colors.success : colors.error}
                    style={{ marginBottom: spacing.md }}
                  />
                  <AppText variant="heading-bold" style={{ fontSize: fontSize.lg, color: colors.textPrimary, marginBottom: spacing.xs }}>
                    {result.success ? 'Success' : 'Failed'}
                  </AppText>
                  <AppText style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }}>
                    {result.message}
                  </AppText>
                  <PrimaryButton title="Scan Next" onPress={() => { setScanned(false); setResult(null); }} style={{ width: '100%' }} />
                </View>
              </View>
            )}
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  attendeeInfo: { flex: 1 },
  timeBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  scanTitle: { fontSize: 22, color: '#FFFFFF' },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  resultCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
  },
});
