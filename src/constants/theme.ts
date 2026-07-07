// ─── Step Challenge Design System ─────────────────────────────────────────────
// Navy dark background | White solid cards | Blue + Yellow accents
// Clean, minimal, professional

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  cardShadow: string;
  cardBorder: string;
  primary: string;
  primaryLight: string;
  /** Text/icon color that stays readable on top of `primary` */
  onPrimary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  textPrimary: string;
  textSecondary: string;
  textOnCard: string;
  textCardSecondary: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  divider: string;
  overlay: string;
}

export const darkColors: ThemeColors = {
  background: '#0c1013', // Deep ink (Pulse home)
  surface: '#0f1416',
  card: '#171d21', // Elevated surface
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  cardBorder: 'rgba(255, 255, 255, 0.07)',
  primary: '#34e0c0', // Teal accent (solid), pairs with the teal→lime gradient
  primaryLight: '#5cf0d6',
  onPrimary: '#07201b', // Deep teal-black — readable on the light teal/lime gradient
  accent: '#b6f24a', // Lime end of the gradient
  success: '#38e8c6',
  warning: '#ffa94d',
  error: '#ff6b6b',
  textPrimary: '#f4f8f6',
  textSecondary: '#8b9a97',
  textOnCard: '#f4f8f6',
  textCardSecondary: '#8b9a97',
  tabBar: '#0f1416',
  tabActive: '#34e0c0',
  tabInactive: '#7c8a87',
  inputBackground: '#171d21',
  inputBorder: '#2a3237',
  inputText: '#f4f8f6',
  inputPlaceholder: '#7c8a87',
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(8, 11, 13, 0.7)',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC', // Off-white
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardShadow: 'rgba(15, 23, 42, 0.05)',
  cardBorder: 'rgba(15, 23, 42, 0.04)',
  primary: '#12b39c', // Teal accent that pairs with the teal→lime gradient
  primaryLight: '#38e8c6',
  onPrimary: '#07201b', // Deep teal-black — readable on the light teal/lime gradient
  accent: '#7bb800', // Lime, darkened for contrast on light backgrounds
  success: '#12b39c',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textOnCard: '#0F172A',
  textCardSecondary: '#64748B',
  tabBar: '#FFFFFF',
  tabActive: '#0D9488',
  tabInactive: '#94A3B8',
  inputBackground: '#F1F5F9',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
  divider: '#E2E8F0',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 24, // Squircles
  xl: 32, // Squircles
  '2xl': 40,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const thaiFonts = {
  heading: {
    medium: 'Anuphan_500Medium',
    bold: 'Anuphan_700Bold',
    extraBold: 'Anuphan_700Bold', // Anuphan tops out at 700 — reuse for the extra-bold slot
  },
  body: {
    regular: 'Anuphan_400Regular',
    medium: 'Anuphan_500Medium',
    semiBold: 'Anuphan_600SemiBold',
    bold: 'Anuphan_700Bold',
  },
} as const;

export const englishFonts = {
  heading: {
    medium: 'Sora_500Medium',
    bold: 'Sora_700Bold',
    extraBold: 'Sora_800ExtraBold',
  },
  body: {
    regular: 'Sora_400Regular',
    medium: 'Sora_500Medium',
    semiBold: 'Sora_600SemiBold',
    bold: 'Sora_700Bold',
  },
} as const;

export type ThemeFonts = typeof thaiFonts;

// Gradient presets
// `primary` is the central teal→lime brand gradient (Pulse). Use it for CTAs,
// active pills, avatars, progress rings, and highlighted text.
export const gradients = {
  primary: ['#38e8c6', '#b6f24a'] as const, // teal → lime
  accent: ['#38e8c6', '#b6f24a'] as const,
  header: ['#0c1013', '#0f1416'] as const,
  headerLight: ['#38e8c6', '#b6f24a'] as const,
  goalCard: ['#15332e', '#12201f'] as const, // subtle teal-tinted card
  success: ['#38e8c6', '#b6f24a'] as const,
  gold: ['#F59E0B', '#FCD34D'] as const,
  silver: ['#94A3B8', '#CBD5E1'] as const,
  bronze: ['#B45309', '#D97706'] as const,
} as const;

// Directional endpoints used when a component needs the raw gradient stops.
export const brandGradient = {
  start: '#38e8c6',
  end: '#b6f24a',
} as const;

// Shadow presets
export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLarge: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  button: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
