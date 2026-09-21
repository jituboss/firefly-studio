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

/** The row's type dot, matching the amount's tone. */
const DOT_TONE = {
  expense: 'bg-expense',
  income: 'bg-income',
  transfer: 'bg-transfer',
  neutral: 'bg-muted-foreground/40',
} as const;

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

/**
 * Row height. 64 rather than 56 because the mobile row carries two lines —
 * description, then the counterparty and category beneath it — and 56 left the
 * second line crowded against the row border.
 */
const ROW_HEIGHT = 64;

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
  selected,
  onToggle,
  onToggleDay,
  onToggleAll,
}: {
  transactions: Transaction[];
  timezone: string;
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
  /*
   * One row height. There used to be a comfortable/compact selector; it worked
   * — 56px against 40px, measured — but the content inside the row did not
   * change with it, so the difference read as nothing and the control was two
   * more words of chrome above a list people came to read.
   */
  const rowHeight = ROW_HEIGHT;

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
  /*
   * Column widths, and the reason they are fractions rather than fixed rem.
   *
   * The account column was a flat `11rem`. Two account names and an arrow do
   * not fit in 176px, so EVERY row truncated both ends of the flow —
   * "Everyday C… → Home Mort…" — on a 1400px screen with hundreds of spare
   * pixels sitting in the description column. Fractions let the two text
   * columns share the space that is actually available, so the flow only
   * truncates when the window is genuinely narrow.
   *
   * The gap grows with the breakpoint too. At `gap-3` the account flow ran
   * within 12px of the category beside it and the two read as one run-on
   * string; the columns need to look like columns.
   */
  const contentColumns =
    'grid-cols-[minmax(0,1fr)_auto] items-center gap-3 ' +
    'md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_9rem_9.5rem] md:gap-5 ' +
    'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_10rem_11rem] lg:gap-8';
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
                      <span className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                        <span className="hidden sm:inline">
                          {row.count} {row.count === 1 ? 'entry' : 'entries'}
                        </span>
                        {row.net === null ? null : (
                          <Amount
                            value={row.net}
                            currency={row.currency}
                            tone="auto"
                            className="text-xs font-semibold"
                          />
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              );
            }

            const { split, groupId, splitCount } = row;
            const outgoing = split.type === 'withdrawal';
            /*
             * Which account the narrow row names.
             *
             * A withdrawal and a transfer both LEAVE an account you own, so the
             * informative half is where the money went; a deposit arrives, so it
             * is where it came from. Keying this off `outgoing` alone showed a
             * transfer's source — "Everyday Current" — which is the account you
             * were already looking at and never the thing you wanted to know.
             */
            const counterparty =
              split.type === 'deposit' ? split.source_name : split.destination_name;
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
                        {/*
                          A type dot. Three transaction types were distinguishable
                          only by the colour of the amount, which is at the far
                          right of a 1400px row — so telling a transfer from a
                          spend meant reading across the whole row. Colour is not
                          the only signal: the flow arrow and the amount's sign
                          both still say it.
                        */}
                        <span
                          aria-hidden="true"
                          className={cn('size-1.5 shrink-0 rounded-full', DOT_TONE[tone])}
                        />
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
                      {/*
                        The mobile second line. Counterparty first, because on a
                        phone "who" is the question — the asset account is almost
                        always the same one — and the category as a chip so it
                        reads as a label rather than more of the same sentence.
                      */}
                      <span className="mt-0.5 flex items-center gap-1.5 md:hidden">
                        <span className="text-muted-foreground min-w-0 truncate text-xs">
                          {counterparty}
                        </span>
                        {split.category_name ? (
                          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-px text-[0.6875rem]">
                            {split.category_name}
                          </span>
                        ) : null}
                      </span>
                    </span>

                    {/*
                      The account flow. `min-w-0` on both names so each truncates
                      independently instead of one shoving the other out, and the
                      counterparty carries the weight because it is the end of the
                      flow anyone is actually scanning for.
                    */}
                    <span className="text-muted-foreground hidden min-w-0 items-center gap-1.5 text-xs md:flex">
                      <span className="min-w-0 truncate">{split.source_name}</span>
                      <ArrowRight className="size-3 shrink-0 opacity-40" aria-hidden="true" />
                      <span className="text-foreground/75 min-w-0 truncate">
                        {split.destination_name}
                      </span>
                    </span>

                    <span className="hidden min-w-0 md:block">
                      {split.category_name ? (
                        <span className="bg-muted/70 text-muted-foreground inline-block max-w-full truncate rounded px-2 py-0.5 text-[0.6875rem]">
                          {split.category_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </span>

                    <span className="text-right">
                      <Amount
                        value={outgoing ? `-${split.amount}` : split.amount}
                        currency={split.currency_code}
                        decimalPlaces={split.currency_decimal_places}
                        tone={tone}
                        /* The figure is what the row is about. At `text-xs` it
                           was the smallest thing on a line whose description
                           was larger and whose colour it was carrying. */
                        className="text-sm font-semibold md:text-[0.9375rem]"
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
