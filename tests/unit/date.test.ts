import { describe, expect, it } from 'vitest';
import {
  eachMonthInRange,
  formatDate,
  formatMonthLabel,
  parseFireflyDate,
  parseFireflyDateTime,
  rangeToQuery,
  resolveRange,
  toApiDate,
} from '@/lib/date';

describe('parseFireflyDate', () => {
  it('anchors a plain date to local midnight in the given timezone', () => {
    const date = parseFireflyDate('2026-03-15', 'America/New_York');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });

  it('does not shift the calendar day west of Greenwich', () => {
    // `new Date('2026-03-15')` is UTC midnight, which is 14 March in New York.
    // That off-by-one is what moves transactions between months in reports.
    for (const timezone of ['America/Los_Angeles', 'America/New_York', 'UTC', 'Asia/Tokyo']) {
      expect(toApiDate(parseFireflyDate('2026-03-15', timezone), timezone)).toBe('2026-03-15');
    }
  });

  it('survives a month boundary in both directions', () => {
    expect(toApiDate(parseFireflyDate('2026-01-01', 'Pacific/Auckland'), 'Pacific/Auckland')).toBe(
      '2026-01-01',
    );
    expect(
      toApiDate(parseFireflyDate('2025-12-31', 'America/Anchorage'), 'America/Anchorage'),
    ).toBe('2025-12-31');
  });

  it('handles a leap day', () => {
    expect(toApiDate(parseFireflyDate('2028-02-29', 'UTC'), 'UTC')).toBe('2028-02-29');
  });
});

describe('parseFireflyDateTime', () => {
  it('preserves the instant across timezone rendering', () => {
    // The instant is the invariant; the string rendering of it is not
    // (TZDate emits an explicit +00:00 offset rather than the Z shorthand).
    const expected = Date.UTC(2026, 2, 15, 13, 30, 0);
    expect(parseFireflyDateTime('2026-03-15T14:30:00+01:00', 'UTC').getTime()).toBe(expected);
    expect(parseFireflyDateTime('2026-03-15T14:30:00+01:00', 'Asia/Tokyo').getTime()).toBe(
      expected,
    );
    expect(parseFireflyDateTime('2026-03-15T08:30:00-05:00', 'UTC').getTime()).toBe(expected);
  });

  it('throws on unparseable input rather than yielding Invalid Date', () => {
    expect(() => parseFireflyDateTime('definitely not a date', 'UTC')).toThrow(RangeError);
  });
});

describe('resolveRange', () => {
  it('produces inclusive month boundaries', () => {
    const query = rangeToQuery(resolveRange('this-month', 'UTC'), 'UTC');
    expect(query.start).toMatch(/^\d{4}-\d{2}-01$/);
    expect(query.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(query.end >= query.start).toBe(true);
  });

  it('starts a quarter on the correct month', () => {
    const query = rangeToQuery(resolveRange('this-quarter', 'UTC'), 'UTC');
    const month = Number.parseInt(query.start.slice(5, 7), 10);
    expect([1, 4, 7, 10]).toContain(month);
  });

  it('spans a full calendar year', () => {
    const query = rangeToQuery(resolveRange('last-year', 'UTC'), 'UTC');
    expect(query.start.slice(4)).toBe('-01-01');
    expect(query.end.slice(4)).toBe('-12-31');
    expect(query.start.slice(0, 4)).toBe(query.end.slice(0, 4));
  });
});

describe('formatDate', () => {
  it('renders a plain date in the requested timezone and locale', () => {
    expect(formatDate('2026-03-15', { timezone: 'UTC', locale: 'en-GB', style: 'medium' })).toBe(
      '15 Mar 2026',
    );
  });
});

describe('formatDate relative style', () => {
  it('names the days around today in the user timezone', async () => {
    const { formatAxisDate, now, toApiDate } = await import('@/lib/date');
    const timezone = 'Asia/Dhaka';
    const today = toApiDate(now(timezone), timezone);

    expect(formatDate(today, { timezone, style: 'relative' })).toBe('Today');

    // A date far from today falls through to an absolute rendering rather than
    // "in 8,411 days", which no one can read.
    expect(formatDate('2001-01-15', { timezone, style: 'relative' })).toMatch(/2001/);

    // The axis formatter is short by design: a tick has a few dozen pixels.
    expect(formatAxisDate('2026-08-03', timezone)).toBe('Aug 3');
  });
});

describe('eachMonthInRange', () => {
  it('splits a span into whole calendar months', () => {
    const months = eachMonthInRange('2026-01-01', '2026-03-31');
    expect(months.map((m) => m.key)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(months[1]).toMatchObject({ start: '2026-02-01', end: '2026-02-28', label: 'Feb 2026' });
  });

  it('clips a partial month to the days actually inside the range', () => {
    // The report grids call one insight endpoint per bucket, so a bucket that
    // over-reaches its range would double-count the overlap.
    const months = eachMonthInRange('2026-01-15', '2026-02-10');
    expect(months[0]).toMatchObject({ start: '2026-01-15', end: '2026-01-31' });
    expect(months[1]).toMatchObject({ start: '2026-02-01', end: '2026-02-10' });
  });

  it('handles a range inside one month', () => {
    expect(eachMonthInRange('2026-05-03', '2026-05-09')).toEqual([
      { key: '2026-05', label: 'May 2026', start: '2026-05-03', end: '2026-05-09' },
    ]);
  });

  it('includes February 29 in a leap year', () => {
    expect(eachMonthInRange('2028-02-01', '2028-02-29')[0]?.end).toBe('2028-02-29');
  });

  it('returns nothing when the range runs backwards', () => {
    expect(eachMonthInRange('2026-06-01', '2026-01-01')).toEqual([]);
  });

  it('caps a pathological range rather than firing hundreds of requests', () => {
    expect(eachMonthInRange('1900-01-01', '2100-01-01').length).toBeLessThanOrEqual(120);
  });
});

describe('formatMonthLabel', () => {
  it('reads a YYYY-MM key', () => {
    expect(formatMonthLabel('2026-03')).toBe('Mar 2026');
  });

  it('reads a full date too', () => {
    expect(formatMonthLabel('2026-03-15')).toBe('Mar 2026');
  });

  it('resolves the month in the user timezone, not the server one', () => {
    // 1 March in Auckland is still 28 February in UTC; getting this wrong moves
    // a transaction between months in every report grid.
    expect(formatMonthLabel('2026-03-01', 'Pacific/Auckland')).toBe('Mar 2026');
  });
});
