'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

/** E4-02 — filters, kept in the URL so the view is shareable. */
export function AccountFilters({
  type,
  showInactive,
  sort,
}: {
  type: string;
  showInactive: boolean;
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  const selectClass =
    'border-input bg-background h-8 rounded-md border px-2 text-xs disabled:opacity-60';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="type-filter">
        Account type
      </label>
      <select
        id="type-filter"
        value={type}
        disabled={pending}
        onChange={(event) => update('type', event.target.value)}
        className={selectClass}
      >
        <option value="all">All types</option>
        <option value="asset">Asset</option>
        <option value="expense">Expense</option>
        <option value="revenue">Revenue</option>
        <option value="liabilities">Liabilities</option>
        <option value="cash">Cash</option>
      </select>

      <label className="sr-only" htmlFor="sort-filter">
        Sort by
      </label>
      <select
        id="sort-filter"
        value={sort}
        disabled={pending}
        onChange={(event) => update('sort', event.target.value)}
        className={selectClass}
      >
        <option value="name">Name</option>
        <option value="balance">Balance</option>
        <option value="activity">Last activity</option>
      </select>

      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          checked={showInactive}
          disabled={pending}
          onChange={(event) => update('inactive', event.target.checked ? '1' : null)}
          className="size-3.5"
        />
        Show archived
      </label>
    </div>
  );
}
