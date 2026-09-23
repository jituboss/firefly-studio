'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SearchBar } from './search-bar';

/**
 * E5-02 / E5-03 — filters, all URL-synced so the view is shareable.
 *
 * **The toolbar is one row at every width.** It used to be a wrapping flex row
 * holding a full-width search box, a type `<select>`, four saved-view controls
 * and a Clear button; on a 390px phone that wrapped to three bands, and the
 * grid — the thing the page is for — started below the fold. A bar that tall
 * also reads as a form to fill in rather than as a filter you occasionally
 * touch.
 *
 * So: search takes the row, and everything else is behind two buttons that
 * shrink to their glyphs on a phone. The type picker moved into a menu because
 * a bare `<select>` reading "All types" is a control that costs 110px to say
 * nothing is filtered.
 *
 * What the bar no longer shows, it still says: the count, range, account and
 * drill-through scope are in the page subtitle above, which was already
 * rendering them.
 */

const TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'transfer', label: 'Transfers' },
] as const;

export function TransactionFilters({
  type,
  search,
  accountId,
  accountLabel,
  scopeLabel,
  trailing,
}: {
  type: string;
  search: string;
  accountId?: string;
  /** The pinned account's name, so the menu can name what it is removing. */
  accountLabel?: string | null;
  /** E14-12 — set when a report drilled through to a category/budget/tag. */
  scopeLabel?: string | null;
  /**
   * Controls that belong on the same row as the filter button — saved views.
   * A slot rather than a sibling in the page, because the search box grows to
   * fill the row: anything rendered after this component landed on a row of
   * its own.
   */
  trailing?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      // Any filter change invalidates the current page number.
      next.delete('page');
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router],
  );

  /*
   * The search term is deliberately NOT counted here. It is sitting in the box
   * next to this button in the user's own words; a badge saying "1" beside it
   * would be the same fact told twice, and would make the button look active on
   * a page with no filters applied at all.
   */
  const active = [type !== 'all', Boolean(accountId), Boolean(scopeLabel)].filter(Boolean).length;
  const anything = active > 0 || Boolean(search);

  const clearAll = () =>
    update({ q: null, account: null, type: null, category: null, budget: null, tag: null });

  return (
    /* `items-start`, not `items-center`: the search box grows a typo warning
       and a quoting hint below itself, and centring would push the two buttons
       down the row every time one appeared. */
    <div className="flex w-full min-w-0 items-start gap-2">
      {/* E15-02 — the search box moved out to its own component so it could
          grow operator autocomplete and a typo warning. */}
      <SearchBar initialQuery={search} />

      <Popover
        align="end"
        label="Filters"
        contentClassName="w-72"
        trigger={(props) => (
          <Button
            {...props}
            type="button"
            variant={active > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 shrink-0 max-sm:w-9 max-sm:px-0"
            disabled={pending}
          >
            <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
            <span className="max-sm:sr-only">Filters</span>
            {active > 0 ? (
              <span
                className="bg-primary text-primary-foreground tabular grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                aria-hidden="true"
              >
                {active}
              </span>
            ) : null}
            {/* The badge is decorative — the count is in the name instead, so a
                screen reader is not read a bare digit after the word. */}
            <span className="sr-only">{active > 0 ? `, ${active} applied` : ''}</span>
          </Button>
        )}
      >
        {(close) => (
          <div className="text-sm">
            <p className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-medium tracking-wide uppercase">
              Transaction type
            </p>
            {/*
              A `<div>`, not a `<ul>`. `role="radiogroup"` on a list element
              overrides its list semantics, which orphans every `<li>` inside
              it — axe reports `listitem` at serious, and only in the OPEN
              state, so the page scan that runs over closed menus never sees
              it. The buttons are the group's children directly.
            */}
            <div className="p-1" role="radiogroup" aria-label="Transaction type">
              {TYPES.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  role="radio"
                  aria-checked={type === entry.value}
                  onClick={() => {
                    update({ type: entry.value === 'all' ? null : entry.value });
                    close();
                  }}
                  className={cn(
                    'hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left',
                    type === entry.value && 'font-medium',
                  )}
                >
                  <Check
                    className={cn('size-3.5 shrink-0', type !== entry.value && 'invisible')}
                    aria-hidden="true"
                  />
                  {entry.label}
                </button>
              ))}
            </div>

            {/*
              The scope filters are set from somewhere else — an account page,
              or a chart element in a report — so the only thing this menu owes
              them is a way OUT. Landing on a pre-filtered list with no visible
              way to widen it is how a short list looks like a bug.
            */}
            {accountId || scopeLabel ? (
              <>
                <p className="text-muted-foreground border-t px-3 pt-2.5 pb-1 text-xs font-medium tracking-wide uppercase">
                  Scoped to
                </p>
                <ul className="space-y-1 p-1">
                  {accountId ? (
                    <ScopeChip
                      label={accountLabel ?? 'One account'}
                      onRemove={() => update({ account: null })}
                    />
                  ) : null}
                  {scopeLabel ? (
                    <ScopeChip
                      label={scopeLabel}
                      onRemove={() => update({ category: null, budget: null, tag: null })}
                    />
                  ) : null}
                </ul>
              </>
            ) : null}

            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-start"
                disabled={!anything}
                onClick={() => {
                  clearAll();
                  close();
                }}
              >
                <X className="size-4" aria-hidden="true" />
                Clear all filters
              </Button>
            </div>
          </div>
        )}
      </Popover>

      {trailing}
    </div>
  );
}

function ScopeChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li className="bg-muted flex items-center gap-1 rounded-md py-1 pr-1 pl-2">
      <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        aria-label={`Remove filter ${label}`}
        onClick={onRemove}
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </li>
  );
}
