import { describe, expect, it } from 'vitest';
import {
  add,
  compare,
  describeMoney,
  divide,
  formatMoney,
  percentOf,
  subtract,
  toApiString,
  toDecimal,
} from '@/lib/money';

describe('toDecimal', () => {
  it('parses Firefly string amounts without precision loss', () => {
    expect(toDecimal('1234.56').toString()).toBe('1234.56');
    expect(toDecimal('-0.01').toString()).toBe('-0.01');
  });

  it('treats null, undefined, empty and malformed input as zero', () => {
    for (const value of [null, undefined, '', 'not-a-number', NaN, Infinity]) {
      expect(toDecimal(value as never).toString()).toBe('0');
    }
  });
});

describe('arithmetic', () => {
  it('sums repeated decimals exactly where floats cannot', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in IEEE-754. This is the entire reason
    // lib/money.ts exists.
    expect(add('0.1', '0.2').toString()).toBe('0.3');
  });

  it('sums a hundred cents to exactly one unit', () => {
    const cents = Array.from({ length: 100 }, () => '0.01');
    expect(add(...cents).toString()).toBe('1');
  });

  it('subtracts without drift', () => {
    expect(subtract('1.00', '0.99').toString()).toBe('0.01');
  });

  it('returns zero rather than Infinity when dividing by zero', () => {
    expect(divide('100', '0').toString()).toBe('0');
  });

  it('orders amounts correctly', () => {
    expect(compare('10.00', '9.99')).toBe(1);
    expect(compare('9.99', '10.00')).toBe(-1);
    expect(compare('10.00', '10.000')).toBe(0);
  });
});

describe('percentOf', () => {
  it('computes a budget consumption ratio', () => {
    expect(percentOf('75', '300').toString()).toBe('25');
  });

  it('clamps over-budget values when asked', () => {
    expect(percentOf('450', '300', true).toString()).toBe('100');
    expect(percentOf('450', '300').toString()).toBe('150');
  });
});

describe('toApiString', () => {
  it('round-trips to the fixed-decimal wire format Firefly expects', () => {
    expect(toApiString('1234.5')).toBe('1234.50');
    expect(toApiString(add('0.1', '0.2'))).toBe('0.30');
  });

  it('honours currencies with non-standard decimal places', () => {
    // Firefly currencies carry their own decimal_places: JPY is 0, BHD is 3.
    expect(toApiString('1234.567', 3)).toBe('1234.567');
    expect(toApiString('1234.567', 0)).toBe('1235');
  });

  it('rounds half to even, not half up', () => {
    // Deliberate: ROUND_HALF_EVEN avoids the systematic upward bias that
    // ROUND_HALF_UP introduces when summing thousands of transactions.
    expect(toApiString('1234.5', 0)).toBe('1234');
    expect(toApiString('1235.5', 0)).toBe('1236');
    expect(toApiString('0.125', 2)).toBe('0.12');
    expect(toApiString('0.135', 2)).toBe('0.14');
  });
});

describe('formatMoney', () => {
  it('formats with a currency symbol', () => {
    expect(formatMoney('1234.56', { currency: 'EUR', locale: 'en-US' })).toBe('€1,234.56');
  });

  it('shows an explicit sign for non-zero deltas only', () => {
    const options = { currency: 'USD', locale: 'en-US', signDisplay: 'exceptZero' } as const;
    expect(formatMoney('12', options)).toBe('+$12.00');
    expect(formatMoney('-12', options)).toBe('-$12.00');
    expect(formatMoney('0', options)).toBe('$0.00');
  });
});

describe('describeMoney', () => {
  it('gives screen readers a direction word, not just a minus sign', () => {
    expect(describeMoney('-40', 'USD')).toBe('outgoing $40.00');
    expect(describeMoney('40', 'USD')).toBe('incoming $40.00');
    expect(describeMoney('0', 'USD')).toBe('no change $0.00');
  });
});
