/** @type {import('tailwindcss').Config} */

/*
 * Every colour resolves through a CSS variable defined in global.css, which
 * holds both the light and the dark value. That is deliberate: it means adding
 * dark mode to a screen costs nothing, because `bg-surface` and `text-text-muted`
 * already flip when `.dark` is applied. Writing `dark:` variants per screen would
 * have doubled every stylesheet and guaranteed the two modes drifted apart.
 *
 * The scale itself came from the design system's `:root` block, cross-checked
 * against the written spec for the values it does not name: the green #25D366
 * used for unread badges and active tabs, teal #008069 for nav-bar actions, and
 * the read-receipt blue #53BDEB.
 *
 * The type scale carries no negative tracking. An earlier pass used SF Pro's
 * values (33.33/16/14 at -1.33/-0.32), which assume SF's advance widths; the app
 * renders Roboto, which is wider, so every fixed measurement derived from the
 * design came out too small and text overflowed its row.
 */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;
// A few tokens are translucent by nature, so their alpha is fixed here while the
// colour still follows the active mode.
const translucent = (name, alpha) => `rgb(var(--color-${name}) / ${alpha})`;

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // surfaces
        surface: token('surface'),
        'surface-muted': token('surface-muted'),
        'surface-input': token('surface-input'),
        'surface-active': token('surface-active'),
        'surface-cta': token('surface-cta'),
        'panel-blur': translucent('panel-blur', 0.82),
        'panel-blur-warm': translucent('panel-blur-warm', 0.86),
        'chat-bg': token('chat-bg'),
        'input-border': token('input-border'),

        // brand
        product: token('product'),
        teal: token('teal'),
        'product-deep': token('product-deep'),

        // text
        'text-strong': token('text-strong'),
        'text-muted': token('text-muted'),
        'text-invert': token('text-invert'),
        'text-error': token('text-error'),
        link: token('link'),
        'tick-read': token('tick-read'),

        // lines
        separator: token('separator'),
        'panel-border': token('panel-border'),
        'avatar-border': token('avatar-border'),

        // bubbles
        'bubble-out': token('bubble-out'),
        'bubble-in': token('bubble-in'),
        'bubble-shadow': translucent('bubble-shadow', 0.06),

        // replying
        quote: token('quote'),
        'cta-options': token('cta-options'),

        // derived, translucent
        'text-faint': translucent('text-strong', 0.5),
        'sound-off': translucent('text-strong', 0.2),

        // The app previously used Signal blue here. Pointing `primary` at the
        // WhatsApp green re-skins every existing bg-primary / text-primary in one
        // place instead of hunting them down.
        primary: token('product'),
        transparent: 'transparent',
        current: 'currentColor',
      },
      fontSize: {
        // size / line-height
        display: ['34px', { lineHeight: '41px' }], // large title
        'body-1': ['17px', { lineHeight: '22px' }], // nav title, row name, body
        'body-2': ['15px', { lineHeight: '20px' }], // preview, subtitle, chips
        'body-3': ['12px', { lineHeight: '16px' }], // badges, timestamps
        caption: ['11px', { lineHeight: '14px' }],
        tabbar: ['10px', { lineHeight: '12px' }],
      },
      borderRadius: {
        search: '10px',
        chip: '16px', // chips are full pills; covers partial-radius cases
        card: '14px', // cards and sheets
        avatar: '28px', // 56pt avatar
        bubble: '12px',
      },
      spacing: {
        row: '76px', // conversation row: 56pt avatar over two text lines
        statusbar: '54px',
        navbar: '44px',
        header: '98px', // status bar plus nav bar
        tabbar: '83px',
      },
      borderWidth: {
        hair: '0.5px', // 0.5pt separators
        bubble: '0.5px',
      },
      minHeight: {
        tap: '44px', // 44pt minimum tap target
      },
    },
  },
  plugins: [],
};
