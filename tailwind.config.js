/** @type {import('tailwindcss').Config} */

// Design tokens for a WhatsApp-class iOS messenger.
//
// Source of truth is the generated design system's `:root` block (Inter type,
// 393x852 artboard), cross-checked against the written spec for the values the
// stylesheet does not name: the green #25D366 used for badges and unread
// timestamps, teal #008069 for nav-bar actions, and the read-receipt blue.
//
// This supersedes the earlier Figma community kit, whose type ran a step small
// (33.33/16/14 with negative tracking) and whose rows were 77.33pt tall. Those
// numbers assumed SF Pro's advance widths while the app renders Roboto, which is
// wider, so text measured wider than every fixed value derived from it. Inter is
// metrically much closer to SF Pro, and the scale below carries no negative
// tracking.
const wa = {
  // surfaces
  surface: '#ffffff',
  'surface-muted': '#f2f2f7', // grouped background, unselected chips
  'surface-input': '#f0f2f5', // search field and text inputs
  'surface-active': '#d9fdd3', // selected chip, green tint
  'surface-cta': 'rgba(17,27,33,0.03)', // circular icon button
  'panel-blur': 'rgba(242,242,247,0.82)', // nav and tab bar material
  'panel-blur-warm': 'rgba(239,234,226,0.82)', // thread header and composer
  'chat-bg': '#efeae2', // thread wallpaper, doodles drawn over it at ~6%
  'input-border': '#b2b2b2',

  // brand
  product: '#25d366', // primary green: unread badges, active tab, send button
  teal: '#008069', // nav-bar actions, focus ring, timestamp accent
  'product-deep': '#00a884', // pressed/active states

  // text
  'text-strong': '#111b21',
  'text-muted': '#667781',
  'text-faint': 'rgba(17,27,33,0.5)',
  'text-invert': '#ffffff',
  'text-error': '#d93025', // destructive, Block/Report/Exit
  link: '#027eb5', // iOS blue for "Broadcast Lists" and other text links
  'tick-read': '#53bdeb', // read receipts
  'sound-off': 'rgba(17,27,33,0.2)', // unplayed waveform bars

  // lines, 0.5pt hairlines
  separator: '#e9edef',
  'panel-border': 'rgba(17,27,33,0.12)',
  'avatar-border': 'rgba(17,27,33,0.1)',

  // message bubbles
  'bubble-out': '#d9fdd3',
  'bubble-in': '#ffffff',
  'bubble-shadow': 'rgba(17,27,33,0.06)',

  // replying
  quote: '#d42a66', // quote bar and its title
  'cta-options': '#ffffff', // circles on the attach sheet
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
        // size / line-height. No negative tracking: the design specifies none,
        // and carrying SF's tracking over onto a wider fallback font is what made
        // rows overflow in the first place.
        display: ['34px', { lineHeight: '41px' }], // large title
        'body-1': ['17px', { lineHeight: '22px' }], // nav title, row name, body
        'body-2': ['15px', { lineHeight: '20px' }], // preview, subtitle, chips
        'body-3': ['12px', { lineHeight: '16px' }], // badges, timestamps
        caption: ['11px', { lineHeight: '14px' }],
        tabbar: ['10px', { lineHeight: '12px' }],
      },
      borderRadius: {
        search: '10px',
        chip: '16px', // chips are full pills; this covers partial-radius cases
        card: '14px', // cards and sheets
        avatar: '28px', // 56pt avatar
        bubble: '12px',
      },
      spacing: {
        row: '76px', // conversation row: 56pt avatar + 2 lines
        statusbar: '54px',
        navbar: '44px',
        header: '98px', // status bar + nav bar
        tabbar: '83px',
      },
      borderWidth: {
        hair: '0.5px', // 0.5pt separators
        bubble: '0.5px',
      },
      minHeight: {
        // 44pt minimum tap target, per the accessibility requirement
        tap: '44px',
      },
    },
  },
  plugins: [],
};
