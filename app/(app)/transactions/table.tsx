'use client';

import * as React from 'react';
import Link from 'next/link';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ArrowRight, Paperclip } from 'lucide-react';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
      /** Distinct group ids under this header, for select-all-in-day. */
      groupIds: string[];
    }
  | { kind: 'split'; groupId: string; split: TransactionSplit; splitCount: number };

const TYPE_TONE = {
  withdrawal: 'expense',
  deposit: 'income',
  transfer: 'transfer',
} as const;

/**
 * Day-header height. 38 rather than 34 so its select-all checkbox clears ~40px
 * of tap target — the transaction rows give 55, and a day header that is
 * noticeably harder to hit than the rows under it is the kind of small
 * inconsistency that makes a list feel unfinished on a phone.
 */
const DAY_HEIGHT = 38;

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
 *
 * **It virtualises against the WINDOW, not an inner scroll container.** A
 * `max-height` with `overflow-auto` put a second scrollbar inside the page:
 * two thumbs on screen at once, a wheel that stops scrolling the list and
 * starts scrolling the page at an arbitrary point, and a trackpad that could
 * never quite reach the last row. Window virtualisation keeps the one scrollbar
 * the browser already gives you, at the cost of tracking the list's offset from
 * the top of the document (`scrollMargin` below).
 */
export function TransactionTable({
  transactions,
  timezone,
  density = 'comfortable',
  selected,
  onToggle,
  onToggleDay,
  onToggleAll,
}: {
  transactions: Transaction[];
  timezone: string;
  density?: string;
  /** E5-11 — selected GROUP ids. Selection is per group, not per split:
   *  Firefly's PUT operates on the group, so selecting one leg of a split and
   *  not the others is not a thing the API can express. */
  selected?: ReadonlySet<string>;
  onToggle?: (groupId: string) => void;
  onToggleDay?: (groupIds: string[], select: boolean) => void;
  /** Select or clear everything on the page, from the column header. */
  onToggleAll?: (select: boolean) => void;
}) {
  const selecting = Boolean(onToggle);
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
        groupIds: [...new Set(buffer.map((entry) => entry.groupId))],
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

  // Selection state for the header checkbox. Counted over GROUPS, matching what
  // selection actually operates on — counting split rows would make a
  // fully-selected three-way split read as "3 of 12" instead of "1 of 10".
  const allGroupIds = React.useMemo(
    () => [...new Set(transactions.map((group) => group.id))],
    [transactions],
  );
  const selectedCount = allGroupIds.filter((id) => selected?.has(id)).length;
  const allSelected = allGroupIds.length > 0 && selectedCount === allGroupIds.length;
  const someSelected = selectedCount > 0;

  const listRef = React.useRef<HTMLDivElement>(null);

  // Where the list starts in the document. The window virtualiser measures
  // scroll from the top of the page, so without this every row is offset by the
  // height of everything above the table.
  const [scrollMargin, setScrollMargin] = React.useState(0);
  React.useLayoutEffect(() => {
    const measure = () => {
      if (listRef.current) {
        setScrollMargin(listRef.current.getBoundingClientRect().top + window.scrollY);
      }
    };
    measure();
    // The filter bar and the selection toolbar change height above the list, so
    // a one-time measurement drifts. ResizeObserver on the body catches both.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: (index) => (rows[index]?.kind === 'day' ? DAY_HEIGHT : rowHeight),
    overscan: 12,
    scrollMargin,
    // There is no window to measure during SSR, so without an initial rect the
    // first render emits zero rows and the grid is blank until hydration.
    initialRect: { width: 1200, height: 900 },
  });

  // The content columns. The checkbox, when selecting, sits in its own track
  // OUTSIDE this grid rather than as a first column — see the row below for
  // why the link cannot simply contain it.
  const contentColumns =
    'grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_11rem_8rem_8rem] items-center gap-3';
  /**
   * ONE grid template for the column header, the day headers and the rows.
   *
   * Alignment kept drifting because each of the three built its own layout: the
   * day header nested its label in a flex with `gap-3` after the checkbox, while
   * a row's description began immediately after the same track. The label
   * therefore sat 24px right of the descriptions it was labelling — visible in
   * every screenshot, and the thing that made the list look untidy.
   *
   * Sharing a template makes that class of bug impossible: the checkbox column
   * and the content column are defined once and every row inherits them.
   */
  const rowGrid = selecting
    ? 'grid grid-cols-[2.75rem_minmax(0,1fr)] items-center pr-3 sm:pr-4'
    : 'grid grid-cols-[minmax(0,1fr)] items-center px-3 sm:px-4';
  /**
   * The cell is the tap target, not the box.
   *
   * A 16px checkbox is far below the ~44px minimum for a finger, which is most
   * of why selecting rows on a phone felt fiddly. Making the whole cell a
   * full-height label means anywhere in the 44px column toggles the row, while
   * the box stays visually small. `cursor-pointer` and the row's own hover keep
   * it discoverable on a mouse.
   */
  const checkboxCell = 'flex h-full cursor-pointer items-center justify-center';

  return (
    /*
     * `overflow-clip`, not `overflow-hidden`. `hidden` makes this card a scroll
     * container, which becomes the scrollport the sticky header below is
     * measured against — so it scrolled away with the card instead of pinning
     * to the viewport (observed at top=-2930px). `clip` clips the rounded
     * corners identically but creates no scroll container, leaving the window
     * as the scrollport.
     */
    <div className="bg-card min-w-0 overflow-clip rounded-xl border">
      {/* Header mirrors the row grid so columns stay aligned while scrolling. */}
      {/* Sticky under the app header (h-14). Losing the column labels after the
          first screen was the other cost of the old inner scroll container. */}
      <div
        className={cn(
          'bg-muted/50 text-muted-foreground supports-[backdrop-filter]:bg-muted/70 sticky top-14 z-10 border-b py-2.5 text-[0.6875rem] font-medium tracking-wider uppercase backdrop-blur-sm',
          rowGrid,
        )}
      >
        {selecting ? (
          <label className={checkboxCell}>
            <Checkbox
              aria-label={allSelected ? 'Clear selection' : 'Select every transaction on this page'}
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={(event) => onToggleAll?.(event.currentTarget.checked)}
            />
          </label>
        ) : null}
        <div className={cn('grid min-w-0', contentColumns)}>
          <span>Description</span>
          <span className="hidden md:block">Account</span>
          <span className="hidden md:block">Category</span>
          <span className="text-right">Amount</span>
        </div>
      </div>

      <div ref={listRef}>
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
              // Subtract the list's document offset: the window virtualiser
              // reports positions relative to the page, not to this container.
              transform: `translateY(${item.start - scrollMargin}px)`,
            };

            if (row.kind === 'day') {
              return (
                <div key={`day-${row.date}`} style={style}>
                  <div className={cn('bg-muted/35 h-full border-b', rowGrid)}>
                    {selecting ? (
                      <label className={checkboxCell}>
                        <Checkbox
                          aria-label={`Select every transaction on ${row.date}`}
                          checked={row.groupIds.every((id) => selected?.has(id))}
                          indeterminate={
                            row.groupIds.some((id) => selected?.has(id)) &&
                            !row.groupIds.every((id) => selected?.has(id))
                          }
                          onChange={(event) =>
                            onToggleDay?.(row.groupIds, event.currentTarget.checked)
                          }
                        />
                      </label>
                    ) : null}
                    {/* Same content column as a row, so the day label starts on
                        exactly the x the descriptions below it start on. */}
                    <span className="flex min-w-0 items-center justify-between gap-3">
                      <span className="truncate text-xs font-semibold tracking-wide">
                        {formatDate(row.date, { timezone, style: 'relative' })}
                      </span>
                      <span className="text-muted-foreground flex shrink-0 items-center gap-2.5 text-xs">
                        <span className="hidden sm:inline">
                          {row.count} {row.count === 1 ? 'entry' : 'entries'}
                        </span>
                        {row.net === null ? null : (
                          <Amount value={row.net} currency={row.currency} size="sm" tone="auto" />
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              );
            }

            const { split, groupId, splitCount } = row;
            const outgoing = split.type === 'withdrawal';
            const tone = TYPE_TONE[split.type as keyof typeof TYPE_TONE] ?? 'neutral';

            const isSelected = selected?.has(groupId) ?? false;

            return (
              <div key={`${groupId}-${split.transaction_journal_id}`} style={style}>
                <div
                  className={cn(
                    'hover:bg-accent/50 h-full border-b transition-colors',
                    // A left rule reads as "this row is picked" far faster than
                    // a background wash, which is easy to mistake for hover.
                    isSelected && 'bg-primary/[0.07] shadow-[inset_2px_0_0_0_var(--primary)]',
                    rowGrid,
                  )}
                >
                  {selecting ? (
                    // A sibling of the link, not a child of it: a checkbox
                    // nested inside an anchor toggles AND navigates.
                    <label className={checkboxCell}>
                      <Checkbox
                        aria-label={`Select ${split.description}`}
                        checked={isSelected}
                        onChange={() => onToggle?.(groupId)}
                      />
                    </label>
                  ) : null}
                  <Link
                    href={`/transactions/${groupId}`}
                    className={cn('grid min-w-0', contentColumns)}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
