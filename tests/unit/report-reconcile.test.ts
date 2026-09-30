import { describe, expect, it } from 'vitest';
import { reconcile, summaryMagnitude } from '@/lib/report-reconcile';

/**
 * E14-15 — the figures below are a real 2026-01-01 → 2026-09-30 range from the
 * dev instance, trimmed. The live check is `pnpm check:reconcile`; these pin
 * the comparison logic without one.
 */
const summary = {
  'spent-in-EUR': { monetary_value: '-26642.010000000000', currency_code: 'EUR' },
  'earned-in-EUR': { monetary_value: '37080.000000000000', currency_code: 'EUR' },
  'balance-in-EUR': { monetary_value: '10437.990000000000', currency_code: 'EUR' },
};

const base = {
  currency: 'EUR',
  summary,
  expenseTotal: [{ difference: '-26642.01', currency_code: 'EUR' }],
  incomeTotal: [{ difference: '37080.00', currency_code: 'EUR' }],
  expensePartitions: {
    category: [
      [
        { id: '1', name: 'Groceries', difference: '-26000.00', currency_code: 'EUR' },
        { id: '2', name: 'Fuel', difference: '-640.01', currency_code: 'EUR' },
      ],
      [{ difference: '-2.00', currency_code: 'EUR' }],
    ],
  },
  incomePartitions: {
    'revenue account': [[{ id: '9', name: 'Employer', difference: '37080', currency_code: 'EUR' }]],
  },
};

describe('summaryMagnitude', () => {
  it('reads string or number values, as magnitudes except balance', () => {
    expect(summaryMagnitude(summary, 'spent', 'eur')).toBe('26642.01');
    expect(
      summaryMagnitude(
        { 'balance-in-EUR': { monetary_value: -5, currency_code: 'EUR' } },
        'balance',
        'EUR',
      ),
    ).toBe('-5.00');
    expect(summaryMagnitude(summary, 'spent', 'USD')).toBe('0.00');
  });
});

describe('reconcile', () => {
  it('passes when every total and every partition agrees to the cent', () => {
    const checks = reconcile(base);
    expect(checks.map((c) => c.ok)).toEqual(checks.map(() => true));
    expect(checks.map((c) => c.name)).toContain('Spending by category adds up');
  });

  it('catches a partition that loses its "without" bucket', () => {
    const checks = reconcile({
      ...base,
      expensePartitions: { category: [base.expensePartitions.category[0]!] },
    });
    const failed = checks.find((c) => c.name === 'Spending by category adds up');
    expect(failed).toMatchObject({ ok: false, ours: '26640.01', theirs: '26642.01' });
  });

  it('ignores other currencies instead of adding them in', () => {
    const checks = reconcile({
      ...base,
      expenseTotal: [...base.expenseTotal, { difference: '-99', currency_code: 'USD' }],
      expensePartitions: {
        category: [
          ...base.expensePartitions.category,
          [{ id: '1', name: 'Groceries', difference: '-99', currency_code: 'USD' }],
        ],
      },
    });
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('does not fall back to another currency when the requested one is absent', () => {
    const checks = reconcile({
      currency: 'EUR',
      summary: {},
      expenseTotal: [],
      incomeTotal: [],
      expensePartitions: { category: [[{ id: '1', difference: '-50', currency_code: 'USD' }]] },
      incomePartitions: {},
    });
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('flags a balance that is not income minus spending', () => {
    const checks = reconcile({
      ...base,
      summary: {
        ...summary,
        'balance-in-EUR': { monetary_value: '1.00', currency_code: 'EUR' },
      },
    });
    expect(checks.find((c) => c.name.startsWith('Income − spending'))?.ok).toBe(false);
  });
});
