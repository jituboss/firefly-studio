import { divide, multiply, toDecimal } from '@/lib/money';

/**
 * E13-05 — converting between currencies, so a multi-currency ledger can show
 * one comparable figure instead of a row of incomparable ones.
 *
 * Until now every total in this app was grouped by currency and never summed
 * across them — the standing rule in `lib/money.ts`, and the right default,
 * because adding euros to dollars invents a number. The cost was that someone
 * holding EUR and GBP accounts saw two subtotals and no answer to "what am I
 * worth?".
 *
 * **Conversion is opt-in and always disclosed.** A converted figure is an
 * estimate built from a rate with a date on it, and presenting it as if it
 * were counted money is the same class of lie as summing currencies silently.
 * Every caller that converts also says so, and `rateAsOf` is what it says it
 * with.
 *
 * Firefly's `/exchange-rates` are stored per (from, to, date). On a stock
 * instance they are anchored on the instance's own currency — the seeded set
 * here is EUR→x — so converting GBP→PLN means going GBP→EUR→PLN. `buildRates`
 * inverts and chains for exactly that reason; without it, two currencies that
 * both had rates would still report "no rate available".
 */

export interface RateRow {
  from: string;
  to: string;
  rate: string;
  date: string;
}

export interface RateTable {
  /** `${from}>${to}` → rate, including inverted and chained pairs. */
  pairs: Map<string, string>;
  /** The newest rate date seen, for disclosure. */
  asOf: string | null;
}

const key = (from: string, to: string) => `${from.toUpperCase()}>${to.toUpperCase()}`;

/**
 * Build a lookup from Firefly's rate rows, adding the inverses and one hop of
 * chaining through each shared base.
 */
export function buildRates(rows: RateRow[]): RateTable {
  const pairs = new Map<string, string>();
  let asOf: string | null = null;

  for (const row of rows) {
    const rate = toDecimal(row.rate);
    // A zero or negative rate is not a rate. Dividing by it later would throw
    // or, worse, produce Infinity and render as a number.
    if (rate.isZero() || rate.isNegative()) continue;
    const from = row.from.toUpperCase();
    const to = row.to.toUpperCase();

    pairs.set(key(from, to), rate.toString());
    if (!pairs.has(key(to, from))) {
      pairs.set(key(to, from), divide('1', rate.toString()).toString());
    }
    if (!asOf || row.date > asOf) asOf = row.date;
  }

  /*
   * One hop through a shared base. `a>base` and `base>b` gives `a>b`.
   * Deliberately a single pass over a snapshot of the direct pairs, not a
   * transitive closure: two hops compound two rounding errors and the result
   * stops being worth showing.
   */
  const direct = [...pairs.entries()];
  for (const [leftKey, leftRate] of direct) {
    const [a, base] = leftKey.split('>') as [string, string];
    for (const [rightKey, rightRate] of direct) {
      const [rightFrom, b] = rightKey.split('>') as [string, string];
      if (rightFrom !== base || a === b) continue;
      if (pairs.has(key(a, b))) continue;
      pairs.set(key(a, b), multiply(leftRate, rightRate).toString());
    }
  }

  for (const code of new Set(rows.flatMap((row) => [row.from, row.to]))) {
    pairs.set(key(code, code), '1');
  }

  return { pairs, asOf };
}

/** The rate, or null when the pair cannot be reached. */
export function rateFor(table: RateTable, from: string, to: string): string | null {
  if (from.toUpperCase() === to.toUpperCase()) return '1';
  return table.pairs.get(key(from, to)) ?? null;
}

/**
 * Convert one amount. Returns null rather than a guess when no rate exists —
 * a missing rate has to reach the UI as "cannot convert", never as zero.
 */
export function convert(amount: string, from: string, to: string, table: RateTable): string | null {
  const rate = rateFor(table, from, to);
  if (rate === null) return null;
  return multiply(amount, rate).toString();
}

export interface CurrencyBucket {
  currency: string;
  amount: string;
}

export interface ConvertedTotal {
  /** The converted sum, in `to`. */
  total: string;
  /** Currencies that were converted, excluding `to` itself. */
  converted: string[];
  /** Currencies with no usable rate; their amounts are NOT in `total`. */
  unconvertible: string[];
}

/**
 * Sum buckets of different currencies into one figure.
 *
 * Anything without a rate is reported separately rather than dropped quietly —
 * a total that silently omits a currency is a wrong total, and the whole point
 * of this module is to stop inventing figures.
 */
export function convertTotal(
  buckets: CurrencyBucket[],
  to: string,
  table: RateTable,
): ConvertedTotal {
  let total = toDecimal(0);
  const converted: string[] = [];
  const unconvertible: string[] = [];

  for (const bucket of buckets) {
    const code = bucket.currency.toUpperCase();
    const target = to.toUpperCase();
    if (code === target) {
      total = total.plus(toDecimal(bucket.amount));
      continue;
    }
    const value = convert(bucket.amount, code, target, table);
    if (value === null) {
      if (!unconvertible.includes(code)) unconvertible.push(code);
      continue;
    }
    total = total.plus(toDecimal(value));
    if (!converted.includes(code)) converted.push(code);
  }

  return { total: total.toString(), converted, unconvertible };
}
