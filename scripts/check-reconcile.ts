/**
 * E14-15 — `pnpm check:reconcile`: assert the report totals equal Firefly's
 * own figures, to the cent, against a live instance.
 *
 *   FIREFLY_URL=http://localhost:8080 FIREFLY_PAT=… pnpm check:reconcile
 *
 * (DEV_FIREFLY_URL / DEV_FIREFLY_PAT from .env work too.) Exits 1 on any
 * mismatch. Like `check:a11y`, it needs a running, seeded instance, so it runs
 * on demand rather than in CI. What it compares, and why tags are excluded, is
 * in lib/report-reconcile.ts.
 */
import 'dotenv/config';
import { reconcile, type SummaryLike } from '@/lib/report-reconcile';
import type { InsightLike } from '@/lib/reports';

const BASE = (process.env.FIREFLY_URL ?? process.env.DEV_FIREFLY_URL ?? '').replace(/\/+$/, '');
const TOKEN = (process.env.FIREFLY_PAT ?? process.env.DEV_FIREFLY_PAT ?? '').trim();

if (!BASE || !TOKEN) {
  console.error('Set FIREFLY_URL and FIREFLY_PAT (or DEV_FIREFLY_URL / DEV_FIREFLY_PAT).');
  process.exit(2);
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`${path} → HTTP ${response.status}`);
  return (await response.json()) as T;
}

const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Calendar ranges as plain strings — the whole point is to avoid a timezone. */
function ranges(): Array<{ label: string; start: string; end: string }> {
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth() + 1;
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  return [
    { label: 'This month', start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${lastDay(y, m)}` },
    {
      label: 'Last month',
      start: `${prevY}-${pad(prevM)}-01`,
      end: `${prevY}-${pad(prevM)}-${lastDay(prevY, prevM)}`,
    },
    { label: 'This year', start: `${y}-01-01`, end: `${y}-12-31` },
    { label: 'Last year', start: `${y - 1}-01-01`, end: `${y - 1}-12-31` },
  ];
}

async function main() {
  const currency =
    process.argv[2]?.toUpperCase() ??
    (await get<{ data: { attributes: { code: string } } }>('/currencies/primary')).data.attributes
      .code;

  let failures = 0;
  for (const range of ranges()) {
    const q = `?start=${range.start}&end=${range.end}`;
    const insight = (path: string) => get<InsightLike[]>(`/insight/${path}${q}`);
    const [summary, expenseTotal, incomeTotal, ...parts] = await Promise.all([
      get<Record<string, SummaryLike>>(`/summary/basic${q}`),
      insight('expense/total'),
      insight('income/total'),
      insight('expense/category'),
      insight('expense/no-category'),
      insight('expense/budget'),
      insight('expense/no-budget'),
      insight('expense/bill'),
      insight('expense/no-bill'),
      insight('expense/expense'),
      insight('expense/asset'),
      insight('income/category'),
      insight('income/no-category'),
      insight('income/revenue'),
      insight('income/asset'),
    ]);
    const [cat, noCat, bud, noBud, bill, noBill, payee, asset, iCat, iNoCat, source, iAsset] =
      parts;

    const checks = reconcile({
      currency,
      summary,
      expenseTotal,
      incomeTotal,
      expensePartitions: {
        category: [cat!, noCat!],
        budget: [bud!, noBud!],
        subscription: [bill!, noBill!],
        'expense account': [payee!],
        'asset account': [asset!],
      },
      incomePartitions: {
        category: [iCat!, iNoCat!],
        'revenue account': [source!],
        'asset account': [iAsset!],
      },
    });

    console.log(`\n${range.label} (${range.start} → ${range.end}, ${currency})`);
    for (const c of checks) {
      const mark = c.ok ? '✓' : '✗';
      const detail = c.ok ? c.ours : `ours ${c.ours} · Firefly ${c.theirs}`;
      console.log(`  ${mark} ${c.name.padEnd(42)} ${detail}`);
      if (!c.ok) failures += 1;
    }
  }

  console.log(failures === 0 ? '\nAll figures reconcile.' : `\n${failures} mismatch(es).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
});
