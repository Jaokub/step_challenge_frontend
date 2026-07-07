import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';

// Refetch-on-focus for React Native: map AppState "active" to TanStack focus.
// (On web the default visibilitychange listener already handles this.)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min — screens re-mount often; avoid refetch storms
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: false, // no NetInfo wired up; online status is unreliable in RN
    },
  },
});
