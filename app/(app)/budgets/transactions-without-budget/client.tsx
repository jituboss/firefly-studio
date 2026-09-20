'use client';

import * as React from 'react';
import { WithoutBudgetTable } from './table';
import { bulkSetBudgetAction } from '@/server/firefly/budget-actions';
import { BulkAssignToolbar } from '@/components/bulk-assign-toolbar';
import type { Transaction } from '@/server/firefly/types';

/**
 * E6-05 — client wrapper that owns selection state for the
 * transactions-without-budget page. Kept separate from the server page so
 * data fetching stays SSR.
 */
export function WithoutBudgetClient({
  transactions,
  timezone,
}: {
  transactions: Transaction[];
  timezone: string;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const selectableIds = React.useMemo(
    () =>
      transactions
        .filter((group) => group.attributes.transactions[0]?.type === 'withdrawal')
        .map((group) => group.id),
    [transactions],
  );

  const toggle = (groupId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const all = new Set(selectableIds);
      const next = prev.size === selectableIds.length ? new Set<string>() : all;
      return next;
    });
  };

  return (
    <>
      <BulkAssignToolbar
        action={bulkSetBudgetAction}
        endpoint="budgets"
        valueName="budget_name"
        applyLabel="Set budget on"
        placeholder="Pick or type a budget…"
        selectedIds={[...selected]}
        onSuccess={() => setSelected(new Set())}
      />
      <WithoutBudgetTable
        transactions={transactions}
        timezone={timezone}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />
    </>
  );
}
