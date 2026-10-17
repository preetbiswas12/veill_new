/**
 * Rewrites hardcoded hex literals onto theme tokens.
 *
 * Two passes:
 *   1. JSX attribute position (`color="#767779"`), the case that silently stays
 *      dark on a dark background.
 *   2. A conditional inside a style object
 *      (`color: a ? '#ea0038' : '#0a0a0a'`), mapping each side independently.
 *
 * Anything left is reported rather than rewritten: module-level constants,
 * object literals and comments need a human to decide the token.
 *
 * Run: node scripts/tokenize-colors.mjs [--write]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

// Old hex -> token key. scripts/check-theme.mjs stays the authority on values.
const MAP = {
  '#0a0a0a': 'text-strong',
  '#767779': 'text-muted',
  '#1dab61': 'product',
  '#15603e': 'product-deep',
  '#00a884': 'product-deep',
  '#ea0038': 'text-error',
  '#d93025': 'text-error',
  '#53bdeb': 'tick-read',
  '#d0fecf': 'surface-active',
  '#b2b2b2': 'input-border',
  '#e4e4e6': 'separator',
  '#111b21': 'text-strong',
  '#667781': 'text-muted',
  '#e9edef': 'separator',
  '#9ca3af': 'text-muted',
};

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
};

/** `cond ? '#a' : '#b'` inside a style object -> `cond ? colors['x'] : colors['y']` */
const conditional = /\?(\s*)'(#[0-9a-fA-F]{6})'(\s*):(\s*)'(#[0-9a-fA-F]{6})'/g;

const files = [...walk(join(root, 'app')), ...walk(join(root, 'components'))];
const leftovers = [];
let changedFiles = 0;

for (const file of files) {
  const rel = relative(root, file);
  let src = readFileSync(file, 'utf8');
  const original = src;

  src = src.replace(/\b([a-zA-Z]+)="(#[0-9a-fA-F]{6})\b"/g, (whole, attr, hex) => {
    const key = MAP[hex.toLowerCase()];
    return key ? `${attr}={colors['${key}']}` : whole;
  });

  src = src.replace(conditional, (whole, s1, thenHex, s2, s3, elseHex) => {
    const a = MAP[thenHex.toLowerCase()];
    const b = MAP[elseHex.toLowerCase()];
    if (!a || !b) return whole;
    return `?${s1}colors['${a}']${s2}:${s3}colors['${b}']`;
  });

  const rest = src
    .replace(/^\s*\*.*$/gm, '')
    .replace(/\/\/.*$/gm, '')
    .match(/#[0-9a-fA-F]{3,6}\b/g);
  if (rest) leftovers.push(rel + ': ' + [...new Set(rest)].join(' '));

  if (src !== original) {
    changedFiles++;
    if (write) writeFileSync(file, src, 'utf8');
  }
}

console.log(`${write ? 'rewrote' : 'would rewrite'} ${changedFiles} file(s)`);
if (leftovers.length) {
  console.log('\nstill hardcoded, needs a decision:');
  for (const l of leftovers) console.log('  ' + l);
}
