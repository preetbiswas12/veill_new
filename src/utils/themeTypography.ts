import { Platform } from 'react-native';

export type TypographyVariant = {
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
};

export type Typography = {
  fontFamily: string;
  link: TypographyVariant;
  title: TypographyVariant;
  titleMedium: TypographyVariant;
  titleBold: TypographyVariant;
  heading1: TypographyVariant;
  heading1Medium: TypographyVariant;
  heading1Bold: TypographyVariant;
  heading2: TypographyVariant;
  heading2Medium: TypographyVariant;
  heading2Bold: TypographyVariant;
  heading3: TypographyVariant;
  heading3Medium: TypographyVariant;
  heading3Bold: TypographyVariant;
  heading4: TypographyVariant;
  heading4Medium: TypographyVariant;
  heading4Bold: TypographyVariant;
  body: TypographyVariant;
  bodyMedium: TypographyVariant;
  bodyBold: TypographyVariant;
  caption1: TypographyVariant;
  caption1Medium: TypographyVariant;
  caption1Bold: TypographyVariant;
  caption2: TypographyVariant;
  caption2Medium: TypographyVariant;
  caption2Bold: TypographyVariant;
  button: TypographyVariant;
  buttonMedium: TypographyVariant;
  buttonBold: TypographyVariant;
};

const SIZES: Record<string, { regular: number; medium: number; bold: number }> = {
  title:    { regular: 34, medium: 34, bold: 34 },
  heading1: { regular: 22, medium: 22, bold: 22 },
  heading2: { regular: 20, medium: 20, bold: 20 },
  heading3: { regular: 18, medium: 18, bold: 18 },
  heading4: { regular: 16, medium: 16, bold: 16 },
  body:     { regular: 15, medium: 15, bold: 15 },
  caption1: { regular: 14, medium: 14, bold: 14 },
  caption2: { regular: 13, medium: 13, bold: 13 },
  button:   { regular: 15, medium: 15, bold: 15 },
};

const FONT_MAP: Record<string, { regular: string; medium: string; bold: string }> = {
  'system': {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium:  Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    bold:    Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  },
};

function makeVariant(
  fontFamily: string,
  size: number,
  weight: '400' | '500' | '600' | '700',
): TypographyVariant {
  return { fontFamily, fontSize: size, fontWeight: weight };
}

export const createTypography = (font: string): Typography => {
  const fontKey = font ? font.toLowerCase().trim() : '';
  const fontVariants =
    FONT_MAP[fontKey] || FONT_MAP['system'];

  const baseRegular = fontVariants.regular;
  const baseMedium = fontVariants.medium;
  const baseBold = fontVariants.bold;

  const types = [
    'title', 'heading1', 'heading2', 'heading3',
    'heading4', 'body', 'caption1', 'caption2', 'button',
  ] as const;

  const result: Record<string, TypographyVariant> = {
    link: makeVariant(baseRegular, 15, '400'),
  };

  for (const type of types) {
    const sizes = SIZES[type];
    result[type] = makeVariant(baseRegular, sizes.regular, '400');
    result[`${type}Medium`] = makeVariant(baseMedium, sizes.medium, '500');
    result[`${type}Bold`] = makeVariant(baseBold, sizes.bold, '700');
  }

  return result as unknown as Typography;
};
