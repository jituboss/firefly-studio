'use client';

import {
  ExportMenu as Menu,
  downloadCsv,
  downloadPdfDocument,
} from '@/components/export/export-menu';
import { buildStatement, type StatementInput } from '@/lib/statement';
import { useSelection } from './selection';
import type { Transaction } from '@/server/firefly/types';

/**
 * E5-16 — export what is on screen, as CSV or as a PDF statement.
 *
 * **A menu, not a bare button, and it sits with Filters and Views.** As a lone
 * ghost button above the table it owned a band of the page to offer one file
 * format, and on a phone that band was 40px of scrolling before the first row.
 * Grouped with the other two toolbar menus it costs the width of a glyph, and
 * the format it produces is named in the menu rather than guessed from an icon.
 * The same menu now serves every export in the app — see
 * `components/export/export-menu.tsx`.
 *
 * It also states its scope. The button used to switch silently between "all
 * rows on this page" and "the rows you ticked" depending on the selection,
 * which is the right behaviour told in the wrong place — a label that changes
 * under you is not a label. Each item says which it is about to do.
 *
 * Both files are built from the rows already rendered, so they always match the
 * view that produced them. One line per SPLIT, because a split transaction
 * exported as a single row would not reconcile against anything.
 *
 * The PDF is a statement (`lib/statement.ts`): oldest first, money in and out
 * in their own columns, and — when one account is pinned and the export holds
 * its whole period — opening, running and closing balances.
 */
export function ExportMenu({
  transactions,
  rangeLabel,
  statement,
}: {
  transactions: Transaction[];
  rangeLabel: string;
  statement: Omit<StatementInput, 'transactions' | 'selected'>;
}) {
  const { selected } = useSelection();
  const count = [...selected].length;
  const chosen = count > 0 ? transactions.filter((group) => selected.has(group.id)) : transactions;
  const slug = `transactions-${rangeLabel.toLowerCase().replace(/\s+/g, '-')}`;

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
    downloadCsv(`${slug}.csv`, rows);
  };

  const exportPdf = () =>
    downloadPdfDocument(
      buildStatement({
        ...statement,
        transactions: chosen,
        selected: count > 0 ? count : undefined,
        // A running balance is only true of the complete period; a selection
        // leaves lines out, so it drops the opening figure the page supplied.
        account: statement.account
          ? { ...statement.account, opening: count > 0 ? null : statement.account.opening }
          : null,
      }),
      `${statement.account ? 'statement' : 'transactions'}-${slug.replace(/^transactions-/, '')}`,
    );

  const splits = chosen.reduce((sum, group) => sum + group.attributes.transactions.length, 0);
  const scope =
    count > 0
      ? `${count} selected transaction${count === 1 ? '' : 's'}`
      : `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} on this page`;

  return (
    <Menu
      disabled={transactions.length === 0}
      options={[
        {
          format: 'csv',
          // The row count is the split count, not the group count: a
          // three-way split is three lines in the file, and someone
          // reconciling against a bank statement is counting lines.
          detail: `${scope} — ${splits} row${splits === 1 ? '' : 's'}`,
          run: exportCsv,
        },
        {
          format: 'pdf',
          detail: `${statement.account ? 'Account statement' : 'Statement'} of ${scope}`,
          run: exportPdf,
        },
      ]}
    />
  );
}
