import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAuthToken, clearAuthToken } from '../services/api';
import { TOKEN_KEY, getToken } from '../services/tokenStorage';
import authService from '../features/auth/authService';
import type { User } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, nickname: string, department: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  // Check for existing token on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const response = await authService.getMe();
          if (response.success) {
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.warn('Auto-login failed:', error);
        // Clear invalid tokens
        await clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.success) {
      setUser(response.data.user);
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    nickname: string,
    department: string,
  ) => {
    const response = await authService.register(email, password, fullName, nickname, department);
    if (response.success) {
      setUser(response.data.user);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.warn('Failed to refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
