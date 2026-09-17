'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteBudgetLimitAction } from '@/server/firefly/budget-actions';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { AddLimitButton, LimitForm } from './limit-form';
import type { BudgetLimit } from '@/server/firefly/types';

/** E6-03 — per-period limit list, each editable and deletable in place. */
export function LimitsPanel({
  budgetId,
  limits,
  currency,
  timezone,
}: {
  budgetId: string;
  limits: BudgetLimit[];
  currency: string;
  timezone: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sorted = [...limits].sort((a, b) => b.attributes.start.localeCompare(a.attributes.start));

  return (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm">No limits set for any period yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((limit) => {
            const l = limit.attributes;
            if (editingId === limit.id) {
              return (
                <li key={limit.id}>
                  <LimitForm
                    budgetId={budgetId}
                    currency={currency}
                    limit={{ id: limit.id, start: l.start, end: l.end, amount: l.amount }}
                    onDone={() => setEditingId(null)}
                  />
                </li>
              );
            }

            const spent = l.spent?.[0];

            return (
              <li
                key={limit.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {formatDate(l.start.slice(0, 10), { timezone })} –{' '}
                    {formatDate(l.end.slice(0, 10), { timezone })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {spent ? `${spent.sum} spent of ` : ''}
                    {l.amount} {l.currency_code ?? currency}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingId(limit.id)}
                    aria-label="Edit limit"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <form
                    action={deleteBudgetLimitAction}
                    onSubmit={(event) => {
                      if (!confirm('Delete this limit?')) event.preventDefault();
                    }}
                  >
                    <input type="hidden" name="budget_id" value={budgetId} />
                    <input type="hidden" name="limit_id" value={limit.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="text-expense"
                      aria-label="Delete limit"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddLimitButton budgetId={budgetId} currency={currency} />
    </div>
  );
}
