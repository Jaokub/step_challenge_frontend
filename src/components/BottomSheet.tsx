import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of screen height the sheet may grow to before its content scrolls. */
  maxHeightPct?: number;
}

// Generic bottom sheet shell — mockup frames 14/16 (rounded-top panel sliding
// up from the bottom, drag handle, tap-outside-to-close). Content (search,
// lists, CTA) is supplied by the caller so this stays reusable across the
// enroll-group-into-activity sheet and the coordinator group picker.
const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, children, maxHeightPct = 0.82 }) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, maxHeight: `${maxHeightPct * 100}%` as any },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  handle: { width: 40, height: 5, borderRadius: 99, alignSelf: 'center' },
});

export default BottomSheet;
