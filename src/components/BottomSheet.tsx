import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of screen height the sheet may grow to before its content scrolls. */
  maxHeightPct?: number;
}

const ANIM_MS = 240;

// Generic bottom sheet shell — mockup frames 14/16 (rounded-top panel sliding
// up from the bottom, drag handle, tap-outside-to-close). Content (search,
// lists, CTA) is supplied by the caller so this stays reusable across the
// enroll-group-into-activity sheet and the coordinator group picker.
//
// Animated manually (animationType="none" on the Modal) so the dark backdrop
// fades in place instead of riding up with the sheet — RN's built-in "slide"
// animates the whole modal content (backdrop included) as one rigid block,
// which reads as the screen darkening bottom-to-top instead of a uniform fade.
const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, children, maxHeightPct = 0.82 }) => {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(visible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      overlayOpacity.setValue(0);
      sheetY.setValue(40);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: ANIM_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: ANIM_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: ANIM_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 40,
          duration: ANIM_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayWrap}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: overlayOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              maxHeight: `${maxHeightPct * 100}%` as any,
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayWrap: { flex: 1, justifyContent: 'flex-end' },
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
