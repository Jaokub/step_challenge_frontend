import { StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme';

/** Shared by SearchTab / PendingTab avatar chips. */
export const initials = (name?: string): string =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();

// Row/avatar/pill geometry is identical across the search and pending
// tabs — only the theme-dependent colors are applied inline at each call
// site, so this stays a plain (color-free) StyleSheet.
export const rowStyles = StyleSheet.create({
  list: { maxHeight: 320 },
  empty: { fontSize: 12.5, textAlign: 'center', paddingVertical: spacing.lg },
  loadingRow: { paddingVertical: spacing.lg, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  outlinePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
