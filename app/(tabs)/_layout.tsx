import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '../../src/components';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard.greeting'),
          tabBarLabel: 'หน้าแรก',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -12 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: t('activities.title'),
          tabBarLabel: 'กิจกรรม',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? "barbell" : "barbell-outline"} size={size} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -12 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('scan.title'),
          tabBarLabel: 'สแกน',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? "qr-code" : "qr-code-outline"} size={size} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -12 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "เพื่อนและกลุ่ม",
          tabBarLabel: 'เพื่อน',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -12 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarLabel: 'โปรไฟล์',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -12 }} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
