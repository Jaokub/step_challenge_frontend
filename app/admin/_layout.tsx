import { Stack } from 'expo-router';
import { AdminGuard } from '../../src/components';

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="activities/index" />
        <Stack.Screen name="create-activity" />
        <Stack.Screen name="edit-activity/[id]" />
        <Stack.Screen name="activities/[id]/qr" />
        <Stack.Screen name="activities/[id]/attendees" />
        <Stack.Screen name="ranking/[type]" />
        <Stack.Screen name="users" />
      </Stack>
    </AdminGuard>
  );
}
