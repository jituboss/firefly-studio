import { TZDate } from '@date-fns/tz';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';

/**
 * E21-09 — date discipline.
 *
 * Firefly III sends two shapes:
 *   - plain dates       "2026-03-15"                 (a calendar day, no zone)
 *   - zoned datetimes   "2026-03-15T14:30:00+01:00"  (an instant)
 *
 * Parsing "2026-03-15" with `new Date(...)` treats it as UTC midnight, which
 * renders as 14 March for anyone west of Greenwich — an off-by-one-day bug that
 * silently shifts transactions between months and corrupts every report total.
 *
 * So: a plain date is anchored to the USER's timezone, never the browser's or
 * the server's. The ESLint config bans bare `new Date(string)` outside this file.
 */

export const DEFAULT_TIMEZONE = 'UTC';
const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Firefly's plain-date wire format. */
export const API_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Parse a Firefly plain date ("2026-03-15") as local midnight in `timezone`.
 */
export function parseFireflyDate(value: string, timezone: string = DEFAULT_TIMEZONE): TZDate {
  if (!PLAIN_DATE.test(value)) {
    // A datetime was passed where a date was expected — handle it rather than
    // producing an Invalid Date that fails somewhere far from the cause.
    return parseFireflyDateTime(value, timezone);
  }
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  return new TZDate(year!, month! - 1, day!, timezone);
}

/** Parse a Firefly ISO-8601 datetime into a zone-aware instant. */
export function parseFireflyDateTime(value: string, timezone: string = DEFAULT_TIMEZONE): TZDate {
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    throw new RangeError(`Unparseable Firefly datetime: ${JSON.stringify(value)}`);
  }
  return new TZDate(parsed, timezone);
}

/** Serialise back to the plain-date format Firefly expects on write. */
export function toApiDate(date: Date | TZDate, timezone: string = DEFAULT_TIMEZONE): string {
  return format(new TZDate(date, timezone), API_DATE_FORMAT);
}

/** Serialise to a full ISO-8601 datetime with offset. */
export function toApiDateTime(date: Date | TZDate, timezone: string = DEFAULT_TIMEZONE): string {
  return new TZDate(date, timezone).toISOString();
}

/** "Now", in the user's timezone. Always use this instead of `new Date()`. */
export function now(timezone: string = DEFAULT_TIMEZONE): TZDate {
  return new TZDate(Date.now(), timezone);
}

export interface DateRange {
  start: TZDate;
  end: TZDate;
}

export type RangePreset =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'year-to-date'
  | 'last-12-months'
  | 'this-year'
  | 'last-year';

/**
 * Resolve a named preset into a concrete range, inclusive of both endpoints.
 * Used by the global date-range picker (E3-02).
 */
export function resolveRange(preset: RangePreset, timezone: string = DEFAULT_TIMEZONE): DateRange {
  const today = now(timezone);
  const zone = (date: Date) => new TZDate(date, timezone);

  switch (preset) {
    case 'this-month':
      return { start: zone(startOfMonth(today)), end: zone(endOfMonth(today)) };
    case 'last-month': {
      const previous = subMonths(today, 1);
      return { start: zone(startOfMonth(previous)), end: zone(endOfMonth(previous)) };
    }
    case 'this-quarter': {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const start = new TZDate(today.getFullYear(), quarterStartMonth, 1, timezone);
      return { start, end: zone(endOfMonth(addMonths(start, 2))) };
    }
    case 'year-to-date':
      return { start: zone(startOfYear(today)), end: zone(endOfDay(today)) };
    case 'last-12-months':
      return { start: zone(startOfDay(subMonths(today, 12))), end: zone(endOfDay(today)) };
    case 'this-year':
      return { start: zone(startOfYear(today)), end: zone(endOfYear(today)) };
    case 'last-year': {
      const previous = new TZDate(today.getFullYear() - 1, 0, 1, timezone);
      return { start: zone(startOfYear(previous)), end: zone(endOfYear(previous)) };
    }
  }
}

/** Serialise a range into the `start`/`end` query params Firefly expects. */
export function rangeToQuery(
  range: DateRange,
  timezone: string = DEFAULT_TIMEZONE,
): { start: string; end: string } {
  return { start: toApiDate(range.start, timezone), end: toApiDate(range.end, timezone) };
}

export interface FormatDateOptions {
  timezone?: string;
  locale?: string;
  style?: 'short' | 'medium' | 'long' | 'relative';
}

/** Human-facing date rendering, always in the user's timezone. */
export function formatDate(value: string | Date | TZDate, options: FormatDateOptions = {}): string {
  const { timezone = DEFAULT_TIMEZONE, locale = 'en-US', style = 'medium' } = options;
  const date =
    typeof value === 'string' ? parseFireflyDate(value, timezone) : new TZDate(value, timezone);

  if (style === 'relative') {
    const days = differenceInCalendarDays(date, now(timezone));
    if (days === 0) return 'Today';
    if (days === -1) return 'Yesterday';
    if (days === 1) return 'Tomorrow';
    if (Math.abs(days) < 7) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
    }
  }

  const dateStyle = style === 'relative' ? 'medium' : style;
  return new Intl.DateTimeFormat(locale, { dateStyle, timeZone: timezone }).format(date);
}

/**
 * Compact label for a chart axis — "3 Aug" rather than a full date, because an
 * axis has room for a few dozen pixels per tick. Lives here, like every other
 * date formatter, so the timezone is never resolved from the browser's locale
 * by accident.
 */
export function formatAxisDate(
  value: string,
  timezone: string = DEFAULT_TIMEZONE,
  locale = 'en-US',
): string {
  const date = parseFireflyDate(value, timezone);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  }).format(date);
}

export { addDays, addMonths, endOfMonth, startOfMonth, TZDate, differenceInCalendarDays };

/**
 * Split an inclusive `start`..`end` pair into whole calendar months.
 *
 * M5 reports need per-month figures, and Firefly's `/insight/*` endpoints only
 * ever return one total for whatever range you hand them — so a month-by-month
 * table is built by asking for each month separately. Buckets are clipped to
 * the requested range at both ends, so a half-month at either edge reports the
 * days actually inside the range rather than the whole calendar month.
 */
export function eachMonthInRange(
  start: string,
  end: string,
  timezone: string = DEFAULT_TIMEZONE,
): Array<{ key: string; label: string; start: string; end: string }> {
  const first = parseFireflyDate(start, timezone);
  const last = parseFireflyDate(end, timezone);
  if (last < first) return [];

  const buckets: Array<{ key: string; label: string; start: string; end: string }> = [];
  let cursor = new TZDate(startOfMonth(first), timezone);

  // A pathological range (a decade of daily buckets) would produce a table no
  // one can read and a burst of API calls, so cap it.
  for (let guard = 0; guard < 120; guard += 1) {
    if (cursor > last) break;
    const monthStart = new TZDate(startOfMonth(cursor), timezone);
    const monthEnd = new TZDate(endOfMonth(cursor), timezone);
    const clippedStart = monthStart < first ? first : monthStart;
    const clippedEnd = monthEnd > last ? last : monthEnd;

    buckets.push({
      key: format(monthStart, 'yyyy-MM'),
      label: format(monthStart, 'MMM yyyy'),
      start: toApiDate(clippedStart, timezone),
      end: toApiDate(clippedEnd, timezone),
    });

    cursor = new TZDate(addMonths(monthStart, 1), timezone);
  }

  return buckets;
}

/** "Mar 2026" for a `YYYY-MM` or `YYYY-MM-DD` key, in the user's timezone. */
export function formatMonthLabel(
  key: string,
  timezone: string = DEFAULT_TIMEZONE,
  locale = 'en-US',
): string {
  const plain = key.length === 7 ? `${key}-01` : key;
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  }).format(parseFireflyDate(plain, timezone));
}
