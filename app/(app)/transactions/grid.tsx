'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/auth/form-shell';
import { TransactionTable } from './table';
import { Pagination, PaginationButtons, PaginationSummary } from './pagination';
import { useSelection } from './selection';
import {
  bulkDeleteTransactionsAction,
  bulkUpdateTransactionsAction,
  type BulkTransactionState,
} from '@/server/firefly/transaction-actions';
import type { Transaction } from '@/server/firefly/types';

/**
 * E5-11 — selection, bulk edit and paging around the virtualised grid.
 *
 * Selection is read from `SelectionProvider` rather than held here, because
 * the export menu in the toolbar needs it too — see `selection.tsx`. It is
 * still not held in `table.tsx`: that stays a pure renderer, and it is
 * virtualised, so state in it would re-run the virtualiser on every checkbox
 * click.
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
  pagination,
  accountId,
}: {
  transactions: Transaction[];
  timezone: string;
  /**
   * Firefly's `meta.pagination`, as plain data.
   *
   * Passed as data rather than as a rendered `<Pagination>` element because the
   * grid renders it TWICE — once on the bar above the table, sharing that line
   * with the export button, and once below the last row. An element handed in
   * from the server could not be placed in two spots, and the totals strip
   * already learned what happens when you try to reposition server-serialised
   * markup from a client component.
   */
  pagination?: { page: number; totalPages: number; total: number } | null;
  /** Set when the list is filtered to one account; makes rows read from its side. */
  accountId?: string;
}) {
  const { selected, setSelected } = useSelection();
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
    // `setSelected` comes from the provider's `useState` and is stable; it is
    // listed because the linter cannot see that through the context.
  }, [update, removed, setSelected]);

  const toggle = React.useCallback(
    (groupId: string) => {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        return next;
      });
    },
    [setSelected],
  );

  const toggleDay = React.useCallback(
    (groupIds: string[], select: boolean) => {
      setSelected((current) => {
        const next = new Set(current);
        for (const id of groupIds) {
          if (select) next.add(id);
          else next.delete(id);
        }
        return next;
      });
    },
    [setSelected],
  );

  const toggleAll = React.useCallback(
    (select: boolean) => {
      setSelected(select ? new Set(transactions.map((group) => group.id)) : new Set());
    },
    [transactions, setSelected],
  );

  const ids = [...selected];
  const count = ids.length;

  const paged = pagination && pagination.totalPages > 1 ? pagination : null;

  return (
    // The bottom padding is what stops the floating bar from covering the last
    // rows once the page is scrolled to the end.
    <div className={cn('min-w-0 space-y-3', count > 0 && (editing ? 'pb-56 sm:pb-40' : 'pb-24'))}>
      {/*
        The pager above the table.

        Repeated below the last row as well. Fifty rows is about four phone
        screens, so a reader who has finished the page is nowhere near the top
        control, and a reader who has just arrived cannot see the bottom one —
        page two has to be reachable from both ends.

        It renders nothing at all on a single page. The export button used to
        share this line, which meant the row existed on every list whether or
        not there was anything to page to; it lives in the toolbar with Filters
        and Views now, and a band that says "1 of 1" and nothing else is exactly
        the chrome this pass was spending.
      */}
      {paged ? (
        <nav
          className="flex items-center justify-between gap-2"
          aria-label="Pagination, above the list"
        >
          <PaginationSummary page={paged.page} totalPages={paged.totalPages} total={paged.total} />
          <PaginationButtons page={paged.page} totalPages={paged.totalPages} />
        </nav>
      ) : null}

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
        accountId={accountId}
        selected={selected}
        onToggle={toggle}
        onToggleDay={toggleDay}
        onToggleAll={toggleAll}
      />

      {paged ? (
        <Pagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          label="Pagination, below the list"
          className="border-t pt-3"
        />
      ) : null}
    </div>
  );
}
