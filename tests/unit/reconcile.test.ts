import { describe, expect, it } from 'vitest';
import {
  buildReconcileRows,
  clearedTotal,
  correctionPlan,
  countChanges,
  describeChanges,
  findReconciliationAccount,
  initialSelection,
  isReconcilable,
  parseStatementInput,
  planReconciledWrites,
  reconcileMath,
  reconciliationAccountName,
  splitEffect,
} from '@/lib/reconcile';
import type { Account, Transaction, TransactionSplit } from '@/server/firefly/types';

const ASSET = '104';

function split(overrides: Partial<TransactionSplit> = {}): TransactionSplit {
  return {
    transaction_journal_id: '1',
    type: 'withdrawal',
    date: '2026-08-15T00:00:00+00:00',
    amount: '100.00',
    currency_code: 'EUR',
    currency_symbol: '€',
    currency_decimal_places: 2,
    foreign_amount: null,
    foreign_currency_code: null,
    description: 'Groceries',
    source_id: ASSET,
    source_name: 'Everyday Current',
    source_type: 'Asset account',
    destination_id: '300',
    destination_name: 'Corner Shop',
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

function group(id: string, splits: TransactionSplit[]): Transaction {
  return {
    type: 'transactions',
    id,
    attributes: {
      created_at: '2026-08-15T00:00:00+00:00',
      updated_at: '2026-08-15T00:00:00+00:00',
      user: '1',
      group_title: splits.length > 1 ? 'Split' : null,
      transactions: splits,
    },
  } as Transaction;
}

function account(id: string, name: string, type: string): Account {
  return {
    type: 'accounts',
    id,
    attributes: { name, type, currency_code: 'EUR' },
  } as unknown as Account;
}

describe('reconciliationAccountName', () => {
  it("matches Firefly's own template", () => {
    expect(reconciliationAccountName('Everyday Current', 'EUR')).toBe(
      'Everyday Current reconciliation (EUR)',
    );
  });
});

describe('findReconciliationAccount', () => {
  const holding = account('209', 'Everyday Current reconciliation (EUR)', 'reconciliation');

  it('finds the holding account by generated name', () => {
    expect(findReconciliationAccount([holding], 'Everyday Current', 'EUR')?.id).toBe('209');
  });

  it('tolerates case and repeated whitespace', () => {
    const messy = account('209', '  everyday   current RECONCILIATION (eur) ', 'reconciliation');
    expect(findReconciliationAccount([messy], 'Everyday Current', 'EUR')?.id).toBe('209');
  });

  it('refuses a same-named account of another type', () => {
    const impostor = account('310', 'Everyday Current reconciliation (EUR)', 'expense');
    expect(findReconciliationAccount([impostor], 'Everyday Current', 'EUR')).toBeNull();
  });

  it("does not match another account's holding account", () => {
    expect(findReconciliationAccount([holding], 'Emergency Savings', 'EUR')).toBeNull();
  });

  it('distinguishes currencies on the same account name', () => {
    expect(findReconciliationAccount([holding], 'Everyday Current', 'USD')).toBeNull();
  });
});

describe('isReconcilable', () => {
  it.each([
    ['asset', true],
    ['liabilities', false],
    ['expense', false],
    ['revenue', false],
    ['reconciliation', false],
  ])('%s → %s', (type, expected) => {
    expect(isReconcilable(account('1', 'x', type))).toBe(expected);
  });
});

describe('splitEffect', () => {
  it('is negative when money leaves the account', () => {
    expect(splitEffect(split(), ASSET, 'EUR').effect).toBe('-100.00');
  });

  it('is positive when money arrives', () => {
    const deposit = split({
      type: 'deposit',
      source_id: '400',
      destination_id: ASSET,
    });
    expect(splitEffect(deposit, ASSET, 'EUR').effect).toBe('100.00');
  });

  it('is zero for a split that does not touch the account', () => {
    const elsewhere = split({ source_id: '999', destination_id: '300' });
    expect(splitEffect(elsewhere, ASSET, 'EUR')).toEqual({
      effect: '0',
      amount: '0',
      unconvertible: false,
    });
  });

  it('uses the foreign amount when it is the side denominated in our currency', () => {
    const fx = split({
      amount: '120.00',
      currency_code: 'USD',
      foreign_amount: '101.50',
      foreign_currency_code: 'EUR',
    });
    expect(splitEffect(fx, ASSET, 'EUR')).toEqual({
      effect: '-101.50',
      amount: '101.50',
      unconvertible: false,
    });
  });

  it('reports a split in a third currency rather than counting it as zero', () => {
    const fx = split({ amount: '120.00', currency_code: 'USD' });
    expect(splitEffect(fx, ASSET, 'EUR').unconvertible).toBe(true);
    expect(splitEffect(fx, ASSET, 'EUR').effect).toBe('0');
  });

  it('normalises a negative amount to the direction the accounts imply', () => {
    // Firefly reports magnitudes, but a hand-rolled payload or a future version
    // could send a signed one; direction must come from the accounts alone.
    expect(splitEffect(split({ amount: '-100.00' }), ASSET, 'EUR').effect).toBe('-100.00');
  });

  it('honours a currency that is not carried to two places', () => {
    const bhd = split({ amount: '10.125', currency_code: 'BHD' });
    expect(splitEffect(bhd, ASSET, 'BHD', 3).effect).toBe('-10.125');
    // Forced down to two places it rounds half-to-even, per lib/money's global
    // Decimal config — 10.125 goes to 10.12, not 10.13. Asserted so that a
    // change to that config shows up here rather than as a cent of drift
    // spread across a reconciliation.
    expect(splitEffect(bhd, ASSET, 'BHD', 2).effect).toBe('-10.12');
  });
});

describe('buildReconcileRows', () => {
  it('keeps only the legs that touch the account', () => {
    const groups = [
      group('1', [
        split({ transaction_journal_id: '11' }),
        split({ transaction_journal_id: '12', source_id: '999', destination_id: '300' }),
      ]),
    ];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    expect(rows.map((row) => row.journalId)).toEqual(['11']);
  });

  it('names the counterparty from the other side', () => {
    const groups = [
      group('1', [split({ transaction_journal_id: '11' })]),
      group('2', [
        split({
          transaction_journal_id: '21',
          type: 'deposit',
          source_id: '400',
          source_name: 'Northwind Trading',
          destination_id: ASSET,
          destination_name: 'Everyday Current',
        }),
      ]),
    ];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    expect(rows.map((row) => row.counterparty).sort()).toEqual([
      'Corner Shop',
      'Northwind Trading',
    ]);
  });

  it('sorts newest first, with a stable tiebreak', () => {
    const groups = [
      group('1', [
        split({ transaction_journal_id: '11', date: '2026-08-01T00:00:00+00:00' }),
        split({ transaction_journal_id: '13', date: '2026-08-20T00:00:00+00:00' }),
        split({ transaction_journal_id: '12', date: '2026-08-20T00:00:00+00:00' }),
      ]),
    ];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    expect(rows.map((row) => row.journalId)).toEqual(['13', '12', '11']);
  });

  it("flags Firefly's own bookkeeping rows as system rows", () => {
    const groups = [
      group('1', [split({ transaction_journal_id: '11', type: 'reconciliation' })]),
      group('2', [split({ transaction_journal_id: '21', type: 'opening balance' })]),
      group('3', [split({ transaction_journal_id: '31' })]),
    ];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    expect(
      rows
        .filter((row) => row.system)
        .map((row) => row.journalId)
        .sort(),
    ).toEqual(['11', '21']);
  });

  it('collects unconvertible rows separately but still lists them', () => {
    const groups = [
      group('1', [split({ transaction_journal_id: '11', amount: '80', currency_code: 'USD' })]),
    ];
    const { rows, unconvertible } = buildReconcileRows(groups, ASSET, 'EUR');
    expect(rows).toHaveLength(1);
    expect(unconvertible.map((row) => row.journalId)).toEqual(['11']);
  });

  it('falls back to a placeholder when the other side has no name', () => {
    const groups = [group('1', [split({ destination_name: null })])];
    expect(buildReconcileRows(groups, ASSET, 'EUR').rows[0]!.counterparty).toBe(
      '(unnamed account)',
    );
  });
});

describe('clearedTotal', () => {
  const groups = [
    group('1', [split({ transaction_journal_id: '11', amount: '100.00' })]),
    group('2', [
      split({
        transaction_journal_id: '21',
        type: 'deposit',
        amount: '250.00',
        source_id: '400',
        destination_id: ASSET,
      }),
    ]),
  ];
  const { rows } = buildReconcileRows(groups, ASSET, 'EUR');

  it('is zero with nothing ticked', () => {
    expect(clearedTotal(rows, new Set())).toBe('0.00');
  });

  it('nets outflow against inflow', () => {
    expect(clearedTotal(rows, new Set(['11', '21']))).toBe('150.00');
  });

  it('ignores ids that are not on screen', () => {
    expect(clearedTotal(rows, new Set(['11', 'not-a-row']))).toBe('-100.00');
  });

  it('adds without floating-point drift', () => {
    const pennies = Array.from({ length: 10 }, (_, index) =>
      group(String(index), [
        split({ transaction_journal_id: `p${index}`, amount: '0.10', date: '2026-08-01' }),
      ]),
    );
    const built = buildReconcileRows(pennies, ASSET, 'EUR').rows;
    expect(clearedTotal(built, new Set(built.map((row) => row.journalId)))).toBe('-1.00');
  });
});

describe('reconcileMath', () => {
  it('is balanced when the books match the statement', () => {
    const math = reconcileMath({ opening: '1000.00', cleared: '-100.00', statement: '900.00' });
    expect(math).toMatchObject({ computed: '900.00', difference: '0.00', balanced: true });
  });

  it('reports a positive difference when the books claim too much', () => {
    // Nothing ticked, so our books still stand at the opening balance while the
    // statement has already moved on.
    const math = reconcileMath({ opening: '1000.00', cleared: '0', statement: '900.00' });
    expect(math.difference).toBe('100.00');
    expect(math.balanced).toBe(false);
  });

  it('reports a negative difference when the books claim too little', () => {
    const math = reconcileMath({ opening: '1000.00', cleared: '-100.00', statement: '950.00' });
    expect(math.difference).toBe('-50.00');
  });

  it('compares at the currency’s precision, not at full precision', () => {
    const math = reconcileMath({ opening: '1000.001', cleared: '0', statement: '1000.002' });
    expect(math.difference).toBe('0.00');
    expect(math.balanced).toBe(true);
  });

  it('treats an empty statement figure as zero rather than throwing', () => {
    expect(reconcileMath({ opening: '10.00', cleared: '0', statement: '' }).difference).toBe(
      '10.00',
    );
  });

  it('honours a three-decimal currency', () => {
    const math = reconcileMath({
      opening: '10.125',
      cleared: '0',
      statement: '10.120',
      decimals: 3,
    });
    expect(math.difference).toBe('0.005');
    expect(math.balanced).toBe(false);
  });
});

describe('correctionPlan', () => {
  const base = {
    assetAccountId: '104',
    reconciliationAccountId: '209',
    start: '2026-08-01',
    end: '2026-08-31',
  };

  it('is null when there is nothing to correct', () => {
    expect(correctionPlan({ ...base, difference: '0.00' })).toBeNull();
  });

  it('drains the asset account when our books claim too much', () => {
    // Verified live: source asset → destination reconciliation lowers the
    // account balance by the amount.
    expect(correctionPlan({ ...base, difference: '12.40' })).toMatchObject({
      direction: 'drain',
      amount: '12.40',
      sourceId: '104',
      destinationId: '209',
    });
  });

  it('fills the asset account when our books claim too little', () => {
    expect(correctionPlan({ ...base, difference: '-12.40' })).toMatchObject({
      direction: 'fill',
      amount: '12.40',
      sourceId: '209',
      destinationId: '104',
    });
  });

  it("uses Firefly's own description so corrections look native", () => {
    expect(correctionPlan({ ...base, difference: '1.00' })?.description).toBe(
      'Reconciliation (2026-08-01 to 2026-08-31)',
    );
  });
});

describe('planReconciledWrites', () => {
  const groups = [
    group('1', [
      split({ transaction_journal_id: '11', reconciled: false }),
      split({ transaction_journal_id: '12', reconciled: false }),
    ]),
    group('2', [split({ transaction_journal_id: '21', reconciled: true })]),
  ];
  const { rows } = buildReconcileRows(groups, ASSET, 'EUR');

  it('writes nothing when the selection matches what Firefly already holds', () => {
    expect(planReconciledWrites(rows, new Set(['21']))).toEqual([]);
  });

  it('carries unchanged siblings so a PUT cannot delete them', () => {
    const writes = planReconciledWrites(rows, new Set(['11', '21']));
    expect(writes).toHaveLength(1);
    expect(writes[0]!.groupId).toBe('1');
    expect([...writes[0]!.desired.entries()].sort()).toEqual([
      ['11', true],
      ['12', false],
    ]);
  });

  it('plans an unreconcile as readily as a reconcile', () => {
    const writes = planReconciledWrites(rows, new Set());
    expect(writes.map((write) => write.groupId)).toEqual(['2']);
    expect(writes[0]!.desired.get('21')).toBe(false);
  });

  it('touches every group that changed', () => {
    const writes = planReconciledWrites(rows, new Set(['11', '12']));
    expect(writes.map((write) => write.groupId).sort()).toEqual(['1', '2']);
  });
});

describe('initialSelection', () => {
  it('starts with exactly what Firefly already considers reconciled', () => {
    const groups = [
      group('1', [
        split({ transaction_journal_id: '11', reconciled: true }),
        split({ transaction_journal_id: '12', reconciled: false }),
      ]),
    ];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    expect([...initialSelection(rows)]).toEqual(['11']);
  });
});

describe('the whole sum, end to end', () => {
  it('lands on zero when every statement line is ticked', () => {
    // Opening 1,000. Statement closes at 1,150 after a 250 deposit and a 100
    // card payment; ticking both must balance exactly.
    const groups = [
      group('1', [split({ transaction_journal_id: '11', amount: '100.00' })]),
      group('2', [
        split({
          transaction_journal_id: '21',
          type: 'deposit',
          amount: '250.00',
          source_id: '400',
          destination_id: ASSET,
        }),
      ]),
    ];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    const cleared = clearedTotal(rows, new Set(['11', '21']));
    const math = reconcileMath({ opening: '1000.00', cleared, statement: '1150.00' });

    expect(math.balanced).toBe(true);
    expect(
      correctionPlan({
        difference: math.difference,
        assetAccountId: ASSET,
        reconciliationAccountId: '209',
        start: '2026-08-01',
        end: '2026-08-31',
      }),
    ).toBeNull();
  });

  it('proposes the exact correction for a missing line', () => {
    // The statement shows a 30.00 bank fee our books never recorded, so our
    // books claim 30.00 too much and the correction takes it out.
    const groups = [group('1', [split({ transaction_journal_id: '11', amount: '100.00' })])];
    const { rows } = buildReconcileRows(groups, ASSET, 'EUR');
    const cleared = clearedTotal(rows, new Set(['11']));
    const math = reconcileMath({ opening: '1000.00', cleared, statement: '870.00' });

    expect(math.difference).toBe('30.00');
    expect(
      correctionPlan({
        difference: math.difference,
        assetAccountId: ASSET,
        reconciliationAccountId: '209',
        start: '2026-08-01',
        end: '2026-08-31',
      }),
    ).toMatchObject({ direction: 'drain', amount: '30.00', sourceId: ASSET });
  });
});

describe('parseStatementInput', () => {
  it.each([
    ['1234.56', '1234.56'],
    ['1,234.56', '1234.56'],
    ['1.234,56', '1234.56'],
    ['1 234,56', '1234.56'],
    ["1'234.56", '1234.56'],
    ['1.234.567,89', '1234567.89'],
    ['1,234,567.89', '1234567.89'],
    ['0', '0'],
    ['-45.20', '-45.20'],
    ['+45.20', '45.20'],
    ['-1.234,56', '-1234.56'],
    ['1,5', '1.5'],
    ['1,50', '1.50'],
    ['1,500', '1500'],
    ['  12.00  ', '12.00'],
  ])('reads %s as %s', (input, expected) => {
    expect(parseStatementInput(input)).toEqual({ value: expected, error: null });
  });

  it('refuses an empty field rather than assuming zero', () => {
    expect(parseStatementInput('   ').error).toMatch(/closing balance/i);
  });

  it.each(['abc', '12.34.56.78x', '€50', '50 EUR', '--5', '.', ',', '1e5'])(
    'refuses %s',
    (input) => {
      expect(parseStatementInput(input).error).not.toBeNull();
    },
  );

  it('never returns a value alongside an error', () => {
    const bad = parseStatementInput('nonsense');
    expect(bad.value).toBe('');
    expect(bad.error).not.toBeNull();
  });
});

describe('countChanges / describeChanges', () => {
  const groups = [
    group('1', [
      split({ transaction_journal_id: '11', reconciled: false }),
      split({ transaction_journal_id: '12', reconciled: true }),
    ]),
  ];
  const { rows } = buildReconcileRows(groups, ASSET, 'EUR');

  it('separates reconciling from unreconciling', () => {
    expect(countChanges(rows, new Set(['11']))).toEqual({
      reconcile: 1,
      unreconcile: 1,
      total: 2,
    });
  });

  it('counts nothing when the selection already matches Firefly', () => {
    expect(countChanges(rows, new Set(['12']))).toEqual({
      reconcile: 0,
      unreconcile: 0,
      total: 0,
    });
  });

  it('describes an unreconcile as an unreconcile', () => {
    expect(describeChanges({ reconcile: 0, unreconcile: 12 })).toBe(
      'Unreconciled 12 transactions.',
    );
  });

  it('describes a reconcile as a reconcile', () => {
    expect(describeChanges({ reconcile: 1, unreconcile: 0 })).toBe('Reconciled 1 transaction.');
  });

  it('describes a submit that does both', () => {
    expect(describeChanges({ reconcile: 2, unreconcile: 3 })).toBe(
      'Reconciled 2 transactions and unreconciled 3 transactions.',
    );
  });

  it('says so plainly when there is nothing to do', () => {
    expect(describeChanges({ reconcile: 0, unreconcile: 0 })).toMatch(/Nothing to change/);
  });
});
