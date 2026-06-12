import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '../../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing, fontSize } from '../../../constants/theme';
import type { User } from '../../../types';

interface MyQRCodeViewProps {
  user: User | null;
  onClose: () => void;
}

export function MyQRCodeView({ user, onClose }: MyQRCodeViewProps) {
  const { colors } = useTheme();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.topBar, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  topBar: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.md,
  },
  scanTitle: { 
    fontSize: 22, 
  },
  iconButton: {
    width: 48, 
    height: 48, 
    borderRadius: 24,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center', 
    justifyContent: 'center',
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
