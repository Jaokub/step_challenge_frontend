import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LoadingScreen, AnimatedTabIcon } from '../../src/components';

export default function TabsLayout() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Admin accounts are console-only (mockup Section 1 · ADMIN CONSOLE):
  // they never see the normal user tabs. Keep them inside /admin/*.
  if (isAdmin) {
    return <Redirect href="/admin/dashboard" />;
  }

  const tabIcon =
    (name: string) =>
    ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
      <AnimatedTabIcon name={name} color={color} focused={focused} size={size} />
    );

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync().catch(() => {});
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        // colors.tabBar / colors.divider are the mockup footer's literal
        // #0f1416 / rgba(255,255,255,0.06) (dark) — previously a hardcoded
        // translucent rgba + cardBorder, which didn't match.
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 12,
          elevation: 0,
        },
        // No custom tabBarButton here — see AnimatedTabIcon.tsx's comment
        // for why (it broke tab switching). The "bulge" feedback lives on
        // the icon itself instead, driven by the `focused` prop below.
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard.greeting'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: tabIcon('home'),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: t('activities.title'),
          tabBarLabel: t('tabs.activities'),
          tabBarIcon: tabIcon('barbell'),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('groups.friends'),
          tabBarLabel: t('tabs.friends'),
          tabBarIcon: tabIcon('people'),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('groups.myGroups'),
          tabBarLabel: t('tabs.groups'),
          tabBarIcon: tabIcon('grid'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: tabIcon('person'),
        }}
      />
    </Tabs>
  );
}
