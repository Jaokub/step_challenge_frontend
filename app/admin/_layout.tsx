import { Stack } from 'expo-router';
import { AdminGuard } from '../../src/components';
import ThemeContext from '../../src/contexts/ThemeContext';
import { lightColors } from '../../src/constants/theme';

// The admin console is white-theme only (matches the mockup, which has no dark
// variant). Force the light palette for the whole /admin subtree regardless of
// the user's app-wide theme preference, and center content on wide screens
// (web/tablet) to a phone-width column so blocks don't stretch full-bleed.
const FORCED_LIGHT = {
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
};

const ADMIN_MAX_WIDTH = 480;

export default function AdminLayout() {
  return (
    <AdminGuard>
      <ThemeContext.Provider value={FORCED_LIGHT}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: lightColors.background,
              width: '100%',
              maxWidth: ADMIN_MAX_WIDTH,
              alignSelf: 'center',
            },
          }}
        >
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="activities/index" />
          <Stack.Screen name="create-activity" />
          <Stack.Screen name="edit-activity/[id]" />
          <Stack.Screen name="activities/[id]/qr" />
          <Stack.Screen name="activities/[id]/attendees" />
          <Stack.Screen name="manual-checkin/select-event" />
          <Stack.Screen name="users" />
          <Stack.Screen name="users/[id]" />
          <Stack.Screen name="groups" />
        </Stack>
      </ThemeContext.Provider>
    </AdminGuard>
  );
}
