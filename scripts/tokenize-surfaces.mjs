/**
 * Replaces literal `bg-white` with the `bg-surface` token, for the cases where
 * white is the app's background rather than an intentional on-dark contrast.
 *
 * Skips three cases deliberately:
 *   - `bg-white/15`, `bg-white/40`  alpha overlays on dark or media surfaces
 *   - `bg-white` on the camera screen, which is always dark
 *   - the scroll-to-bottom button, which must stay white to read over media
 *
 * Run: node scripts/tokenize-surfaces.mjs [--write]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

// Screens that are dark by design, where white is a deliberate contrast colour.
const DARK_SURFACES = ['camera.tsx'];

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
};

const files = [...walk(join(root, 'app')), ...walk(join(root, 'components'))];
let changed = 0;

for (const file of files) {
  const rel = relative(root, file);
  const name = rel.split(/[\\/]/).pop();
  if (DARK_SURFACES.includes(name)) continue;

  let src = readFileSync(file, 'utf8');
  const original = src;

  // Only the bare class. `bg-white/15` and friends must not match.
  src = src.replace(/(?<![\w/-])bg-white(?![\w/-])/g, 'bg-surface');

  if (src !== original) {
    changed++;
    if (write) writeFileSync(file, src, 'utf8');
  }
}

console.log(`${write ? 'rewrote' : 'would rewrite'} ${changed} file(s)`);
