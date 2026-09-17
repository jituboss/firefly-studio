import * as React from 'react';
import { cn } from '@/lib/utils';
import { describeMoney, formatMoney, isNegative, isZero, type MoneyInput } from '@/lib/money';

/**
 * E21-02 — the money primitive.
 *
 * Three rules this component exists to enforce:
 *   1. Tabular numerals, so columns of figures align on the decimal point.
 *   2. Colour never carries meaning alone — a sign glyph and a screen-reader
 *      label always accompany the hue (WCAG 1.4.1).
 *   3. Formatting happens here and nowhere else, via lib/money.ts.
 *
 * The `data-slot="amount"` attribute is what the "hide balances" privacy
 * toggle (E3-14) blurs, so every amount on screen must render through this.
 */

export type AmountTone = 'auto' | 'neutral' | 'income' | 'expense' | 'transfer';

export interface AmountProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  value: MoneyInput;
  currency?: string;
  locale?: string;
  decimalPlaces?: number;
  /** `auto` colours by sign; the explicit tones colour by transaction type. */
  tone?: AmountTone;
  /** Render an explicit +/- glyph. On by default for `auto` and deltas. */
  showSign?: boolean;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const toneClasses: Record<Exclude<AmountTone, 'auto'>, string> = {
  neutral: 'text-foreground',
  income: 'text-income',
  expense: 'text-expense',
  transfer: 'text-transfer',
};

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg font-semibold',
  // A three-letter ISO code plus a millions-scale figure ("BDT 4,692,202.50")
  // is ~350px at text-3xl, which overflows a quarter-width KPI tile. Capping at
  // text-2xl keeps the whole figure visible rather than truncating the headline
  // number, which is the one thing on the tile that must stay readable.
  xl: 'text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight',
} as const;

export function Amount({
  value,
  currency,
  locale = 'en-US',
  decimalPlaces = 2,
  tone = 'auto',
  showSign,
  compact = false,
  size = 'md',
  className,
  ...props
}: AmountProps) {
  const negative = isNegative(value);
  const zero = isZero(value);

  const resolvedTone: Exclude<AmountTone, 'auto'> =
    tone === 'auto' ? (zero ? 'neutral' : negative ? 'expense' : 'income') : tone;

  const withSign = showSign ?? tone === 'auto';

  const formatted = formatMoney(value, {
    currency,
    locale,
    decimalPlaces,
    compact,
    // `exceptZero` keeps a bare 0 from rendering as "+0".
    signDisplay: withSign ? 'exceptZero' : 'auto',
  });

  return (
    <span
      data-slot="amount"
      className={cn(
        'tabular whitespace-nowrap',
        toneClasses[resolvedTone],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {/* The visible glyph is inside the formatted string via signDisplay; this
          label is what a screen reader announces instead of a bare minus sign. */}
      <span aria-hidden="true">{formatted}</span>
      <span className="sr-only">{describeMoney(value, currency, locale)}</span>
    </span>
  );
}
