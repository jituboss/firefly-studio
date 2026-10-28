import { describe, expect, it } from 'vitest';
import { mapHeaders } from '@/lib/import/columns';
import {
  parseImportAmount,
  parseImportDate,
  readImportRow,
  type ImportRow,
} from '@/lib/import/cells';
import { parseCsv } from '@/lib/import/csv';
import {
  fingerprintKey,
  planImport,
  suggestAccount,
  type ExistingAccount,
  type ImportOverrides,
  type LedgerLists,
} from '@/lib/import/plan';
import { summarise } from '@/lib/import/summary';
import { SAMPLE_NOTE } from '@/lib/import/sample';

describe('parseImportDate', () => {
  it('reads an Excel date cell by its UTC calendar day', () => {
    // exceljs hands a date cell over as UTC midnight; reading it in local time
    // west of Greenwich would book it the day before.
    expect(parseImportDate(new Date(Date.UTC(2026, 2, 15)))).toBe('2026-03-15');
  });

  it('reads an Excel serial day number', () => {
    expect(parseImportDate(46096)).toBe('2026-03-15');
  });

  it('accepts year-first text only', () => {
    expect(parseImportDate('2026-03-15')).toBe('2026-03-15');
    expect(parseImportDate('2026/3/5')).toBe('2026-03-05');
    expect(parseImportDate('2026-03-15 13:45')).toBe('2026-03-15');
    // 03/04/2026 is a different day on each side of the Atlantic.
    expect(parseImportDate('03/04/2026')).toBeNull();
  });

  it('refuses a day that does not exist', () => {
    expect(parseImportDate('2026-02-30')).toBeNull();
    expect(parseImportDate('2024-02-29')).toBe('2024-02-29');
  });
});

describe('parseImportAmount', () => {
  it('turns an Excel double into its intended decimal', () => {
    expect(parseImportAmount(12.1)).toEqual({ value: '12.1', negative: false });
    expect(parseImportAmount(0.1 + 0.2)).toEqual({ value: '0.3', negative: false });
  });

  it('reads both decimal conventions from text', () => {
    expect(parseImportAmount('1,234.56')?.value).toBe('1234.56');
    expect(parseImportAmount('1.234,56')?.value).toBe('1234.56');
    expect(parseImportAmount('12,5')?.value).toBe('12.5');
    expect(parseImportAmount('1,234')?.value).toBe('1234');
  });

  it('strips currency symbols and reads accounting negatives', () => {
    expect(parseImportAmount('€ 42.00')).toEqual({ value: '42', negative: false });
    expect(parseImportAmount('(15.20)')).toEqual({ value: '15.2', negative: true });
    expect(parseImportAmount('-7')).toEqual({ value: '7', negative: true });
  });

  it('refuses zero and junk', () => {
    expect(parseImportAmount('0')).toBeNull();
    expect(parseImportAmount('abc')).toBeNull();
    expect(parseImportAmount(null)).toBeNull();
  });
});

describe('mapHeaders', () => {
  it('matches loosely and reports what it could not place', () => {
    const map = mapHeaders(['date', 'AMOUNT', 'Memo', 'From', 'Paid to', 'Whatever']);
    expect(map.columns).toMatchObject({
      date: 0,
      amount: 1,
      description: 2,
      source: 3,
      destination: 4,
    });
    expect(map.missing).toEqual([]);
    expect(map.ignored).toEqual(['Whatever']);
  });

  it('lists missing required columns', () => {
    expect(mapHeaders(['Date', 'Amount']).missing.map((c) => c.key)).toEqual([
      'description',
      'source',
      'destination',
    ]);
  });
});

describe('parseCsv', () => {
  it('handles quotes, doubled quotes, newlines in fields and a BOM', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\n"two\nlines",3')).toEqual([
      ['a', 'b'],
      ['x, y', 'he said "hi"'],
      ['two\nlines', '3'],
    ]);
  });

  it('detects a semicolon separator', () => {
    expect(parseCsv('Date;Amount\n2026-01-01;12,50')).toEqual([
      ['Date', 'Amount'],
      ['2026-01-01', '12,50'],
    ]);
  });
});

const HEADERS = mapHeaders([
  'Date',
  'Amount',
  'Description',
  'Source',
  'Destination',
  'Type',
  'Source kind',
  'Destination kind',
  'Currency',
]);

function row(line: number, cells: Array<string | number | null>): ImportRow {
  const parsed = readImportRow(cells, HEADERS, line);
  if (!parsed) throw new Error('empty row');
  return parsed;
}

describe('readImportRow', () => {
  it('returns null for a blank row', () => {
    expect(readImportRow([null, '', '  '], HEADERS, 2)).toBeNull();
  });

  it('collects every problem rather than stopping at the first', () => {
    const parsed = row(2, ['soon', 'lots', '', 'A', '']);
    expect(parsed.problems).toHaveLength(4);
  });

  it('takes a negative amount as its magnitude and says so', () => {
    const parsed = row(2, ['2026-01-02', -5, 'Coffee', 'Current', 'Cafe']);
    expect(parsed.amount).toBe('5');
    expect(parsed.problems).toEqual([]);
    expect(parsed.notices[0]).toMatch(/negative/);
  });

  it('reads type aliases and kinds', () => {
    const parsed = row(2, ['2026-01-02', 5, 'x', 'A', 'B', 'income', 'Revenue account', 'loan']);
    expect(parsed.type).toBe('deposit');
    expect(parsed.sourceKind).toBe('revenue');
    expect(parsed.destinationKind).toBe('loan');
  });
});

const ACCOUNTS: ExistingAccount[] = [
  { id: '1', name: 'Everyday Current', kind: 'asset', active: true, currency: 'EUR' },
  { id: '2', name: 'Savings', kind: 'asset', active: true, currency: 'EUR' },
  { id: '3', name: 'Rewe', kind: 'expense', active: true, currency: null },
  { id: '4', name: 'Employer', kind: 'revenue', active: true, currency: null },
  { id: '5', name: 'Car loan', kind: 'loan', active: true, currency: 'EUR' },
  { id: '6', name: 'Visa', kind: 'asset', active: true, currency: 'EUR' },
  { id: '7', name: 'Visa', kind: 'expense', active: true, currency: null },
  { id: '8', name: 'Old card', kind: 'asset', active: false, currency: 'EUR' },
];

function plan(rows: ImportRow[], ledger: Record<string, number> = {}, overrides?: ImportOverrides) {
  return planImport({ rows, accounts: ACCOUNTS, ledger, currencies: ['EUR', 'USD'], overrides });
}

describe('planImport — types and accounts', () => {
  it('infers every type from the account pair', () => {
    const result = plan([
      row(2, ['2026-01-01', 10, 'Shop', 'Everyday Current', 'rewe']),
      row(3, ['2026-01-01', 10, 'Pay', 'Employer', 'Everyday Current']),
      row(4, ['2026-01-01', 10, 'Save', 'Everyday Current', 'Savings']),
      row(5, ['2026-01-01', 10, 'Loan payment', 'Everyday Current', 'Car loan']),
    ]);
    expect(result.rows.map((r) => r.type)).toEqual([
      'withdrawal',
      'deposit',
      'transfer',
      'withdrawal',
    ]);
    expect(result.rows.every((r) => r.status === 'ready')).toBe(true);
    // Matched case-insensitively, to the existing id.
    expect(result.rows[0]!.destination).toMatchObject({ id: '3', newKey: null });
  });

  it('creates a new payee as an expense and a new payer as revenue', () => {
    const result = plan([
      row(2, ['2026-01-01', 10, 'x', 'Everyday Current', 'New Shop']),
      row(3, ['2026-01-01', 10, 'y', 'New Client', 'Everyday Current']),
    ]);
    expect(result.newAccounts.map((a) => [a.name, a.kind])).toEqual([
      ['New Shop', 'expense'],
      ['New Client', 'revenue'],
    ]);
    expect(result.rows.map((r) => r.type)).toEqual(['withdrawal', 'deposit']);
  });

  it('only creates an account of your own when told which one it is', () => {
    // Neither name exists and nothing hints at either — no account words, one
    // row, no context. Both are listed for the preview; nothing is created
    // until one of them is said to be yours.
    const vague = plan([row(2, ['2026-01-01', 10, 'x', 'Alpha', 'Beta'])]);
    expect(vague.rows[0]!.status).toBe('error');
    expect(vague.rows[0]!.errors.join(' ')).toMatch(/New accounts/);
    expect(vague.newAccounts.map((a) => [a.name, a.kind, a.needed])).toEqual([
      ['Alpha', 'revenue', false],
      ['Beta', 'expense', false],
    ]);

    // Said in the file…
    const stated = plan([row(2, ['2026-01-01', 10, 'x', 'Alpha', 'Beta', '', 'asset'])]);
    expect(stated.rows[0]!.status).toBe('ready');
    expect(stated.newAccounts.map((a) => a.kind).sort()).toEqual(['asset', 'expense']);

    // …or chosen in the preview.
    const chosen = plan(
      [row(2, ['2026-01-01', 10, 'x', 'Alpha', 'Beta'])],
      {},
      {
        rows: {},
        accounts: { alpha: { kind: 'asset' } },
      },
    );
    expect(chosen.rows[0]!.status).toBe('ready');
    expect(chosen.newAccounts.every((a) => a.needed)).toBe(true);
  });

  it('picks the pair the table allows when a name exists as two kinds', () => {
    // "Visa" is an asset AND an expense. As a destination of Savings it can
    // be either; as a SOURCE paying Rewe only the asset works.
    const result = plan([row(2, ['2026-01-01', 10, 'x', 'Visa', 'Rewe'])]);
    expect(result.rows[0]!.source).toMatchObject({ id: '6', kind: 'asset' });
  });

  it('honours a stated type when choosing between same-named accounts', () => {
    const result = plan([row(2, ['2026-01-01', 10, 'x', 'Savings', 'Visa', 'transfer'])]);
    expect(result.rows[0]!.destination).toMatchObject({ id: '6' });
    expect(result.rows[0]!.type).toBe('transfer');
  });

  it('flags a stated type the accounts contradict, and offers a swap when that fixes it', () => {
    const result = plan([row(2, ['2026-01-01', 10, 'x', 'Rewe', 'Everyday Current'])]);
    expect(result.rows[0]!.status).toBe('error');
    expect(result.rows[0]!.canSwap).toBe(true);

    const swapped = plan(
      [row(2, ['2026-01-01', 10, 'x', 'Rewe', 'Everyday Current'])],
      {},
      {
        rows: { '2': { swap: true } },
        accounts: {},
      },
    );
    expect(swapped.rows[0]!.status).toBe('ready');
    expect(swapped.rows[0]!.type).toBe('withdrawal');
  });

  it('refuses a transfer between an asset and a liability', () => {
    const result = plan([
      row(2, ['2026-01-01', 10, 'x', 'Everyday Current', 'Car loan', 'transfer']),
    ]);
    expect(result.rows[0]!.status).toBe('error');
    expect(result.rows[0]!.errors.join(' ')).toMatch(/withdrawal/);
  });

  it('applies account overrides: a kind, or an existing account instead', () => {
    const rows = [row(2, ['2026-01-01', 10, 'x', 'Everyday Current', 'Amazn'])];
    const mapped = plan(
      rows,
      {},
      {
        rows: {},
        accounts: { amazn: { mapTo: { id: '3', name: 'Rewe', kind: 'expense' } } },
      },
    );
    expect(mapped.newAccounts).toEqual([]);
    expect(mapped.rows[0]!.destination).toMatchObject({ id: '3' });

    const asLoan = plan(rows, {}, { rows: {}, accounts: { amazn: { kind: 'loan' } } });
    expect(asLoan.newAccounts[0]).toMatchObject({ kind: 'loan' });
    expect(asLoan.rows[0]!.type).toBe('withdrawal');
  });

  it('warns about archived accounts and refuses unknown currencies', () => {
    const result = plan([
      row(2, ['2026-01-01', 10, 'x', 'Old card', 'Rewe']),
      row(3, ['2026-01-01', 10, 'x', 'Everyday Current', 'Rewe', '', '', '', 'JPY']),
    ]);
    expect(result.rows[0]!.warnings.join(' ')).toMatch(/archived/);
    expect(result.rows[1]!.status).toBe('error');
  });

  it('skips a row on request', () => {
    const result = plan(
      [row(2, ['nope', 10, 'x', 'A', 'B'])],
      {},
      { rows: { '2': { skip: true } }, accounts: {} },
    );
    expect(result.rows[0]!.status).toBe('skipped');
    expect(result.counts.skipped).toBe(1);
  });
});

describe('planImport — duplicates', () => {
  const coffee = (line: number) =>
    row(line, ['2026-01-05', 3.5, 'Coffee', 'Everyday Current', 'Rewe']);
  const key = fingerprintKey('2026-01-05', '3.50', '1', '3');

  it('flags a row already in the ledger', () => {
    expect(plan([coffee(2)], { [key]: 1 }).rows[0]!.status).toBe('duplicate');
  });

  it('counts identical rows instead of collapsing them', () => {
    // Two coffees in the file, one in the ledger: the second is new.
    const result = plan([coffee(2), coffee(3)], { [key]: 1 });
    expect(result.rows.map((r) => r.status)).toEqual(['duplicate', 'ready']);
    expect(result.rows[1]!.warnings.join(' ')).toMatch(/row 2/);
  });

  it('imports a duplicate the user vouches for', () => {
    const result = plan(
      [coffee(2)],
      { [key]: 1 },
      { rows: { '2': { force: true } }, accounts: {} },
    );
    expect(result.rows[0]!.status).toBe('ready');
  });

  it('does not treat a different amount as the same transaction', () => {
    const other = row(2, ['2026-01-05', 3.6, 'Coffee', 'Everyday Current', 'Rewe']);
    expect(plan([other], { [key]: 1 }).rows[0]!.status).toBe('ready');
  });

  it('normalises amounts the way the ledger writes them', () => {
    expect(fingerprintKey('2026-01-05', '3.500000000000', '1', '3')).toBe(key);
  });
});

describe('suggestAccount', () => {
  it('finds a near-identical name, same kind first', () => {
    expect(suggestAccount('rewe.', 'expense', ACCOUNTS)?.id).toBe('3');
    expect(suggestAccount('Everyday Curent', 'asset', ACCOUNTS)?.id).toBe('1');
    expect(suggestAccount('Something else', 'expense', ACCOUNTS)).toBeNull();
  });
});

describe('summarise', () => {
  it('counts only what was written, per type and per currency', () => {
    const rows = [
      {
        line: 2,
        type: 'withdrawal' as const,
        date: '2026-01-02',
        amount: '10.5',
        source: { id: '1', name: 'Everyday Current', kind: 'asset' as const },
        destination: { id: '3', name: 'Rewe', kind: 'expense' as const },
      },
      {
        line: 3,
        type: 'deposit' as const,
        date: '2026-01-01',
        amount: '100',
        source: { id: '4', name: 'Employer', kind: 'revenue' as const },
        destination: { id: '1', name: 'Everyday Current', kind: 'asset' as const },
      },
      {
        line: 4,
        type: 'withdrawal' as const,
        date: '2026-01-09',
        amount: '1',
        source: { id: '1', name: 'Everyday Current', kind: 'asset' as const },
        destination: { id: '3', name: 'Rewe', kind: 'expense' as const },
      },
    ];
    const summary = summarise(rows, {
      '2': { status: 'imported', currency: 'EUR' },
      '3': { status: 'imported', currency: 'EUR' },
      '4': { status: 'failed', error: 'x' },
    });
    expect(summary).toMatchObject({
      imported: 2,
      failed: 1,
      firstDate: '2026-01-01',
      lastDate: '2026-01-02',
    });
    expect(summary.totals).toEqual([
      { type: 'withdrawal', currency: 'EUR', count: 1, amount: '10.5' },
      { type: 'deposit', currency: 'EUR', count: 1, amount: '100' },
    ]);
    // Only your own accounts, net.
    expect(summary.accounts).toEqual([
      { id: '1', name: 'Everyday Current', currency: 'EUR', change: '89.5' },
    ]);
  });
});

describe('planImport — starting from an empty ledger', () => {
  const empty = (
    rows: ImportRow[],
    lists: LedgerLists = { categories: [], budgets: [], tags: [] },
  ) => planImport({ rows, accounts: [], ledger: {}, currencies: [], lists });

  it('builds accounts and types from the file alone', () => {
    const result = empty([
      row(2, ['2026-01-01', 3000, 'Salary', 'Acme Ltd', 'Main Bank']),
      row(3, ['2026-01-02', 40, 'Groceries', 'Main Bank', 'Corner Market']),
      row(4, ['2026-01-03', 500, 'Transfer to savings', 'Main Bank', 'Rainy Day Pot']),
      row(5, ['2026-01-04', 300, 'Car loan repayment', 'Main Bank', 'Car Loan']),
    ]);
    expect(result.rows.map((r) => [r.type, r.status])).toEqual([
      ['deposit', 'ready'],
      ['withdrawal', 'ready'],
      ['transfer', 'ready'],
      ['withdrawal', 'ready'],
    ]);
    const kinds = Object.fromEntries(result.newAccounts.map((a) => [a.name, a.kind]));
    expect(kinds).toEqual({
      'Acme Ltd': 'revenue',
      'Main Bank': 'asset',
      'Corner Market': 'expense',
      'Rainy Day Pot': 'asset',
      'Car Loan': 'loan',
    });
    // Every guess explains itself.
    expect(result.newAccounts.every((a) => a.reason.length > 0)).toBe(true);
  });

  it('finds the account a bank export is about, even with a bland name', () => {
    const result = empty([
      row(2, ['2026-01-01', 10, 'a', 'Everyday', 'Shop A']),
      row(3, ['2026-01-02', 10, 'b', 'Everyday', 'Shop B']),
      row(4, ['2026-01-03', 10, 'c', 'Everyday', 'Shop C']),
      row(5, ['2026-01-04', 10, 'd', 'Shop D', 'Everyday']),
    ]);
    expect(result.newAccounts.find((a) => a.name === 'Everyday')).toMatchObject({
      kind: 'asset',
      confidence: 'high',
    });
    expect(result.counts.ready).toBe(4);
  });

  it('keeps a shop that refunds you as a payee and a payer, as Firefly does', () => {
    const result = empty([
      row(2, ['2026-01-01', 10, 'Order', 'Main Bank', 'Online Store']),
      row(3, ['2026-01-05', 10, 'Refund', 'Online Store', 'Main Bank']),
    ]);
    expect(result.rows.map((r) => r.type)).toEqual(['withdrawal', 'deposit']);
    expect(result.rows[1]!.source).toMatchObject({ name: 'Online Store', kind: 'revenue' });
    expect(result.rows[0]!.destination).toMatchObject({ name: 'Online Store', kind: 'expense' });
  });

  it('reuses existing categories, budgets and tags whatever their capitals', () => {
    const result = empty(
      [
        row(2, ['2026-01-01', 40, 'Food', 'Main Bank', 'Shop']),
        row(3, ['2026-01-02', 40, 'Food', 'Main Bank', 'Shop']),
      ].map((r, i) => ({
        ...r,
        category: i === 0 ? 'groceries' : 'Dining',
        budget: 'FOOD',
        tags: ['Weekly', 'new-tag'],
      })),
      { categories: ['Groceries'], budgets: ['Food'], tags: ['weekly'] },
    );
    expect(result.rows[0]).toMatchObject({ category: 'Groceries', budget: 'Food' });
    expect(result.rows[0]!.tags).toEqual(['weekly', 'new-tag']);
    expect(result.setup.categories).toEqual([
      { name: 'Dining', isNew: true, rows: 1 },
      { name: 'Groceries', isNew: false, rows: 1 },
    ]);
    expect(result.setup.budgets).toEqual([{ name: 'Food', isNew: false, rows: 2 }]);
    expect(result.setup.tags.find((t) => t.name === 'new-tag')).toMatchObject({ isNew: true });
  });

  it('skips the template sample rows unless asked to include them', () => {
    const sample = { ...row(2, ['2026-01-01', 10, 'x', 'Main Bank', 'Shop']), notes: SAMPLE_NOTE };
    expect(empty([sample]).rows[0]!.status).toBe('skipped');
    const included = planImport({
      rows: [sample],
      accounts: [],
      ledger: {},
      currencies: [],
      overrides: { rows: { '2': { skip: false } }, accounts: {} },
    });
    expect(included.rows[0]!.status).toBe('ready');
  });
});
