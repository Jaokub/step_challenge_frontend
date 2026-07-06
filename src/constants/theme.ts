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
  background: '#18181B', // Soft Charcoal
  surface: '#27272A', // Lighter Charcoal
  card: '#27272A',
  cardShadow: 'rgba(0, 0, 0, 0.25)',
  cardBorder: 'rgba(255, 255, 255, 0.05)',
  primary: '#14B8A6', // Soft Teal
  primaryLight: '#5EEAD4',
  onPrimary: '#052E2B', // Dark teal-black — readable on the light teal primary
  accent: '#FBBF24',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textOnCard: '#FAFAFA',
  textCardSecondary: '#A1A1AA',
  tabBar: '#18181B',
  tabActive: '#14B8A6',
  tabInactive: '#71717A',
  inputBackground: '#27272A',
  inputBorder: '#3F3F46',
  inputText: '#FAFAFA',
  inputPlaceholder: '#71717A',
  divider: '#3F3F46',
  overlay: 'rgba(24, 24, 27, 0.7)',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC', // Off-white
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardShadow: 'rgba(15, 23, 42, 0.05)',
  cardBorder: 'rgba(15, 23, 42, 0.04)',
  primary: '#0D9488', // Soft Teal
  primaryLight: '#2DD4BF',
  onPrimary: '#FFFFFF', // White — readable on the darker teal primary
  accent: '#F59E0B',
  success: '#10B981',
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
    medium: 'Kanit_500Medium',
    bold: 'Kanit_700Bold',
  },
  body: {
    regular: 'Kanit_400Regular', // Using Kanit for regular
    medium: 'Kanit_500Medium',
    semiBold: 'Kanit_600SemiBold',
    bold: 'Kanit_700Bold',
  },
} as const;

export const englishFonts = {
  heading: {
    medium: 'DMSans_500Medium',
    bold: 'DMSans_700Bold',
  },
  body: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_700Bold',
    bold: 'DMSans_700Bold',
  },
} as const;

export type ThemeFonts = typeof thaiFonts;

// Gradient presets
export const gradients = {
  primary: ['#0D9488', '#14B8A6'] as const,
  accent: ['#F59E0B', '#FBBF24'] as const,
  header: ['#18181B', '#27272A'] as const,
  headerLight: ['#0D9488', '#2DD4BF'] as const,
  success: ['#10B981', '#34D399'] as const,
  gold: ['#F59E0B', '#FCD34D'] as const,
  silver: ['#94A3B8', '#CBD5E1'] as const,
  bronze: ['#B45309', '#D97706'] as const,
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
