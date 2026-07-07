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
  background: '#fbfdfc', // Near-white (Pulse light) — lets grey #eef2f0 cards pop
  surface: '#ffffff',
  card: '#ffffff',
  cardShadow: 'rgba(20, 32, 29, 0.06)',
  cardBorder: 'rgba(20, 32, 29, 0.08)',
  primary: '#0d9488', // Teal accent
  primaryLight: '#38e8c6',
  onPrimary: '#07201b', // Deep teal-black — readable on the teal/lime gradient
  accent: '#b6f24a', // Lime end of the gradient
  success: '#0d9488',
  warning: '#e8862b', // Orange (kcal), darkened for contrast on light
  error: '#e5484d',
  textPrimary: '#14201d',
  textSecondary: '#6f7d78',
  textOnCard: '#14201d',
  textCardSecondary: '#6f7d78',
  tabBar: '#fbfdfc',
  tabActive: '#0d9488',
  tabInactive: '#9aa5a0',
  inputBackground: '#eef2f0', // Recessed groove / dashboard card grey
  inputBorder: '#e2e8e5',
  inputText: '#14201d',
  inputPlaceholder: '#9aa5a0',
  divider: 'rgba(20, 32, 29, 0.08)',
  overlay: 'rgba(20, 32, 29, 0.4)',
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

/**
 * Central layout rhythm — the single source of truth for screen padding and the
 * vertical gaps between UI blocks. Pull from here (do not hardcode 20 / 14 / 12)
 * so spacing stays consistent across screens.
 */
export const layout = {
  screenPaddingX: 20, // left/right padding for screen content
  sectionGap: 20,     // vertical gap between major sections (goal card, stats, ranking…)
  headerGap: 14,      // vertical gap between header sub-blocks (greeting, month nav, toggle…)
  cardGap: 12,        // gap between cards sitting in the same row
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
  primary: ['#38e8c6', '#b6f24a'] as const, // teal → lime (brand)
  accent: ['#38e8c6', '#b6f24a'] as const,
  header: ['#0c1013', '#0f1416'] as const,
  headerLight: ['#38e8c6', '#b6f24a'] as const,
  // Goal card surface — dark vs light theme
  goalCard: ['#15332e', '#12201f'] as const,
  goalCardLight: ['#e3f6ef', '#f0f8dd'] as const,
  // Goal % text fill — bright teal→lime on dark, darker teal→olive on light for contrast
  goalText: ['#38e8c6', '#b6f24a'] as const,
  goalTextLight: ['#0d9488', '#84971f'] as const,
  success: ['#38e8c6', '#b6f24a'] as const,
  gold: ['#F59E0B', '#FCD34D'] as const,
  silver: ['#94A3B8', '#CBD5E1'] as const,
  bronze: ['#B45309', '#D97706'] as const,
} as const;

// Theme-aware accent sets consumed by dashboard cards. Index 0 = dark, 1 = light.
export const dashboardAccents = {
  ringTrack: { dark: 'rgba(255,255,255,0.08)', light: 'rgba(20,32,29,0.08)' },
  goalCardBorder: { dark: 'rgba(56,232,198,0.18)', light: 'rgba(13,148,136,0.22)' },
  goalLabel: { dark: '#9fc7bd', light: '#3f7268' },
  rank1Fill: {
    dark: ['rgba(56,232,198,0.16)', 'rgba(182,242,74,0.07)'] as const,
    light: ['rgba(13,148,136,0.12)', 'rgba(182,242,74,0.10)'] as const,
  },
  rank1Border: { dark: 'rgba(56,232,198,0.35)', light: 'rgba(13,148,136,0.32)' },
  avatarMuted: { dark: '#222b2e', light: '#e2e8e5' },
  kcalIcon: { dark: '#ffa94d', light: '#e8862b' },
  kmIcon: { dark: '#4dabf7', light: '#2b8ae8' },
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
