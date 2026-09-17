import 'dotenv/config';

/**
 * Dev utility: populate the local Firefly III container with a realistic
 * dataset so the dashboard, accounts and transaction views have something to
 * render. Not used in production; see E24-06 for the full fixture.
 *
 *   pnpm firefly:seed
 */

const BASE = process.env.DEV_FIREFLY_URL ?? 'http://127.0.0.1:8080';
const TOKEN = process.env.DEV_FIREFLY_PAT ?? '';

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
  if (!response.ok)
    throw new Error(`${method} ${path} → ${response.status}: ${text.slice(0, 300)}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

const iso = (daysAgo: number) => {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
};

const pick = <T>(items: T[], index: number): T => items[index % items.length]!;

async function main() {
  if (!TOKEN) throw new Error('DEV_FIREFLY_PAT is not set in .env');

  const txCount = await api<{ meta: { pagination?: { total: number } } }>(
    '/v1/transactions?limit=1',
  );
  if ((txCount.meta.pagination?.total ?? 0) > 50) {
    console.log(
      `Instance already has ${txCount.meta.pagination?.total} transactions — nothing to do.`,
    );
    return;
  }

  // Idempotent: reuse anything already present, create only what is missing.
  const existing = await api<{
    data: Array<{ id: string; attributes: { name: string; type: string } }>;
  }>('/v1/accounts?limit=200');
  const byName = new Map(existing.data.map((a) => [a.attributes.name, a.id]));

  async function ensureAccount(payload: Record<string, unknown>): Promise<string> {
    const name = String(payload.name);
    const found = byName.get(name);
    if (found) return found;
    const created = await api<{ data: { id: string } }>('/v1/accounts', 'POST', payload);
    byName.set(name, created.data.id);
    return created.data.id;
  }

  console.log('Creating accounts…');
  const assets: string[] = [];
  for (const [name, role, balance] of [
    ['Everyday Checking', 'defaultAsset', '4820.55'],
    ['Savings', 'savingAsset', '15250.00'],
    ['Credit Card', 'ccAsset', '-640.20'],
  ] as const) {
    assets.push(
      await ensureAccount({
        name,
        type: 'asset',
        account_role: role,
        currency_code: 'EUR',
        opening_balance: balance,
        opening_balance_date: iso(400),
        include_net_worth: true,
        // Firefly requires both of these whenever the role is ccAsset.
        ...(role === 'ccAsset'
          ? { credit_card_type: 'monthlyFull', monthly_payment_date: iso(400) }
          : {}),
      }),
    );
  }

  const expenses: string[] = [];
  for (const name of ['Tesco', 'Shell', 'Netflix', 'Rent BV', 'Cafe Nero', 'Amazon', 'Gym']) {
    expenses.push(await ensureAccount({ name, type: 'expense', currency_code: 'EUR' }));
  }

  const revenueId = await ensureAccount({
    name: 'Acme Corp Salary',
    type: 'revenue',
    currency_code: 'EUR',
  });

  console.log('Creating categories and a budget…');
  const existingCategories = await api<{
    data: Array<{ id: string; attributes: { name: string } }>;
  }>('/v1/categories?limit=200');
  const categoryByName = new Map(existingCategories.data.map((c) => [c.attributes.name, c.id]));

  const categories: string[] = [];
  for (const name of [
    'Groceries',
    'Transport',
    'Subscriptions',
    'Housing',
    'Eating out',
    'Shopping',
  ]) {
    const found = categoryByName.get(name);
    if (found) {
      categories.push(found);
      continue;
    }
    const created = await api<{ data: { id: string } }>('/v1/categories', 'POST', { name });
    categories.push(created.data.id);
  }

  const existingBudgets = await api<{ data: Array<{ id: string; attributes: { name: string } }> }>(
    '/v1/budgets?limit=100',
  );
  let budgetId = existingBudgets.data.find((b) => b.attributes.name === 'Everyday spending')?.id;
  if (!budgetId) {
    const created = await api<{ data: { id: string } }>('/v1/budgets', 'POST', {
      name: 'Everyday spending',
      active: true,
    });
    budgetId = created.data.id;
    await api(`/v1/budgets/${budgetId}/limits`, 'POST', {
      start: iso(30),
      end: iso(0),
      amount: '1200',
      currency_code: 'EUR',
    });
  }

  console.log('Creating a subscription and a savings goal…');
  const existingBills = await api<{ data: Array<{ attributes: { name: string } }> }>(
    '/v1/bills?limit=100',
  );
  const hasBill = existingBills.data.some((b) => b.attributes.name === 'Netflix');
  const existingPiggies = await api<{ data: Array<{ attributes: { name: string } }> }>(
    '/v1/piggy-banks?limit=100',
  );
  const hasPiggy = existingPiggies.data.some((p) => p.attributes.name === 'Holiday fund');
  if (!hasBill) {
    await api('/v1/bills', 'POST', {
      name: 'Netflix',
      amount_min: '12.99',
      amount_max: '15.99',
      currency_code: 'EUR',
      date: iso(60),
      repeat_freq: 'monthly',
      active: true,
    });
  }

  if (!hasPiggy) {
    await api('/v1/piggy-banks', 'POST', {
      name: 'Holiday fund',
      accounts: [{ account_id: assets[1]!, current_amount: '1800' }],
      target_amount: '4000',
      start_date: iso(90),
      target_date: iso(-180),
      transaction_currency_code: 'EUR',
      object_group_title: 'Goals',
    });
  }

  console.log('Creating transactions…');
  const descriptions = [
    'Weekly groceries',
    'Fuel',
    'Netflix subscription',
    'Monthly rent',
    'Flat white',
    'Headphones',
    'Gym membership',
  ];
  const amounts = ['86.40', '62.10', '15.99', '1450.00', '3.80', '129.99', '39.00'];

  let created = 0;
  for (let day = 0; day < 120; day += 1) {
    // Roughly two purchases a day, skipping some days entirely.
    if (day % 3 === 0) continue;
    for (let n = 0; n < 2; n += 1) {
      const index = (day * 2 + n) % descriptions.length;
      await api('/v1/transactions', 'POST', {
        transactions: [
          {
            type: 'withdrawal',
            date: iso(day),
            amount: pick(amounts, index),
            description: pick(descriptions, index),
            source_id: pick(assets, index),
            destination_id: pick(expenses, index),
            category_id: pick(categories, index),
            budget_id: index % 3 === 0 ? budgetId : undefined,
          },
        ],
      });
      created += 1;
    }
  }

  // Salary on the 1st of each of the last four months.
  for (const monthsAgo of [0, 1, 2, 3]) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo, 1);
    await api('/v1/transactions', 'POST', {
      transactions: [
        {
          type: 'deposit',
          date: date.toISOString().slice(0, 10),
          amount: '3850.00',
          description: 'Salary',
          source_id: revenueId,
          destination_id: assets[0]!,
        },
      ],
    });
    created += 1;
  }

  // A split transaction, so the grid's split rendering has a real case.
  await api('/v1/transactions', 'POST', {
    group_title: 'Supermarket run',
    transactions: [
      {
        type: 'withdrawal',
        date: iso(2),
        amount: '54.20',
        description: 'Food',
        source_id: assets[0]!,
        destination_id: expenses[0]!,
        category_id: categories[0]!,
      },
      {
        type: 'withdrawal',
        date: iso(2),
        amount: '18.75',
        description: 'Household',
        source_id: assets[0]!,
        destination_id: expenses[0]!,
        category_id: categories[5]!,
      },
    ],
  });
  created += 1;

  // A transfer between own accounts.
  await api('/v1/transactions', 'POST', {
    transactions: [
      {
        type: 'transfer',
        date: iso(5),
        amount: '500.00',
        description: 'Monthly saving',
        source_id: assets[0]!,
        destination_id: assets[1]!,
      },
    ],
  });
  created += 1;

  console.log(`\nDone. ${created} transactions across ${assets.length} asset accounts.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
