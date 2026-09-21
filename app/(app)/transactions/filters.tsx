'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SearchBar } from './search-bar';

/** E5-02 / E5-03 — filters, all URL-synced so the view is shareable. */
export function TransactionFilters({
  type,
  search,
  accountId,
  scopeLabel,
  trailing,
}: {
  type: string;
  search: string;
  accountId?: string;
  /** E14-12 — set when a report drilled through to a category/budget/tag. */
  scopeLabel?: string | null;
  /**
   * Controls that belong on the same row as the type filter — saved views.
   * A slot rather than a sibling in the page, because the search box is
   * `w-full` on a phone and forces a line break: anything rendered after this
   * component landed on a third row of its own, so the page spent two bands on
   * two small controls.
   */
  trailing?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    // Any filter change invalidates the current page number.
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1">
      {/* E15-02 — the search box moved out to its own component so it could
          grow operator autocomplete and a typo warning. */}
      <SearchBar initialQuery={search} />

      <label className="sr-only" htmlFor="type-filter">
        Transaction type
      </label>
      <Select
        id="type-filter"
        value={type}
        disabled={pending}
        onChange={(event) =>
          update({ type: event.target.value === 'all' ? null : event.target.value })
        }
        className="disabled:opacity-60"
        containerClassName="w-auto"
      >
        <option value="all">All types</option>
        <option value="withdrawal">Withdrawals</option>
        <option value="deposit">Deposits</option>
        <option value="transfer">Transfers</option>
      </Select>

      {trailing}

      {scopeLabel ? (
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs">
          {scopeLabel}
        </span>
      ) : null}

      {search || accountId || scopeLabel || type !== 'all' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            update({
              q: null,
              account: null,
              type: null,
              category: null,
              budget: null,
              tag: null,
            });
          }}
        >
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
