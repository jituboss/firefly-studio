import { add, negate, toDecimal } from '@/lib/money';
import { isOwn, type AccountKind, type FlowType } from '@/lib/account-matrix';

/**
 * What a finished import did, worked out from what was written rather than
 * from what was planned — a row the plan called ready can still be refused by
 * Firefly, and the summary must not count it.
 */

export interface CommittedSide {
  id: string | null;
  name: string;
  kind: AccountKind | null;
}

export interface CommittedRow {
  line: number;
  type: FlowType;
  date: string;
  amount: string;
  source: CommittedSide;
  destination: CommittedSide;
}

export interface RowResult {
  status: 'imported' | 'failed' | 'duplicate';
  groupId?: string;
  error?: string;
  /** The currency Firefly booked it in, read back from the response. */
  currency?: string;
}

export interface ImportSummary {
  imported: number;
  failed: number;
  duplicates: number;
  firstDate: string | null;
  lastDate: string | null;
  /** One line per (type, currency). */
  totals: Array<{ type: FlowType; currency: string; count: number; amount: string }>;
  /** Net change on each of your own accounts, per currency. */
  accounts: Array<{ id: string | null; name: string; currency: string; change: string }>;
}

export function summarise(rows: CommittedRow[], results: Record<string, RowResult>): ImportSummary {
  let imported = 0;
  let failed = 0;
  let duplicates = 0;
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  const totals = new Map<
    string,
    { type: FlowType; currency: string; count: number; amount: string }
  >();
  const accounts = new Map<
    string,
    { id: string | null; name: string; currency: string; change: string }
  >();

  for (const row of rows) {
    const result = results[String(row.line)];
    if (!result) continue;
    if (result.status === 'failed') failed += 1;
    if (result.status === 'duplicate') duplicates += 1;
    if (result.status !== 'imported') continue;
    imported += 1;

    if (!firstDate || row.date < firstDate) firstDate = row.date;
    if (!lastDate || row.date > lastDate) lastDate = row.date;

    const currency = result.currency ?? '';
    const totalKey = `${row.type}|${currency}`;
    const total = totals.get(totalKey) ?? { type: row.type, currency, count: 0, amount: '0' };
    total.count += 1;
    total.amount = add(total.amount, row.amount).toFixed();
    totals.set(totalKey, total);

    for (const [side, sign] of [
      [row.source, -1],
      [row.destination, 1],
    ] as const) {
      if (!isOwn(side.kind)) continue;
      const key = `${side.id ?? side.name}|${currency}`;
      const entry = accounts.get(key) ?? { id: side.id, name: side.name, currency, change: '0' };
      const delta = sign < 0 ? negate(row.amount) : toDecimal(row.amount);
      entry.change = add(entry.change, delta).toFixed();
      accounts.set(key, entry);
    }
  }

  const order: FlowType[] = ['withdrawal', 'deposit', 'transfer'];
  return {
    imported,
    failed,
    duplicates,
    firstDate,
    lastDate,
    totals: [...totals.values()].sort(
      (a, b) =>
        order.indexOf(a.type) - order.indexOf(b.type) || a.currency.localeCompare(b.currency),
    ),
    accounts: [...accounts.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}
