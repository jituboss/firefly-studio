'use client';

import * as React from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowRight, Paperclip } from 'lucide-react';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date';
import { add, toDecimal } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionSplit } from '@/server/firefly/types';

type Row =
  | {
      kind: 'day';
      date: string;
      /** Net for the day, or null when the day mixes currencies. */
      net: string | null;
      currency: string;
      count: number;
    }
  | { kind: 'split'; groupId: string; split: TransactionSplit; splitCount: number };

const TYPE_TONE = {
  withdrawal: 'expense',
  deposit: 'income',
  transfer: 'transfer',
} as const;

const DAY_HEIGHT = 34;

/** A withdrawal leaves the account, so it counts against the day's net. */
const signedAmount = (split: TransactionSplit) =>
  split.type === 'withdrawal' ? toDecimal(split.amount).negated() : toDecimal(split.amount);

/**
 * E5-01 — virtualised transaction grid.
 *
 * A "transaction" in Firefly is a group of splits. The grid renders one row per
 * split so a three-way split shows its three legs, with a badge linking them.
 *
 * Rows are grouped under a day header carrying that day's net, because a flat
 * list of fifty dated rows makes the reader do the grouping in their head. The
 * headers are ordinary virtual items — variable-height measurement is what
 * `estimateSize` is for — so the list stays virtualised at any length.
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
  const rowHeight = density === 'compact' ? 40 : 56;

  const rows = React.useMemo<Row[]>(() => {
    const splits = transactions.flatMap((group) =>
      group.attributes.transactions.map((split) => ({
        groupId: group.id,
        split,
        splitCount: group.attributes.transactions.length,
      })),
    );

    const out: Row[] = [];
    let currentDay: string | null = null;
    let buffer: typeof splits = [];

    const flush = () => {
      if (buffer.length === 0 || currentDay === null) return;
      const currencies = new Set(buffer.map((entry) => entry.split.currency_code));
      // Never add two currencies together (lib/money's standing rule); a mixed
      // day reports its count instead of a number that means nothing.
      const net =
        currencies.size === 1
          ? buffer.reduce((sum, entry) => add(sum, signedAmount(entry.split)), toDecimal(0))
          : null;
      out.push({
        kind: 'day',
        date: currentDay,
        net: net ? net.toString() : null,
        currency: buffer[0]!.split.currency_code,
        count: buffer.length,
      });
      for (const entry of buffer) out.push({ kind: 'split', ...entry });
      buffer = [];
    };

    for (const entry of splits) {
      const day = entry.split.date.slice(0, 10);
      if (day !== currentDay) {
        flush();
        currentDay = day;
      }
      buffer.push(entry);
    }
    flush();

    return out;
  }, [transactions]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.kind === 'day' ? DAY_HEIGHT : rowHeight),
    overscan: 12,
    // On the server there is no scroll element to measure, so without an
    // initial rect the first render emits zero rows and the grid is empty
    // until hydration. This makes the first screen render server-side.
    initialRect: { width: 1200, height: 720 },
  });

  const columns =
    'grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_11rem_8rem_8rem] items-center gap-3 px-4';

  return (
    <div className="bg-card min-w-0 overflow-hidden rounded-xl border">
      {/* Header mirrors the row grid so columns stay aligned while scrolling. */}
      <div
        className={cn(
          'bg-muted/50 text-muted-foreground grid border-b py-2 text-xs font-medium tracking-wide uppercase',
          columns,
        )}
      >
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

            const style: React.CSSProperties = {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: item.size,
              transform: `translateY(${item.start}px)`,
            };

            if (row.kind === 'day') {
              return (
                <div key={`day-${row.date}`} style={style}>
                  <div className="bg-muted/40 flex h-full items-center justify-between gap-3 border-b px-4">
                    <span className="text-xs font-medium">
                      {formatDate(row.date, { timezone, style: 'relative' })}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>
                        {row.count} {row.count === 1 ? 'entry' : 'entries'}
                      </span>
                      {row.net === null ? null : (
                        <Amount value={row.net} currency={row.currency} size="sm" tone="auto" />
                      )}
                    </span>
                  </div>
                </div>
              );
            }

            const { split, groupId, splitCount } = row;
            const outgoing = split.type === 'withdrawal';
            const tone = TYPE_TONE[split.type as keyof typeof TYPE_TONE] ?? 'neutral';

            return (
              <div key={`${groupId}-${split.transaction_journal_id}`} style={style}>
                <Link
                  href={`/transactions/${groupId}`}
                  className={cn(
                    'hover:bg-accent/50 grid h-full border-b transition-colors',
                    columns,
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{split.description}</span>
                      {splitCount > 1 ? (
                        <Badge variant="secondary" className="shrink-0">
                          split {splitCount}
                        </Badge>
                      ) : null}
                      {split.has_attachments ? (
                        <Paperclip
                          className="text-muted-foreground size-3 shrink-0"
                          aria-label="Has attachments"
                        />
                      ) : null}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs md:hidden">
                      {outgoing ? split.destination_name : split.source_name}
                      {split.category_name ? ` · ${split.category_name}` : ''}
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
