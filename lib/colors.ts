/**
 * The palette, as hex.
 *
 * The same values are also declared as CSS variables in global.css, because
 * className colours such as `bg-surface` can only follow the active mode
 * through a variable. That means two representations of one palette, which is a
 * drift risk, so `scripts/check-theme.mjs` parses global.css and fails if any
 * token here disagrees with it. Run it after editing either file.
 *
 * Prefer className tokens over these values. Reach for this map only where a
 * literal colour is unavoidable, which in practice means props on third-party
 * components: Ionicons `color`, Switch `trackColor`/`thumbColor`, and
 * ActivityIndicator.
 */
export const lightPalette = {
  // surfaces
  surface: '#ffffff',
  'surface-muted': '#f2f2f7',
  'surface-input': '#f0f2f5',
  'surface-active': '#d9fdd3',
  'surface-cta': '#f7f8f9',
  'panel-blur': '#f2f2f7',
  'panel-blur-warm': '#efeae2',
  'chat-bg': '#efeae2',
  'input-border': '#b2b2b2',

  // brand
  product: '#25d366',
  teal: '#008069',
  'product-deep': '#00a884',

  // text
  'text-strong': '#111b21',
  'text-muted': '#667781',
  'text-invert': '#ffffff',
  'text-error': '#d93025',
  link: '#027eb5',
  'tick-read': '#53bdeb',

  // lines
  separator: '#e9edef',
  'panel-border': '#e0e4e6',
  'avatar-border': '#e8ecee',

  // bubbles
  'bubble-out': '#d9fdd3',
  'bubble-in': '#ffffff',
  'bubble-shadow': '#111b21',

  // replying
  quote: '#d42a66',
  'cta-options': '#ffffff',
} as const;

export const darkPalette: Record<keyof typeof lightPalette, string> = {
  // surfaces
  surface: '#0b141a',
  'surface-muted': '#111b21',
  'surface-input': '#202c33',
  'surface-active': '#103529',
  'surface-cta': '#141e24',
  'panel-blur': '#111b21',
  'panel-blur-warm': '#0b141a',
  'chat-bg': '#0b141a',
  'input-border': '#2a3942',

  // brand: WhatsApp's current dark accent green, decoded from the
  // com.whatsapp resources (0x7f060173 = #21c063); #103529 is the selected
  // filter chip's fill in the same decode
  product: '#21c063',
  teal: '#00a884',
  'product-deep': '#06d6a5',

  // text
  'text-strong': '#e9edef',
  'text-muted': '#8696a0',
  'text-invert': '#0b141a',
  'text-error': '#f15c6d',
  link: '#53bdeb',
  'tick-read': '#53bdeb',

  // lines
  separator: '#222d34',
  'panel-border': '#2a3942',
  'avatar-border': '#2a3942',

  // bubbles
  'bubble-out': '#005c4b',
  'bubble-in': '#202c33',
  'bubble-shadow': '#000000',

  // replying
  quote: '#e5739f',
  'cta-options': '#202c33',
};

export type Palette = Record<keyof typeof lightPalette, string>;
