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

  React.useEffect(() => {
    document.dispatchEvent(
      new CustomEvent('uncategorised-rows', { detail: { rows: ids.map((id) => ({ id })) } }),
    );
  }, [ids]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      document.dispatchEvent(
        new CustomEvent('uncategorised-sync-selection', { detail: { ids: [...next] } }),
      );
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const all = new Set(ids);
      const next = prev.size === ids.length ? new Set<string>() : all;
      document.dispatchEvent(
        new CustomEvent('uncategorised-sync-selection', { detail: { ids: [...next] } }),
      );
      return next;
    });
  };

  return (
    <>
      <BulkToolbar selectedCount={selected.size} />
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
