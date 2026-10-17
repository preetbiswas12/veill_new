/**
 * Ensures every scope that reads `colors[...]` declares
 * `const { colors } = useTheme();`, adding the import when it is missing.
 *
 * Scopes are located by brace-matching from each component declaration rather
 * than by looking at the first one in the file, because several screens keep
 * their rows in a helper component above the screen itself and both need it.
 *
 * Implicit-return components (`=> (`) are reported, not rewritten: they have
 * nowhere legal to put a hook and have to be converted by hand.
 *
 * Run: node scripts/fix-theme-scope.mjs [--write]
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

/** Walks braces from an opening `{` to its match, skipping strings and comments. */
const blockEnd = (src, open) => {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      i = src.indexOf('*/', i) + 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/** Block-bodied arrow components: `const X = (…) => {`. */
const blockComponents = (src) => {
  const found = [];
  const re = /(?:^|\n)(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*(?::[^=\n]*)?=>\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const open = re.lastIndex - 1;
    const end = blockEnd(src, open);
    if (end > 0) found.push({ name: m[1], open, bodyStart: re.lastIndex, end });
  }
  return found;
};

/** Implicit-return arrow components: `const X = (…) => (`. */
const implicitComponents = (src) => {
  const found = [];
  const re = /(?:^|\n)(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*(?::[^=\n]*)?=>\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const open = re.lastIndex - 1;
    const end = blockEnd(src, open);
    if (end > 0) found.push({ name: m[1], bodyStart: re.lastIndex, end });
  }
  return found;
};

const DECL = 'const { colors } = useTheme();';
const IMPORT = "import { useTheme } from '@/hooks/useTheme';";
const files = [...walk(join(root, 'app')), ...walk(join(root, 'components'))];
const report = [];
let fixedFiles = 0;

for (const file of files) {
  const rel = relative(root, file);
  let src = readFileSync(file, 'utf8');
  if (!/colors\[/.test(src)) continue;

  let changed = false;

  // Innermost-first, so an earlier insertion does not shift a later offset.
  const blocks = blockComponents(src).sort((a, b) => b.bodyStart - a.bodyStart);
  for (const scope of blocks) {
    const body = src.slice(scope.bodyStart, scope.end);
    if (!/colors\[/.test(body) || body.includes(DECL)) continue;
    src = src.slice(0, scope.bodyStart) + `\n  ${DECL}` + src.slice(scope.bodyStart);
    changed = true;
    report.push(`${rel}: ${scope.name}`);
  }

  // An implicit-return component cannot host a hook, so surface it rather than
  // mangling the JSX. This is the case that produced "colors is not defined".
  for (const scope of implicitComponents(src)) {
    if (/colors\[/.test(src.slice(scope.bodyStart, scope.end))) {
      report.push(`${rel}: ${scope.name} returns implicitly but uses colors — convert by hand`);
    }
  }

  if (changed) {
    if (!/from '@\/hooks\/useTheme'/.test(src)) {
      const lastImport = src.lastIndexOf('\nimport ');
      const importEnd = src.indexOf('\n', src.indexOf(';', lastImport) + 1);
      src =
        src.slice(0, importEnd + 1) +
        IMPORT +
        '\n' +
        src.slice(importEnd + 1);
    }
    fixedFiles++;
    if (write) writeFileSync(file, src, 'utf8');
  }
}

console.log(`${write ? 'fixed' : 'would fix'} ${fixedFiles} file(s)`);
for (const r of report) console.log('  ' + r);
