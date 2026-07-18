// ─── Step Challenge UI Components ─────────────────────────────────────────────
// Barrel file — re-exports all reusable components

// Layout & Containers
export { default as AppCard } from './AppCard';
export { default as GradientHeader } from './GradientHeader';
export { default as ScreenHeader } from './ScreenHeader';
export { default as CustomModal } from './CustomModal';
export { default as BottomSheet } from './BottomSheet';
export { default as WeeklyStepsChart } from './WeeklyStepsChart';

// Buttons
export { default as PrimaryButton } from './PrimaryButton';
export { default as OutlineButton } from './OutlineButton';
export { default as QuickActionButton } from './QuickActionButton';
export { default as HeaderIconButton } from './HeaderIconButton';

// Navigation
// NOTE: TabBarButton.tsx (custom tabBarButton wrapper) is unused — it broke
// expo-router's Link-based tab switching (see AnimatedTabIcon.tsx's comment).
// Left in place rather than deleted; AnimatedTabIcon is the one actually used.
export { default as AnimatedTabIcon } from './AnimatedTabIcon';

// Progress & Animation
export { default as AnimatedCounter } from './AnimatedCounter';
export { default as CircularProgress } from './CircularProgress';
export { default as ProgressBar } from './ProgressBar';

// Values
export { default as StepsValue } from './StepsValue';

// Badges
export { default as StatusBadge, statusColors } from './StatusBadge';
export { default as RoleBadge } from './RoleBadge';
export { default as PointsBadge } from './PointsBadge';

// Cards
export { default as ActivityCard } from './ActivityCard';
export { default as GroupCard } from './GroupCard';
export { default as LeaderboardItem } from './LeaderboardItem';
export { default as HealthStatCard } from './HealthStatCard';

// Feedback & States
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';
export { default as AppText, THAI_CHAR_REGEX } from './AppText';
export { default as GradientText } from './GradientText';
export { default as LoadingScreen } from './LoadingScreen';
export * from './Skeleton';

// User & Identity
export { default as AvatarCircle } from './AvatarCircle';
export { default as AdminGuard } from './AdminGuard';

// Input
export { default as SearchBar } from './SearchBar';
export { default as MonthYearPicker } from './MonthYearPicker';
export { default as TimeframeSelector } from './TimeframeSelector';

// Settings & Preferences
export { default as SettingsRow } from './SettingsRow';
export { default as ThemeToggle } from './ThemeToggle';
export { default as SegmentedToggle } from './SegmentedToggle';
export { default as SwitchToggle } from './SwitchToggle';

// Feedback
export { default as Toast } from './Toast';
