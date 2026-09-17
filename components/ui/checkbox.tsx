'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * E21 — the checkbox primitive.
 *
 * Still a real `<input type="checkbox">`, so keyboard, form submission, label
 * association and assistive technology all behave natively. `appearance-none`
 * removes the platform rendering and the box is drawn with the design tokens,
 * which is what `accent-color` alone could not do — it tints the tick but
 * leaves the browser's own border, size and focus ring, and those differ enough
 * between Safari, Chrome and Firefox to look broken next to the rest of the UI.
 *
 * The glyph is a sibling rather than a background image so it inherits
 * `currentColor` and stays crisp at any zoom.
 */
export interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type' | 'size'> {
  /** Some-but-not-all state, for a "select all" that is partially satisfied. */
  indeterminate?: boolean;
}

export function Checkbox({ className, indeterminate = false, ...props }: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  // `indeterminate` is a DOM property with no HTML attribute, so it cannot be
  // set through JSX and has to be written on the node.
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer border-input size-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border',
          'bg-background transition-colors',
          'hover:border-primary/60',
          'checked:border-primary checked:bg-primary',
          'indeterminate:border-primary indeterminate:bg-primary',
          'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      {/* pointer-events-none so the glyph never swallows a click meant for the
          input underneath it. */}
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className={cn(
          'text-primary-foreground pointer-events-none absolute size-3 opacity-0 transition-opacity',
          'peer-checked:opacity-100',
          indeterminate && 'peer-checked:opacity-0',
        )}
      />
      <Minus
        aria-hidden="true"
        strokeWidth={3}
        className={cn(
          'text-primary-foreground pointer-events-none absolute size-3 transition-opacity',
          indeterminate ? 'opacity-100' : 'opacity-0',
        )}
      />
    </span>
  );
}
