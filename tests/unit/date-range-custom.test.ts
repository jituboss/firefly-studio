import { describe, expect, it } from 'vitest';
import {
  describeRange,
  resolveRangeFromParams,
  selectableYears,
  yearRange,
} from '@/lib/date-range';

describe('selectableYears', () => {
  it('starts two years back, because this year and last year are presets', () => {
    expect(selectableYears(new Date(2026, 5, 1), 3)).toEqual([2024, 2023, 2022]);
  });

  it('is ordered newest first', () => {
    const years = selectableYears(new Date(2026, 0, 1), 5);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });
});

describe('yearRange', () => {
  it('spans the whole calendar year', () => {
    expect(yearRange(2024)).toEqual({ start: '2024-01-01', end: '2024-12-31' });
  });
});

describe('describeRange', () => {
  it('names a whole year as the year', () => {
    // "2024-01-01 → 2024-12-31" is the thing the reader typed, printed back.
    expect(describeRange('2024-01-01', '2024-12-31')).toBe('2024');
  });

  it('names a whole month as the month', () => {
    expect(describeRange('2024-03-01', '2024-03-31')).toBe('March 2024');
  });

  it('handles a 30-day month', () => {
    expect(describeRange('2024-04-01', '2024-04-30')).toBe('April 2024');
  });

  it('handles February in a leap year and a common year', () => {
    expect(describeRange('2024-02-01', '2024-02-29')).toBe('February 2024');
    expect(describeRange('2023-02-01', '2023-02-28')).toBe('February 2023');
    // 2000 is a leap year, 1900 is not — the rule the naive `% 4` misses.
    expect(describeRange('2000-02-01', '2000-02-29')).toBe('February 2000');
    expect(describeRange('1900-02-01', '1900-02-28')).toBe('February 1900');
  });

  it('falls back to readable dates for an arbitrary span', () => {
    expect(describeRange('2024-03-05', '2024-04-02')).toBe('5 Mar 2024 → 2 Apr 2024');
  });

  it('does not call a partial month a month', () => {
    expect(describeRange('2024-03-01', '2024-03-30')).toContain('→');
  });

  it('constructs no Date, so it cannot shift a month by timezone', () => {
    // new Date('2024-03-01') is UTC midnight — the previous day west of
    // Greenwich — which would label this February for half the world.
    expect(describeRange('2024-03-01', '2024-03-31')).toBe('March 2024');
  });
});

describe('resolveRangeFromParams with a custom range', () => {
  it('accepts an explicit start and end', () => {
    const r = resolveRangeFromParams({ start: '2021-01-01', end: '2021-12-31' });
    expect(r).toMatchObject({ start: '2021-01-01', end: '2021-12-31', preset: 'custom' });
    expect(r.label).toBe('2021');
  });

  it('orders an inverted pair rather than passing it through', () => {
    // Firefly answers an inverted range with an empty result set, not an
    // error — which reads as "you had no transactions then".
    const r = resolveRangeFromParams({ start: '2021-12-31', end: '2021-01-01' });
    expect(r.start).toBe('2021-01-01');
    expect(r.end).toBe('2021-12-31');
  });

  it('ignores a malformed pair and falls back to a preset', () => {
    const r = resolveRangeFromParams({ start: 'yesterday', end: '2021-12-31' });
    expect(r.preset).toBe('this-month');
  });
});
