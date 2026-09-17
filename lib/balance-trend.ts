import { add, divide, subtract, toDecimal } from '@/lib/money';

/**
 * Builds the dashboard's balance-over-time chart data.
 *
 * Firefly's `/chart/account/overview?preselected=all` returns ONE SERIES PER
 * ACCOUNT (every asset and liability account), each a running balance. Plotting
 * all of them directly produces an unreadable tangle once a ledger has more
 * than a handful of accounts, which is what this module exists to fix: it
 * aggregates them into a single total line, and reduces the per-account view to
 * the few accounts that actually carry the balance plus an "Other" roll-up.
 *
 * NET-WORTH CONSISTENCY — Firefly lets a user flag an account
 * `include_net_worth: false`, and its own `/summary/basic` net-worth figure
 * honours that, but `/chart/account/overview` reports the balance regardless.
 * Summing the chart blindly therefore produces a headline that contradicts the
 * Net worth tile sitting directly above it on the same dashboard (observed on a
 * real ledger: 7.9M on the chart against 3.2M on the tile, a single excluded
 * account accounting for the whole gap). `excludeLabels` carries those account
 * names in so the two agree.
 *
 * CURRENCY SAFETY — the reason this is not a one-line `reduce`:
 * each series carries its own `currency_code`, and Firefly's `pc_entries`
 * (primary-currency conversions) come back EMPTY even for a foreign-currency
 * account — verified against a live instance, not assumed. So there is no
 * conversion data available here, and summing raw `entries` across currencies
 * would invent a meaningless number. Instead only one currency is totalled at a
 * time, and anything excluded is reported back so the UI can disclose it rather
 * than silently under-reporting the user's money.
 */

/** One account's balance series, as Firefly returns it. */
export interface BalanceSeriesInput {
  label: string;
  currency_code?: string | null;
  entries: Record<string, number | string>;
}

export interface BalanceTrendPoint {
  /** `YYYY-MM-DD`. */
  date: string;
  /** Summed balance across every included account on this date. */
  total: number;
  /** Per-account balance, keyed by account label. */
  [account: string]: number | string;
}

export interface BalanceTrendAccount {
  label: string;
  closing: number;
  /** True for the synthetic "Other (N)" roll-up rather than a real account. */
  aggregated: boolean;
}

export interface BalanceTrend {
  /** The currency every figure here is denominated in. */
  currency: string;
  points: BalanceTrendPoint[];
  /** Accounts worth drawing, largest first, including any "Other" roll-up. */
  accounts: BalanceTrendAccount[];
  opening: number;
  closing: number;
  change: number;
  /** Null when the opening balance is zero, where a percentage is meaningless. */
  changePercent: number | null;
  /** How many real accounts are represented. */
  includedAccounts: number;
  /** Currency codes present in the data but excluded from the total. */
  excludedCurrencies: string[];
  excludedAccounts: number;
  /** Accounts dropped because the user excluded them from net worth. */
  excludedFromNetWorth: number;
}

const OTHER_LABEL = 'Other';

/** How many individual accounts to draw before rolling the rest into "Other". */
const MAX_ACCOUNT_SERIES = 6;

function normaliseCurrency(value: string | null | undefined): string | null {
  const code = (value ?? '').trim().toUpperCase();
  return code === '' ? null : code;
}

/**
 * Pick which currency to total. Prefers the connection's primary currency; if
 * no account uses it, falls back to whichever currency covers the most
 * accounts, so the chart shows something real rather than nothing.
 */
function chooseCurrency(series: BalanceSeriesInput[], preferred: string): string {
  const counts = new Map<string, number>();
  for (const entry of series) {
    const code = normaliseCurrency(entry.currency_code);
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const preferredCode = normaliseCurrency(preferred) ?? '';
  if (counts.has(preferredCode)) return preferredCode;

  let best: string | null = null;
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }

  return best ?? preferredCode;
}

export interface BuildBalanceTrendOptions {
  /**
   * Account names flagged `include_net_worth: false`. The chart endpoint gives
   * no account id, only the label, so names are the only join key available.
   */
  excludeLabels?: ReadonlySet<string>;
}

export function buildBalanceTrend(
  series: BalanceSeriesInput[],
  preferredCurrency: string,
  options: BuildBalanceTrendOptions = {},
): BalanceTrend {
  const excludeLabels = options.excludeLabels ?? new Set<string>();

  const eligible = series.filter((entry) => !excludeLabels.has(entry.label));
  const excludedFromNetWorth = series.length - eligible.length;

  const currency = chooseCurrency(eligible, preferredCurrency);

  const included: BalanceSeriesInput[] = [];
  const excludedCurrencies = new Set<string>();
  let excludedAccounts = 0;

  for (const entry of eligible) {
    const code = normaliseCurrency(entry.currency_code);
    // A series with no currency at all is assumed to be in the chart's
    // currency — Firefly omits the field rather than lying about it.
    if (code === null || code === currency) {
      included.push(entry);
    } else {
      excludedCurrencies.add(code);
      excludedAccounts += 1;
    }
  }

  const empty: BalanceTrend = {
    currency,
    points: [],
    accounts: [],
    opening: 0,
    closing: 0,
    change: 0,
    changePercent: null,
    includedAccounts: included.length,
    excludedCurrencies: [...excludedCurrencies].sort(),
    excludedAccounts,
    excludedFromNetWorth,
  };

  if (included.length === 0) return empty;

  const dates = new Set<string>();
  for (const entry of included) {
    for (const date of Object.keys(entry.entries)) dates.add(date.slice(0, 10));
  }
  const sortedDates = [...dates].sort();
  if (sortedDates.length === 0) return empty;

  // Index each account's entries by plain date so lookups are not O(n) per cell.
  const byAccount = included.map((entry) => {
    const values = new Map<string, string | number>();
    for (const [rawDate, value] of Object.entries(entry.entries)) {
      values.set(rawDate.slice(0, 10), value);
    }
    return { label: entry.label, values };
  });

  // Rank accounts by their closing balance so the chart draws the ones that
  // actually move the total, not whichever happened to come back first.
  const lastDate = sortedDates[sortedDates.length - 1]!;
  const ranked = byAccount
    .map((account) => ({
      label: account.label,
      values: account.values,
      closingDecimal: toDecimal(account.values.get(lastDate) ?? 0),
    }))
    .sort((a, b) => b.closingDecimal.abs().comparedTo(a.closingDecimal.abs()));

  const primary = ranked.slice(0, MAX_ACCOUNT_SERIES);
  const rest = ranked.slice(MAX_ACCOUNT_SERIES);

  const points: BalanceTrendPoint[] = sortedDates.map((date) => {
    const point: BalanceTrendPoint = { date, total: 0 };

    // Decimal arithmetic throughout; `.toNumber()` only at the boundary where
    // the value is handed to the charting library to draw.
    let total = toDecimal(0);
    for (const account of ranked) {
      total = add(total, account.values.get(date) ?? 0);
    }
    point.total = total.toNumber();

    for (const account of primary) {
      point[account.label] = toDecimal(account.values.get(date) ?? 0).toNumber();
    }

    if (rest.length > 0) {
      let other = toDecimal(0);
      for (const account of rest) other = add(other, account.values.get(date) ?? 0);
      point[OTHER_LABEL] = other.toNumber();
    }

    return point;
  });

  const accounts: BalanceTrendAccount[] = primary.map((account) => ({
    label: account.label,
    closing: account.closingDecimal.toNumber(),
    aggregated: false,
  }));

  if (rest.length > 0) {
    let otherClosing = toDecimal(0);
    for (const account of rest) otherClosing = add(otherClosing, account.closingDecimal);
    accounts.push({
      label: OTHER_LABEL,
      closing: otherClosing.toNumber(),
      aggregated: true,
    });
  }

  const openingDecimal = toDecimal(points[0]?.total ?? 0);
  const closingDecimal = toDecimal(points[points.length - 1]?.total ?? 0);
  const changeDecimal = subtract(closingDecimal, openingDecimal);

  return {
    currency,
    points,
    accounts,
    opening: openingDecimal.toNumber(),
    closing: closingDecimal.toNumber(),
    change: changeDecimal.toNumber(),
    changePercent: openingDecimal.isZero()
      ? null
      : divide(changeDecimal, openingDecimal.abs()).times(100).toNumber(),
    includedAccounts: included.length,
    excludedCurrencies: [...excludedCurrencies].sort(),
    excludedAccounts,
    excludedFromNetWorth,
  };
}

export { OTHER_LABEL, MAX_ACCOUNT_SERIES };
