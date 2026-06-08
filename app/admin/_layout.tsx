import { Stack } from 'expo-router';
import { AdminGuard } from '../../src/components';

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="create-activity" />
        <Stack.Screen name="edit-activity/[id]" />
        <Stack.Screen name="activity/[id]/attendees" />
        <Stack.Screen name="ranking/[type]" />
        <Stack.Screen name="users" />
      </Stack>
    </AdminGuard>
  );
}
