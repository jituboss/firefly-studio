import { DEFAULT_TIMEZONE } from '@/lib/date';
import { previousPeriod, resolveRangeFromParams, type ResolvedRange } from '@/lib/date-range';

/**
 * E14-01 — the scope every report shares.
 *
 * All of it lives in the URL, for the same reason the global date range does
 * (E3-02): a report someone is looking at must be linkable, back-button safe,
 * and printable to the same thing it showed on screen.
 *
 *   ?range=this-year            — or ?start=&end= for a custom span
 *   ?accounts=3,7               — restrict to these Firefly asset-account ids
 *   ?currency=EUR               — which currency's figures to display
 *   ?compare=1                  — also fetch the preceding period
 */

export interface ReportScope extends ResolvedRange {
  /** Firefly account ids, empty meaning "every account". */
  accounts: string[];
  /** Display currency. Empty string means "whatever the data uses". */
  currency: string;
  compare: boolean;
  previous: { start: string; end: string };
}

const readList = (value: string | string[] | undefined): string[] => {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  return (
    raw
      .split(',')
      .map((entry) => entry.trim())
      // Account ids are numeric in Firefly; anything else is a crafted URL.
      .filter((entry) => /^\d+$/.test(entry))
  );
};

export function resolveReportScope(
  params: Record<string, string | string[] | undefined>,
  fallbackCurrency: string,
  timezone: string = DEFAULT_TIMEZONE,
): ReportScope {
  const range = resolveRangeFromParams(params, timezone);
  const rawCurrency = typeof params.currency === 'string' ? params.currency.toUpperCase() : '';

  return {
    ...range,
    accounts: readList(params.accounts),
    currency: /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : fallbackCurrency,
    compare: params.compare === '1' || params.compare === 'true',
    previous: previousPeriod(range),
  };
}

/**
 * Rebuild the query string for a link that keeps the current scope.
 *
 * Every drill-through link (E14-12) and every report-to-report link goes
 * through this, so the period a user picked survives the whole journey from a
 * chart down to the transaction list.
 */
export function scopeToQuery(
  scope: ReportScope,
  extra: Record<string, string | undefined> = {},
): string {
  const params = new URLSearchParams();

  if (scope.preset === 'custom') {
    params.set('start', scope.start);
    params.set('end', scope.end);
  } else {
    params.set('range', scope.preset);
  }

  if (scope.accounts.length > 0) params.set('accounts', scope.accounts.join(','));
  if (scope.currency) params.set('currency', scope.currency);
  if (scope.compare) params.set('compare', '1');

  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === '') params.delete(key);
    else params.set(key, value);
  }

  return params.toString();
}

/**
 * A link into the transaction list filtered to the same window — the shared
 * back end of E14-12. Firefly's own transaction list takes `start`/`end` as
 * explicit dates, so the preset is resolved rather than passed through.
 */
export function drillToTransactions(
  scope: ReportScope,
  filters: Record<string, string | undefined> = {},
): string {
  const params = new URLSearchParams({ start: scope.start, end: scope.end });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return `/transactions?${params.toString()}`;
}
