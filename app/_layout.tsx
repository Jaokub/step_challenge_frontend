import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { Anuphan_400Regular, Anuphan_500Medium, Anuphan_600SemiBold, Anuphan_700Bold } from '@expo-google-fonts/anuphan';
import * as SplashScreen from 'expo-splash-screen' ;
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/services/queryClient';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { registerForPushNotificationsAsync } from '../src/services/notificationService';
import { useStepGoalPolling } from '../src/features/health/useStepGoalPolling';
import '../src/i18n/i18n';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const { isDark } = useTheme();
  // ADR-001 / BUILD_PLAN.md Phase 7 PR 2 — foreground active-event polling.
  // Needs AuthProvider + ToastProvider, both already wrapping this
  // component; no-ops unless the user has an active step-gated goal.
  useStepGoalPolling();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activity/[id]" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="events/index" />
        <Stack.Screen name="events/[id]" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="leaderboard" options={{ presentation: 'modal' }} />
        <Stack.Screen name="health" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    Anuphan_400Regular,
    Anuphan_500Medium,
    Anuphan_600SemiBold,
    Anuphan_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          console.log('Push notification token retrieved');
        }
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <RootLayoutInner />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
