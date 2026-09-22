/**
 * E21-06 — the accessibility gate.
 *
 * Runs axe-core against the app in a real browser and fails on any violation
 * at the WCAG 2.1 A/AA level. Two modes:
 *
 *   pnpm check:a11y                    public pages only (no account needed)
 *   FS_EMAIL=… FS_PASSWORD=… pnpm check:a11y    signs in and checks the app too
 *
 * The public subset is what CI can run: it needs the app and a database, and
 * nothing else. The authenticated subset needs a Firefly connection, which is
 * why it is opt-in rather than the default.
 *
 * Why a script and not a Vitest test: axe measures computed style and the
 * accessibility tree, which only exist in a browser. jsdom reports contrast
 * and focus order that no user will ever experience.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.FS_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.FS_EMAIL;
const PASSWORD = process.env.FS_PASSWORD;

const PUBLIC_PAGES = ['/sign-in', '/sign-up', '/forgot-password'];
const APP_PAGES = [
  '/dashboard',
  '/transactions',
  '/accounts',
  // E4-06. Checkboxes, a live region and a disabled submit that has to explain
  // itself — the page in the app with the most to get wrong here.
  '/accounts/1/reconcile',
  '/budgets',
  '/categories',
  '/bills',
  '/piggy-banks',
  '/reports/net-worth',
  '/reports/categories',
  '/rules',
  // E11-09. Rows of selects and comboboxes with no visible labels, plus a
  // popover — the shape that had a critical select-name violation on it.
  '/rules/new',
  '/recurring',
  '/tags',
  '/currencies',
  '/settings/preferences',
  '/settings/security',
  '/settings/connections',
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page, path, theme) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  // Charts mount their SVG after hydration; scanning before that misses them.
  await page.waitForTimeout(600);

  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map((violation) => ({
    path: `${path} (${theme})`,
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.length,
    // One example is enough to find it; the full list is noise in a terminal.
    example: violation.nodes[0]?.target?.join(' ') ?? '',
    snippet: (violation.nodes[0]?.html ?? '').slice(0, 120),
  }));
}

const browser = await chromium.launch();
// axe-core/playwright requires a context it can evaluate in; browser.newPage()
// creates one implicitly and it refuses that.
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const findings = [];

/**
 * Both themes, always. Contrast is the rule that actually fails in practice,
 * and it fails per-palette: the one violation this script found on its first
 * run existed in dark and not in light. Checking only the theme you happen to
 * be using tests half the app.
 */
const THEMES = ['light', 'dark'];

async function setTheme(theme) {
  // next-themes reads this before first paint; it is the same switch the UI
  // flips, so this exercises the real code path rather than forcing a class.
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => localStorage.setItem('theme', value), theme);
}

for (const theme of THEMES) {
  await setTheme(theme);
  for (const path of PUBLIC_PAGES) {
    findings.push(...(await scan(page, path, theme)));
    process.stdout.write(`  scanned ${path} (${theme})\n`);
  }
}

if (EMAIL && PASSWORD) {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page
    .getByRole('button', { name: /sign in/i })
    .first()
    .click();
  await page.waitForTimeout(2500);

  if (page.url().includes('/sign-in')) {
    console.error('Could not sign in — check FS_EMAIL/FS_PASSWORD, or the rate limiter.');
    await browser.close();
    process.exit(2);
  }

  for (const theme of THEMES) {
    await setTheme(theme);
    for (const path of APP_PAGES) {
      findings.push(...(await scan(page, path, theme)));
      process.stdout.write(`  scanned ${path} (${theme})\n`);
    }
  }
} else {
  process.stdout.write('\n  (set FS_EMAIL and FS_PASSWORD to include the authenticated pages)\n');
}

await browser.close();

if (findings.length === 0) {
  console.log(`\n✓ axe found no WCAG 2.1 A/AA violations.`);
  process.exit(0);
}

// Group by rule: one broken component repeated on twelve pages is one fix, and
// a list of twelve identical findings hides that.
const byRule = new Map();
for (const finding of findings) {
  const entry = byRule.get(finding.id) ?? { ...finding, paths: [], total: 0 };
  entry.paths.push(finding.path);
  entry.total += finding.nodes;
  byRule.set(finding.id, entry);
}

console.log(`\n✗ ${byRule.size} rule(s) violated, ${findings.length} page-level findings:\n`);
for (const entry of [...byRule.values()].sort((a, b) => b.total - a.total)) {
  console.log(`  [${entry.impact}] ${entry.id} — ${entry.help}`);
  console.log(
    `    ${entry.total} node(s) across ${entry.paths.length} page(s): ${entry.paths.slice(0, 4).join(', ')}`,
  );
  console.log(`    e.g. ${entry.example}`);
  console.log(`         ${entry.snippet}\n`);
}
process.exit(1);
