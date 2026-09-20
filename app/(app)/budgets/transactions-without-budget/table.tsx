'use client';

import * as React from 'react';
import Link from 'next/link';
import { Amount } from '@/components/ui/amount';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/server/firefly/types';

/**
 * E6-05 — selectable list for transactions without a budget. Only
 * withdrawals get a checkbox: budgets don't apply to transfers or deposits.
 */
export function WithoutBudgetTable({
  transactions,
  timezone,
  selected,
  onToggle,
  onToggleAll,
}: {
  transactions: Transaction[];
  timezone: string;
  selected?: Set<string>;
  onToggle?: (groupId: string) => void;
  onToggleAll?: () => void;
}) {
  const selectedSet = selected ?? new Set<string>();
  const selectableIds = React.useMemo(
    () =>
      transactions
        .filter((group) => group.attributes.transactions[0]?.type === 'withdrawal')
        .map((group) => group.id),
    [transactions],
  );

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id));
  const someSelected = selectableIds.some((id) => selectedSet.has(id)) && !allSelected;

  return (
    <div className="bg-card min-w-0 overflow-hidden rounded-xl border">
      <div className="bg-muted/50 text-muted-foreground grid grid-cols-[2.5rem_6rem_1fr_auto] items-center gap-3 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase">
        <input
          type="checkbox"
          aria-label="Select all transactions without budget"
          className="size-4 cursor-pointer"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={() => onToggleAll?.()}
        />
        <span>Date</span>
        <span>Description</span>
        <span className="text-right">Amount</span>
      </div>

      <div className="divide-border divide-y">
        {transactions.map((group) => {
          const split = group.attributes.transactions[0];
          if (!split) return null;
          const outgoing = split.type === 'withdrawal';
          const isSelected = selectedSet.has(group.id);

          return (
            <div
              key={group.id}
              className={cn(
                'grid grid-cols-[2.5rem_6rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors',
                isSelected ? 'bg-accent/40' : 'hover:bg-accent/50',
              )}
            >
              {split.type === 'withdrawal' ? (
                <input
                  type="checkbox"
                  aria-label={`Select transaction ${split.description}`}
                  className="size-4 cursor-pointer"
                  checked={isSelected}
                  onChange={() => onToggle?.(group.id)}
                />
              ) : (
                <span />
              )}

              <Link
                href={`/transactions/${group.id}`}
                className="text-muted-foreground tabular text-xs"
              >
                {formatDate(split.date.slice(0, 10), { timezone, style: 'short' })}
              </Link>

              <Link href={`/transactions/${group.id}`} className="min-w-0">
                <span className="truncate text-sm font-medium">{split.description}</span>
              </Link>

              <span className="text-right">
                <Amount
                  value={outgoing ? `-${split.amount}` : split.amount}
                  currency={split.currency_code}
                  decimalPlaces={split.currency_decimal_places}
                  tone={outgoing ? 'expense' : split.type === 'deposit' ? 'income' : 'neutral'}
                  size="sm"
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
