import { describe, expect, it } from 'vitest';
import { buildRateTable, convertSpent } from '@/lib/budget-currency';

const rates = [
  {
    attributes: {
      from_currency_code: 'BDT',
      to_currency_code: 'USD',
      rate: '0.0081',
      date: '2026-09-28',
    },
  },
  {
    attributes: {
      from_currency_code: 'EUR',
      to_currency_code: 'BDT',
      rate: '130',
      date: '2026-09-27',
    },
  },
];

const rateTable = buildRateTable(rates);

describe('buildRateTable', () => {
  it('builds a rate table from Firefly exchange-rate resources', () => {
    expect(rateTable.asOf).toBe('2026-09-28');
  });

  it('supports direct conversion', () => {
    expect(rateTable.pairs.has('BDT>USD')).toBe(true);
  });

  it('supports inverse conversion', () => {
    expect(rateTable.pairs.has('USD>BDT')).toBe(true);
  });

  it('chains through a shared base', () => {
    // EUR→BDT and BDT→USD should give EUR→USD
    expect(rateTable.pairs.has('EUR>USD')).toBe(true);
  });
});

describe('convertSpent', () => {
  it('returns zero for an empty array', () => {
    const result = convertSpent([], 'BDT', rateTable);
    expect(result.amount).toBe('0');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
  });

  it('returns zero for null/undefined spent', () => {
    expect(convertSpent(null, 'BDT', rateTable).amount).toBe('0');
    expect(convertSpent(undefined, 'BDT', rateTable).amount).toBe('0');
  });

  it('sums entries already in the target currency without conversion', () => {
    const result = convertSpent(
      [
        { sum: '-5000', currency_code: 'BDT' },
        { sum: '-3000', currency_code: 'BDT' },
      ],
      'BDT',
      rateTable,
    );
    expect(result.amount).toBe('8000');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
    expect(result.foreignAmounts).toEqual([]);
  });

  it('converts a single foreign-currency entry to the target currency', () => {
    const result = convertSpent([{ sum: '-62.04', currency_code: 'USD' }], 'BDT', rateTable);
    // USD→BDT: 62.04 / 0.0081 = 7660.74...
    const expected = 62.04 / 0.0081;
    expect(Number(result.amount)).toBeCloseTo(expected, 2);
    expect(result.convertedCurrencies).toEqual(['USD']);
    expect(result.unconvertible).toEqual([]);
    expect(result.foreignAmounts).toHaveLength(1);
    expect(result.foreignAmounts[0]!.currency).toBe('USD');
  });

  it('sums mixed-currency entries into one target-currency figure', () => {
    const result = convertSpent(
      [
        { sum: '-5000', currency_code: 'BDT' },
        { sum: '-62.04', currency_code: 'USD' },
      ],
      'BDT',
      rateTable,
    );
    // 5000 BDT + 62.04 USD converted to BDT
    const expected = 5000 + 62.04 / 0.0081;
    expect(Number(result.amount)).toBeCloseTo(expected, 2);
    expect(result.convertedCurrencies).toEqual(['USD']);
    expect(result.unconvertible).toEqual([]);
  });

  it('reports unconvertible currencies instead of dropping them silently', () => {
    const result = convertSpent(
      [
        { sum: '-5000', currency_code: 'BDT' },
        { sum: '-5000', currency_code: 'JPY' },
      ],
      'BDT',
      rateTable,
    );
    // Only the BDT entry is in the total; JPY has no rate.
    expect(result.amount).toBe('5000');
    expect(result.unconvertible).toEqual(['JPY']);
    expect(result.convertedCurrencies).toEqual([]);
  });

  it('handles all foreign currency with no rates table', () => {
    const result = convertSpent(
      [
        { sum: '-5000', currency_code: 'BDT' },
        { sum: '-62.04', currency_code: 'USD' },
      ],
      'BDT',
      null,
    );
    // Without a rate table, only same-currency entries are summed.
    expect(result.amount).toBe('5000');
    expect(result.unconvertible).toEqual(['USD']);
    expect(result.convertedCurrencies).toEqual([]);
  });

  it('handles a currency with no rate as unconvertible', () => {
    const result = convertSpent(
      [
        { sum: '-5000', currency_code: 'BDT' },
        { sum: '-100', currency_code: 'EUR' },
        { sum: '-50', currency_code: 'JPY' },
      ],
      'BDT',
      rateTable,
    );
    // BDT + EUR (converted via EUR→BDT rate) ; JPY unconvertible
    const expected = 5000 + 100 * 130;
    expect(Number(result.amount)).toBeCloseTo(expected, 2);
    expect(result.convertedCurrencies).toEqual(['EUR']);
    expect(result.unconvertible).toEqual(['JPY']);
  });

  it('uses the absolute magnitude (spent comes in negative)', () => {
    const result = convertSpent([{ sum: '-62.04', currency_code: 'USD' }], 'BDT', rateTable);
    expect(Number(result.amount)).toBeGreaterThan(0);
    expect(Number(result.foreignAmounts[0]!.amount)).toBeCloseTo(62.04, 2);
  });

  it('reports the rate date for disclosure', () => {
    const result = convertSpent([{ sum: '-62.04', currency_code: 'USD' }], 'BDT', rateTable);
    expect(result.rateAsOf).toBe('2026-09-28');
  });
});
