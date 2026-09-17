import { describe, expect, it } from 'vitest';
import { buildBalanceTrend, type BalanceSeriesInput } from '@/lib/balance-trend';

const series = (
  label: string,
  currency: string | null,
  entries: Record<string, string>,
): BalanceSeriesInput => ({ label, currency_code: currency, entries });

describe('buildBalanceTrend', () => {
  it('sums accounts per date into a single total line', () => {
    const trend = buildBalanceTrend(
      [
        series('Checking', 'EUR', { '2026-08-01': '100.00', '2026-08-02': '150.00' }),
        series('Savings', 'EUR', { '2026-08-01': '900.00', '2026-08-02': '900.00' }),
      ],
      'EUR',
    );

    expect(trend.points).toHaveLength(2);
    expect(trend.points[0]).toMatchObject({ date: '2026-08-01', total: 1000 });
    expect(trend.points[1]).toMatchObject({ date: '2026-08-02', total: 1050 });
    expect(trend.opening).toBe(1000);
    expect(trend.closing).toBe(1050);
    expect(trend.change).toBe(50);
    expect(trend.changePercent).toBeCloseTo(5, 5);
  });

  it('never sums across currencies, and reports what it excluded', () => {
    // The whole reason this module exists: Firefly returns no conversion data
    // (pc_entries comes back empty), so a mixed-currency total would be fiction.
    const trend = buildBalanceTrend(
      [
        series('BDT Wallet', 'BDT', { '2026-08-01': '1000.00' }),
        series('USD Wallet', 'USD', { '2026-08-01': '500.00' }),
      ],
      'BDT',
    );

    expect(trend.currency).toBe('BDT');
    expect(trend.points[0]?.total).toBe(1000);
    expect(trend.includedAccounts).toBe(1);
    expect(trend.excludedAccounts).toBe(1);
    expect(trend.excludedCurrencies).toEqual(['USD']);
  });

  it('falls back to the most common currency when none match the preference', () => {
    const trend = buildBalanceTrend(
      [
        series('A', 'EUR', { '2026-08-01': '10.00' }),
        series('B', 'EUR', { '2026-08-01': '20.00' }),
        series('C', 'USD', { '2026-08-01': '999.00' }),
      ],
      'BDT',
    );

    expect(trend.currency).toBe('EUR');
    expect(trend.points[0]?.total).toBe(30);
    expect(trend.excludedCurrencies).toEqual(['USD']);
  });

  it('keeps the six largest accounts and rolls the rest into Other', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      series(`Account ${i}`, 'EUR', { '2026-08-01': String((i + 1) * 100) }),
    );

    const trend = buildBalanceTrend(many, 'EUR');
    const other = trend.accounts.find((a) => a.aggregated);

    expect(trend.accounts).toHaveLength(7);
    expect(trend.accounts.filter((a) => !a.aggregated)).toHaveLength(6);
    // Smallest three (100 + 200 + 300) are the ones rolled up.
    expect(other?.closing).toBe(600);
    // The total still covers every account, not just the drawn ones.
    expect(trend.points[0]?.total).toBe(4500);
  });

  it('ranks by absolute balance so a large debt is not treated as trivial', () => {
    const trend = buildBalanceTrend(
      [
        series('Small', 'EUR', { '2026-08-01': '50.00' }),
        series('Big debt', 'EUR', { '2026-08-01': '-9000.00' }),
      ],
      'EUR',
    );

    expect(trend.accounts[0]?.label).toBe('Big debt');
    expect(trend.points[0]?.total).toBe(-8950);
  });

  it('treats a missing date on one account as no change, not as a gap', () => {
    const trend = buildBalanceTrend(
      [
        series('Checking', 'EUR', { '2026-08-01': '100.00', '2026-08-02': '100.00' }),
        series('Sparse', 'EUR', { '2026-08-02': '25.00' }),
      ],
      'EUR',
    );

    expect(trend.points[0]?.total).toBe(100);
    expect(trend.points[1]?.total).toBe(125);
  });

  it('returns a null percentage when the opening balance is zero', () => {
    const trend = buildBalanceTrend(
      [series('New', 'EUR', { '2026-08-01': '0.00', '2026-08-02': '500.00' })],
      'EUR',
    );

    expect(trend.change).toBe(500);
    expect(trend.changePercent).toBeNull();
  });

  it('reports a negative percentage correctly when balances fall from a debt', () => {
    // Opening -200 -> closing -100 is an improvement of +50%, not -50%:
    // the denominator must be the absolute opening balance.
    const trend = buildBalanceTrend(
      [series('Card', 'EUR', { '2026-08-01': '-200.00', '2026-08-02': '-100.00' })],
      'EUR',
    );

    expect(trend.change).toBe(100);
    expect(trend.changePercent).toBeCloseTo(50, 5);
  });

  it('excludes accounts the user flagged out of net worth', () => {
    // Real-ledger bug this guards: the chart summed an excluded account and
    // showed 7.9M beside a Net worth tile reading 3.2M.
    const trend = buildBalanceTrend(
      [
        series('Bank', 'BDT', { '2026-08-01': '3269202.00' }),
        series('Salary Due', 'BDT', { '2026-08-01': '4675611.00' }),
      ],
      'BDT',
      { excludeLabels: new Set(['Salary Due']) },
    );

    expect(trend.points[0]?.total).toBe(3269202);
    expect(trend.excludedFromNetWorth).toBe(1);
    expect(trend.accounts.map((a) => a.label)).toEqual(['Bank']);
  });

  it('survives an empty response', () => {
    const trend = buildBalanceTrend([], 'EUR');
    expect(trend.points).toEqual([]);
    expect(trend.accounts).toEqual([]);
    expect(trend.closing).toBe(0);
  });

  it('accepts ISO datetime keys and normalises them to plain dates', () => {
    const trend = buildBalanceTrend(
      [series('Checking', 'EUR', { '2026-08-01T00:00:00+00:00': '42.00' })],
      'EUR',
    );

    expect(trend.points[0]?.date).toBe('2026-08-01');
  });

  it('does not lose precision when summing repeating decimals', () => {
    const trend = buildBalanceTrend(
      [series('A', 'EUR', { '2026-08-01': '0.1' }), series('B', 'EUR', { '2026-08-01': '0.2' })],
      'EUR',
    );

    expect(trend.points[0]?.total).toBe(0.3);
  });
});

describe('summariseNetWorth', () => {
  const account = (
    name: string,
    type: string,
    balance: string,
    extra: Record<string, unknown> = {},
  ) =>
    ({
      id: name,
      type: 'accounts',
      attributes: {
        name,
        type,
        current_balance: balance,
        currency_code: 'BDT',
        active: true,
        include_net_worth: true,
        account_role: null,
        liability_type: null,
        ...extra,
      },
    }) as never;

  it('sums signed balances rather than subtracting liabilities', async () => {
    // Verified against a live ledger: Firefly signs liability balances itself
    // (a card you owe on is already negative), and a straight sum of every
    // eligible account reproduced /summary/basic net worth to the cent.
    // Subtracting liabilities would double the sign and turn debt into wealth.
    const { summariseNetWorth } = await import('@/lib/account-summary');
    const summary = summariseNetWorth(
      [account('Bank', 'asset', '1000.00'), account('Card', 'liabilities', '-250.00')],
      'BDT',
    );

    expect(summary.assets).toBe('1000');
    expect(summary.liabilities).toBe('-250');
    expect(summary.netWorth).toBe('750');
  });

  it('skips archived and opted-out accounts, matching Firefly net worth', async () => {
    const { summariseNetWorth } = await import('@/lib/account-summary');
    const summary = summariseNetWorth(
      [
        account('Bank', 'asset', '1000.00'),
        account('Archived', 'asset', '500.00', { active: false }),
        account('Opted out', 'asset', '900.00', { include_net_worth: false }),
      ],
      'BDT',
    );

    expect(summary.netWorth).toBe('1000');
    expect(summary.excludedAccounts).toBe(2);
  });

  it('never folds a foreign currency into the headline figure', async () => {
    const { summariseNetWorth } = await import('@/lib/account-summary');
    const summary = summariseNetWorth(
      [
        account('BDT Bank', 'asset', '1000.00'),
        account('USD Bank', 'asset', '500.00', { currency_code: 'USD' }),
      ],
      'BDT',
    );

    expect(summary.netWorth).toBe('1000');
    expect(summary.otherCurrencies).toEqual([{ currency: 'USD', amount: '500' }]);
  });

  it('ignores payees, income sources and Firefly internals', async () => {
    const { summariseNetWorth } = await import('@/lib/account-summary');
    const summary = summariseNetWorth(
      [
        account('Bank', 'asset', '1000.00'),
        account('Amazon', 'expense', '50000.00'),
        account('Employer', 'revenue', '-900000.00'),
        account('Recon', 'reconciliation', '1234.00'),
      ],
      'BDT',
    );

    expect(summary.netWorth).toBe('1000');
    expect(summary.countedAccounts).toBe(1);
  });
});

describe('accountBucket / roleLabel', () => {
  it('separates the user money from merchants, employers and bookkeeping', async () => {
    const { accountBucket } = await import('@/lib/account-summary');
    expect(accountBucket('asset')).toBe('money');
    expect(accountBucket('liabilities')).toBe('money');
    expect(accountBucket('cash')).toBe('money');
    expect(accountBucket('expense')).toBe('payee');
    expect(accountBucket('revenue')).toBe('income');
    expect(accountBucket('reconciliation')).toBe('internal');
    expect(accountBucket('initial-balance')).toBe('internal');
  });

  it('translates Firefly role enums into words a person would use', async () => {
    const { roleLabel } = await import('@/lib/account-summary');
    const make = (type: string, extra: Record<string, unknown>) =>
      ({ id: 'x', type: 'accounts', attributes: { type, ...extra } }) as never;

    expect(roleLabel(make('asset', { account_role: 'defaultAsset' }))).toBe('Checking');
    expect(roleLabel(make('asset', { account_role: 'savingAsset' }))).toBe('Savings');
    expect(roleLabel(make('asset', { account_role: 'cashWalletAsset' }))).toBe('Cash wallet');
    expect(roleLabel(make('liabilities', { liability_type: 'loan' }))).toBe('Loan');
    expect(roleLabel(make('liabilities', { liability_type: 'creditcard' }))).toBe('Credit card');
  });
});
