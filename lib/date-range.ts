import { DEFAULT_TIMEZONE, rangeToQuery, resolveRange, type RangePreset } from '@/lib/date';

/**
 * E3-02 — the global date range, encoded in the URL so every view is
 * shareable and back-button safe.
 */

export const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'year-to-date', label: 'Year to date' },
  { value: 'last-12-months', label: 'Last 12 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-year', label: 'Last year' },
];

const PRESET_VALUES = new Set(RANGE_PRESETS.map((preset) => preset.value));
const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ResolvedRange {
  start: string;
  end: string;
  preset: RangePreset | 'custom';
  label: string;
}

/**
 * Resolve `?range=`, or an explicit `?start=&end=` pair, into API date strings.
 * Falls back to the current month.
 */
export function resolveRangeFromParams(
  params: Record<string, string | string[] | undefined>,
  timezone: string = DEFAULT_TIMEZONE,
): ResolvedRange {
  const start = typeof params.start === 'string' ? params.start : undefined;
  const end = typeof params.end === 'string' ? params.end : undefined;

  if (start && end && PLAIN_DATE.test(start) && PLAIN_DATE.test(end)) {
    /*
     * Ordered, because `?start=` after `?end=` is trivially produced by hand
     * or by editing a shared link, and Firefly answers an inverted range with
     * an empty result set rather than an error — which reads as "you had no
     * transactions then" instead of "that range is backwards".
     */
    const [from, to] = start <= end ? [start, end] : [end, start];
    return { start: from, end: to, preset: 'custom', label: describeRange(from, to) };
  }

  const raw = typeof params.range === 'string' ? params.range : 'this-month';
  const preset = (PRESET_VALUES.has(raw as RangePreset) ? raw : 'this-month') as RangePreset;
  const query = rangeToQuery(resolveRange(preset, timezone), timezone);

  return {
    ...query,
    preset,
    label: RANGE_PRESETS.find((entry) => entry.value === preset)?.label ?? 'This month',
  };
}

/** Same span, shifted back one period — for period-over-period deltas. */
export function previousPeriod(range: ResolvedRange): { start: string; end: string } {
  const startMs = Date.parse(`${range.start}T00:00:00Z`);
  const endMs = Date.parse(`${range.end}T00:00:00Z`);
  const span = endMs - startMs + 86_400_000;

  const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { start: toIso(startMs - span), end: toIso(startMs - 86_400_000) };
}

/**
 * A calendar year that the presets do not already cover, newest first.
 *
 * "This year" and "last year" have their own presets, so the list starts two
 * years back. Without this the only way to look at 2023 was to hand-write a
 * `?start=&end=` pair into the address bar, which is not a feature, it is a
 * workaround that happened to work.
 */
export function selectableYears(today: Date, count = 5): number[] {
  const first = today.getFullYear() - 2;
  return Array.from({ length: count }, (_, index) => first - index);
}

/** The `?start=&end=` pair for a whole calendar year. */
export function yearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Name a custom range the way a person would say it.
 *
 * `2024-01-01 → 2024-12-31` is a correct label and a useless one: it is the
 * thing the reader already typed, printed back at them, and it makes the
 * header of every page read like a query string. A range that happens to be a
 * whole year is "2024"; a whole month is "March 2024".
 *
 * Pure string work on ISO dates on purpose — no Date is constructed, so there
 * is no timezone to get wrong. `new Date('2024-01-01')` is UTC midnight, which
 * is the previous day west of Greenwich, and this label would then name the
 * wrong month for half the world (docs/LEARNING.md §5, rule 2).
 */
export function describeRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-');
  const [ey, em, ed] = end.split('-');

  if (sy === ey) {
    if (sm === '01' && sd === '01' && em === '12' && ed === '31') return sy!;
    if (sm === em) {
      const month = MONTHS[Number.parseInt(sm!, 10) - 1];
      const lastDay = daysInMonth(Number.parseInt(sy!, 10), Number.parseInt(sm!, 10));
      if (sd === '01' && Number.parseInt(ed!, 10) === lastDay) return `${month} ${sy}`;
    }
  }

  return `${plain(start)} → ${plain(end)}`;
}

/** `2024-03-05` → `5 Mar 2024`. */
function plain(iso: string): string {
  const [y, m, d] = iso.split('-');
  const month = MONTHS[Number.parseInt(m!, 10) - 1]?.slice(0, 3) ?? m;
  return `${Number.parseInt(d!, 10)} ${month} ${y}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * The ISO date one calendar day before `iso`.
 *
 * E4-06 needs it because a reconciliation's opening balance is the account
 * balance at the END of the day before the statement period starts, which is
 * what Firefly's own reconcile screen uses (`$start->subDay()->endOfDay()`).
 *
 * String arithmetic, for the reason `describeRange` gives: `new Date(iso)` is
 * UTC midnight and lands on the previous day west of Greenwich, so a helper
 * built on it would hand back the day before *that* for half the world and
 * quietly shift the opening balance of every reconciliation by one day.
 */
export function previousDay(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;

  const year = Number.parseInt(y, 10);
  const month = Number.parseInt(m, 10);
  const day = Number.parseInt(d, 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return iso;

  if (day > 1) return `${pad(year, 4)}-${pad(month, 2)}-${pad(day - 1, 2)}`;
  if (month > 1)
    return `${pad(year, 4)}-${pad(month - 1, 2)}-${pad(daysInMonth(year, month - 1), 2)}`;
  return `${pad(year - 1, 4)}-12-31`;
}

const pad = (value: number, width: number) => String(value).padStart(width, '0');
