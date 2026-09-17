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
    return { start, end, preset: 'custom', label: `${start} → ${end}` };
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
