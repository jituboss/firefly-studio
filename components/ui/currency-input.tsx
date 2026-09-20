import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * E21-02 — the money input.
 *
 * Sixteen amount fields had each set `inputMode="decimal"` by hand and then
 * disagreed about the rest: one used tabular numerals, the others did not, and
 * none of them said which currency the number was in even on forms where the
 * answer was not obvious.
 *
 * Deliberately `type="text"` with `inputMode="decimal"`, not `type="number"`:
 *
 *   - a number input's scroll wheel silently changes an amount when someone
 *     scrolls a long form with the cursor resting in it;
 *   - Firefox and Safari accept `1,5` in a number field and hand back an empty
 *     string on read, so a typo becomes a silently missing amount;
 *   - and the value must stay a string all the way to the Server Action
 *     anyway, because money in this codebase is never a float.
 *
 * The currency code is a suffix rather than a prefix symbol: this app is
 * multi-currency, the same form serves EUR and BDT, and "EUR" after the number
 * is unambiguous where a prefixed "€" is one glyph to misread.
 */
export function CurrencyInput({
  currency,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type' | 'inputMode'> & {
  /** Shown as a suffix. Omit when the surrounding form already states it. */
  currency?: string;
}) {
  const input = (
    <Input
      type="text"
      inputMode="decimal"
      // Deliberately no `pattern`. One was tried and removed: it rejected a
      // pasted "1,234.56" at the browser level with a message the user cannot
      // act on, where the Server Action parses that string perfectly well
      // through lib/money. Client-side validation that is stricter than the
      // server is just a way to refuse valid input.
      autoComplete="off"
      className={cn('tabular', currency && 'pr-14', className)}
      {...props}
    />
  );

  if (!currency) return input;

  return (
    <div className="relative">
      {input}
      <span
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium"
        // The field's own label already names the amount; this is a unit, and
        // a screen reader reading "EUR" between the label and the value adds
        // nothing it cannot get from the form.
        aria-hidden="true"
      >
        {currency}
      </span>
    </div>
  );
}
