import AppText from './AppText';
import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, fontSize } from '../constants/theme';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  description,
  children,
  contentStyle,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }, contentStyle]}>
          <View style={styles.modalHeader}>
            <AppText style={[styles.modalTitle, { color: colors.textPrimary }]}>{title}</AppText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {description && (
            <AppText style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {description}
            </AppText>
          )}
          {children}
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
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
  },
  modalDesc: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
});

export default CustomModal;
