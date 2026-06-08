import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { LoadingScreen } from '../src/components';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
