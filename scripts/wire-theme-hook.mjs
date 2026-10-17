/**
 * Wires `const { colors } = useTheme();` into any component that references
 * `colors[...]` but does not yet call the hook.
 *
 * Placement matters: it has to go at the top of the component body, before any
 * early return, or React throws on a conditional hook call. Rather than guessing
 * at the component signature (which is `const X = () => {` in some files and
 * `const X = ({ a, b }: Props) => {` in others), this scans forward from the
 * declaration while tracking paren depth to skip the destructured parameter
 * list, then inserts after the body's opening brace.
 *
 * Run: node scripts/wire-theme-hook.mjs [--write]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
};

/** Index just past the `{` that opens a component body, or -1. */
const findComponentBody = (src) => {
  const decl = /(^|\n)const\s+([A-Za-z0-9_]+)\s*=\s*/g;
  let match;
  while ((match = decl.exec(src))) {
    let i = decl.lastIndex;
    // Skip the parameter list, which may itself contain braces and parens.
    let depth = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '(' || ch === '{') depth++;
      else if (ch === ')' || ch === '}') depth--;
      else if (ch === '=' && src[i + 1] === '>') {
        i += 2;
        break;
      }
      i++;
    }
    while (i < src.length && src[i] !== '{') i++;
    if (i < src.length) return i + 1;
  }
  return -1;
};

const touched = [];

for (const file of [...walk(join(root, 'app')), ...walk(join(root, 'components'))]) {
  const rel = relative(root, file);
  let src = readFileSync(file, 'utf8');

  if (!/colors\[/.test(src) || /useTheme/.test(src)) continue;

  const at = findComponentBody(src);
  if (at < 0) {
    console.log(`  SKIP ${rel}: could not locate a component body`);
    continue;
  }

  src = src.slice(0, at) + "\n  const { colors } = useTheme();" + src.slice(at);

  const lastImport = src.lastIndexOf('\nimport ');
  const importEnd = src.indexOf('\n', src.indexOf(';', lastImport) + 1);
  src = src.slice(0, importEnd + 1) + "import { useTheme } from '@/hooks/useTheme';\n" + src.slice(importEnd + 1);

  touched.push(rel);
  if (write) writeFileSync(file, src, 'utf8');
}

console.log(`${write ? 'wired' : 'would wire'} ${touched.length} file(s):`);
for (const t of touched) console.log('  ' + t);
