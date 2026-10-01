/**
 * Shared multi-currency conversion helpers.
 *
 * Firefly III returns monetary figures grouped by currency — `/summary/basic`
 * emits one entry per currency (`spent-in-BDT`, `spent-in-USD`), and
 * `/insight/*` returns one entry per (resource, currency) pair. Without
 * conversion, every surface that sums these either picks one currency and
 * silently drops the rest, or reports them separately with no single
 * comparable figure.
 *
 * The budget screen already solved this with `lib/budget-currency.ts`. This
 * module generalises that pattern so every surface — dashboard KPI tiles,
 * transactions page totals, categories list, bills, and all reports — can
 * sum across currencies into the primary currency with the same disclosure:
 * what was converted, what could not be, and the date of the newest rate used.
 *
 * Conversion is always opt-in and always disclosed. When no rate table is
 * available, the helpers degrade to the current behaviour: pick one currency,
 * report the rest as excluded. A converted figure is an estimate built from a
 * rate with a date on it, and presenting it as counted money is the same class
 * of lie as summing currencies silently.
 */
import { abs, add, toDecimal } from '@/lib/money';
import { convert, rateFor, type RateTable } from '@/lib/fx';
import type { InsightLike } from '@/lib/reports';

// --- /summary/basic shape ---------------------------------------------------

/**
 * The shape Firefly returns from `/summary/basic`: a keyed object where each
 * value carries a monetary amount and a currency code.
 */
type SummaryEntry = {
  monetary_value: number;
  currency_code: string;
};

export interface ConvertedSummary {
  /** The summed value in the target currency, as a string. */
  value: string;
  /** The target currency code. */
  currency: string;
  /** Currencies that were converted (excluding the target itself). */
  convertedCurrencies: string[];
  /** Currencies with no usable rate — their amounts are NOT in `value`. */
  unconvertible: string[];
  /** The date of the newest rate used, for disclosure. */
  rateAsOf: string | null;
}

/**
 * Sum all currency variants of a `/summary/basic` prefix into one
 * primary-currency figure.
 *
 * Firefly keys summary entries like `spent-in-BDT`, `spent-in-USD`. Pass the
 * prefix (`spent-in-`) and this finds every matching key, converts each to the
 * target currency, and returns a single total with full disclosure.
 *
 * Without a rate table, it picks the preferred currency if present, else the
 * largest by absolute value — the same logic the dashboard used before
 * conversion was added — and reports the rest as unconvertible.
 */
export function convertSummaryEntries(
  entries: Record<string, SummaryEntry>,
  prefix: string,
  targetCurrency: string,
  rateTable: RateTable | null,
): ConvertedSummary {
  const matches = Object.entries(entries).filter(([key]) => key.startsWith(prefix));
  if (matches.length === 0) {
    return {
      value: '0',
      currency: targetCurrency,
      convertedCurrencies: [],
      unconvertible: [],
      rateAsOf: rateTable?.asOf ?? null,
    };
  }

  // With a rate table, sum every currency converted to the target.
  if (rateTable) {
    let total = toDecimal(0);
    const convertedCurrencies: string[] = [];
    const unconvertible: string[] = [];

    for (const [, entry] of matches) {
      const code = entry.currency_code.toUpperCase();
      const target = targetCurrency.toUpperCase();
      const magnitude = abs(entry.monetary_value).toString();

      if (code === target) {
        total = add(total, magnitude);
        continue;
      }

      const rate = rateFor(rateTable, code, target);
      if (rate === null) {
        if (!unconvertible.includes(code)) unconvertible.push(code);
        continue;
      }

      const convertedValue = convert(magnitude, code, target, rateTable);
      if (convertedValue === null) {
        if (!unconvertible.includes(code)) unconvertible.push(code);
        continue;
      }

      total = add(total, convertedValue);
      if (!convertedCurrencies.includes(code)) convertedCurrencies.push(code);
    }

    return {
      value: total.toString(),
      currency: targetCurrency,
      convertedCurrencies,
      unconvertible,
      rateAsOf: rateTable.asOf,
    };
  }

  // Without a rate table, pick the preferred currency or the largest figure.
  const exact = matches.find(([, entry]) => entry.currency_code === targetCurrency);
  const chosen =
    exact ??
    matches.reduce((best, current) =>
      Math.abs(current[1].monetary_value) > Math.abs(best[1].monetary_value) ? current : best,
    );

  const otherCurrencies = matches
    .map(([, entry]) => entry.currency_code)
    .filter((code) => code !== chosen[1].currency_code);

  return {
    value: String(chosen[1].monetary_value),
    currency: chosen[1].currency_code,
    convertedCurrencies: [],
    unconvertible: [...new Set(otherCurrencies)].sort(),
    rateAsOf: null,
  };
}

// --- /insight/* shape -------------------------------------------------------

export interface ConvertedInsight {
  /** The summed total in the target currency, as a string. */
  total: string;
  /** Currencies that were converted (excluding the target itself). */
  convertedCurrencies: string[];
  /** Currencies with no usable rate — their amounts are NOT in `total`. */
  unconvertible: string[];
  /** The date of the newest rate used, for disclosure. */
  rateAsOf: string | null;
}

/**
 * Sum an `/insight/*` array — one entry per (resource, currency) pair — into
 * a single primary-currency figure.
 *
 * With a rate table, every entry is converted to the target currency and summed.
 * Without one, only entries already in the target currency are summed and the
 * rest are reported as unconvertible.
 */
export function convertInsightEntries(
  entries: InsightLike[],
  targetCurrency: string,
  rateTable: RateTable | null,
): ConvertedInsight {
  if (entries.length === 0) {
    return {
      total: '0',
      convertedCurrencies: [],
      unconvertible: [],
      rateAsOf: rateTable?.asOf ?? null,
    };
  }

  let total = toDecimal(0);
  const convertedCurrencies: string[] = [];
  const unconvertible: string[] = [];
  const target = targetCurrency.toUpperCase();

  for (const entry of entries) {
    const code = (entry.currency_code ?? '').toUpperCase();
    if (!code) continue;
    const magnitude = abs(entry.difference).toString();

    if (code === target) {
      total = add(total, magnitude);
      continue;
    }

    if (!rateTable) {
      if (!unconvertible.includes(code)) unconvertible.push(code);
      continue;
    }

    const rate = rateFor(rateTable, code, target);
    if (rate === null) {
      if (!unconvertible.includes(code)) unconvertible.push(code);
      continue;
    }

    const convertedValue = convert(magnitude, code, target, rateTable);
    if (convertedValue === null) {
      if (!unconvertible.includes(code)) unconvertible.push(code);
      continue;
    }

    total = add(total, convertedValue);
    if (!convertedCurrencies.includes(code)) convertedCurrencies.push(code);
  }

  return {
    total: total.toString(),
    convertedCurrencies,
    unconvertible,
    rateAsOf: rateTable?.asOf ?? null,
  };
}