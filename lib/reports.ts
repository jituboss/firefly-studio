import { abs, add, divide, subtract, toDecimal } from '@/lib/money';

/**
 * E14 — the reporting arithmetic, kept pure so it can be reasoned about (and
 * tested) without a Firefly instance.
 *
 * Two shape facts drive everything here, both verified against a live instance
 * rather than read off the OpenAPI spec (LEARNING.md §7):
 *
 *  1. `/insight/*` returns ONE ENTRY PER (resource, currency) pair. A category
 *     with both EUR and USD spending appears twice, with the same `id`. Summing
 *     the array blindly adds euros to dollars and invents a number. So every
 *     aggregate here is computed within a single currency, and the currencies
 *     left out are reported back so the UI can disclose them.
 *  2. Expenses come back NEGATIVE (`difference: "-2899.40"`). Reports show
 *     spending as a positive magnitude next to income, so the sign is
 *     normalised once, here, instead of `Math.abs` being sprinkled over a dozen
 *     components.
 */

export interface InsightLike {
  id?: string;
  name?: string;
  difference: string;
  currency_code: string;
}

export interface ReportRow {
  /** Firefly resource id, absent for the `total`/`no-*` insight variants. */
  id?: string;
  name: string;
  /** Always a positive magnitude. */
  amount: string;
  /** Share of the group total, 0–100. */
  percent: number;
}

export interface ReportBreakdown {
  currency: string;
  rows: ReportRow[];
  total: string;
  /** Currency codes present in the payload but not totalled. */
  otherCurrencies: string[];
}

/** Pick the currency to report in: the requested one if present, else the one
 *  carrying the largest absolute figure, so a report never headlines a trivial
 *  secondary balance simply because it sorted first. */
export function chooseReportCurrency(entries: InsightLike[], preferred: string): string {
  const totals = new Map<string, ReturnType<typeof toDecimal>>();
  for (const entry of entries) {
    const code = (entry.currency_code ?? '').toUpperCase();
    if (!code) continue;
    totals.set(code, add(totals.get(code) ?? 0, abs(entry.difference)));
  }

  if (totals.size === 0) return preferred;
  if (totals.has(preferred.toUpperCase())) return preferred.toUpperCase();

  let best = preferred;
  let bestValue = toDecimal(0);
  for (const [code, value] of totals) {
    if (value.greaterThan(bestValue)) {
      best = code;
      bestValue = value;
    }
  }
  return best;
}

export interface BreakdownOptions {
  /** Drop rows below this magnitude — filters Firefly's zero-value rows. */
  minimum?: string;
  limit?: number;
  /** Roll everything past `limit` into a single "Other (N)" row. */
  rollUp?: boolean;
}

/**
 * Turn an insight payload into a ranked, single-currency breakdown.
 *
 * Rows sharing an `id` are merged, because a resource split across currencies
 * appears once per currency and only the matching ones are kept.
 */
export function buildBreakdown(
  entries: InsightLike[],
  preferredCurrency: string,
  options: BreakdownOptions = {},
): ReportBreakdown {
  const { minimum = '0', limit, rollUp = true } = options;
  const currency = chooseReportCurrency(entries, preferredCurrency);

  const otherCurrencies = new Set<string>();
  const merged = new Map<
    string,
    { id?: string; name: string; amount: ReturnType<typeof toDecimal> }
  >();

  for (const entry of entries) {
    const code = (entry.currency_code ?? '').toUpperCase();
    if (code && code !== currency) {
      otherCurrencies.add(code);
      continue;
    }
    const name = entry.name?.trim() || 'Unnamed';
    const key = entry.id ?? name;
    const existing = merged.get(key);
    const amount = abs(entry.difference);
    if (existing) existing.amount = add(existing.amount, amount);
    else merged.set(key, { id: entry.id, name, amount });
  }

  const floor = toDecimal(minimum);
  const ranked = [...merged.values()]
    .filter((row) => row.amount.greaterThan(floor))
    .sort((a, b) => b.amount.comparedTo(a.amount));

  let total = toDecimal(0);
  for (const row of ranked) total = add(total, row.amount);

  const visible = limit !== undefined && ranked.length > limit ? ranked.slice(0, limit) : ranked;
  const remainder = limit !== undefined && ranked.length > limit ? ranked.slice(limit) : [];

  const rows: ReportRow[] = visible.map((row) => ({
    id: row.id,
    name: row.name,
    amount: row.amount.toString(),
    percent: total.isZero() ? 0 : divide(row.amount, total).times(100).toNumber(),
  }));

  if (rollUp && remainder.length > 0) {
    let rest = toDecimal(0);
    for (const row of remainder) rest = add(rest, row.amount);
    rows.push({
      name: `Other (${remainder.length})`,
      amount: rest.toString(),
      percent: total.isZero() ? 0 : divide(rest, total).times(100).toNumber(),
    });
  }

  return {
    currency,
    rows,
    total: total.toString(),
    otherCurrencies: [...otherCurrencies].sort(),
  };
}

/** The single figure out of an `insight/<flow>/total`-shaped payload. */
export function insightTotal(entries: InsightLike[], currency: string): string {
  let total = toDecimal(0);
  for (const entry of entries) {
    if ((entry.currency_code ?? '').toUpperCase() !== currency.toUpperCase()) continue;
    total = add(total, abs(entry.difference));
  }
  return total.toString();
}

// --- income vs. expense ------------------------------------------------------

export interface ChartSeriesLike {
  label: string;
  currency_code?: string;
  entries: Record<string, number | string>;
}

export interface CashFlowPoint {
  /** `YYYY-MM-DD`, the first day of the bucket. */
  date: string;
  earned: number;
  spent: number;
  net: number;
  /** Running total of `net` from the start of the range. */
  cumulative: number;
}

export interface CashFlowSeries {
  currency: string;
  points: CashFlowPoint[];
  totalEarned: string;
  totalSpent: string;
  net: string;
  /** Share of income not spent, 0–100, or null when nothing was earned. */
  savingsRate: number | null;
  otherCurrencies: string[];
}

/**
 * E14-03 — monthly income against expense, from `/chart/balance/balance`.
 *
 * That endpoint returns two series labelled `earned` and `spent`, each an
 * object keyed by bucket-start datetime. `spent` arrives negative; it is
 * flipped so both bars measure upwards from zero and the net line is the
 * difference rather than a sum.
 */
export function buildCashFlow(
  series: ChartSeriesLike[],
  preferredCurrency: string,
): CashFlowSeries {
  const currencies = new Map<string, number>();
  for (const entry of series) {
    const code = (entry.currency_code ?? '').toUpperCase();
    if (code) currencies.set(code, (currencies.get(code) ?? 0) + 1);
  }

  const wanted = preferredCurrency.toUpperCase();
  const currency = currencies.has(wanted)
    ? wanted
    : ([...currencies.keys()].sort()[0] ?? preferredCurrency);

  const otherCurrencies = [...currencies.keys()].filter((code) => code !== currency).sort();
  const relevant = series.filter(
    (entry) => !entry.currency_code || entry.currency_code.toUpperCase() === currency,
  );

  const earnedBy = new Map<string, ReturnType<typeof toDecimal>>();
  const spentBy = new Map<string, ReturnType<typeof toDecimal>>();

  for (const entry of relevant) {
    const normalized = entry.label.toLowerCase();
    const bucket =
      normalized.includes('earn') || normalized.includes('income') ? earnedBy : spentBy;
    for (const [rawDate, value] of Object.entries(entry.entries)) {
      const date = rawDate.slice(0, 10);
      // `spent` is negative on the wire; magnitude is what a bar chart draws.
      bucket.set(date, add(bucket.get(date) ?? 0, abs(value)));
    }
  }

  const dates = [...new Set([...earnedBy.keys(), ...spentBy.keys()])].sort();

  let totalEarned = toDecimal(0);
  let totalSpent = toDecimal(0);
  let running = toDecimal(0);

  const points: CashFlowPoint[] = dates.map((date) => {
    const earned = earnedBy.get(date) ?? toDecimal(0);
    const spent = spentBy.get(date) ?? toDecimal(0);
    const net = subtract(earned, spent);

    totalEarned = add(totalEarned, earned);
    totalSpent = add(totalSpent, spent);
    running = add(running, net);

    return {
      date,
      earned: earned.toNumber(),
      spent: spent.toNumber(),
      net: net.toNumber(),
      cumulative: running.toNumber(),
    };
  });

  const net = subtract(totalEarned, totalSpent);

  return {
    currency,
    points,
    totalEarned: totalEarned.toString(),
    totalSpent: totalSpent.toString(),
    net: net.toString(),
    savingsRate: totalEarned.isZero() ? null : divide(net, totalEarned).times(100).toNumber(),
    otherCurrencies,
  };
}

// --- period-over-period ------------------------------------------------------

export interface Delta {
  absolute: string;
  /** Null when the baseline is zero, where a percentage means nothing. */
  percent: number | null;
}

export function delta(current: string, previous: string): Delta {
  const difference = subtract(current, previous);
  const base = abs(previous);
  return {
    absolute: difference.toString(),
    percent: base.isZero() ? null : divide(difference, base).times(100).toNumber(),
  };
}

// --- net worth ---------------------------------------------------------------

export interface NetWorthPoint {
  date: string;
  assets: number;
  liabilities: number;
  net: number;
}

export interface NetWorthAccountRow {
  name: string;
  kind: 'asset' | 'liability';
  opening: string;
  closing: string;
  change: string;
  /** Share of the closing total on its own side, 0–100. */
  percent: number;
}

export interface NetWorthReport {
  currency: string;
  points: NetWorthPoint[];
  accounts: NetWorthAccountRow[];
  openingNet: string;
  closingNet: string;
  change: Delta;
  closingAssets: string;
  closingLiabilities: string;
  otherCurrencies: string[];
  /** Accounts the user flagged out of net worth, and so left out here. */
  excludedAccounts: number;
}

export interface NetWorthAccountMeta {
  kind: 'asset' | 'liability';
  includeNetWorth: boolean;
}

/**
 * E14-02 — assets against liabilities over time, from
 * `/chart/account/overview`, which returns one running-balance series per
 * account.
 *
 * Two corrections that the raw payload requires, both learned on a real ledger
 * (see lib/balance-trend.ts for the longer version):
 *
 *  - Firefly reports balances for accounts the user flagged
 *    `include_net_worth: false`, while its own net-worth figure ignores them.
 *    Including them here would put a number on this report that contradicts the
 *    dashboard tile. `meta` carries the flag in so the two agree.
 *  - Liability balances arrive NEGATIVE. They are shown as a positive magnitude
 *    on their own side of the chart and subtracted from assets for the net
 *    line, so "liabilities went up" draws upwards like a debt should.
 */
export function buildNetWorth(
  series: ChartSeriesLike[],
  meta: Map<string, NetWorthAccountMeta>,
  preferredCurrency: string,
): NetWorthReport {
  const eligible = series.filter((entry) => meta.get(entry.label)?.includeNetWorth !== false);
  const excludedAccounts = series.length - eligible.length;

  const counts = new Map<string, number>();
  for (const entry of eligible) {
    const code = (entry.currency_code ?? '').toUpperCase();
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const wanted = preferredCurrency.toUpperCase();
  const currency = counts.has(wanted) ? wanted : ([...counts.keys()].sort()[0] ?? wanted);
  const otherCurrencies = [...counts.keys()].filter((code) => code !== currency).sort();

  const included = eligible.filter(
    (entry) => !entry.currency_code || entry.currency_code.toUpperCase() === currency,
  );

  const empty: NetWorthReport = {
    currency,
    points: [],
    accounts: [],
    openingNet: '0',
    closingNet: '0',
    change: { absolute: '0', percent: null },
    closingAssets: '0',
    closingLiabilities: '0',
    otherCurrencies,
    excludedAccounts,
  };
  if (included.length === 0) return empty;

  const indexed = included.map((entry) => {
    const values = new Map<string, string | number>();
    for (const [rawDate, value] of Object.entries(entry.entries)) {
      values.set(rawDate.slice(0, 10), value);
    }
    // Firefly gives the chart no account id, only the label, so the name is the
    // only join key available back to the account's type.
    const kind = meta.get(entry.label)?.kind ?? 'asset';
    return { label: entry.label, kind, values };
  });

  const dates = [...new Set(indexed.flatMap((entry) => [...entry.values.keys()]))].sort();
  if (dates.length === 0) return empty;

  const points: NetWorthPoint[] = dates.map((date) => {
    let assets = toDecimal(0);
    let liabilities = toDecimal(0);
    for (const account of indexed) {
      const value = toDecimal(account.values.get(date) ?? 0);
      if (account.kind === 'liability') liabilities = add(liabilities, value.abs());
      else assets = add(assets, value);
    }
    return {
      date,
      assets: assets.toNumber(),
      liabilities: liabilities.toNumber(),
      net: subtract(assets, liabilities).toNumber(),
    };
  });

  const firstDate = dates[0]!;
  const lastDate = dates[dates.length - 1]!;

  let closingAssets = toDecimal(0);
  let closingLiabilities = toDecimal(0);
  // Share is measured against the sum of MAGNITUDES on each side, not against
  // the side's net total. An overdrawn current account can drag the asset total
  // negative or to near zero, and dividing by that produced shares of 264% on a
  // real ledger — a percentage that cannot be read as a share of anything.
  let assetMagnitude = toDecimal(0);
  let liabilityMagnitude = toDecimal(0);
  for (const account of indexed) {
    const closing = toDecimal(account.values.get(lastDate) ?? 0);
    if (account.kind === 'liability') {
      closingLiabilities = add(closingLiabilities, closing.abs());
      liabilityMagnitude = add(liabilityMagnitude, closing.abs());
    } else {
      closingAssets = add(closingAssets, closing);
      assetMagnitude = add(assetMagnitude, closing.abs());
    }
  }

  const accounts: NetWorthAccountRow[] = indexed
    .map((account) => {
      const opening = toDecimal(account.values.get(firstDate) ?? 0);
      const closing = toDecimal(account.values.get(lastDate) ?? 0);
      const side = account.kind === 'liability' ? liabilityMagnitude : assetMagnitude;
      return {
        name: account.label,
        kind: account.kind,
        opening: opening.toString(),
        closing: closing.toString(),
        change: subtract(closing, opening).toString(),
        percent: side.isZero() ? 0 : divide(closing.abs(), side).times(100).toNumber(),
      };
    })
    .sort((a, b) => abs(b.closing).comparedTo(abs(a.closing)));

  const openingNet = toDecimal(points[0]!.net);
  const closingNet = toDecimal(points[points.length - 1]!.net);

  return {
    currency,
    points,
    accounts,
    openingNet: openingNet.toString(),
    closingNet: closingNet.toString(),
    change: delta(closingNet.toString(), openingNet.toString()),
    closingAssets: closingAssets.toString(),
    closingLiabilities: closingLiabilities.toString(),
    otherCurrencies,
    excludedAccounts,
  };
}

// --- budgets -----------------------------------------------------------------

export interface BudgetReportRow {
  name: string;
  budgeted: string;
  spent: string;
  /** Budget left, floored at zero — never a negative "remaining". */
  left: string;
  overspent: string;
  /** Spent as a share of budgeted, uncapped so overspend reads above 100. */
  usage: number;
  /** budgeted − spent: negative means over. */
  variance: string;
}

export interface BudgetReport {
  currency: string;
  rows: BudgetReportRow[];
  totalBudgeted: string;
  totalSpent: string;
  totalOverspent: string;
  otherCurrencies: string[];
}

/**
 * E14-05 — planned against actual, from `/chart/budget/overview`.
 *
 * That endpoint returns ONE BAR PER BUDGET for the whole range — not a time
 * series — with `budgeted`, `spent`, `left` and `overspent` in `entries`
 * (LEARNING.md §7: the `/chart/*` endpoints do not share a shape). `spent`
 * arrives negative and is normalised to a magnitude here.
 */
export function buildBudgetReport(
  series: ChartSeriesLike[],
  preferredCurrency: string,
): BudgetReport {
  const codes = new Set(
    series.map((entry) => (entry.currency_code ?? '').toUpperCase()).filter(Boolean),
  );
  const wanted = preferredCurrency.toUpperCase();
  const currency = codes.has(wanted) ? wanted : ([...codes].sort()[0] ?? wanted);

  const rows: BudgetReportRow[] = [];
  let totalBudgeted = toDecimal(0);
  let totalSpent = toDecimal(0);
  let totalOverspent = toDecimal(0);

  for (const entry of series) {
    const code = (entry.currency_code ?? '').toUpperCase();
    if (code && code !== currency) continue;

    const budgeted = abs(entry.entries.budgeted ?? 0);
    const spent = abs(entry.entries.spent ?? 0);
    const overspent = abs(entry.entries.overspent ?? 0);
    // `left` is taken from Firefly rather than recomputed, so the figure agrees
    // with what Firefly's own budget page shows.
    const left = abs(entry.entries.left ?? 0);

    if (budgeted.isZero() && spent.isZero()) continue;

    totalBudgeted = add(totalBudgeted, budgeted);
    totalSpent = add(totalSpent, spent);
    totalOverspent = add(totalOverspent, overspent);

    rows.push({
      name: entry.label,
      budgeted: budgeted.toString(),
      spent: spent.toString(),
      left: left.toString(),
      overspent: overspent.toString(),
      usage: budgeted.isZero() ? 0 : divide(spent, budgeted).times(100).toNumber(),
      variance: subtract(budgeted, spent).toString(),
    });
  }

  rows.sort((a, b) => toDecimal(b.spent).comparedTo(toDecimal(a.spent)));

  return {
    currency,
    rows,
    totalBudgeted: totalBudgeted.toString(),
    totalSpent: totalSpent.toString(),
    totalOverspent: totalOverspent.toString(),
    otherCurrencies: [...codes].filter((code) => code !== currency).sort(),
  };
}

// --- month-over-month grids --------------------------------------------------

export interface MonthlyCell {
  monthKey: string;
  amount: string;
  /** Percentage against whatever this grid measures against, or null. */
  ratio: number | null;
}

export interface MonthlyGridRow {
  id?: string;
  name: string;
  cells: MonthlyCell[];
  total: string;
}

export interface MonthlyGrid {
  months: Array<{ key: string; label: string }>;
  rows: MonthlyGridRow[];
  /** Column totals, same order as `months`. */
  totals: string[];
  grandTotal: string;
}

/**
 * Pivot per-month insight payloads into a resource × month grid.
 *
 * `perMonth` is parallel to `months`: one insight response per bucket, which is
 * how a month-by-month table gets built out of endpoints that only ever report
 * a single total for the range they are given.
 */
export function buildMonthlyGrid(
  months: Array<{ key: string; label: string }>,
  perMonth: InsightLike[][],
  currency: string,
  options: { limit?: number } = {},
): MonthlyGrid {
  const wanted = currency.toUpperCase();
  const byResource = new Map<
    string,
    { id?: string; name: string; amounts: Map<string, ReturnType<typeof toDecimal>> }
  >();

  months.forEach((month, index) => {
    for (const entry of perMonth[index] ?? []) {
      if ((entry.currency_code ?? '').toUpperCase() !== wanted) continue;
      const name = entry.name?.trim() || 'Unnamed';
      const key = entry.id ?? name;
      let row = byResource.get(key);
      if (!row) {
        row = { id: entry.id, name, amounts: new Map() };
        byResource.set(key, row);
      }
      row.amounts.set(month.key, add(row.amounts.get(month.key) ?? 0, abs(entry.difference)));
    }
  });

  const ranked = [...byResource.values()]
    .map((row) => {
      let total = toDecimal(0);
      for (const value of row.amounts.values()) total = add(total, value);
      return { ...row, totalDecimal: total };
    })
    .filter((row) => row.totalDecimal.greaterThan(0))
    .sort((a, b) => b.totalDecimal.comparedTo(a.totalDecimal));

  const visible = options.limit ? ranked.slice(0, options.limit) : ranked;

  // The peak cell sets the heat scale, so the busiest month is the darkest and
  // everything else is read relative to it.
  let peak = toDecimal(0);
  for (const row of visible) {
    for (const value of row.amounts.values()) {
      if (value.greaterThan(peak)) peak = value;
    }
  }

  const rows: MonthlyGridRow[] = visible.map((row) => ({
    id: row.id,
    name: row.name,
    total: row.totalDecimal.toString(),
    cells: months.map((month) => {
      const amount = row.amounts.get(month.key) ?? toDecimal(0);
      return {
        monthKey: month.key,
        amount: amount.toString(),
        ratio: peak.isZero() ? null : divide(amount, peak).times(100).toNumber(),
      };
    }),
  }));

  const totals = months.map((month) => {
    let column = toDecimal(0);
    for (const row of visible) column = add(column, row.amounts.get(month.key) ?? 0);
    return column.toString();
  });

  let grandTotal = toDecimal(0);
  for (const row of visible) grandTotal = add(grandTotal, row.totalDecimal);

  return { months, rows, totals, grandTotal: grandTotal.toString() };
}
