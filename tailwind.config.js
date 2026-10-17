/** @type {import('tailwindcss').Config} */

// Tokens lifted from the Figma file "WhatsApp Screens 2025 with Meta AI - UI for
// iOS". Values are the literal CSS variables the design publishes, e.g.
// `--surface/surface-product` -> #1dab61.
const wa = {
  // surfaces
  surface: '#ffffff',
  'surface-muted': '#f4f4f4', // surface-cta-filters, surface-search-chat
  'surface-active': '#d0fecf', // surface-cta-filters-active
  'surface-cta': 'rgba(10,10,10,0.03)', // surface-cta-circular
  'panel-blur': 'rgba(244,244,244,0.8)', // surface-panel-blur
  'panel-blur-warm': 'rgba(245,242,235,0.8)', // surface-panel (chat header / composer)
  'chat-bg': '#f5f2eb', // surface-chat, the thread wallpaper
  'input-border': '#b2b2b2', // brd-input-chat

  // brand
  product: '#1dab61', // surface-product / txt-product
  'product-deep': '#15603e', // txt-cta-filters-active

  // text
  'text-strong': '#0a0a0a', // txt-primary, txt-tabbar-selected
  'text-muted': '#767779', // txt-secondary, txt-tabbar
  'text-faint': 'rgba(0,0,0,0.5)', // txt-secondary-alpha
  'text-invert': '#ffffff',
  'text-error': '#ea0038',
  'sound-off': 'rgba(0,0,0,0.2)', // surface-sound-off (unplayed waveform)

  // lines
  separator: 'rgba(0,0,0,0.2)', // brd-separator
  'panel-border': 'rgba(0,0,0,0.3)', // brd-panel
  'avatar-border': 'rgba(10,10,10,0.1)', // brd-avatar

  // message bubbles
  'bubble-out': '#d0fecf', // surface-baloon-me
  'bubble-in': '#ffffff', // surface-baloon-you
  'bubble-shadow': 'rgba(0,0,0,0.06)', // surface-shadow-baloon
};

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...wa,
        // The app previously used Signal blue here. Pointing `primary` at the
        // WhatsApp green re-skins every existing bg-primary / text-primary in one
        // place instead of hunting them down.
        primary: wa.product,
      },
      fontSize: {
        // size / line-height, with the tracking the design specifies
        display: ['33.33px', { lineHeight: '40px', letterSpacing: '-1.3332px' }],
        'body-1': ['16px', { lineHeight: '19px', letterSpacing: '-0.32px' }],
        'body-2': ['14px', { lineHeight: '19px', letterSpacing: '-0.14px' }],
        'body-3': ['12px', { lineHeight: '16px', letterSpacing: '-0.12px' }],
        caption: ['11px', { lineHeight: '14px', letterSpacing: '-0.05px' }],
        tabbar: ['10px', { lineHeight: '12px', letterSpacing: '0.05px' }],
      },
      borderRadius: {
        // 10r search input, 19r filter chip, 28r avatar, full pill
        search: '10px',
        chip: '19px',
        avatar: '28px',
      },
      spacing: {
        row: '77.33px', // conversation row height in the design
        tabbar: '83px',
        header: '98px',
      },
      borderWidth: {
        // the design uses 0.33px hairlines for its separators
        hair: '0.33px',
      },
    },
  },
  plugins: [],
};