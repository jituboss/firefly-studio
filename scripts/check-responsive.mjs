/**
 * Responsive regression check.
 *
 * Asserts that no page scrolls horizontally at phone widths, which is the
 * failure mode that clipped the dashboard off the left edge. Grid and flex
 * items default to min-width:auto, so a chart or a long currency-prefixed
 * amount can widen its track and push the whole page sideways — and it is
 * invisible until someone opens the app on a phone.
 *
 * Needs the app running on :3000 and a valid session cookie:
 *   FS_SESSION=<cookie> pnpm check:responsive
 */
import { chromium } from 'playwright';

const COOKIE = process.env.FS_SESSION ?? '';
const PAGES = [
  '/dashboard',
  '/accounts',
  '/transactions',
  '/accounts/1',
  '/transactions/new',
  '/budgets',
  '/budgets/new',
  '/categories',
  '/bills',
  '/piggy-banks',
  '/piggy-banks/new',
];
const WIDTHS = [360, 390, 768, 1440];

if (!COOKIE) {
  console.error('Set FS_SESSION to a valid session cookie value.');
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([{ name: 'fs_session', value: COOKIE, domain: '127.0.0.1', path: '/' }]);

let failures = 0;

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = [];
    // Anything sticking out past the viewport is what creates sideways scroll.
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
        overflow.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? '').slice(0, 60),
          right: Math.round(r.right),
          left: Math.round(r.left),
        });
      }
    }
    return {
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      scrolls: doc.scrollWidth > window.innerWidth + 1,
      offenders: overflow.slice(0, 4),
    };
  });
}

for (const width of WIDTHS) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 800 });

  for (const path of PAGES) {
    await page.goto(`http://127.0.0.1:3000${path}`, { waitUntil: 'networkidle' });
    const r = await measure(page);
    const status = r.scrolls ? 'OVERFLOW' : 'ok';
    if (r.scrolls) failures++;
    console.log(
      `${String(width).padStart(4)}px ${path.padEnd(20)} scrollW=${String(r.scrollWidth).padStart(5)} vw=${r.innerWidth}  ${status}`,
    );
    for (const o of r.offenders) {
      console.log(`            └─ <${o.tag} class="${o.cls}"> left=${o.left} right=${o.right}`);
    }
  }

  // The reported bug: content clipped once the mobile drawer opens.
  if (width < 1024) {
    await page.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'networkidle' });
    await page.getByLabel('Open navigation').click();
    await page.waitForTimeout(250);
    const r = await measure(page);
    const drawer = await page.locator('aside[aria-label="Main navigation"]').boundingBox();
    const bodyLocked = await page.evaluate(() => getComputedStyle(document.body).overflow);
    if (r.scrolls) failures++;
    console.log(
      `${String(width).padStart(4)}px /dashboard [DRAWER OPEN] scrollW=${r.scrollWidth} vw=${r.innerWidth}  ${r.scrolls ? 'OVERFLOW' : 'ok'}  drawer=${Math.round(drawer?.width ?? 0)}px@x${Math.round(drawer?.x ?? 0)}  body.overflow=${bodyLocked}`,
    );
  }

  await page.close();
}

await browser.close();
console.log(
  failures === 0
    ? '\nRESULT: no horizontal overflow at any tested width'
    : `\nRESULT: ${failures} overflow(s)`,
);
process.exit(failures === 0 ? 0 : 1);
