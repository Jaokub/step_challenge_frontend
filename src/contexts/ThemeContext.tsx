import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, darkColors, lightColors } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const THEME_KEY = '@step_challenge_theme';

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved !== null) {
          setIsDark(saved === 'dark');
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      }
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light').catch(() => {});
      return newValue;
    });
  }, []);

  const setTheme = useCallback((dark: boolean) => {
    setIsDark(dark);
    AsyncStorage.setItem(THEME_KEY, dark ? 'dark' : 'light').catch(() => {});
  }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
