/**
 * E2-26 — build the demo ledger.
 *
 *   pnpm demo:seed          create or top up the demo data
 *   pnpm demo:seed --reset  wipe the ledger first, then rebuild it
 *
 * Deliberately separate from `scripts/seed-firefly.ts`, which is a developer
 * convenience that makes a page render. This one is a shop window: it has to
 * produce something a stranger reads as a real financial life, which means
 * THREE YEARS of history, because the things worth showing off — the net-worth
 * chart, the year-over-year report, the cash-flow Sankey, budget pacing — all
 * plot time and have nothing to say about a fortnight of data.
 *
 * Deterministic, not random: a seeded generator, so two runs produce the same
 * ledger and a screenshot taken today still matches the demo next month.
 *
 * Reads FIREFLY_URL and FIREFLY_PAT (falling back to the DEV_* names used by
 * the local stack), and DEMO_CURRENCY (default EUR), which it also makes the
 * instance's primary currency.
 */
const BASE = (process.env.FIREFLY_URL ?? process.env.DEV_FIREFLY_URL ?? 'http://127.0.0.1:8080')
  .trim()
  .replace(/\/+$/, '');
const TOKEN = (process.env.FIREFLY_PAT ?? process.env.DEV_FIREFLY_PAT ?? '').trim();
const RESET = process.argv.includes('--reset');

/*
 * The currency the demo is denominated in, and the one the instance is told to
 * treat as primary.
 *
 * Both halves matter. The app's KPI tiles read `/summary/basic`, which is keyed
 * by the connection's primary currency — so a ledger seeded in EUR on an
 * instance whose primary is BDT shows a dashboard of zeroes, with every figure
 * present and none of them found. Setting it here makes the demo correct on
 * whatever instance it is pointed at.
 *
 * The scale exists because 3,850 is a monthly salary in euros and a takeaway in
 * taka. Rough purchasing-power multipliers, not exchange rates: the point is
 * that the numbers read as plausible, not that they convert.
 */
const CURRENCY = (process.env.DEMO_CURRENCY ?? 'EUR').toUpperCase();
const SCALE: Record<string, number> = { EUR: 1, USD: 1.1, GBP: 0.85, BDT: 130, INR: 90, JPY: 160 };
const scale = SCALE[CURRENCY] ?? 1;

async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      accept: 'application/vnd.api+json',
      'content-type': 'application/json',
      authorization: `Bearer ${TOKEN}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/**
 * Mulberry32. A demo that reshuffles itself on every reset is a demo whose
 * screenshots rot, and whose "what changed since yesterday" figures are noise.
 */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = rng(20260920);
const between = (min: number, max: number) => min + random() * (max - min);
/** Scaled into the demo currency, then rounded to something a person would see. */
const money = (value: number) => {
  const scaled = value * scale;
  return (scaled >= 1000 ? Math.round(scaled) : scaled).toFixed(2);
};
const day = (date: Date) => date.toISOString().slice(0, 10);

/** Months back from today, oldest first, first of each month. */
function months(count: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    out.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)));
  }
  return out;
}

function dayIn(month: Date, dayOfMonth: number): string {
  const last = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  return day(
    new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), Math.min(dayOfMonth, last))),
  );
}

const MONTHS_OF_HISTORY = 36;

interface Named {
  id: string;
  name: string;
}

async function main() {
  if (!TOKEN) throw new Error('FIREFLY_PAT is not set (or DEV_FIREFLY_PAT for the local stack).');

  // /v1/about has no `attributes` envelope — it is `data.version` directly,
  // unlike every resource endpoint. Assuming the usual shape crashes here.
  const about = await api<{ data: { version: string } }>('/v1/about');
  console.log(`Seeding demo data into Firefly III ${about.data.version} at ${BASE}`);

  if (RESET) {
    // Order matters: transactions reference everything else.
    // Accounts last: destroying them takes their transactions with them, and
    // leaving them behind means a previous seed's accounts sit in the demo
    // next to this one's, which is how "7 EUR accounts" appears on a ledger
    // that defines five.
    for (const object of [
      'transactions',
      'budgets',
      'categories',
      'bills',
      'piggy_banks',
      'tags',
      'accounts',
    ]) {
      await api(`/v1/data/destroy?objects=${object}`, 'DELETE').catch((error: unknown) => {
        console.warn(`  could not destroy ${object}: ${(error as Error).message.slice(0, 120)}`);
      });
    }
    console.log('  cleared the existing ledger');
  }

  const existing = await api<{ meta: { pagination?: { total: number } } }>(
    '/v1/transactions?limit=1',
  );
  const already = existing.meta.pagination?.total ?? 0;
  if (!RESET && already > 100) {
    console.log(`Instance already has ${already} transactions — pass --reset to rebuild.`);
    return;
  }

  const currency = CURRENCY;

  // Enable it and make it primary, in that order — Firefly refuses to make a
  // disabled currency primary. Both need a content-type header even with no
  // body: without one they answer 415 rather than doing anything.
  for (const path of [`/v1/currencies/${currency}/enable`, `/v1/currencies/${currency}/primary`]) {
    await api(path, 'POST', {}).catch((error: unknown) =>
      console.warn(`  ${path}: ${(error as Error).message.slice(0, 120)}`),
    );
  }
  console.log(`  currency: ${currency} (enabled, primary)`);

  // --- accounts -------------------------------------------------------------
  const accountIndex = new Map<string, string>();
  const accounts = await api<{ data: Array<{ id: string; attributes: { name: string } }> }>(
    '/v1/accounts?limit=300',
  );
  for (const account of accounts.data) accountIndex.set(account.attributes.name, account.id);

  async function ensureAccount(payload: Record<string, unknown>): Promise<Named> {
    const name = String(payload.name);
    const found = accountIndex.get(name);
    if (found) return { id: found, name };
    const created = await api<{ data: { id: string } }>('/v1/accounts', 'POST', {
      currency_code: currency,
      ...payload,
    });
    accountIndex.set(name, created.data.id);
    return { id: created.data.id, name };
  }

  const current = await ensureAccount({
    name: 'Everyday Current',
    type: 'asset',
    account_role: 'defaultAsset',
    opening_balance: '2400.00',
    opening_balance_date: day(months(MONTHS_OF_HISTORY)[0]!),
  });
  const savings = await ensureAccount({
    name: 'Emergency Savings',
    type: 'asset',
    account_role: 'savingAsset',
    opening_balance: '6000.00',
    opening_balance_date: day(months(MONTHS_OF_HISTORY)[0]!),
  });
  const card = await ensureAccount({
    name: 'Everyday Credit Card',
    type: 'asset',
    account_role: 'ccAsset',
    // Firefly 422s on a credit-card role without these two — see LEARNING.md §7.
    credit_card_type: 'monthlyFull',
    monthly_payment_date: day(months(MONTHS_OF_HISTORY)[0]!),
    opening_balance: '0.00',
    opening_balance_date: day(months(MONTHS_OF_HISTORY)[0]!),
  });
  const mortgage = await ensureAccount({
    name: 'Home Mortgage',
    type: 'liability',
    liability_type: 'mortgage',
    liability_direction: 'credit',
    interest: '3.4',
    interest_period: 'yearly',
    opening_balance: '-184000.00',
    opening_balance_date: day(months(MONTHS_OF_HISTORY)[0]!),
  });

  /*
   * The property the mortgage is against.
   *
   * Without it the demo opens on a net worth of -€90,000: correct double-entry
   * — the debt is real and the asset was missing — but a strange first thing
   * to show someone. With it, net worth is positive and RISING, which is both
   * the honest picture of this fictional person and the one worth looking at.
   */
  await ensureAccount({
    name: 'Family Home',
    type: 'asset',
    account_role: 'savingAsset',
    opening_balance: '289000.00',
    opening_balance_date: day(months(MONTHS_OF_HISTORY)[0]!),
  });

  const employer = await ensureAccount({ name: 'Northwind Trading', type: 'revenue' });
  const merchants: Record<string, Named> = {};
  for (const name of [
    'Kaufland',
    'Rewe',
    'Shell',
    'Deutsche Bahn',
    'Netflix',
    'Spotify',
    'Vodafone',
    'Stadtwerke',
    'Rent BV',
    'Apotheke',
    'IKEA',
    'Zalando',
    'Café Nero',
    'Trattoria Via Roma',
    'Lufthansa',
    'Booking.com',
    'Amazon',
    'Fitness First',
  ]) {
    merchants[name] = await ensureAccount({ name, type: 'expense' });
  }
  console.log(`  accounts: ${accountIndex.size}`);

  // --- categories, budgets, bills, piggy banks, tags -------------------------
  const categoryIndex = new Map<string, string>();
  const categories = await api<{ data: Array<{ id: string; attributes: { name: string } }> }>(
    '/v1/categories?limit=200',
  );
  for (const c of categories.data) categoryIndex.set(c.attributes.name, c.id);

  async function ensureCategory(name: string): Promise<string> {
    const found = categoryIndex.get(name);
    if (found) return found;
    const created = await api<{ data: { id: string } }>('/v1/categories', 'POST', { name });
    categoryIndex.set(name, created.data.id);
    return created.data.id;
  }

  for (const name of [
    'Groceries',
    'Housing',
    'Utilities',
    'Transport',
    'Subscriptions',
    'Eating out',
    'Health',
    'Shopping',
    'Holidays',
    'Income',
  ]) {
    await ensureCategory(name);
  }
  console.log(`  categories: ${categoryIndex.size}`);

  const budgetIndex = new Map<string, string>();
  const budgets = await api<{ data: Array<{ id: string; attributes: { name: string } }> }>(
    '/v1/budgets?limit=100',
  );
  for (const b of budgets.data) budgetIndex.set(b.attributes.name, b.id);

  const BUDGETS: Array<[string, number]> = [
    ['Everyday spending', 850],
    ['Transport', 220],
    ['Eating out', 180],
    ['Shopping', 200],
  ];
  for (const [name, amount] of BUDGETS) {
    if (!budgetIndex.has(name)) {
      const created = await api<{ data: { id: string } }>('/v1/budgets', 'POST', { name });
      budgetIndex.set(name, created.data.id);
    }
    // A limit per month, so budget pacing has something to pace against.
    for (const month of months(6)) {
      const start = day(month);
      const end = day(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)));
      await api(`/v1/budgets/${budgetIndex.get(name)}/limits`, 'POST', {
        start,
        end,
        amount: money(amount),
        currency_code: currency,
      }).catch(() => undefined);
    }
  }
  console.log(`  budgets: ${budgetIndex.size} with monthly limits`);

  const bills = await api<{ data: Array<{ attributes: { name: string } }> }>('/v1/bills?limit=100');
  const billNames = new Set(bills.data.map((b) => b.attributes.name));
  const BILLS: Array<[string, number, string]> = [
    ['Rent', 1150, 'monthly'],
    ['Mobile', 29.99, 'monthly'],
    ['Electricity', 78, 'monthly'],
    ['Netflix', 13.99, 'monthly'],
    ['Spotify', 10.99, 'monthly'],
    ['Gym', 39, 'monthly'],
  ];
  for (const [name, amount, period] of BILLS) {
    if (billNames.has(name)) continue;
    await api('/v1/bills', 'POST', {
      name,
      amount_min: money(amount * 0.95),
      amount_max: money(amount * 1.05),
      date: dayIn(months(2)[0]!, 1),
      repeat_freq: period,
      currency_code: currency,
      active: true,
    });
  }
  console.log(`  subscriptions: ${BILLS.length}`);

  const piggies = await api<{ data: Array<{ attributes: { name: string } }> }>(
    '/v1/piggy-banks?limit=100',
  );
  const piggyNames = new Set(piggies.data.map((p) => p.attributes.name));
  for (const [name, target, saved] of [
    ['New kitchen', 8000, 5200],
    ['Japan 2027', 6000, 1850],
    ['Car replacement', 12000, 9400],
  ] as Array<[string, number, number]>) {
    if (piggyNames.has(name)) continue;
    await api('/v1/piggy-banks', 'POST', {
      name,
      // Two fields the spec does not mark required and Firefly 422s without:
      // a currency, and a start date.
      transaction_currency_code: currency,
      start_date: day(months(12)[0]!),
      target_amount: money(target),
      accounts: [{ id: savings.id, current_amount: money(saved) }],
    }).catch((error: unknown) =>
      console.warn(`  piggy "${name}": ${(error as Error).message.slice(0, 120)}`),
    );
  }
  console.log('  piggy banks: 3');

  // --- three years of transactions ------------------------------------------
  const timeline = months(MONTHS_OF_HISTORY);
  const groceries = [merchants.Kaufland!, merchants.Rewe!];
  const eatingOut = [merchants['Café Nero']!, merchants['Trattoria Via Roma']!];
  const shopping = [merchants.Amazon!, merchants.Zalando!, merchants.IKEA!];

  type Split = Record<string, unknown>;
  const batch: Array<{ transactions: Split[] }> = [];

  const push = (split: Split) => batch.push({ transactions: [split] });

  timeline.forEach((month, index) => {
    // Salary, rising a little each year, paid on the 25th.
    const raise = 1 + Math.floor(index / 12) * 0.035;
    push({
      type: 'deposit',
      date: dayIn(month, 25),
      amount: money(3850 * raise),
      description: 'Salary',
      source_id: employer.id,
      destination_id: current.id,
      category_name: 'Income',
      currency_code: currency,
    });

    // The fixed monthly life.
    for (const [name, amount, merchant, category, budget] of [
      ['Rent', 1150, merchants['Rent BV']!, 'Housing', undefined],
      ['Electricity', 78 + between(-9, 14), merchants.Stadtwerke!, 'Utilities', undefined],
      ['Mobile', 29.99, merchants.Vodafone!, 'Utilities', undefined],
      ['Netflix subscription', 13.99, merchants.Netflix!, 'Subscriptions', undefined],
      ['Spotify', 10.99, merchants.Spotify!, 'Subscriptions', undefined],
      ['Gym membership', 39, merchants['Fitness First']!, 'Health', undefined],
    ] as Array<[string, number, Named, string, string | undefined]>) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 1 + Math.floor(between(0, 4))),
        amount: money(amount),
        description: name,
        source_id: current.id,
        destination_id: merchant.id,
        category_name: category,
        ...(budget ? { budget_name: budget } : {}),
        currency_code: currency,
      });
    }

    // Groceries, weekly-ish, on the card.
    for (let week = 0; week < 4; week += 1) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 3 + week * 7),
        amount: money(between(48, 121)),
        description: 'Groceries',
        source_id: card.id,
        destination_id: groceries[week % groceries.length]!.id,
        category_name: 'Groceries',
        budget_name: 'Everyday spending',
        currency_code: currency,
      });
    }

    // Fuel and transport.
    for (let trip = 0; trip < 2; trip += 1) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 8 + trip * 11),
        amount: money(between(42, 78)),
        description: trip === 0 ? 'Fuel' : 'Rail ticket',
        source_id: current.id,
        destination_id: (trip === 0 ? merchants.Shell! : merchants['Deutsche Bahn']!).id,
        category_name: 'Transport',
        budget_name: 'Transport',
        currency_code: currency,
      });
    }

    // Eating out and shopping, varying in count so the months are not clones.
    const outings = 2 + Math.floor(between(0, 3));
    for (let i = 0; i < outings; i += 1) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 5 + i * 6),
        amount: money(between(11, 68)),
        description: i % 2 === 0 ? 'Coffee and cake' : 'Dinner out',
        source_id: card.id,
        destination_id: eatingOut[i % eatingOut.length]!.id,
        category_name: 'Eating out',
        budget_name: 'Eating out',
        currency_code: currency,
      });
    }
    if (random() > 0.35) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 14),
        amount: money(between(25, 240)),
        description: 'Online order',
        source_id: card.id,
        destination_id: shopping[index % shopping.length]!.id,
        category_name: 'Shopping',
        budget_name: 'Shopping',
        currency_code: currency,
      });
    }

    // Card paid off, savings topped up, mortgage paid down: the transfers that
    // make the net-worth chart move rather than drift.
    push({
      type: 'transfer',
      date: dayIn(month, 27),
      amount: money(between(320, 520)),
      description: 'To savings',
      source_id: current.id,
      destination_id: savings.id,
      currency_code: currency,
    });
    // A withdrawal, NOT a transfer. Firefly 6.5.5 refuses a liability as a
    // transfer destination ("could not find a valid destination account"),
    // and paying debt down is modelled as money leaving an asset account
    // towards the liability. Checked against a live instance; all 36 of these
    // failed as transfers.
    push({
      type: 'withdrawal',
      date: dayIn(month, 28),
      amount: money(742.18),
      description: 'Mortgage payment',
      source_id: current.id,
      destination_id: mortgage.id,
      category_name: 'Housing',
      currency_code: currency,
    });

    // One holiday a year, in July, tagged so the tag report has something.
    if (month.getUTCMonth() === 6) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 12),
        amount: money(between(780, 1450)),
        description: 'Flights',
        source_id: card.id,
        destination_id: merchants.Lufthansa!.id,
        category_name: 'Holidays',
        tags: ['holiday', `summer-${month.getUTCFullYear()}`],
        currency_code: currency,
      });
      push({
        type: 'withdrawal',
        date: dayIn(month, 13),
        amount: money(between(600, 1200)),
        description: 'Hotel',
        source_id: card.id,
        destination_id: merchants['Booking.com']!.id,
        category_name: 'Holidays',
        tags: ['holiday', `summer-${month.getUTCFullYear()}`],
        currency_code: currency,
      });
    }

    // An occasional medical bill, so Health is not a dead category.
    if (index % 5 === 0) {
      push({
        type: 'withdrawal',
        date: dayIn(month, 19),
        amount: money(between(18, 96)),
        description: 'Pharmacy',
        source_id: current.id,
        destination_id: merchants.Apotheke!.id,
        category_name: 'Health',
        currency_code: currency,
      });
    }
  });

  console.log(`  posting ${batch.length} transactions across ${MONTHS_OF_HISTORY} months…`);
  let posted = 0;
  let failed = 0;
  // Sequential on purpose: Firefly's rate limiter and its SQLite-ish write
  // behaviour both dislike a hundred parallel POSTs, and a demo seed that
  // half-fails is worse than one that takes a minute.
  for (const transaction of batch) {
    try {
      await api('/v1/transactions', 'POST', transaction);
      posted += 1;
      if (posted % 100 === 0) console.log(`    ${posted}/${batch.length}`);
    } catch (error) {
      failed += 1;
      if (failed <= 3) console.warn(`    failed: ${(error as Error).message.slice(0, 160)}`);
    }
  }

  console.log(`\nDone. ${posted} transactions posted${failed ? `, ${failed} failed` : ''}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
