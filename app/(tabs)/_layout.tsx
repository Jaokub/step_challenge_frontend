import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '../../src/components';

export default function TabsLayout() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
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
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={(focused ? name : `${name}-outline`) as any} size={size} color={color} />
        {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -10 }} />}
      </View>
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
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(39, 39, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          elevation: 0,
        },
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
        name="scan"
        options={{
          title: t('scan.title'),
          tabBarLabel: t('tabs.scan'),
          tabBarIcon: tabIcon('qr-code'),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.friendsAndGroups'),
          tabBarLabel: t('tabs.friends'),
          tabBarIcon: tabIcon('people'),
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
