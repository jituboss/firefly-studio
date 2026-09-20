import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * E21-02 — the progress primitive.
 *
 * Seven places had written the same nested pair of divs with the same four
 * ARIA attributes, and each one had to remember that a budget over 100% must
 * still not draw past the end of its track — `width: 137%` on an inner div
 * escapes the rounded track and paints over whatever is beside it. One of them
 * did remember; that is the version here.
 *
 * `over` is a separate flag rather than something inferred from `value > max`,
 * because "spent 98% of the budget" and "spent 137%" are both worth colouring
 * red on a page where the point is noticing before it happens — the caller
 * decides where the line is, this draws it.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  over = false,
  tone = 'primary',
  size = 'md',
  className,
}: {
  /** Already a percentage of `max` — the caller owns the arithmetic, which is decimal money. */
  value: number;
  max?: number;
  /** Required: a bar with no accessible name is an unlabelled number to a screen reader. */
  label: string;
  over?: boolean;
  /** Savings bars are green; budget usage is the primary hue. */
  tone?: 'primary' | 'income';
  /** `sm` is the 1.5px track used in dense lists; `md` the 2px hero bar. */
  size?: 'sm' | 'md';
  className?: string;
}) {
  // Two different clamps, for two different consumers.
  //
  // What is DRAWN is clamped, because `width: 824%` on the fill escapes the
  // rounded track and paints over whatever sits beside it — and 824% is not
  // hypothetical: an available-budget envelope on the test ledger reads
  // exactly that.
  //
  // What is ANNOUNCED is clamped too, because `aria-valuenow` outside
  // min..max is invalid and a screen reader may do anything with it — but the
  // true figure is not thrown away, it moves to `aria-valuetext`, which exists
  // for precisely this. Saying "100%" to someone whose budget is four times
  // spent would be the accessible version of hiding the problem.
  const percent = (value / max) * 100;
  const drawn = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={cn(
        'bg-muted overflow-hidden rounded-full',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(drawn)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(percent)}%`}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300',
          over ? 'bg-expense' : tone === 'income' ? 'bg-income' : 'bg-primary',
        )}
        style={{ width: `${drawn}%` }}
      />
    </div>
  );
}
