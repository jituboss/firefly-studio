import Decimal from 'decimal.js';

/**
 * E21-10 — the money layer.
 *
 * Firefly III returns every monetary amount as a STRING ("-1234.56"), precisely
 * so that clients do not round-trip it through a float. An amount stays a string
 * from the API to the render boundary; all arithmetic happens on Decimal.
 *
 * The ESLint config bans `Number()` and `parseFloat` everywhere except this file.
 */

// 28 significant digits is far more than any currency needs, and ROUND_HALF_EVEN
// (banker's rounding) avoids the systematic upward bias of ROUND_HALF_UP when
// summing large numbers of transactions.
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export type MoneyInput = string | number | Decimal | null | undefined;

/** Coerce a Firefly amount to Decimal. Null/undefined/empty/NaN all become 0. */
export function toDecimal(value: MoneyInput): Decimal {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  try {
    const decimal = new Decimal(value);
    return decimal.isFinite() ? decimal : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

export const add = (...values: MoneyInput[]): Decimal =>
  values.reduce<Decimal>((total, value) => total.plus(toDecimal(value)), new Decimal(0));

export const subtract = (a: MoneyInput, b: MoneyInput): Decimal => toDecimal(a).minus(toDecimal(b));

export const multiply = (a: MoneyInput, b: MoneyInput): Decimal => toDecimal(a).times(toDecimal(b));

/** Division guarded against a zero denominator, which is common in ratio maths. */
export function divide(a: MoneyInput, b: MoneyInput): Decimal {
  const denominator = toDecimal(b);
  if (denominator.isZero()) return new Decimal(0);
  return toDecimal(a).dividedBy(denominator);
}

export const negate = (value: MoneyInput): Decimal => toDecimal(value).negated();
export const abs = (value: MoneyInput): Decimal => toDecimal(value).abs();

export const isZero = (value: MoneyInput): boolean => toDecimal(value).isZero();
export const isNegative = (value: MoneyInput): boolean => toDecimal(value).isNegative();
export const isPositive = (value: MoneyInput): boolean => toDecimal(value).greaterThan(0);

export const compare = (a: MoneyInput, b: MoneyInput): -1 | 0 | 1 =>
  toDecimal(a).comparedTo(toDecimal(b)) as -1 | 0 | 1;

/** Percentage of `part` within `whole`, clamped to [0, 100] when requested. */
export function percentOf(part: MoneyInput, whole: MoneyInput, clamp = false): Decimal {
  const pct = divide(part, whole).times(100);
  if (!clamp) return pct;
  return Decimal.min(Decimal.max(pct, 0), 100);
}

/** Back to the wire format Firefly expects on write. */
export const toApiString = (value: MoneyInput, decimalPlaces = 2): string =>
  toDecimal(value).toFixed(decimalPlaces);

export interface FormatMoneyOptions {
  /** ISO 4217 code, e.g. 'EUR'. */
  currency?: string;
  locale?: string;
  /** Firefly currencies carry their own decimal_places; honour it. */
  decimalPlaces?: number;
  /** Render 1 234,56 instead of € 1 234,56. */
  hideSymbol?: boolean;
  /** Always render an explicit + for positive values (deltas). */
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  /** 1.2k instead of 1 234,56 — for dense chart axes only. */
  compact?: boolean;
}

/**
 * Format for display. This is the ONLY place a Decimal becomes a Number, and it
 * happens at the very last step, after all arithmetic is complete, purely so
 * Intl.NumberFormat can do locale-aware grouping and symbol placement.
 */
export function formatMoney(value: MoneyInput, options: FormatMoneyOptions = {}): string {
  const {
    currency,
    locale = 'en-US',
    decimalPlaces = 2,
    hideSymbol = false,
    signDisplay = 'auto',
    compact = false,
  } = options;

  const decimal = toDecimal(value);

  const formatter = new Intl.NumberFormat(locale, {
    style: currency && !hideSymbol ? 'currency' : 'decimal',
    currency: currency && !hideSymbol ? currency : undefined,
    minimumFractionDigits: compact ? 0 : decimalPlaces,
    maximumFractionDigits: compact ? 1 : decimalPlaces,
    signDisplay,
    notation: compact ? 'compact' : 'standard',
  });

  return formatter.format(decimal.toNumber());
}

/** Screen-reader text for an amount — never rely on colour alone (E21-02). */
export function describeMoney(value: MoneyInput, currency?: string, locale = 'en-US'): string {
  const decimal = toDecimal(value);
  const direction = decimal.isNegative() ? 'outgoing' : decimal.isZero() ? 'no change' : 'incoming';
  return `${direction} ${formatMoney(decimal.abs(), { currency, locale })}`;
}

export { Decimal };
