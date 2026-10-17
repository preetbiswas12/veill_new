import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';

import { darkPalette, lightPalette } from '@/lib/colors';
import type { Palette } from '@/lib/colors';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'veill.theme';

interface ThemeValue {
  /** What the user chose. */
  preference: ThemePreference;
  /** What is actually on screen once 'system' is resolved. */
  resolved: 'light' | 'dark';
  isDark: boolean;
  /**
   * Literal colours for the active mode, for props that cannot read a CSS
   * variable: Ionicons `color`, Switch `trackColor`, ActivityIndicator. Prefer
   * className tokens wherever one will do.
   */
  colors: Palette;
  setPreference: (preference: ThemePreference) => void;
  /** Flips between light and dark, leaving 'system' behind as an explicit choice. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Applies the colour scheme to nativewind's `.dark` class and persists the
 * choice. `colorScheme.set` is what flips the class the tokens in global.css
 * hang off, so this is the only place that needs to know about persistence.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useSystemScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Restore the saved preference before the first paint that matters, so the app
  // does not flash light and then swap.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && saved === 'light' || saved === 'dark') setPreferenceState(saved);
      } catch {
        // A missing or unreadable preference just leaves the default.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  useEffect(() => {
    colorScheme.set(resolved);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setPreference]);

  const value = useMemo<ThemeValue>(
    () => ({
      preference,
      resolved,
      isDark: resolved === 'dark',
      colors: resolved === 'dark' ? darkPalette : lightPalette,
      setPreference,
      toggle,
    }),
    [preference, resolved, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
};
