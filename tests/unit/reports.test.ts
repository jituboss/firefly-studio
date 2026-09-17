import { describe, expect, it } from 'vitest';
import {
  buildAccountReport,
  buildBillReport,
  buildBreakdown,
  buildBudgetReport,
  buildCashFlow,
  buildMonthlyGrid,
  buildNetWorth,
  chooseReportCurrency,
  delta,
  insightTotal,
  type InsightLike,
  type NetWorthAccountMeta,
} from '@/lib/reports';

/**
 * The reporting arithmetic. Every case below is one of the Firefly behaviours
 * documented in `lib/reports.ts` — they were verified against a live instance
 * when the module was written, and these pin them so a refactor cannot quietly
 * undo one.
 */

const entry = (over: Partial<InsightLike> & { difference: string }): InsightLike => ({
  currency_code: 'EUR',
  ...over,
});

describe('chooseReportCurrency', () => {
  it('prefers the requested currency when it is present', () => {
    expect(
      chooseReportCurrency(
        [entry({ difference: '-5', currency_code: 'USD' }), entry({ difference: '-1000' })],
        'EUR',
      ),
    ).toBe('EUR');
  });

  it('falls back to the largest figure, not the first one listed', () => {
    // Key-order dependence is the bug class this exists to prevent.
    expect(
      chooseReportCurrency(
        [
          entry({ difference: '-5', currency_code: 'USD' }),
          entry({ difference: '-1000', currency_code: 'BDT' }),
        ],
        'EUR',
      ),
    ).toBe('BDT');
  });

  it('returns the preferred currency when there is nothing to choose from', () => {
    expect(chooseReportCurrency([], 'GBP')).toBe('GBP');
  });
});

describe('buildBreakdown', () => {
  it('reports expenses as positive magnitudes', () => {
    // Firefly sends spending negative; a report shows it next to income.
    const { rows, total } = buildBreakdown(
      [entry({ id: '1', name: 'Food', difference: '-25.50' })],
      'EUR',
    );
    expect(rows[0]).toMatchObject({ name: 'Food', amount: '25.5' });
    expect(total).toBe('25.5');
  });

  it('never adds two currencies together, and says which it left out', () => {
    const result = buildBreakdown(
      [
        entry({ id: '1', name: 'Food', difference: '-100' }),
        entry({ id: '2', name: 'Rent', difference: '-900', currency_code: 'USD' }),
      ],
      'EUR',
    );
    expect(result.total).toBe('100');
    expect(result.otherCurrencies).toEqual(['USD']);
  });

  it('merges the rows Firefly splits per currency by id', () => {
    // One resource appears once per currency, with the same id.
    const result = buildBreakdown(
      [
        entry({ id: '7', name: 'Food', difference: '-10' }),
        entry({ id: '7', name: 'Food', difference: '-15' }),
      ],
      'EUR',
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.amount).toBe('25');
  });

  it('ranks largest first and computes each share of the total', () => {
    const { rows } = buildBreakdown(
      [
        entry({ id: '1', name: 'Small', difference: '-25' }),
        entry({ id: '2', name: 'Big', difference: '-75' }),
      ],
      'EUR',
    );
    expect(rows.map((r) => r.name)).toEqual(['Big', 'Small']);
    expect(rows[0]?.percent).toBeCloseTo(75);
    expect(rows[1]?.percent).toBeCloseTo(25);
  });

  it('rolls everything past the limit into one "Other" row', () => {
    const { rows } = buildBreakdown(
      ['a', 'b', 'c', 'd'].map((name, index) =>
        entry({ id: String(index), name, difference: `-${10 - index}` }),
      ),
      'EUR',
      { limit: 2 },
    );
    expect(rows).toHaveLength(3);
    expect(rows[2]).toMatchObject({ name: 'Other (2)', amount: '15' });
  });

  it('drops zero rows, which Firefly returns freely', () => {
    const { rows } = buildBreakdown(
      [
        entry({ id: '1', name: 'Nothing', difference: '0' }),
        entry({ id: '2', name: 'Real', difference: '-5' }),
      ],
      'EUR',
    );
    expect(rows.map((r) => r.name)).toEqual(['Real']);
  });

  it('names an entry that arrives without one', () => {
    expect(buildBreakdown([entry({ difference: '-1' })], 'EUR').rows[0]?.name).toBe('Unnamed');
  });
});

describe('insightTotal', () => {
  it('sums only the requested currency, as a magnitude', () => {
    expect(
      insightTotal(
        [entry({ difference: '-100' }), entry({ difference: '-50', currency_code: 'USD' })],
        'EUR',
      ),
    ).toBe('100');
  });

  it('is case-insensitive about the currency code', () => {
    expect(insightTotal([entry({ difference: '-7', currency_code: 'eur' })], 'EUR')).toBe('7');
  });
});

describe('delta', () => {
  it('reports the change and its percentage', () => {
    expect(delta('150', '100')).toEqual({ absolute: '50', percent: 50 });
  });

  it('refuses a percentage against a zero baseline', () => {
    // Dividing by zero here would render "Infinity%".
    expect(delta('50', '0')).toEqual({ absolute: '50', percent: null });
  });

  it('measures against the magnitude, so a shrinking debt reads as positive', () => {
    expect(delta('-50', '-100')).toMatchObject({ absolute: '50', percent: 50 });
  });
});

describe('buildCashFlow', () => {
  const series = [
    {
      label: 'earned',
      currency_code: 'EUR',
      entries: { '2026-01-01T00:00:00+00:00': '1000', '2026-02-01T00:00:00+00:00': '1200' },
    },
    {
      label: 'spent',
      currency_code: 'EUR',
      // Firefly sends spending negative.
      entries: { '2026-01-01T00:00:00+00:00': '-600', '2026-02-01T00:00:00+00:00': '-1500' },
    },
  ];

  it('flips spending so both series measure upwards', () => {
    const { points } = buildCashFlow(series, 'EUR');
    expect(points[0]).toMatchObject({ earned: 1000, spent: 600, net: 400 });
  });

  it('runs the net cumulatively across the range', () => {
    const { points } = buildCashFlow(series, 'EUR');
    expect(points[1]).toMatchObject({ net: -300, cumulative: 100 });
  });

  it('computes the savings rate from the totals', () => {
    const result = buildCashFlow(series, 'EUR');
    expect(result.totalEarned).toBe('2200');
    expect(result.totalSpent).toBe('2100');
    // 100 kept out of 2200 earned.
    expect(result.savingsRate).toBeCloseTo(4.545, 2);
  });

  it('has no savings rate when nothing was earned', () => {
    const nothing = [{ label: 'spent', currency_code: 'EUR', entries: { '2026-01-01': '-10' } }];
    expect(buildCashFlow(nothing, 'EUR').savingsRate).toBeNull();
  });

  it('reports currencies it excluded rather than mixing them in', () => {
    const mixed = [
      ...series,
      { label: 'earned', currency_code: 'USD', entries: { '2026-01-01': '99' } },
    ];
    const result = buildCashFlow(mixed, 'EUR');
    expect(result.otherCurrencies).toEqual(['USD']);
    expect(result.totalEarned).toBe('2200');
  });

  it('returns an empty series for no data', () => {
    expect(buildCashFlow([], 'EUR').points).toEqual([]);
  });
});

describe('buildNetWorth', () => {
  const meta = new Map<string, NetWorthAccountMeta>([
    ['Checking', { kind: 'asset', includeNetWorth: true }],
    ['Card', { kind: 'liability', includeNetWorth: true }],
    ['Excluded', { kind: 'asset', includeNetWorth: false }],
  ]);

  const series = [
    {
      label: 'Checking',
      currency_code: 'EUR',
      entries: { '2026-01-01': '1000', '2026-02-01': '1500' },
    },
    // Firefly reports a liability balance negative.
    {
      label: 'Card',
      currency_code: 'EUR',
      entries: { '2026-01-01': '-200', '2026-02-01': '-300' },
    },
  ];

  it('nets liabilities off assets, treating debt as a positive amount owed', () => {
    const { points } = buildNetWorth(series, meta, 'EUR');
    expect(points[0]).toMatchObject({ assets: 1000, liabilities: 200, net: 800 });
    expect(points[1]).toMatchObject({ assets: 1500, liabilities: 300, net: 1200 });
  });

  it('honours the include-in-net-worth flag, so it agrees with the dashboard', () => {
    const withExcluded = [
      ...series,
      {
        label: 'Excluded',
        currency_code: 'EUR',
        entries: { '2026-01-01': '9999', '2026-02-01': '9999' },
      },
    ];
    const result = buildNetWorth(withExcluded, meta, 'EUR');
    expect(result.closingAssets).toBe('1500');
    expect(result.excludedAccounts).toBe(1);
  });

  it('measures each account share against magnitudes, not the net side total', () => {
    // An overdrawn account can drag the side total to near zero; dividing by it
    // produced shares over 100% on a real ledger.
    const overdrawn = [
      { label: 'Checking', currency_code: 'EUR', entries: { '2026-01-01': '-800' } },
      { label: 'Savings', currency_code: 'EUR', entries: { '2026-01-01': '900' } },
    ];
    const withSavings = new Map(meta);
    withSavings.set('Savings', { kind: 'asset', includeNetWorth: true });

    for (const row of buildNetWorth(overdrawn, withSavings, 'EUR').accounts) {
      expect(row.percent).toBeLessThanOrEqual(100);
    }
  });

  it('reports the change across the range', () => {
    const result = buildNetWorth(series, meta, 'EUR');
    expect(result.openingNet).toBe('800');
    expect(result.closingNet).toBe('1200');
    expect(result.change).toMatchObject({ absolute: '400' });
  });

  it('returns an empty report when nothing is eligible', () => {
    expect(buildNetWorth([], meta, 'EUR').points).toEqual([]);
  });
});

describe('buildBudgetReport', () => {
  const chart = [
    {
      label: 'Everyday',
      currency_code: 'EUR',
      entries: { budgeted: '1200', spent: '-1500', left: '0', overspent: '300' },
    },
    {
      label: 'Travel',
      currency_code: 'EUR',
      entries: { budgeted: '500', spent: '-200', left: '300', overspent: '0' },
    },
  ];

  it('normalises spend to a magnitude and computes usage and variance', () => {
    const { rows } = buildBudgetReport(chart, 'EUR');
    const everyday = rows.find((r) => r.name === 'Everyday');
    expect(everyday).toMatchObject({ spent: '1500', budgeted: '1200', variance: '-300' });
    expect(everyday?.usage).toBeCloseTo(125);
  });

  it('ranks by spend, so the budget under most pressure is first', () => {
    expect(buildBudgetReport(chart, 'EUR').rows.map((r) => r.name)).toEqual(['Everyday', 'Travel']);
  });

  it('skips budgets with neither a limit nor any spending', () => {
    const idle = [{ label: 'Idle', currency_code: 'EUR', entries: { budgeted: '0', spent: '0' } }];
    expect(buildBudgetReport(idle, 'EUR').rows).toEqual([]);
  });

  it('totals only the chosen currency', () => {
    const mixed = [
      ...chart,
      { label: 'US', currency_code: 'USD', entries: { budgeted: '10', spent: '-10' } },
    ];
    const result = buildBudgetReport(mixed, 'EUR');
    expect(result.totalBudgeted).toBe('1700');
    expect(result.otherCurrencies).toEqual(['USD']);
  });
});

describe('buildMonthlyGrid', () => {
  const months = [
    { key: '2026-01', label: 'Jan 2026' },
    { key: '2026-02', label: 'Feb 2026' },
  ];

  it('pivots per-month payloads into a resource by month grid', () => {
    const grid = buildMonthlyGrid(
      months,
      [
        [entry({ id: '1', name: 'Food', difference: '-10' })],
        [entry({ id: '1', name: 'Food', difference: '-30' })],
      ],
      'EUR',
    );
    expect(grid.rows[0]?.cells.map((c) => c.amount)).toEqual(['10', '30']);
    expect(grid.rows[0]?.total).toBe('40');
    expect(grid.totals).toEqual(['10', '30']);
    expect(grid.grandTotal).toBe('40');
  });

  it('fills a month a resource is absent from with zero', () => {
    const grid = buildMonthlyGrid(
      months,
      [[entry({ id: '1', name: 'Food', difference: '-10' })], []],
      'EUR',
    );
    expect(grid.rows[0]?.cells[1]?.amount).toBe('0');
  });

  it('scales the heat against the busiest single cell', () => {
    const grid = buildMonthlyGrid(
      months,
      [
        [entry({ id: '1', name: 'Food', difference: '-25' })],
        [entry({ id: '1', name: 'Food', difference: '-100' })],
      ],
      'EUR',
    );
    expect(grid.rows[0]?.cells[0]?.ratio).toBeCloseTo(25);
    expect(grid.rows[0]?.cells[1]?.ratio).toBeCloseTo(100);
  });

  it('ignores a currency that is not the one being reported', () => {
    const grid = buildMonthlyGrid(
      months,
      [[entry({ id: '1', name: 'Food', difference: '-10', currency_code: 'USD' })], []],
      'EUR',
    );
    expect(grid.rows).toEqual([]);
  });
});

describe('buildAccountReport', () => {
  it('keeps the sign on transfers while income and expense are magnitudes', () => {
    // For one account "money in" and "money out" are different facts; collapsing
    // transfers to a magnitude would show both sides of a move as a gain.
    const report = buildAccountReport(
      [entry({ id: '1', name: 'Checking', difference: '1000' })],
      [entry({ id: '1', name: 'Checking', difference: '-400' })],
      [entry({ id: '1', name: 'Checking', difference: '-500' })],
      'EUR',
    );
    expect(report.rows[0]).toMatchObject({
      income: '1000',
      expense: '400',
      transfers: '-500',
      net: '600',
    });
  });

  it('ranks by how much money moved through the account', () => {
    const report = buildAccountReport(
      [
        entry({ id: '1', name: 'Quiet', difference: '10' }),
        entry({ id: '2', name: 'Busy', difference: '5000' }),
      ],
      [],
      [],
      'EUR',
    );
    expect(report.rows.map((r) => r.name)).toEqual(['Busy', 'Quiet']);
  });

  it('excludes other currencies and reports them', () => {
    const report = buildAccountReport(
      [
        entry({ id: '1', name: 'EUR acct', difference: '100' }),
        entry({ id: '2', name: 'US acct', difference: '50', currency_code: 'USD' }),
      ],
      [],
      [],
      'EUR',
    );
    expect(report.totalIncome).toBe('100');
    expect(report.otherCurrencies).toEqual(['USD']);
  });
});

describe('buildBillReport', () => {
  const bill = (
    over: Partial<Parameters<typeof buildBillReport>[0][number]['attributes']> = {},
  ) => ({
    id: '1',
    attributes: {
      name: 'Netflix',
      amount_min: '12.99',
      amount_max: '15.99',
      repeat_freq: 'monthly',
      active: true,
      currency_code: 'EUR',
      ...over,
    },
  });

  it('annualises from the midpoint of the min/max band', () => {
    // A bill is stored as a range, not a figure: (12.99 + 15.99) / 2 * 12.
    const { rows } = buildBillReport([bill()], [], 'EUR');
    expect(rows[0]?.expected).toBe('14.49');
    expect(rows[0]?.annualised).toBe('173.88');
  });

  it('divides by skip + 1, so "every other month" is not counted as monthly', () => {
    const { rows } = buildBillReport([bill({ skip: 1 })], [], 'EUR');
    expect(rows[0]?.annualised).toBe('86.94');
  });

  it('annualises an unrecognised frequency to nothing rather than guessing', () => {
    const { rows, totalAnnualised } = buildBillReport(
      [bill({ repeat_freq: 'fortnightly' })],
      [],
      'EUR',
    );
    expect(rows[0]?.annualised).toBe('0');
    expect(totalAnnualised).toBe('0');
  });

  it('leaves inactive subscriptions out of the annual total but still lists them', () => {
    const { rows, totalAnnualised, activeCount, inactiveCount } = buildBillReport(
      [bill({ active: false })],
      [],
      'EUR',
    );
    expect(rows).toHaveLength(1);
    expect(totalAnnualised).toBe('0');
    expect([activeCount, inactiveCount]).toEqual([0, 1]);
  });

  it('matches what was actually paid against the bill by id', () => {
    const { rows, totalActual } = buildBillReport(
      [bill()],
      [entry({ id: '1', difference: '-15.99' })],
      'EUR',
    );
    expect(rows[0]?.actual).toBe('15.99');
    expect(totalActual).toBe('15.99');
  });

  it('ranks by annual cost, so the expensive habit is first', () => {
    const { rows } = buildBillReport(
      [
        bill(),
        {
          id: '2',
          attributes: { ...bill().attributes, name: 'Gym', amount_min: '40', amount_max: '40' },
        },
      ],
      [],
      'EUR',
    );
    expect(rows.map((r) => r.name)).toEqual(['Gym', 'Netflix']);
  });
});
