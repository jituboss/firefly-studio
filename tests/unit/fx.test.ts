import { describe, expect, it } from 'vitest';
import { buildRates, convert, convertTotal, rateFor, type RateRow } from '@/lib/fx';

const rows: RateRow[] = [
  { from: 'EUR', to: 'GBP', rate: '0.86', date: '2025-04-15' },
  { from: 'EUR', to: 'PLN', rate: '4.28', date: '2025-04-10' },
];

describe('buildRates', () => {
  it('keeps the direct pairs', () => {
    expect(rateFor(buildRates(rows), 'EUR', 'GBP')).toBe('0.86');
  });

  it('adds the inverse, so a rate works in both directions', () => {
    const back = rateFor(buildRates(rows), 'GBP', 'EUR');
    expect(Number(back)).toBeCloseTo(1 / 0.86, 6);
  });

  it('chains through a shared base', () => {
    // Firefly anchors its rates on the instance currency, so GBP→PLN exists
    // only as GBP→EUR→PLN. Without chaining, two currencies that both have
    // rates still report "no rate available".
    const rate = rateFor(buildRates(rows), 'GBP', 'PLN');
    expect(Number(rate)).toBeCloseTo(4.28 / 0.86, 4);
  });

  it('reports the newest rate date, for disclosure', () => {
    expect(buildRates(rows).asOf).toBe('2025-04-15');
  });

  it('ignores a zero or negative rate rather than dividing by it', () => {
    // Inverting 0 is Infinity, which formats as a number and looks real.
    const table = buildRates([{ from: 'EUR', to: 'XXX', rate: '0', date: '2025-01-01' }]);
    expect(rateFor(table, 'EUR', 'XXX')).toBeNull();
    expect(rateFor(table, 'XXX', 'EUR')).toBeNull();
  });

  it('treats a currency as 1:1 with itself', () => {
    expect(rateFor(buildRates(rows), 'GBP', 'GBP')).toBe('1');
  });

  it('is case-insensitive about codes', () => {
    expect(rateFor(buildRates(rows), 'eur', 'gbp')).toBe('0.86');
  });
});

describe('convert', () => {
  it('converts with the direct rate', () => {
    expect(Number(convert('100', 'EUR', 'GBP', buildRates(rows)))).toBeCloseTo(86, 6);
  });

  it('returns null for an unknown pair rather than guessing', () => {
    // A missing rate must reach the UI as "cannot convert", never as zero.
    expect(convert('100', 'JPY', 'GBP', buildRates(rows))).toBeNull();
  });
});

describe('convertTotal', () => {
  const table = buildRates(rows);

  it('sums mixed currencies into one figure', () => {
    const out = convertTotal(
      [
        { currency: 'EUR', amount: '100' },
        { currency: 'GBP', amount: '86' },
      ],
      'EUR',
      table,
    );
    expect(Number(out.total)).toBeCloseTo(200, 4);
    expect(out.converted).toEqual(['GBP']);
    expect(out.unconvertible).toEqual([]);
  });

  it('reports what it could NOT convert instead of dropping it silently', () => {
    // A total that quietly omits a currency is a wrong total.
    const out = convertTotal(
      [
        { currency: 'EUR', amount: '100' },
        { currency: 'JPY', amount: '5000' },
      ],
      'EUR',
      table,
    );
    expect(out.total).toBe('100');
    expect(out.unconvertible).toEqual(['JPY']);
  });

  it('does not list the target currency as converted', () => {
    const out = convertTotal([{ currency: 'EUR', amount: '10' }], 'EUR', table);
    expect(out.converted).toEqual([]);
  });

  it('handles an empty set', () => {
    expect(convertTotal([], 'EUR', table).total).toBe('0');
  });
});
