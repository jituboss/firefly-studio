'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** E5-02 / E5-03 — filters, all URL-synced so the view is shareable. */
export function TransactionFilters({
  type,
  search,
  accountId,
}: {
  type: string;
  search: string;
  accountId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const [term, setTerm] = React.useState(search);

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
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: term });
        }}
        className="relative flex-1 sm:max-w-xs"
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search descriptions…"
          aria-label="Search transactions"
          className="pl-8"
        />
      </form>

      <label className="sr-only" htmlFor="type-filter">
        Transaction type
      </label>
      <select
        id="type-filter"
        value={type}
        disabled={pending}
        onChange={(event) =>
          update({ type: event.target.value === 'all' ? null : event.target.value })
        }
        className="border-input bg-background h-9 rounded-md border px-2 text-sm disabled:opacity-60"
      >
        <option value="all">All types</option>
        <option value="withdrawal">Withdrawals</option>
        <option value="deposit">Deposits</option>
        <option value="transfer">Transfers</option>
      </select>

      <label className="sr-only" htmlFor="density">
        Row density
      </label>
      <select
        id="density"
        defaultValue={params.get('density') ?? 'comfortable'}
        onChange={(event) => update({ density: event.target.value })}
        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
      >
        <option value="comfortable">Comfortable</option>
        <option value="compact">Compact</option>
      </select>

      {search || accountId || type !== 'all' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTerm('');
            update({ q: null, account: null, type: null });
          }}
        >
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
