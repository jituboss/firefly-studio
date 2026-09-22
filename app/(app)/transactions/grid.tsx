'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ChevronUp, Download, Pencil, Trash2, X } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/auth/form-shell';
import { rowsToCsv } from '@/components/reports/report-export';
import { TransactionTable } from './table';
import { PageTotals, type PageTotalsData } from '@/components/transactions/page-totals';
import {
  bulkDeleteTransactionsAction,
  bulkUpdateTransactionsAction,
  type BulkTransactionState,
} from '@/server/firefly/transaction-actions';
import type { Transaction } from '@/server/firefly/types';

/**
 * E5-11 / E5-16 — selection, bulk edit and export around the virtualised grid.
 *
 * Selection lives here rather than in `table.tsx` so the table stays a pure
 * renderer: it is virtualised, and hoisting state into it would re-run the
 * virtualiser on every checkbox click.
 */

const FIELDS = [
  { value: 'category', label: 'Category' },
  { value: 'budget', label: 'Budget' },
  { value: 'tags', label: 'Tags' },
] as const;

function ApplyButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || count === 0}>
      {pending ? 'Applying…' : `Apply to ${count}`}
    </Button>
  );
}

export function TransactionGrid({
  transactions,
  timezone,
  rangeLabel,
  totals,
}: {
  transactions: Transaction[];
  timezone: string;
  rangeLabel: string;
  /** Page totals, rendered beside the export button rather than above it. */
  /** Page totals, as data. Rendered here so the export button can sit inside them. */
  totals?: PageTotalsData;
}) {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [field, setField] = React.useState<string>('category');
  /** The editor is opt-in: the bar has to fit one line on a phone. */
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState('');

  const [update, updateAction] = useActionState<BulkTransactionState, FormData>(
    bulkUpdateTransactionsAction,
    {},
  );
  const [removed, deleteAction] = useActionState<BulkTransactionState, FormData>(
    bulkDeleteTransactionsAction,
    {},
  );

  // A completed bulk action revalidates the page, so the rows underneath change
  // and the old ids are meaningless. Clearing avoids acting on a stale set.
  React.useEffect(() => {
    if (update.ok || removed.ok) {
      setSelected(new Set());
      setValue('');
      setEditing(false);
    }
  }, [update, removed]);

  const toggle = React.useCallback((groupId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const toggleDay = React.useCallback((groupIds: string[], select: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of groupIds) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleAll = React.useCallback(
    (select: boolean) => {
      setSelected(select ? new Set(transactions.map((group) => group.id)) : new Set());
    },
    [transactions],
  );

  const ids = [...selected];
  const count = ids.length;

  /**
   * E5-16 — export what is on screen.
   *
   * Built from the rows already rendered, so the file always matches the view
   * that produced it. One line per SPLIT, because a split transaction that
   * exported as a single row would not reconcile against anything.
   */
  const exportCsv = () => {
    const chosen =
      count > 0 ? transactions.filter((group) => selected.has(group.id)) : transactions;
    const rows = chosen.flatMap((group) =>
      group.attributes.transactions.map((split) => ({
        date: split.date.slice(0, 10),
        type: split.type,
        description: split.description,
        amount: split.type === 'withdrawal' ? `-${split.amount}` : split.amount,
        currency: split.currency_code,
        source: split.source_name ?? '',
        destination: split.destination_name ?? '',
        category: split.category_name ?? '',
        budget: split.budget_name ?? '',
        bill: split.bill_name ?? '',
        tags: (split.tags ?? []).join('|'),
        notes: split.notes ?? '',
        reconciled: split.reconciled ? 'yes' : 'no',
        group_id: group.id,
      })),
    );

    const blob = new Blob(['﻿', rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `transactions-${rangeLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  /* Icon-only on a phone. The word "Export" next to a download glyph is 60px of
     a 390px line spent saying what the glyph already says. */
  const exportButton = (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0 max-sm:size-9 max-sm:p-0"
      onClick={exportCsv}
      aria-label={count > 0 ? `Export ${count} selected` : 'Export CSV'}
    >
      <Download className="size-4" aria-hidden="true" />
      <span className="max-sm:sr-only">Export {count > 0 ? count : 'CSV'}</span>
    </Button>
  );

  return (
    // The bottom padding is what stops the floating bar from covering the last
    // rows once the page is scrolled to the end.
    <div className={cn('min-w-0 space-y-3', count > 0 && (editing ? 'pb-56 sm:pb-40' : 'pb-24'))}>
      {/* The hint that used to live here ("Tick a row to edit…") is gone: a
          column of checkboxes explains itself, and the count now lives in the
          selection bar. That is one less band before the data on a phone. */}
      {/*
        `PageTotals` is rendered HERE, from plain data, rather than handed in as
        an element from the page.

        It needs the export button inside it: the button belongs on the tiles'
        row from `sm` and on the caption's row below that, because sharing the
        tiles' row on a phone left them 69px of content each at 360px and the
        figures truncated — "274,697...." — and a truncated amount is a wrong
        amount. Neither way of getting the button in there from outside works
        across the Server/Client boundary. A render prop is refused outright
        ("Functions cannot be passed directly to Client Components"), and
        `cloneElement` fails more quietly: a server-serialised element is not
        `isValidElement` here, so the guard around it silently took the fallback
        branch and the whole summary disappeared from the page. Data crosses the
        boundary without either problem.
      */}
      {totals ? (
        <PageTotals {...totals} action={exportButton} />
      ) : (
        <div className="flex justify-end">{exportButton}</div>
      )}

      {/* Outside the selection block on purpose. A successful bulk action clears
          the selection, which unmounts the toolbar — leaving the result message
          inside it meant the confirmation vanished before it could be read. */}
      {update.error ? <FormMessage tone="error">{update.error}</FormMessage> : null}
      {update.notice ? <FormMessage tone="notice">{update.notice}</FormMessage> : null}
      {removed.error ? <FormMessage tone="error">{removed.error}</FormMessage> : null}
      {removed.notice ? <FormMessage tone="notice">{removed.notice}</FormMessage> : null}

      {/*
       * Floating at the bottom rather than sticky at the top, for two reasons.
       * The column header is now sticky at top-14, and two things sticking to
       * the same offset overlap. And a bar anchored to the bottom stays in
       * reach on a phone and near the thumb, which is where the selection was
       * made — Gmail, Linear and Drive all put bulk actions there for the same
       * reason.
       */}
      {count > 0 ? (
        <div
          role="region"
          aria-label={`Actions for ${count} selected transaction${count === 1 ? '' : 's'}`}
          /*
           * Constrained to the content column, not centred on the viewport.
           * `left-1/2` centred it against the whole window, so on desktop the
           * bar sat noticeably left of the list it belongs to — the 15rem
           * sidebar is not part of the content area.
           */
          className="fixed inset-x-3 bottom-3 z-30 sm:inset-x-6 lg:right-8 lg:left-[16rem]"
        >
          <div className="fs-rise bg-popover mx-auto max-w-3xl rounded-xl border shadow-lg">
            {/*
             * Two tiers. The top one is always the same handful of controls and
             * always fits one line, even at 360px. The editor below it only
             * exists once asked for.
             *
             * The previous single-row layout wrapped on a phone and the Delete
             * button landed on top of the category picker — unusable, which is
             * exactly what a bulk bar must never be on the device where you are
             * most likely tapping checkboxes.
             */}
            <div className="flex items-center gap-2 p-2.5">
              <span className="bg-primary text-primary-foreground tabular grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold">
                {count}
              </span>
              <span className="text-muted-foreground hidden text-sm sm:inline">selected</span>

              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  variant={editing ? 'secondary' : 'outline'}
                  size="sm"
                  aria-expanded={editing}
                  aria-controls="bulk-editor"
                  onClick={() => setEditing((open) => !open)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                  <ChevronUp
                    className={cn('size-3.5 transition-transform', editing && 'rotate-180')}
                    aria-hidden="true"
                  />
                </Button>

                <form
                  action={(formData) => {
                    for (const id of ids) formData.append('ids', id);
                    deleteAction(formData);
                  }}
                >
                  <ConfirmButton
                    message={`Delete ${count} transaction${count === 1 ? '' : 's'}? This cannot be undone.`}
                    title={`Delete ${count} transaction${count === 1 ? '' : 's'}`}
                    confirmLabel="Delete"
                    pendingLabel="Deleting…"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete {count}
                  </ConfirmButton>
                </form>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear selection"
                  onClick={() => {
                    setSelected(new Set());
                    setEditing(false);
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {editing ? (
              <form
                id="bulk-editor"
                action={(formData) => {
                  formData.set('field', field);
                  formData.set('value', value);
                  for (const id of ids) formData.append('ids', id);
                  updateAction(formData);
                }}
                className="space-y-2 border-t p-2.5"
              >
                {/* Stacked on a phone, one line from `sm` up. */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor="bulk-field">
                    Field to set
                  </label>
                  <Select
                    id="bulk-field"
                    value={field}
                    onChange={(event) => {
                      setField(event.target.value);
                      setValue('');
                    }}
                    containerClassName="shrink-0 sm:w-32"
                  >
                    {FIELDS.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </Select>

                  <div className="min-w-0 flex-1">
                    {field === 'tags' ? (
                      <Input
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder="holiday, reimbursable"
                        aria-label="Tags, comma separated"
                      />
                    ) : (
                      <Combobox
                        id="bulk-value"
                        endpoint={field === 'budget' ? 'budgets' : 'categories'}
                        value={value}
                        onChange={setValue}
                        placeholder={field === 'budget' ? 'Pick a budget…' : 'Pick a category…'}
                        allowFreeText
                      />
                    )}
                  </div>

                  <ApplyButton count={count} />
                </div>

                {field !== 'tags' ? (
                  <p className="text-muted-foreground text-xs">
                    Leave it empty to clear the {field} on all {count}.
                  </p>
                ) : null}
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      <TransactionTable
        transactions={transactions}
        timezone={timezone}
        selected={selected}
        onToggle={toggle}
        onToggleDay={toggleDay}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
