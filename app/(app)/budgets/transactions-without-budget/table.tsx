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
      <div className="bg-muted/50 text-muted-foreground grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase sm:grid-cols-[2.5rem_6rem_1fr_auto]">
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
        {/* The date has no column of its own on a phone — it sits under the
            description — so its heading would label thin air. */}
        <span className="hidden sm:block">Date</span>
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
                // Four columns need 2.5rem + 6rem + three 12px gaps + 2rem of
                // padding before the description and the amount get anything —
                // 204px of a 390px phone. The two of them fought over what was
                // left and the description ran straight through the amount.
                // Under `sm` the date drops to a second line and the amount
                // spans both, which is the same shape the transactions list
                // uses.
                'grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 transition-colors',
                'sm:grid-cols-[2.5rem_6rem_1fr_auto] sm:gap-y-0',
                isSelected ? 'bg-accent/40' : 'hover:bg-accent/50',
              )}
            >
              {split.type === 'withdrawal' ? (
                <input
                  type="checkbox"
                  aria-label={`Select transaction ${split.description}`}
                  className="col-start-1 row-span-2 size-4 cursor-pointer self-center sm:row-span-1"
                  checked={isSelected}
                  onChange={() => onToggle?.(group.id)}
                />
              ) : (
                <span className="col-start-1" />
              )}

              <Link
                href={`/transactions/${group.id}`}
                className="text-muted-foreground tabular col-start-2 row-start-2 text-xs sm:col-start-2 sm:row-start-1"
              >
                {formatDate(split.date.slice(0, 10), { timezone, style: 'short' })}
              </Link>

              <Link
                href={`/transactions/${group.id}`}
                className="col-start-2 row-start-1 min-w-0 sm:col-start-3"
              >
                <span className="block truncate text-sm font-medium">{split.description}</span>
              </Link>

              <span className="col-start-3 row-span-2 row-start-1 self-center text-right sm:col-start-4 sm:row-span-1">
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
