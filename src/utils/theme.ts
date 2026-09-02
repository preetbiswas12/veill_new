import { createTypography } from './themeTypography';
import config from '../config/config.json';

export type ColorConfig = {
  brandColor: string;
  primaryTextLight: string;
  primaryTextDark: string;
  secondaryTextLight: string;
  secondaryTextDark: string;
};

export const colors: ColorConfig = config.settings.style.color;

export const getTypography = () => {
  return createTypography('system');
};

export const isDarkTheme = (): boolean => {
  return config.settings.style.theme === 'dark';
};

// ─── Spacing & Radius Tokens ───────────────────────────────────────
const spacingTokens = {
  s0: 0, s0_5: 2, s1: 4, s1_5: 6, s2: 8, s3: 12, s4: 16,
  s5: 20, s6: 24, s8: 32, s10: 40, s12: 48, s16: 64, s20: 80,
  max: 9999,
};

const radiusTokens = {
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999,
};

const spacing = {
  spacing: spacingTokens,
  padding: { ...spacingTokens },
  margin: { ...spacingTokens },
  radius: { ...radiusTokens },
};

// ─── Light Theme ──────────────────────────────────────────────────
const lightTheme = {
  mode: 'light' as const,
  color: {
    background: '#FFFFFF',
    background1: '#F0F2F5',
    background2: '#E9EDEF',
    background3: '#F8F9FA',
    primary: colors.brandColor,
    primaryText: colors.primaryTextLight,
    secondaryText: colors.secondaryTextLight,
    error: '#EF4444',
    success: '#22C55E',
    border: '#E9EDEF',
    borderDefault: '#D1D7DB',
    iconPrimary: colors.primaryTextLight,
    iconSecondary: colors.secondaryTextLight,
    textPrimary: colors.primaryTextLight,
    textSecondary: colors.secondaryTextLight,
  },
  spacing,
  typography: getTypography(),
};

// ─── Dark Theme (WhatsApp-inspired) ───────────────────────────────
const darkTheme = {
  mode: 'dark' as const,
  color: {
    background: '#0a0a0a',
    background1: '#111111',
    background2: '#1f2c33',
    background3: '#202c33',
    background4: '#182229',
    primary: '#00A884',
    primaryText: '#E9EDEF',
    secondaryText: '#8696A0',
    error: '#EF4444',
    success: '#22C55E',
    border: '#2a2f32',
    borderDefault: '#3b4a54',
    iconPrimary: '#E9EDEF',
    iconSecondary: '#8696A0',
    textPrimary: '#E9EDEF',
    textSecondary: '#8696A0',
  },
  spacing,
  typography: getTypography(),
};

export const cometChatTheme = {
  dark: darkTheme,
  light: lightTheme,
};
