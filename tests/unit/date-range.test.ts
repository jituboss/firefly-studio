import { describe, expect, it } from 'vitest';
import { previousPeriod, RANGE_PRESETS, resolveRangeFromParams } from '@/lib/date-range';

/**
 * The global date range is encoded in the URL, so it is parsed from untrusted
 * input on every page. These cover what happens when that input is wrong,
 * because the failure mode is a page quietly reporting the wrong period rather
 * than an error anyone would notice.
 */
describe('resolveRangeFromParams', () => {
  it('honours an explicit start/end pair as a custom range', () => {
    const range = resolveRangeFromParams({ start: '2026-02-01', end: '2026-02-28' }, 'Asia/Dhaka');
    expect(range).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
      preset: 'custom',
      label: '2026-02-01 → 2026-02-28',
    });
  });

  it('falls back to this month when a date is malformed', () => {
    // A half-valid pair must not be trusted: "2026-02" with a real end date
    // would otherwise be handed to Firefly as a start parameter.
    const range = resolveRangeFromParams({ start: '2026-02', end: '2026-02-28' }, 'UTC');
    expect(range.preset).toBe('this-month');
  });

  it('ignores an unknown preset rather than passing it upstream', () => {
    const range = resolveRangeFromParams({ range: 'since-the-dawn-of-time' }, 'UTC');
    expect(range.preset).toBe('this-month');
    expect(range.label).toBe('This month');
  });

  it('ignores repeated query parameters, which arrive as arrays', () => {
    const range = resolveRangeFromParams({ range: ['last-month', 'this-year'] }, 'UTC');
    expect(range.preset).toBe('this-month');
  });

  it('resolves every preset to a whole, ordered, plain-date range', () => {
    for (const preset of RANGE_PRESETS) {
      const range = resolveRangeFromParams({ range: preset.value }, 'Asia/Dhaka');
      expect(range.preset).toBe(preset.value);
      expect(range.label).toBe(preset.label);
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.start <= range.end).toBe(true);
    }
  });

  it('starts a month range on the first of the month', () => {
    const range = resolveRangeFromParams({ range: 'this-month' }, 'UTC');
    expect(range.start.endsWith('-01')).toBe(true);
  });
});

describe('previousPeriod', () => {
  it('shifts a full month back without overlapping it', () => {
    const previous = previousPeriod({
      start: '2026-03-01',
      end: '2026-03-31',
      preset: 'this-month',
      label: 'This month',
    });
    // 31 days back, ending the day before the current period opens.
    expect(previous).toEqual({ start: '2026-01-29', end: '2026-02-28' });
  });

  it('keeps the comparison span identical to the current one', () => {
    const current = { start: '2026-03-10', end: '2026-03-19' };
    const previous = previousPeriod({ ...current, preset: 'custom' as const, label: 'x' });
    const days = (range: { start: string; end: string }) =>
      (Date.parse(`${range.end}T00:00:00Z`) - Date.parse(`${range.start}T00:00:00Z`)) / 86_400_000;

    expect(days(previous)).toBe(days(current));
    expect(previous.end < current.start).toBe(true);
  });

  it('handles a single day', () => {
    const previous = previousPeriod({
      start: '2026-03-02',
      end: '2026-03-02',
      preset: 'custom',
      label: 'x',
    });
    expect(previous).toEqual({ start: '2026-03-01', end: '2026-03-01' });
  });
});
