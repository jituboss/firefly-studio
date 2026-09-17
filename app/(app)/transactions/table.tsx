'use client';

import * as React from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowRight } from 'lucide-react';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionSplit } from '@/server/firefly/types';

interface Row {
  groupId: string;
  split: TransactionSplit;
  splitCount: number;
}

const TYPE_TONE = {
  withdrawal: 'expense',
  deposit: 'income',
  transfer: 'transfer',
} as const;

/**
 * E5-01 — virtualised transaction grid.
 *
 * A "transaction" in Firefly is a group of splits. The grid renders one row per
 * split so a three-way split shows its three legs, with a badge linking them.
 */
export function TransactionTable({
  transactions,
  timezone,
  density = 'comfortable',
}: {
  transactions: Transaction[];
  timezone: string;
  density?: string;
}) {
  const rows = React.useMemo<Row[]>(
    () =>
      transactions.flatMap((group) =>
        group.attributes.transactions.map((split) => ({
          groupId: group.id,
          split,
          splitCount: group.attributes.transactions.length,
        })),
      ),
    [transactions],
  );

  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowHeight = density === 'compact' ? 40 : 56;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
    // On the server there is no scroll element to measure, so without an
    // initial rect the first render emits zero rows and the grid is empty
    // until hydration. This makes the first screen render server-side.
    initialRect: { width: 1200, height: 720 },
  });

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      {/* Header mirrors the row grid so columns stay aligned while scrolling. */}
      <div className="bg-muted/50 text-muted-foreground grid grid-cols-[6rem_1fr_auto] items-center gap-3 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase md:grid-cols-[6.5rem_1fr_11rem_8rem_8rem]">
        <span>Date</span>
        <span>Description</span>
        <span className="hidden md:block">Account</span>
        <span className="hidden md:block">Category</span>
        <span className="text-right">Amount</span>
      </div>

      <div ref={parentRef} className="max-h-[70vh] overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (!row) return null;
            const { split, groupId, splitCount } = row;
            const outgoing = split.type === 'withdrawal';
            const tone = TYPE_TONE[split.type as keyof typeof TYPE_TONE] ?? 'neutral';

            return (
              <div
                key={`${groupId}-${split.transaction_journal_id}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <Link
                  href={`/transactions/${groupId}`}
                  className={cn(
                    'hover:bg-accent/50 grid h-full grid-cols-[6rem_1fr_auto] items-center gap-3 border-b px-4 transition-colors md:grid-cols-[6.5rem_1fr_11rem_8rem_8rem]',
                  )}
                >
                  <span className="text-muted-foreground tabular text-xs">
                    {formatDate(split.date.slice(0, 10), { timezone, style: 'short' })}
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{split.description}</span>
                      {splitCount > 1 ? (
                        <Badge variant="secondary" className="shrink-0">
                          split {splitCount}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs md:hidden">
                      {split.source_name} → {split.destination_name}
                    </span>
                  </span>

                  <span className="text-muted-foreground hidden min-w-0 items-center gap-1 text-xs md:flex">
                    <span className="truncate">{split.source_name}</span>
                    <ArrowRight className="size-3 shrink-0 opacity-50" aria-hidden="true" />
                    <span className="truncate">{split.destination_name}</span>
                  </span>

                  <span className="text-muted-foreground hidden truncate text-xs md:block">
                    {split.category_name ?? '—'}
                  </span>

                  <span className="text-right">
                    <Amount
                      value={outgoing ? `-${split.amount}` : split.amount}
                      currency={split.currency_code}
                      decimalPlaces={split.currency_decimal_places}
                      tone={tone}
                      size="sm"
                    />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
