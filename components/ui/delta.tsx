import * as React from 'react';
import { computeDelta, isImprovement } from '@/lib/delta';
import type { MoneyInput } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * E21-02 — period-over-period change.
 *
 * This exists because the one hand-rolled version was wrong in a way nobody
 * would notice from the code. It computed the change with signed arithmetic
 * and coloured it by sign, while the tile above it displayed a MAGNITUDE. For
 * spending, which Firefly reports as a negative number, that produced
 * "Spent ↑ 48.7%" in green on a period where spending had fallen: the arrow
 * said up, the colour said good, and the truth was neither.
 *
 * So two decisions belong to the caller and are named rather than inferred:
 *
 *   `compare`    — 'magnitude' for a quantity rendered without its sign
 *                  (earned, spent), 'value' for one that is meaningful signed
 *                  (net worth, which can be negative and improve by rising).
 *   `betterWhen` — whether up is good. Spending more is not an improvement,
 *                  and no amount of arithmetic can work that out.
 *
 * The arrow is `aria-hidden`: a screen reader announcing "downwards arrow
 * 12.4 percent" is worse than the sentence this builds instead.
 */
export function Delta({
  current,
  previous,
  compare = 'value',
  betterWhen = 'higher',
  suffix = 'vs. previous period',
  className,
}: {
  current: MoneyInput;
  previous?: MoneyInput;
  compare?: 'value' | 'magnitude';
  betterWhen?: 'higher' | 'lower';
  suffix?: string;
  className?: string;
}) {
  const { percent, direction } = computeDelta(current, previous, compare);

  if (percent === null) {
    return (
      <p className={cn('text-muted-foreground text-xs', className)}>No comparison available</p>
    );
  }

  if (direction === 'flat') {
    return <p className={cn('text-muted-foreground text-xs', className)}>Unchanged {suffix}</p>;
  }

  const rose = direction === 'up';
  const good = isImprovement(direction, betterWhen);
  const magnitude = `${Math.abs(percent).toFixed(1)}%`;

  return (
    <p className={cn('text-muted-foreground text-xs', className)}>
      <span className={good ? 'text-income' : 'text-expense'}>
        <span aria-hidden="true">{rose ? '↑' : '↓'} </span>
        {/* Spelled out for a screen reader, because an arrow glyph is not a
            direction to anything that reads the accessibility tree. */}
        <span className="sr-only">{rose ? 'up' : 'down'} </span>
        {magnitude}
      </span>{' '}
      {suffix}
    </p>
  );
}
