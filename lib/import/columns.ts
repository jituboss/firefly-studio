/**
 * The spreadsheet format the transaction import reads and the template writes.
 *
 * One row is one transaction. Direction is carried by Source → Destination,
 * never by the sign of the amount, because that is how Firefly itself records a
 * transaction and it is the only convention that means the same thing for a
 * spend, an income and a transfer. The type is optional: every allowed account
 * pair belongs to exactly one type (`lib/account-matrix.ts`), so it is worked
 * out from the accounts and the column only exists to double-check.
 *
 * Headers are matched loosely — case, spacing and a few common synonyms — so a
 * sheet exported from elsewhere and renamed by hand still reads.
 *
 * The template carries only `TEMPLATE_COLUMNS`, the nine a person fills in
 * for nearly every row. The rest are still read when present — a sheet can add
 * a Currency or a Type column by hand — but they are not offered, because a
 * template with sixteen columns and four sheets was more form than spreadsheet.
 * The one thing the dropped "kind" columns did, saying a brand-new account is
 * yours, is done in the preview instead.
 */

export type ColumnKey =
  | 'date'
  | 'amount'
  | 'description'
  | 'source'
  | 'destination'
  | 'type'
  | 'source_kind'
  | 'destination_kind'
  | 'currency'
  | 'foreign_amount'
  | 'foreign_currency'
  | 'category'
  | 'budget'
  | 'tags'
  | 'notes'
  | 'external_ref';

export interface ImportColumn {
  key: ColumnKey;
  header: string;
  required: boolean;
  aliases: string[];
  help: string;
  width: number;
}

/** The template's columns, in the order a row is naturally read. */
export const TEMPLATE_COLUMNS: ColumnKey[] = [
  'date',
  'description',
  'amount',
  'source',
  'destination',
  'category',
  'budget',
  'tags',
  'notes',
];

export const IMPORT_COLUMNS: ImportColumn[] = [
  {
    key: 'date',
    header: 'Date',
    required: true,
    aliases: ['transaction date', 'booking date', 'value date'],
    help: 'The day it happened. An Excel date, or text as YYYY-MM-DD.',
    width: 12,
  },
  {
    key: 'amount',
    header: 'Amount',
    required: true,
    aliases: ['value', 'sum', 'total'],
    help: 'How much, as a positive number. Which way it moved comes from Source → Destination.',
    width: 12,
  },
  {
    key: 'description',
    header: 'Description',
    required: true,
    aliases: ['memo', 'title', 'narration', 'details'],
    help: 'What it was for.',
    width: 32,
  },
  {
    key: 'source',
    header: 'Source',
    required: true,
    aliases: ['from', 'source account', 'paid from', 'payer'],
    help: 'Where the money came from: one of your accounts, or who paid you.',
    width: 24,
  },
  {
    key: 'destination',
    header: 'Destination',
    required: true,
    aliases: ['to', 'destination account', 'paid to', 'payee'],
    help: 'Where the money went: one of your accounts, or who you paid.',
    width: 24,
  },
  {
    key: 'type',
    header: 'Type',
    required: false,
    aliases: ['transaction type', 'kind'],
    help: 'Optional: withdrawal, deposit or transfer. Leave blank to work it out from the accounts.',
    width: 12,
  },
  {
    key: 'source_kind',
    header: 'Source kind',
    required: false,
    aliases: ['source type', 'from kind', 'from type'],
    help: 'Only needed when Source is new and is YOUR account: asset, loan, debt or mortgage. A new payer becomes a revenue account on its own.',
    width: 13,
  },
  {
    key: 'destination_kind',
    header: 'Destination kind',
    required: false,
    aliases: ['destination type', 'to kind', 'to type'],
    help: 'Only needed when Destination is new and is YOUR account: asset, loan, debt or mortgage. A new payee becomes an expense account on its own.',
    width: 16,
  },
  {
    key: 'currency',
    header: 'Currency',
    required: false,
    aliases: ['currency code', 'ccy'],
    help: "Optional ISO code such as EUR. Blank uses the account's own currency.",
    width: 10,
  },
  {
    key: 'foreign_amount',
    header: 'Foreign amount',
    required: false,
    aliases: ['original amount'],
    help: 'Optional: the amount in the currency it was actually paid in.',
    width: 14,
  },
  {
    key: 'foreign_currency',
    header: 'Foreign currency',
    required: false,
    aliases: ['original currency'],
    help: 'Required with a foreign amount.',
    width: 15,
  },
  {
    key: 'category',
    header: 'Category',
    required: false,
    aliases: [],
    help: 'Optional. An existing one is matched whatever its capitals; a new name creates it.',
    width: 18,
  },
  {
    key: 'budget',
    header: 'Budget',
    required: false,
    aliases: [],
    help: 'Optional, withdrawals only. A new name creates the budget.',
    width: 18,
  },
  {
    key: 'tags',
    header: 'Tags',
    required: false,
    aliases: ['labels'],
    help: 'Optional, comma separated. New tags are created.',
    width: 18,
  },
  {
    key: 'notes',
    header: 'Notes',
    required: false,
    aliases: ['comment', 'comments'],
    help: 'Optional.',
    width: 24,
  },
  {
    key: 'external_ref',
    header: 'External ref',
    required: false,
    aliases: ['external id', 'reference', 'bank reference', 'ref'],
    help: "Optional: your bank's reference. Stored as the transaction's external ID.",
    width: 16,
  },
];

function squash(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_\-.]+/g, ' ');
}

export interface HeaderMap {
  /** Column key → zero-based index into the row. */
  columns: Partial<Record<ColumnKey, number>>;
  missing: ImportColumn[];
  /** Headers in the file that match nothing, so the user knows they were ignored. */
  ignored: string[];
}

export function mapHeaders(headers: string[]): HeaderMap {
  const columns: Partial<Record<ColumnKey, number>> = {};
  const ignored: string[] = [];

  headers.forEach((raw, index) => {
    const header = squash(raw);
    if (!header) return;
    const match = IMPORT_COLUMNS.find(
      (column) =>
        squash(column.header) === header ||
        column.aliases.some((alias) => squash(alias) === header),
    );
    if (match && columns[match.key] === undefined) columns[match.key] = index;
    else ignored.push(raw.trim());
  });

  return {
    columns,
    missing: IMPORT_COLUMNS.filter(
      (column) => column.required && columns[column.key] === undefined,
    ),
    ignored,
  };
}
