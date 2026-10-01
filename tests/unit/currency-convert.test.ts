import { describe, expect, it } from 'vitest';
import { convertSummaryEntries, convertInsightEntries } from '@/lib/currency-convert';
import { buildRates, type RateRow } from '@/lib/fx';
import type { InsightLike } from '@/lib/reports';

const rateRows: RateRow[] = [
  { from: 'BDT', to: 'USD', rate: '0.0081', date: '2026-09-28' },
  { from: 'EUR', to: 'BDT', rate: '130', date: '2026-09-27' },
];

const rateTable = buildRates(rateRows);

// --- convertSummaryEntries --------------------------------------------------

describe('convertSummaryEntries', () => {
  it('returns zero for an empty summary', () => {
    const result = convertSummaryEntries({}, 'spent-in-', 'BDT', rateTable);
    expect(result.value).toBe('0');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
  });

  it('sums a single currency without conversion', () => {
    const result = convertSummaryEntries(
      { 'spent-in-BDT': { monetary_value: -5000, currency_code: 'BDT' } },
      'spent-in-',
      'BDT',
      rateTable,
    );
    expect(result.value).toBe('5000');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
  });

  it('sums multiple entries in the target currency', () => {
    const result = convertSummaryEntries(
      {
        'spent-in-BDT': { monetary_value: -5000, currency_code: 'BDT' },
        'spent-in-BDT-2': { monetary_value: -3000, currency_code: 'BDT' },
      },
      'spent-in-',
      'BDT',
      rateTable,
    );
    expect(result.value).toBe('8000');
  });

  it('converts multi-currency entries to the target currency', () => {
    const result = convertSummaryEntries(
      {
        'spent-in-BDT': { monetary_value: -5000, currency_code: 'BDT' },
        'spent-in-USD': { monetary_value: -62.04, currency_code: 'USD' },
      },
      'spent-in-',
      'BDT',
      rateTable,
    );
    // 5000 BDT + 62.04 USD → BDT (USD→BDT = 1/0.0081)
    const expected = 5000 + 62.04 / 0.0081;
    expect(Number(result.value)).toBeCloseTo(expected, 2);
    expect(result.convertedCurrencies).toEqual(['USD']);
    expect(result.unconvertible).toEqual([]);
    expect(result.rateAsOf).toBe('2026-09-28');
  });

  it('reports unconvertible currencies instead of dropping them', () => {
    const result = convertSummaryEntries(
      {
        'spent-in-BDT': { monetary_value: -5000, currency_code: 'BDT' },
        'spent-in-JPY': { monetary_value: -5000, currency_code: 'JPY' },
      },
      'spent-in-',
      'BDT',
      rateTable,
    );
    expect(result.value).toBe('5000');
    expect(result.unconvertible).toEqual(['JPY']);
    expect(result.convertedCurrencies).toEqual([]);
  });

  it('degrades to pick-by-largest when no rate table is provided', () => {
    const result = convertSummaryEntries(
      {
        'spent-in-BDT': { monetary_value: -5000, currency_code: 'BDT' },
        'spent-in-USD': { monetary_value: -62.04, currency_code: 'USD' },
      },
      'spent-in-',
      'BDT',
      null,
    );
    // Without a rate table, BDT is preferred since it matches the target.
    expect(result.value).toBe('-5000');
    expect(result.currency).toBe('BDT');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual(['USD']);
  });

  it('all same currency as target — no conversion needed', () => {
    const result = convertSummaryEntries(
      {
        'net-worth-in-BDT': { monetary_value: 100000, currency_code: 'BDT' },
      },
      'net-worth-in-',
      'BDT',
      rateTable,
    );
    expect(result.value).toBe('100000');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
  });
});

// --- convertInsightEntries --------------------------------------------------

describe('convertInsightEntries', () => {
  const entry = (over: Partial<InsightLike> & { difference: string }): InsightLike => ({
    currency_code: 'BDT',
    ...over,
  });

  it('returns zero for an empty array', () => {
    const result = convertInsightEntries([], 'BDT', rateTable);
    expect(result.total).toBe('0');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
  });

  it('sums a single currency without conversion', () => {
    const result = convertInsightEntries([entry({ difference: '-5000' })], 'BDT', rateTable);
    expect(result.total).toBe('5000');
    expect(result.convertedCurrencies).toEqual([]);
  });

  it('converts multi-currency entries with rates', () => {
    const result = convertInsightEntries(
      [entry({ difference: '-5000' }), entry({ difference: '-62.04', currency_code: 'USD' })],
      'BDT',
      rateTable,
    );
    const expected = 5000 + 62.04 / 0.0081;
    expect(Number(result.total)).toBeCloseTo(expected, 2);
    expect(result.convertedCurrencies).toEqual(['USD']);
    expect(result.unconvertible).toEqual([]);
  });

  it('reports unconvertible currencies with missing rates', () => {
    const result = convertInsightEntries(
      [entry({ difference: '-5000' }), entry({ difference: '-5000', currency_code: 'JPY' })],
      'BDT',
      rateTable,
    );
    expect(result.total).toBe('5000');
    expect(result.unconvertible).toEqual(['JPY']);
  });

  it('degrades to target-only summing without a rate table', () => {
    const result = convertInsightEntries(
      [entry({ difference: '-5000' }), entry({ difference: '-62.04', currency_code: 'USD' })],
      'BDT',
      null,
    );
    expect(result.total).toBe('5000');
    expect(result.unconvertible).toEqual(['USD']);
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.rateAsOf).toBeNull();
  });

  it('all same currency as target — no conversion needed', () => {
    const result = convertInsightEntries(
      [entry({ difference: '-100' }), entry({ difference: '-200' })],
      'BDT',
      rateTable,
    );
    expect(result.total).toBe('300');
    expect(result.convertedCurrencies).toEqual([]);
    expect(result.unconvertible).toEqual([]);
  });
});
