'use client';

import * as React from 'react';
import { UncategorisedTable } from './table';
import { BulkToolbar } from './bulk-toolbar';
import type { Transaction } from '@/server/firefly/types';

/**
 * E7-04 — client wrapper that owns selection state for the uncategorised
 * inbox. Kept separate from the server page so data fetching stays SSR.
 */
export function UncategorisedClient({
  transactions,
  timezone,
}: {
  transactions: Transaction[];
  timezone: string;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const ids = React.useMemo(() => transactions.map((t) => t.id), [transactions]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const all = new Set(ids);
      const next = prev.size === ids.length ? new Set<string>() : all;
      return next;
    });
  };

  return (
    <>
      <BulkToolbar selectedIds={[...selected]} onSuccess={() => setSelected(new Set())} />
      <UncategorisedTable
        transactions={transactions}
        timezone={timezone}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />
    </>
  );
}
