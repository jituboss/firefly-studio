/**
 * E22-05 — the bundle budget.
 *
 *   pnpm check:bundle             fail if any route exceeds its budget
 *   pnpm check:bundle --update    rewrite the budget file from this build
 *
 * Measures the gzipped first-load JavaScript per route: every chunk the route
 * needs, plus the shared ones, de-duplicated, as the browser would actually
 * download them. Raw bytes would be the wrong number — nothing is served
 * uncompressed — and a total across all routes would hide the case that
 * matters, which is one page quietly doubling.
 *
 * The budget is committed (`bundle-budget.json`) with a headroom allowance, so
 * ordinary churn does not redden a pull request but a step change does. When a
 * rise is deliberate, `--update` and commit the new numbers: the diff is then
 * part of the review, which is the entire point.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const NEXT_DIR = '.next';
const BUDGET_FILE = 'bundle-budget.json';
/** How far a route may drift above its recorded size before this fails. */
const HEADROOM = 1.1;

if (!existsSync(join(NEXT_DIR, 'app-build-manifest.json'))) {
  console.error('No build found. Run `pnpm build` first.');
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(join(NEXT_DIR, 'app-build-manifest.json'), 'utf8'));

const gzipCache = new Map();
function gzipSize(file) {
  if (gzipCache.has(file)) return gzipCache.get(file);
  const path = join(NEXT_DIR, file);
  let size = 0;
  try {
    if (statSync(path).isFile()) size = gzipSync(readFileSync(path)).length;
  } catch {
    // A file in the manifest that is not on disk is not this script's problem
    // to report; the build would have failed first.
  }
  gzipCache.set(file, size);
  return size;
}

// Every route carries the root layout's chunks as well as its own.
const shared = new Set(manifest.pages['/layout'] ?? []);

const sizes = {};
for (const [route, files] of Object.entries(manifest.pages)) {
  if (route === '/layout') continue;
  const unique = new Set([...shared, ...files]);
  let total = 0;
  for (const file of unique) {
    if (file.endsWith('.js')) total += gzipSize(file);
  }
  sizes[route] = total;
}

const update = process.argv.includes('--update');

if (update) {
  writeFileSync(BUDGET_FILE, `${JSON.stringify(sizes, null, 2)}\n`, 'utf8');
  const biggest = Object.entries(sizes).sort((a, b) => b[1] - a[1])[0];
  console.log(`Wrote ${BUDGET_FILE} for ${Object.keys(sizes).length} routes.`);
  console.log(`Largest: ${biggest[0]} at ${(biggest[1] / 1024).toFixed(1)} kB gzipped.`);
  process.exit(0);
}

if (!existsSync(BUDGET_FILE)) {
  console.error(`No ${BUDGET_FILE}. Run \`pnpm check:bundle --update\` and commit it.`);
  process.exit(2);
}

const budget = JSON.parse(readFileSync(BUDGET_FILE, 'utf8'));
const over = [];
const added = [];

for (const [route, size] of Object.entries(sizes)) {
  const allowed = budget[route];
  if (allowed === undefined) {
    added.push([route, size]);
    continue;
  }
  if (size > allowed * HEADROOM) over.push([route, size, allowed]);
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

for (const [route, size] of added) {
  console.log(`  new route  ${route} — ${kb(size)} (not yet budgeted)`);
}

if (over.length === 0) {
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  console.log(
    `✓ ${Object.keys(sizes).length} routes within budget (largest ${kb(Math.max(...Object.values(sizes)))}, mean ${kb(total / Object.keys(sizes).length)}).`,
  );
  process.exit(0);
}

console.error(
  `\n✗ ${over.length} route(s) over budget (+${Math.round((HEADROOM - 1) * 100)}% allowed):\n`,
);
for (const [route, size, allowed] of over.sort((a, b) => b[1] - b[2] - (a[1] - a[2]))) {
  const delta = (((size - allowed) / allowed) * 100).toFixed(1);
  console.error(`  ${route}\n    ${kb(allowed)} → ${kb(size)}  (+${delta}%)`);
}
console.error(
  `\nIf this growth is intended: pnpm check:bundle --update, and commit ${BUDGET_FILE}.`,
);
process.exit(1);
