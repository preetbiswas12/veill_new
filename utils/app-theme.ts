import StorageService from './storage';

export type Theme = 'light' | 'dark' | 'system';

export const colors = {
  dark: {
    primary: '#7A2222',
    muted: '#9B2E2E',
    background: '#000000',
    surface: '#0D0D0D',
    card: '#181818',
    text: '#FFFFFF',
    textSecondary: '#FFFFFF',
    gray: '#FFFFFF',
    lightGray: '#292929',
    green: '#7A2222',
    lightGreen: '#9B2E2E',
    red: '#7A2222',
    yellow: '#FFFFFF',
  },
  light: {
    primary: '#7A2222',
    muted: '#9B2E2E',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#000000',
    gray: '#666666',
    lightGray: '#E0E0E0',
    green: '#7A2222',
    lightGreen: '#9B2E2E',
    red: '#7A2222',
    yellow: '#FFA500',
  },
};

export async function getEffectiveTheme(): Promise<'light' | 'dark'> {
  try {
    const settings = await StorageService.getSettings();
    const theme = settings.theme || 'dark';
    if (theme === 'system') {
      return 'dark';
    }
    return theme as 'light' | 'dark';
  } catch {
    return 'dark';
  }
}

export async function getEffectiveFontSize(): Promise<'small' | 'medium' | 'large' | 'xlarge'> {
  try {
    const settings = await StorageService.getSettings();
    return (settings.fontSize || 'medium') as 'small' | 'medium' | 'large' | 'xlarge';
  } catch {
    return 'medium';
  }
}

export async function getEffectiveWallpaper(): Promise<string> {
  try {
    const settings = await StorageService.getSettings();
    return settings.wallpaper || 'default';
  } catch {
    return 'default';
  }
}

export const fontSizes = {
  small: 13,
  medium: 16,
  large: 19,
  xlarge: 22,
};

export const wallpaperColors = {
  default: '#000000',
  blue: '#E3F2FD',
  orange: '#FFF3E0',
  purple: '#F3E5F5',
  red: '#FFEBEE',
  teal: '#E0F2F1',
  yellow: '#FFFDE7',
  grey: '#F5F5F5',
};

export function getWallpaperColor(wallpaperId: string): string {
  return wallpaperColors[wallpaperId as keyof typeof wallpaperColors] || wallpaperColors.default;
}
