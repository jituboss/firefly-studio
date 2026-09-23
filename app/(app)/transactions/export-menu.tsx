'use client';

import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { rowsToCsv } from '@/components/reports/report-export';
import { useSelection } from './selection';
import type { Transaction } from '@/server/firefly/types';

/**
 * E5-16 — export what is on screen.
 *
 * **A menu, not a bare button, and it sits with Filters and Views.** As a lone
 * ghost button above the table it owned a band of the page to offer one file
 * format, and on a phone that band was 40px of scrolling before the first row.
 * Grouped with the other two toolbar menus it costs the width of a glyph, and
 * the format it produces is named in the menu rather than guessed from an icon.
 *
 * It also states its scope. The button used to switch silently between "all
 * rows on this page" and "the rows you ticked" depending on the selection,
 * which is the right behaviour told in the wrong place — a label that changes
 * under you is not a label. The menu item says which it is about to do.
 *
 * The file is built from the rows already rendered, so it always matches the
 * view that produced it. One line per SPLIT, because a split transaction
 * exported as a single row would not reconcile against anything.
 */
export function ExportMenu({
  transactions,
  rangeLabel,
}: {
  transactions: Transaction[];
  rangeLabel: string;
}) {
  const { selected } = useSelection();
  const count = [...selected].length;
  const chosen = count > 0 ? transactions.filter((group) => selected.has(group.id)) : transactions;

  const exportCsv = () => {
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

    // The BOM is what makes Excel open a UTF-8 file as UTF-8 rather than as
    // the local codepage, which mangles every non-ASCII payee name.
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

  const splits = chosen.reduce((sum, group) => sum + group.attributes.transactions.length, 0);
  const scope =
    count > 0
      ? `${count} selected transaction${count === 1 ? '' : 's'}`
      : `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} on this page`;

  return (
    <Popover
      align="end"
      label="Export"
      contentClassName="w-64"
      trigger={(props) => (
        <Button
          {...props}
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 max-sm:w-9 max-sm:px-0"
          disabled={transactions.length === 0}
        >
          <Download className="size-4 shrink-0" aria-hidden="true" />
          <span className="max-sm:sr-only">Export</span>
        </Button>
      )}
    >
      {(close) => (
        <div className="p-1">
          <button
            type="button"
            onClick={() => {
              exportCsv();
              close();
            }}
            className="hover:bg-accent flex w-full items-start gap-2 rounded px-2 py-1.5 text-left"
          >
            <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">CSV</span>
              {/* The row count is the split count, not the group count: a
                  three-way split is three lines in the file, and someone
                  reconciling against a bank statement is counting lines. */}
              <span className="text-muted-foreground block text-xs leading-relaxed">
                {scope} — {splits} row{splits === 1 ? '' : 's'}
              </span>
            </span>
          </button>
        </div>
      )}
    </Popover>
  );
}
