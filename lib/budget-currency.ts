/**
 * Convert a budget's multi-currency `spent` array into a single primary-currency
 * figure, using the exchange rates from Firefly's `/exchange-rates`.
 *
 * The problem this solves: Firefly III returns `budget.attributes.spent` as an
 * array of `{ sum, currency_code }` — one entry per currency used in that
 * budget's transactions. A budget with a BDT limit can have USD spending, and
 * the raw array has both. Without conversion, the UI either picks the wrong
 * entry (showing $62.04 against a BDT 20,000 limit) or splits them into
 * incomparable rows. With conversion, every budget shows in the user's primary
 * currency, which is the whole point of having one.
 *
 * Conversion is always disclosed: the caller knows which currencies were
 * converted and which could not be, so the UI can say "includes $62.04 USD
 * converted at rate as of 2026-09-28" or "some spending in JPY could not be
 * converted" rather than silently inventing or dropping a figure.
 */
import { abs, add, toDecimal } from '@/lib/money';
import { buildRates, convert, type RateTable } from '@/lib/fx';

export interface SpentEntry {
  sum: string;
  currency_code: string;
}

export interface ConvertedSpent {
  /** Total spent in the target currency, converted from all entries. */
  amount: string;
  /** The target currency code. */
  currency: string;
  /** Currencies that were converted (excluding the target itself). */
  convertedCurrencies: string[];
  /** Currencies with no usable rate — their amounts are NOT in `amount`. */
  unconvertible: string[];
  /** The date of the newest rate used, for disclosure. */
  rateAsOf: string | null;
  /** The individual foreign-currency amounts that were converted, for display. */
  foreignAmounts: Array<{ amount: string; currency: string; convertedTo: string }>;
}

/**
 * Build a RateTable from Firefly Exchange-rate resources.
 *
 * Firefly's `ExchangeRate` has `from_currency_code`, `to_currency_code`, `rate`,
 * `date` — this adapts them to the `RateRow` shape `buildRates` expects.
 */
export function buildRateTable(
  rates: Array<{
    attributes: {
      from_currency_code: string;
      to_currency_code: string;
      rate: string;
      date: string;
    };
  }>,
): RateTable {
  const rows = rates.map((r) => ({
    from: r.attributes.from_currency_code,
    to: r.attributes.to_currency_code,
    rate: r.attributes.rate,
    date: r.attributes.date,
  }));
  return buildRates(rows);
}

/**
 * Sum all spent entries into one primary-currency figure.
 *
 * Entries already in the target currency are added directly. Entries in other
 * currencies are converted using the rate table. Entries with no available rate
 * are reported as `unconvertible` — their amounts are NOT included in the total,
 * so the caller can surface "some spending could not be converted" rather than
 * showing a wrong number.
 */
export function convertSpent(
  spent: SpentEntry[] | null | undefined,
  targetCurrency: string,
  rateTable: RateTable | null,
): ConvertedSpent {
  if (!spent || spent.length === 0) {
    return {
      amount: '0',
      currency: targetCurrency,
      convertedCurrencies: [],
      unconvertible: [],
      rateAsOf: rateTable?.asOf ?? null,
      foreignAmounts: [],
    };
  }

  let total = toDecimal(0);
  const convertedCurrencies: string[] = [];
  const unconvertible: string[] = [];
  const foreignAmounts: ConvertedSpent['foreignAmounts'] = [];

  for (const entry of spent) {
    const absAmount = abs(entry.sum).toString();
    const code = entry.currency_code.toUpperCase();
    const target = targetCurrency.toUpperCase();

    if (code === target) {
      total = add(total, absAmount);
      continue;
    }

    if (!rateTable) {
      if (!unconvertible.includes(code)) unconvertible.push(code);
      continue;
    }

    const converted = convert(absAmount, code, target, rateTable);
    if (converted === null) {
      if (!unconvertible.includes(code)) unconvertible.push(code);
      continue;
    }

    total = add(total, converted);
    if (!convertedCurrencies.includes(code)) convertedCurrencies.push(code);
    foreignAmounts.push({
      amount: absAmount,
      currency: entry.currency_code,
      convertedTo: converted,
    });
  }

  return {
    amount: total.toString(),
    currency: targetCurrency,
    convertedCurrencies,
    unconvertible,
    rateAsOf: rateTable?.asOf ?? null,
    foreignAmounts,
  };
}
