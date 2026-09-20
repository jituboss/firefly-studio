import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * E21-01 — the select primitive.
 *
 * A native `<select>`, not a listbox built out of divs. The native control
 * already gets keyboard behaviour, type-ahead, screen-reader semantics and —
 * the part no custom implementation matches — the platform picker on a phone,
 * which is a scroll wheel your thumb can reach rather than a dropdown pinned
 * to the top of the viewport.
 *
 * What this adds is the chrome: the same border, height and focus ring as
 * `Input`, and a chevron, because `appearance-none` is needed to make the
 * control look like the rest of the app and it takes the native arrow with it.
 *
 * It exists because sixteen places had hand-copied the same class string, and
 * a seventeenth would have copied it again from whichever of those it found
 * first.
 */
function Select({
  className,
  containerClassName,
  children,
  ...props
}: React.ComponentProps<'select'> & {
  /**
   * Layout classes for the wrapper. The chevron is positioned against it, so
   * the wrapper — not the control — is what a caller sizes: a `sm:w-32` on the
   * select alone would shrink the control inside a wrapper still claiming the
   * full row.
   */
  containerClassName?: string;
}) {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      <select
        data-slot="select"
        className={cn(
          'border-input bg-background flex h-9 w-full appearance-none rounded-md border py-1 pr-8 pl-3 text-sm shadow-xs transition-colors',
          'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-expense',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-60"
        aria-hidden="true"
      />
    </div>
  );
}

export { Select };
