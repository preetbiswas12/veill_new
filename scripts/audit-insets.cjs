const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk('app');
const issues = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const hasHeader = /<ScreenHeader/.test(src);
  const edgesMatch = src.match(/edges=\{?['"]([^'"]+)['"]/) || src.match(/edges=\{\[([^\]]+)\]/);
  let edges = null;
  if (edgesMatch) {
    edges = edgesMatch[1] + (src.match(/edges=\{\[([^\]]+)\]/)?.[1]?.slice(edgesMatch[1].length) || '');
    const bracket = src.match(/edges=\{\[([^\]]+)\]/);
    if (bracket) edges = bracket[1];
  }
  const hasScreenElem = /<Screen\b/.test(src) || /<KeyboardScreen\b/.test(src);
  if (!hasScreenElem) continue;
  const topHandledByScreen = !edges || /'top'|"top"|top,/.test(edges);
  // A header owns the top inset. If the Screen also pads the top → double inset.
  if (hasHeader && topHandledByScreen) {
    issues.push({ file, kind: 'HEADER + top edge (double inset)', edges: edges || 'default(all)' });
  }
  // A screen without a header must own the top edge — either by letting the
  // Screen keep it, or by padding `paddingTop: insets.top` in a custom header
  // row. Screens that do neither put their title under the notch.
  if (!hasHeader && !topHandledByScreen && !/paddingTop:\s*insets/.test(src)) {
    issues.push({ file, kind: 'no header, top excluded, no manual padding (status-bar overlap?)', edges });
  }
}

if (!issues.length) {
  console.log('OK — no Screen/ScreenHeader inset conflicts found in', files.length, 'screens');
} else {
  for (const item of issues) console.log(`${item.kind}\n  ${item.file}\n  edges: ${item.edges}\n`);
}
