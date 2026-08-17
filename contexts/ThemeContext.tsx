import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import StorageService from '@/utils/storage';
import { colors, getEffectiveTheme, getEffectiveFontSize, getEffectiveWallpaper, fontSizes, getWallpaperColor, Theme } from '@/utils/app-theme';

type ThemeContextType = {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  wallpaper: string;
  wallpaperColor: string;
  fontSizeValue: number;
  colors: typeof colors.dark;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => Promise<void>;
  setWallpaper: (id: string) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  fontSize: 'medium',
  wallpaper: 'default',
  wallpaperColor: getWallpaperColor('default'),
  fontSizeValue: fontSizes.medium,
  colors: colors.dark,
  setTheme: async () => {},
  setFontSize: async () => {},
  setWallpaper: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [wallpaper, setWallpaperState] = useState<string>('default');

  const loadSettings = useCallback(async () => {
    try {
      const effectiveTheme = await getEffectiveTheme();
      const effectiveFontSize = await getEffectiveFontSize();
      const effectiveWallpaper = await getEffectiveWallpaper();
      setThemeState(effectiveTheme);
      setFontSizeState(effectiveFontSize);
      setWallpaperState(effectiveWallpaper);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setTheme = async (value: 'light' | 'dark' | 'system') => {
    await StorageService.updateSetting('theme', value);
    const effective = value === 'system' ? (systemTheme === 'light' ? 'light' : 'dark') : value;
    setThemeState(effective);
  };

  const setFontSize = async (value: 'small' | 'medium' | 'large' | 'xlarge') => {
    await StorageService.updateSetting('fontSize', value);
    setFontSizeState(value);
  };

  const setWallpaper = async (value: string) => {
    await StorageService.updateSetting('wallpaper', value);
    setWallpaperState(value);
  };

  const wallpaperColor = getWallpaperColor(wallpaper);
  const fontSizeValue = fontSizes[fontSize] || fontSizes.medium;
  const currentColors = theme === 'dark' ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ theme, fontSize, wallpaper, wallpaperColor, fontSizeValue, colors: currentColors, setTheme, setFontSize, setWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
