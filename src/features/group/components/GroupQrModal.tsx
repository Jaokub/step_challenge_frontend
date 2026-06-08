import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText, PrimaryButton, OutlineButton } from '../../../components';
import { ThemeColors } from '../../../constants/theme';
import { spacing, borderRadius } from '../../../constants/theme';

interface GroupQrModalProps {
  visible: boolean;
  onClose: () => void;
  qrImage: string | null;
  qrInviteCode: string | null;
  onShare: () => void;
  colors: ThemeColors;
}

export const GroupQrModal: React.FC<GroupQrModalProps> = ({
  visible,
  onClose,
  qrImage,
  qrInviteCode,
  onShare,
  colors,
}) => {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.modalHeader}>
            <AppText variant="heading-bold" style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('groups.qrInvite')}
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrContainer}>
            {qrImage ? (
              <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
                <Image 
                  source={{ uri: qrImage }} 
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            
            <AppText style={[styles.inviteCodeLabel, { color: colors.textSecondary }]}>
              {t('groups.inviteCode')}
            </AppText>
            <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
              <AppText variant="heading-bold" style={[styles.codeText, { color: colors.primary }]}>
                {qrInviteCode}
              </AppText>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <OutlineButton 
              title={t('common.cancel')} 
              onPress={onClose} 
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <PrimaryButton 
              title={t('common.share')} 
              onPress={onShare}
              icon="share-social-outline"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  qrWrapper: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inviteCodeLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  codeBox: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 24,
    letterSpacing: 2,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
