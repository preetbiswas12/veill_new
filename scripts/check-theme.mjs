/**
 * Guards against the palette drifting between lib/colors.ts (hex, for props on
 * third-party components) and global.css (CSS variables, for className tokens).
 *
 * Two representations of one palette is the only way to cover both, since a
 * `color` prop on Ionicons cannot read a CSS variable, and a className cannot
 * read a hex map. The risk is that one side gets edited and the other does not,
 * which shows up as icons that stay dark on a dark background. This turns that
 * into a failing check instead.
 *
 * Usage: node scripts/check-theme.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// lib/colors.ts is TypeScript, so the object literals are read rather than
// imported. Both maps are plain `key: '#hex'` entries.
const colorsSource = readFileSync(join(root, 'lib', 'colors.ts'), 'utf8');
const css = readFileSync(join(root, 'global.css'), 'utf8');

// PowerShell text redirects and Set-Content silently add a UTF-8 BOM on
// Windows. A leading BOM derails the lexer inside react-native-css-interop
// (lightningcss): every Metro/bundle start fails with a cryptic
// `Unexpected token Delim('*')` that blames the universal selector. That
// selector is valid — only the invisible leading BOM is the problem. Check
// the raw bytes, because nothing in the decoded string shows the BOM.
if (readFileSync(join(root, 'global.css')).subarray(0, 3).toString('hex') === 'efbbbf') {
  console.error(
    'global.css starts with a UTF-8 BOM. Strip it before continuing:\n' +
      '  node -e "const fs=require(\'fs\');const b=fs.readFileSync(\'global.css\');fs.writeFileSync(\'global.css\',b.subarray(3));"\n' +
      'BOMs come from PowerShell `>` / Set-Content writes; edit css with node or an editor saving UTF-8 without BOM.'
  );
  process.exit(1);
}


const toRgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** Pulls `name: '#hex'` pairs out of one of the two exported maps. */
const readMap = (marker) => {
  const start = colorsSource.indexOf(marker);
  if (start < 0) throw new Error(`Could not find "${marker}" in lib/colors.ts`);
  // lightPalette is frozen with `as const` and darkPalette is annotated, so the
  // two object literals close differently. Take whichever terminator comes first,
  // otherwise the light map's scan runs on into the dark one and silently reports
  // the dark values as light ones.
  const ends = ['\n};', '\n} as const;', '\n} satisfies'].map((t) => {
    const at = colorsSource.indexOf(t, start);
    return at < 0 ? Infinity : at;
  });
  const body = colorsSource.slice(start, Math.min(...ends));
  const map = {};
  for (const match of body.matchAll(/'?([a-z-]+)'?:\s*'(#[0-9a-fA-F]{3,6})'/g)) {
    map[match[1]] = match[2].toLowerCase();
  }
  return map;
};

/** Reads `--color-name: R G B` declarations out of a selector block. */
const readCssVars = (selector) => {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`Could not find "${selector}" in global.css`);
  const open = css.indexOf('{', at);
  const close = css.indexOf('}', open);
  const body = css.slice(open, close);
  const vars = {};
  for (const match of body.matchAll(/--color-([a-z-]+):\s*([\d\s]+);/g)) {
    const [r, g, b] = match[2].trim().split(/\s+/).map(Number);
    vars[match[1]] = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
  }
  return vars;
};

const problems = [];

const compare = (label, jsMap, cssVars) => {
  for (const [name, hex] of Object.entries(jsMap)) {
    if (!(name in cssVars)) {
      problems.push(`${label}: --color-${name} is missing from global.css`);
      continue;
    }
    if (cssVars[name] !== hex) {
      problems.push(
        `${label}: ${name} is ${hex} in lib/colors.ts but ${cssVars[name]} in global.css`
      );
    }
  }
  for (const name of Object.keys(cssVars)) {
    if (!(name in jsMap)) problems.push(`${label}: --color-${name} is in global.css but not lib/colors.ts`);
  }
};

compare('light', readMap('lightPalette'), readCssVars(':root'));
compare('dark', readMap('darkPalette'), readCssVars('.dark:root'));

if (problems.length) {
  console.error('Theme palettes disagree:\n');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

const light = Object.keys(readMap('lightPalette')).length;
console.log(`Theme palettes agree: ${light} tokens in both modes.`);
