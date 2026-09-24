import { add, toDecimal } from './money';
import { splitFlow } from './account-flow';
import type { PdfColumn, PdfDocument, PdfRow, PdfStat } from './pdf/spec';
import type { Transaction, TransactionSplit } from '@/server/firefly/types';

/**
 * E5-16 — the transactions list as a statement.
 *
 * A bank statement answers three questions in a fixed order: what period, what
 * came in and went out, and what the balance did. This builds that document
 * from the rows on screen, in two modes that mirror the page's own totals:
 *
 * - **One account pinned** — an account statement. Direction comes from which
 *   side of each split the account sits on, never from the transaction type
 *   (see `lib/account-flow.ts` for the credit-card case that type gets wrong),
 *   and transfers count because they move this account's money. When the page
 *   holds the account's WHOLE period, the opening balance is known and every
 *   line carries a running balance.
 * - **No account** — a ledger statement. Deposits in, withdrawals out, and
 *   transfers in a column of their own, because moving money between your own
 *   accounts is neither income nor spending and counting it as either would
 *   double the period's activity.
 *
 * Lines run oldest first, as on every statement, although the screen lists
 * newest first.
 */

export interface StatementInput {
  transactions: Transaction[];
  /** The connection's primary currency, used when no account fixes one. */
  currency: string;
  range: { start: string; end: string; label: string };
  account?: {
    id: string;
    name: string;
    currency?: string | null;
    /**
     * Balance at the end of the day before the range opens. Only supplied when
     * the export holds every transaction in the range — otherwise a running
     * balance would be confidently wrong from the first missing line on.
     */
    opening?: string | null;
  } | null;
  /** "category: Groceries" and similar, from a report drill-through. */
  scopeLabel?: string | null;
  search?: string;
  /** Rows the user ticked, when the export is a selection. */
  selected?: number;
  /** Pagination, so a partial export says it is partial. */
  page?: number;
  totalPages?: number;
  locale?: string;
  timezone?: string;
}

type Line = { split: TransactionSplit; groupId: string };

/** Oldest first; journals on the same instant keep Firefly's own order. */
function chronological(transactions: Transaction[]): Line[] {
  const lines = transactions.flatMap((group) =>
    group.attributes.transactions.map((split) => ({ split, groupId: group.id })),
  );
  return lines.sort(
    (a, b) =>
      a.split.date.localeCompare(b.split.date) ||
      a.split.transaction_journal_id.localeCompare(b.split.transaction_journal_id, undefined, {
        numeric: true,
      }),
  );
}

/** The preferred currency when any line uses it, otherwise the most common one. */
export function statementCurrency(splits: TransactionSplit[], preferred: string): string {
  const counts = new Map<string, number>();
  for (const split of splits)
    counts.set(split.currency_code, (counts.get(split.currency_code) ?? 0) + 1);
  if (counts.has(preferred) || counts.size === 0) return preferred;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? preferred;
}

function detailLine(split: TransactionSplit): string {
  return [
    split.category_name,
    split.budget_name ? `Budget: ${split.budget_name}` : null,
    split.bill_name ? `Bill: ${split.bill_name}` : null,
    split.tags && split.tags.length > 0 ? split.tags.map((tag) => `#${tag}`).join(' ') : null,
  ]
    .filter(Boolean)
    .join('  ·  ');
}

const TYPE_LABEL: Record<string, string> = {
  withdrawal: 'Withdrawal',
  deposit: 'Deposit',
  transfer: 'Transfer',
  'opening balance': 'Opening balance',
  reconciliation: 'Reconciliation',
};

export function buildStatement(input: StatementInput): PdfDocument {
  const lines = chronological(input.transactions);
  const account = input.account ?? null;
  const currency =
    account?.currency ??
    statementCurrency(
      lines.map((line) => line.split),
      input.currency,
    );

  const rows: PdfRow[] = [];
  let inflow = toDecimal(0);
  let outflow = toDecimal(0);
  let transfers = toDecimal(0);
  let excluded = 0;

  const runningBalance = Boolean(
    account && account.opening !== null && account.opening !== undefined,
  );
  let balance = toDecimal(account?.opening ?? 0);

  for (const { split } of lines) {
    const base: PdfRow = {
      date: split.date.slice(0, 10),
      description: split.description,
      detail: detailLine(split),
      type: TYPE_LABEL[split.type] ?? split.type,
      currency,
    };

    if (account) {
      const flow = splitFlow(split, account.id, currency);
      const counterparty = flow.direction === -1 ? split.destination_name : split.source_name;
      if (flow.unconvertible) {
        // Listed in its own currency and left out of every total, rather than
        // silently counted as if it were the account's.
        excluded += 1;
        rows.push({
          ...base,
          counterparty: counterparty ?? '',
          out: flow.direction === -1 ? split.amount : null,
          in: flow.direction === 1 ? split.amount : null,
          currency: split.currency_code,
          balance: runningBalance ? balance.toString() : null,
        });
        continue;
      }
      if (flow.direction === 1) inflow = inflow.plus(flow.magnitude);
      if (flow.direction === -1) outflow = outflow.plus(flow.magnitude);
      balance =
        flow.direction === -1 ? balance.minus(flow.magnitude) : balance.plus(flow.magnitude);
      rows.push({
        ...base,
        counterparty: counterparty ?? '',
        out: flow.direction === -1 ? flow.magnitude.toString() : null,
        in: flow.direction === 1 ? flow.magnitude.toString() : null,
        balance: runningBalance ? balance.toString() : null,
      });
      continue;
    }

    const inCurrency = split.currency_code === currency;
    if (!inCurrency) excluded += 1;
    const amount = toDecimal(split.amount).abs().toString();
    const route = [split.source_name, split.destination_name].filter(Boolean).join(' → ');
    rows.push({
      ...base,
      counterparty: route,
      currency: split.currency_code,
      out: split.type === 'withdrawal' ? amount : null,
      in: split.type === 'deposit' || split.type === 'opening balance' ? amount : null,
      transfer: split.type === 'transfer' || split.type === 'reconciliation' ? amount : null,
    });
    if (!inCurrency) continue;
    if (split.type === 'withdrawal') outflow = add(outflow, amount);
    else if (split.type === 'deposit' || split.type === 'opening balance')
      inflow = add(inflow, amount);
    else transfers = add(transfers, amount);
  }

  const hasTransfers = !account && rows.some((row) => row.transfer !== null);

  const columns: PdfColumn[] = [
    { key: 'date', header: 'Date', kind: 'date', width: 1.45 },
    { key: 'description', header: 'Description', detailKey: 'detail', width: 3.1 },
    {
      key: 'counterparty',
      header: account ? 'Counterparty' : 'From → To',
      width: account ? 2.1 : 2.6,
    },
    {
      key: 'out',
      header: 'Money out',
      kind: 'money',
      tone: 'expense',
      currencyKey: 'currency',
      total: true,
      width: 1.3,
    },
    {
      key: 'in',
      header: 'Money in',
      kind: 'money',
      tone: 'income',
      currencyKey: 'currency',
      total: true,
      width: 1.3,
    },
    ...(hasTransfers
      ? [
          {
            key: 'transfer',
            header: 'Transfers',
            kind: 'money',
            tone: 'accent',
            currencyKey: 'currency',
            total: true,
            width: 1.3,
          } satisfies PdfColumn,
        ]
      : []),
    ...(runningBalance
      ? [
          {
            key: 'balance',
            header: 'Balance',
            kind: 'money',
            tone: 'neutral',
            width: 1.4,
          } satisfies PdfColumn,
        ]
      : []),
  ];

  const splitCount = rows.length;
  const net = inflow.minus(outflow);

  const stats: PdfStat[] = [
    { label: 'Money in', value: inflow.toString(), currency, tone: 'income' },
    { label: 'Money out', value: outflow.toString(), currency, tone: 'expense' },
    { label: 'Net movement', value: net.toString(), currency, tone: 'auto' },
    hasTransfers
      ? { label: 'Transfers', value: transfers.toString(), currency, tone: 'accent' }
      : {
          label: 'Lines',
          value: splitCount,
          kind: 'count',
          tone: 'neutral',
          hint: `${input.transactions.length} transaction${input.transactions.length === 1 ? '' : 's'}`,
        },
  ];

  const scope = describeScope(input, splitCount);
  const notes: string[] = [];
  if (excluded > 0) {
    notes.push(
      `${excluded} line${excluded === 1 ? ' is' : 's are'} in another currency and ${
        excluded === 1 ? 'is' : 'are'
      } shown with ${excluded === 1 ? 'its' : 'their'} own code; ${
        excluded === 1 ? 'it is' : 'they are'
      } not included in the ${currency} totals.`,
    );
  }
  if (!account) {
    notes.push(
      'Transfers move money between your own accounts, so they are listed separately and counted as neither money in nor money out.',
    );
  }
  if (account && !runningBalance) {
    notes.push(
      'No running balance is shown because this export does not contain every transaction in the period — a balance carried across missing lines would be wrong.',
    );
  }
  if ((input.totalPages ?? 1) > 1 && !input.selected) {
    notes.push(
      `This is page ${input.page ?? 1} of ${input.totalPages} of the list. Export each page, or narrow the date range, for a complete record.`,
    );
  }
  notes.push('Amounts are taken from your Firefly III ledger at the time of export.');

  const facts = [
    ...(account ? [{ label: 'Account', value: account.name }] : []),
    ...(input.scopeLabel ? [{ label: 'Scope', value: capitalise(input.scopeLabel) }] : []),
    ...(input.search ? [{ label: 'Search', value: `“${input.search}”` }] : []),
    { label: 'Currency', value: currency },
  ];

  return {
    kind: 'statement',
    title: account ? 'Account statement' : 'Transaction statement',
    subtitle: account ? account.name : input.range.label,
    description: scope,
    period: { start: input.range.start, end: input.range.end },
    currency,
    facts,
    stats,
    balance: runningBalance
      ? {
          opening: toDecimal(account?.opening).toString(),
          closing: balance.toString(),
          currency,
          openingLabel: 'Opening balance',
          closingLabel: 'Closing balance',
        }
      : undefined,
    tables: [
      {
        title: 'Transactions',
        description: 'Oldest first. Split transactions are listed one line per split.',
        columns,
        rows,
        currency,
        totalLabel: 'Period totals',
        emptyMessage: 'No transactions in this export.',
      },
    ],
    notes,
    accent: account ? 'indigo' : 'blue',
    locale: input.locale,
    timezone: input.timezone,
  };
}

function describeScope(input: StatementInput, lines: number): string {
  const what = input.selected
    ? `${input.selected} selected transaction${input.selected === 1 ? '' : 's'}`
    : `${input.transactions.length} transaction${input.transactions.length === 1 ? '' : 's'}`;
  const where = input.account ? ` on ${input.account.name}` : '';
  const scope = input.scopeLabel ? ` for ${input.scopeLabel}` : '';
  const search = input.search ? ` matching “${input.search}”` : '';
  return `${what}${where}${scope}${search} in ${input.range.label.toLowerCase()}, ${lines} line${
    lines === 1 ? '' : 's'
  } in all.`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
