import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * E21-01 — the data table.
 *
 * A real `<table>`, because the semantics are the feature: a screen reader
 * announces "column 3 of 5, Net" when you arrow across a cell, and nothing
 * built from divs gives you that without re-declaring the entire grid in ARIA.
 * What this adds is the chrome the reports had each re-typed by hand, plus the
 * two things every one of those copies was missing.
 *
 * **The scroll container is focusable.** A `<div class="overflow-x-auto">` can
 * be scrolled by a mouse wheel and by a touch drag and by nothing else: a
 * keyboard user cannot reach the columns past the fold, because there is no
 * focusable element inside them to Tab to. `tabIndex={0}` on the region is the
 * fix (it is also axe's `scrollable-region-focusable` rule), and a focusable
 * region needs a name, which is what `label` is for.
 *
 * **Cards below the breakpoint are built in.** Four numeric columns at 390px
 * is the layout that put amounts on top of each other in
 * `transactions-without-budget`. `cards` turns each row into a stacked block
 * with its column heading beside each value, and `TD` takes the `label` that
 * heading comes from. It is opt-in rather than automatic because a two-column
 * table is more readable as a narrow table than as a stack of cards.
 */

export function Table({
  children,
  label,
  cards,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  /** Names the scrollable region. Required — an unnamed tab stop is worse than none. */
  label: string;
  /** Collapse rows into stacked cards below `sm`. */
  cards?: boolean;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'focus-visible:ring-ring relative min-w-0 overflow-x-auto outline-none focus-visible:ring-2',
        containerClassName,
      )}
    >
      <table
        data-slot="table"
        data-cards={cards ? '' : undefined}
        className={cn('w-full min-w-0 text-sm', className)}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead
      data-slot="table-head"
      className={cn('text-muted-foreground text-left text-xs', className)}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody data-slot="table-body" className={className}>
      {children}
    </tbody>
  );
}

export function TFoot({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tfoot data-slot="table-foot" className={cn('font-medium', className)}>
      {children}
    </tfoot>
  );
}

export function TR({
  children,
  head,
  className,
}: {
  children: React.ReactNode;
  /** A heading row: a full-weight bottom border rather than the row hairline. */
  head?: boolean;
  className?: string;
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(head ? 'border-border border-b' : 'border-border/60 border-b', className)}
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  align = 'left',
  hideBelow,
  className,
  ...rest
}: {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Drop the column below this breakpoint. Pair with the matching `TD`. */
  hideBelow?: 'sm' | 'md' | 'lg';
  className?: string;
} & Omit<React.ComponentProps<'th'>, 'className' | 'align'>) {
  return (
    <th
      scope="col"
      data-slot="table-header-cell"
      className={cn(
        'py-1.5 font-medium',
        ALIGN[align],
        hideBelow && HIDE_BELOW[hideBelow],
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  align = 'left',
  hideBelow,
  label,
  className,
  ...rest
}: {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  hideBelow?: 'sm' | 'md' | 'lg';
  /** The column heading, shown beside the value in card mode. */
  label?: string;
  className?: string;
} & Omit<React.ComponentProps<'td'>, 'className' | 'align'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('py-2', ALIGN[align], hideBelow && HIDE_BELOW[hideBelow], className)}
      /*
       * The label rides as a data attribute and is rendered by a `::before` in
       * the card-mode media query in globals.css — not as a `<span class="sm:hidden">`.
       * A hidden span is still in the accessibility tree's text content, so on
       * a desktop screen reader every cell would read "In -1,234.56" with the
       * column name duplicated: once from the `<th>` association and once from
       * the span. Generated content is not in the accessibility tree at all,
       * which is exactly right for something that only repeats the header.
       */
      data-label={label}
      {...rest}
    >
      {children}
    </td>
  );
}

const ALIGN = {
  left: 'pr-3 text-left last:pr-0',
  center: 'px-1.5 text-center',
  right: 'pr-3 text-right last:pr-0',
} as const;

const HIDE_BELOW = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;
