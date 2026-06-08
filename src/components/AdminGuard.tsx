import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
};

export default AdminGuard;
