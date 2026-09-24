import { describe, expect, it } from 'vitest';
import {
  columnHeader,
  columnTotals,
  formatPdfCell,
  formatPdfMoney,
  formatPdfStat,
  pdfFilename,
  pdfLocale,
  resolveTone,
  type PdfTable,
} from '@/lib/pdf/spec';
import { buildStatement, statementCurrency } from '@/lib/statement';
import type { Transaction, TransactionSplit } from '@/server/firefly/types';

const CHECKING = '104';
const CARD = '222';

function split(overrides: Partial<TransactionSplit> = {}): TransactionSplit {
  return {
    transaction_journal_id: '1',
    type: 'withdrawal',
    date: '2026-09-15T00:00:00+00:00',
    amount: '100.00',
    currency_code: 'EUR',
    currency_symbol: '€',
    currency_decimal_places: 2,
    foreign_amount: null,
    foreign_currency_code: null,
    description: 'Something',
    source_id: CHECKING,
    source_name: 'Checking',
    source_type: 'Asset account',
    destination_id: '300',
    destination_name: 'A shop',
    destination_type: 'Expense account',
    category_id: null,
    category_name: null,
    budget_id: null,
    budget_name: null,
    bill_id: null,
    bill_name: null,
    tags: null,
    notes: null,
    reconciled: false,
    internal_reference: null,
    external_url: null,
    ...overrides,
  };
}

function group(id: string, ...splits: TransactionSplit[]): Transaction {
  return {
    type: 'transactions',
    id,
    attributes: {
      created_at: '2026-09-01T00:00:00+00:00',
      updated_at: '2026-09-01T00:00:00+00:00',
      user: '1',
      group_title: null,
      transactions: splits,
    },
  } as Transaction;
}

const RANGE = { start: '2026-09-01', end: '2026-09-30', label: 'This month' };

describe('pdf spec formatting', () => {
  it('forces Latin digits so the embedded font can draw them', () => {
    expect(pdfLocale('bn-BD')).toContain('nu-latn');
    expect(formatPdfMoney('1234.5', { locale: 'bn-BD' })).toMatch(/^[\d,.]+$/);
  });

  it('falls back to en-US for a malformed locale', () => {
    expect(pdfLocale('not a locale!!')).toBe('en-US');
  });

  it('leaves the currency to the header, except for a row in another currency', () => {
    expect(formatPdfMoney('1234.5', { currency: 'EUR', tableCurrency: 'EUR' })).toBe('1,234.50');
    expect(formatPdfMoney('12', { currency: 'USD', tableCurrency: 'EUR' })).toBe('USD 12.00');
    expect(columnHeader({ key: 'a', header: 'Spent', kind: 'money' }, 'BDT')).toBe('Spent (BDT)');
    expect(columnHeader({ key: 'a', header: 'Name' }, 'BDT')).toBe('Name');
  });

  it('formats each kind of cell and never prints "undefined"', () => {
    const row = { d: '2026-09-15T10:00:00+06:00', m: '2026-03', p: '12.345', c: 1200, n: null };
    expect(formatPdfCell({ key: 'd', header: '', kind: 'date' }, row)).toBe('Sep 15, 2026');
    expect(formatPdfCell({ key: 'm', header: '', kind: 'month' }, row)).toBe('Mar 2026');
    expect(formatPdfCell({ key: 'p', header: '', kind: 'percent' }, row)).toBe('12.3%');
    expect(formatPdfCell({ key: 'c', header: '', kind: 'count' }, row)).toBe('1,200');
    expect(formatPdfCell({ key: 'n', header: '' }, row)).toBe('—');
    expect(formatPdfCell({ key: 'n', header: '', kind: 'money' }, row)).toBe('');
    expect(formatPdfCell({ key: 'missing', header: '' }, row)).toBe('—');
  });

  it('prints a headline figure with its code', () => {
    expect(formatPdfStat({ label: 'x', value: '-50', currency: 'EUR' })).toBe('EUR -50.00');
    expect(formatPdfStat({ label: 'x', value: 7, kind: 'count' })).toBe('7');
    expect(formatPdfStat({ label: 'x', value: 33.333, kind: 'percent' })).toBe('33.3%');
    expect(formatPdfStat({ label: 'x', value: null, kind: 'percent' })).toBe('—');
  });

  it('colours auto by sign and keeps a stated tone whatever the sign', () => {
    expect(resolveTone('auto', '-1')).toBe('expense');
    expect(resolveTone('auto', '1')).toBe('income');
    expect(resolveTone('auto', '0')).toBe('neutral');
    expect(resolveTone('auto', null)).toBe('neutral');
    // A spending column reports magnitudes: bigger is not better.
    expect(resolveTone('expense', '500')).toBe('expense');
    expect(resolveTone(undefined, '500')).toBe('neutral');
  });

  it('totals on Decimal and never adds another currency into the sum', () => {
    const table: PdfTable = {
      currency: 'EUR',
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'amount', header: 'Amount', kind: 'money', currencyKey: 'cur', total: true },
        { key: 'n', header: 'N', kind: 'count', total: true },
      ],
      rows: [
        { name: 'a', amount: '0.1', cur: 'EUR', n: 1 },
        { name: 'b', amount: '0.2', cur: 'EUR', n: 2 },
        { name: 'c', amount: '99', cur: 'USD', n: 3 },
      ],
    };
    const { totals, skipped } = columnTotals(table);
    expect(totals.amount).toBe('0.3');
    expect(totals.n).toBe(6);
    expect(skipped).toBe(1);
  });

  it('returns no totals when no column asks for one', () => {
    expect(columnTotals({ columns: [{ key: 'a', header: 'A' }], rows: [{ a: 1 }] })).toEqual({
      totals: {},
      skipped: 0,
    });
  });

  it('makes a safe file name', () => {
    expect(pdfFilename('Transactions — This Month!')).toBe('transactions-this-month.pdf');
    expect(pdfFilename('***')).toBe('export.pdf');
  });
});

describe('buildStatement', () => {
  it('lists lines oldest first, whatever order the page used', () => {
    const doc = buildStatement({
      currency: 'EUR',
      range: RANGE,
      transactions: [
        group('2', split({ date: '2026-09-20T00:00:00+00:00', description: 'Later' })),
        group('1', split({ date: '2026-09-02T00:00:00+00:00', description: 'Earlier' })),
      ],
    });
    expect(doc.tables[0]?.rows.map((row) => row.description)).toEqual(['Earlier', 'Later']);
    expect(doc.kind).toBe('statement');
    expect(doc.title).toBe('Transaction statement');
  });

  it('keeps transfers out of money in and out when no account is pinned', () => {
    const doc = buildStatement({
      currency: 'EUR',
      range: RANGE,
      transactions: [
        group('1', split({ type: 'withdrawal', amount: '40' })),
        group(
          '2',
          split({ type: 'deposit', amount: '100', source_id: '9', destination_id: CHECKING }),
        ),
        group('3', split({ type: 'transfer', amount: '25', destination_id: '105' })),
      ],
    });
    const stats = Object.fromEntries((doc.stats ?? []).map((stat) => [stat.label, stat.value]));
    expect(stats['Money in']).toBe('100');
    expect(stats['Money out']).toBe('40');
    expect(stats['Net movement']).toBe('60');
    expect(stats.Transfers).toBe('25');
    expect(doc.tables[0]?.columns.map((column) => column.key)).toContain('transfer');
    expect(doc.balance).toBeUndefined();
  });

  it('reads direction from the account side, so a card repayment is money in', () => {
    const doc = buildStatement({
      currency: 'EUR',
      range: RANGE,
      account: { id: CARD, name: 'EBL Visa', currency: 'EUR', opening: '-500' },
      transactions: [
        // Paying the card off is a withdrawal INTO the card.
        group(
          '1',
          split({
            amount: '300',
            source_id: CHECKING,
            destination_id: CARD,
            date: '2026-09-03T00:00:00+00:00',
          }),
        ),
        group(
          '2',
          split({
            amount: '50',
            source_id: CARD,
            destination_id: '300',
            date: '2026-09-04T00:00:00+00:00',
          }),
        ),
      ],
    });
    const rows = doc.tables[0]?.rows ?? [];
    expect(rows[0]?.in).toBe('300');
    expect(rows[1]?.out).toBe('50');
    expect(rows.map((row) => row.balance)).toEqual(['-200', '-250']);
    expect(doc.balance).toMatchObject({ opening: '-500', closing: '-250', currency: 'EUR' });
    expect(doc.title).toBe('Account statement');
  });

  it('shows no running balance without an opening figure, and says why', () => {
    const doc = buildStatement({
      currency: 'EUR',
      range: RANGE,
      account: { id: CHECKING, name: 'Checking', opening: null },
      transactions: [group('1', split())],
    });
    expect(doc.tables[0]?.columns.some((column) => column.key === 'balance')).toBe(false);
    expect(doc.notes?.some((note) => note.includes('No running balance'))).toBe(true);
  });

  it('lists a line in another currency and leaves it out of the totals', () => {
    const doc = buildStatement({
      currency: 'EUR',
      range: RANGE,
      transactions: [
        group('1', split({ amount: '10' })),
        group('2', split({ amount: '999', currency_code: 'USD' })),
      ],
    });
    const stats = Object.fromEntries((doc.stats ?? []).map((stat) => [stat.label, stat.value]));
    expect(stats['Money out']).toBe('10');
    expect(doc.tables[0]?.rows[1]?.currency).toBe('USD');
    expect(doc.notes?.[0]).toMatch(/another currency/);
  });

  it('notes a partial page and a drill-through scope', () => {
    const doc = buildStatement({
      currency: 'EUR',
      range: RANGE,
      scopeLabel: 'category: Groceries',
      page: 2,
      totalPages: 3,
      transactions: [group('1', split({ category_name: 'Groceries', tags: ['trip'] }))],
    });
    expect(doc.notes?.some((note) => note.includes('page 2 of 3'))).toBe(true);
    expect(doc.facts).toContainEqual({ label: 'Scope', value: 'Category: Groceries' });
    expect(doc.tables[0]?.rows[0]?.detail).toBe('Groceries  ·  #trip');
  });

  it('picks the preferred currency when present, otherwise the most common', () => {
    expect(statementCurrency([split({ currency_code: 'USD' }), split()], 'EUR')).toBe('EUR');
    expect(
      statementCurrency(
        [
          split({ currency_code: 'USD' }),
          split({ currency_code: 'USD' }),
          split({ currency_code: 'GBP' }),
        ],
        'EUR',
      ),
    ).toBe('USD');
    expect(statementCurrency([], 'EUR')).toBe('EUR');
  });
});
