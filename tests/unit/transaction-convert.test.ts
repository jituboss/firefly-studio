import { describe, expect, it } from 'vitest';
import {
  assetSide,
  buildConversionPayload,
  conversionApplied,
  planConversion,
  type ConversionPlan,
  type SplitLike,
} from '@/lib/transaction-convert';
import { isAllowed } from '@/lib/account-matrix';

const withdrawal: SplitLike = {
  transaction_journal_id: '10',
  type: 'withdrawal',
  source_id: '104',
  source_name: 'Everyday Current',
  destination_id: '115',
  destination_name: 'Rewe',
  source_type: 'Asset account',
  destination_type: 'Expense account',
};

const deposit: SplitLike = {
  transaction_journal_id: '11',
  type: 'deposit',
  source_id: '200',
  source_name: 'Employer',
  destination_id: '104',
  destination_name: 'Everyday Current',
  source_type: 'Revenue account',
  destination_type: 'Asset account',
};

const transfer: SplitLike = {
  transaction_journal_id: '12',
  type: 'transfer',
  source_id: '104',
  source_name: 'Everyday Current',
  destination_id: '106',
  destination_name: 'Emergency Savings',
  source_type: 'Asset account',
  destination_type: 'Asset account',
};

const loanPayment: SplitLike = {
  transaction_journal_id: '13',
  type: 'withdrawal',
  source_id: '104',
  source_name: 'Everyday Current',
  source_type: 'Asset account',
  destination_id: '300',
  destination_name: 'Car loan',
  destination_type: 'Loan',
};

const paidFromLoan: SplitLike = {
  transaction_journal_id: '14',
  type: 'withdrawal',
  source_id: '300',
  source_name: 'Car loan',
  source_type: 'Loan',
  destination_id: '115',
  destination_name: 'Garage',
  destination_type: 'Expense account',
};

const plan = (result: ReturnType<typeof planConversion>): ConversionPlan => {
  if (!result || 'error' in result) throw new Error('expected a plan');
  return result;
};

describe('assetSide', () => {
  it('knows where each type keeps the account you own', () => {
    // A withdrawal pays OUT of your account; a deposit pays INTO it. This is
    // the fact that makes withdrawal->deposit move the surviving account
    // between fields.
    expect(assetSide('withdrawal')).toBe('source');
    expect(assetSide('deposit')).toBe('destination');
    expect(assetSide('transfer')).toBe('source');
  });
});

describe('planConversion', () => {
  it('returns null when the target is the current type', () => {
    // Offering it would build a PUT that Firefly answers 200 to while changing
    // nothing — indistinguishable from a failed conversion.
    expect(planConversion(withdrawal, 'withdrawal')).toBeNull();
  });

  it('refuses a type it cannot convert', () => {
    const result = planConversion({ ...withdrawal, type: 'opening balance' }, 'transfer');
    expect(result).toHaveProperty('error');
  });

  it('withdrawal to transfer keeps the source and asks for a destination', () => {
    const p = plan(planConversion(withdrawal, 'transfer'));
    expect(p.source).toMatchObject({ id: '104', kind: 'asset' });
    expect(p.destination).toBeNull();
  });

  it('withdrawal to deposit moves the kept account from source to destination', () => {
    // The account you own stays yours; it is the FIELD that changes, because a
    // deposit arrives into the destination.
    const p = plan(planConversion(withdrawal, 'deposit'));
    expect(p.destination).toMatchObject({ id: '104' });
    expect(p.source).toBeNull();
  });

  it('deposit to withdrawal moves it back to source', () => {
    const p = plan(planConversion(deposit, 'withdrawal'));
    expect(p.source).toMatchObject({ id: '104' });
    expect(p.destination).toBeNull();
  });

  it('transfer to deposit keeps an asset on the destination side', () => {
    const p = plan(planConversion(transfer, 'deposit'));
    expect(p.destination).toMatchObject({ id: '104' });
  });

  it('a loan payment converted to a deposit swaps the two accounts', () => {
    // asset → loan is a withdrawal; loan → asset is the deposit of borrowed
    // money. Both accounts survive, reversed.
    const p = plan(planConversion(loanPayment, 'deposit'));
    expect(p.swapped).toBe(true);
    expect(p.source).toMatchObject({ id: '300', kind: 'loan' });
    expect(p.destination).toMatchObject({ id: '104', kind: 'asset' });
  });

  it('a spend from a loan converted to a transfer keeps the loan as the source', () => {
    // A transfer out of a liability can only go to another liability.
    const p = plan(planConversion(paidFromLoan, 'transfer'));
    expect(p.source).toMatchObject({ id: '300', kind: 'loan' });
    expect(p.destination).toBeNull();
  });

  it('a spend from a loan converted to a deposit puts the loan on the receiving side', () => {
    // revenue → loan is allowed, so the loan moves to the destination.
    const p = plan(planConversion(paidFromLoan, 'deposit'));
    expect(p.destination).toMatchObject({ id: '300' });
    expect(p.source).toBeNull();
  });

  it('never pre-fills a pair Firefly would refuse', () => {
    for (const split of [withdrawal, deposit, transfer, loanPayment, paidFromLoan]) {
      for (const to of ['withdrawal', 'deposit', 'transfer'] as const) {
        const result = planConversion(split, to);
        if (!result || 'error' in result) continue;
        if (result.source?.kind && result.destination?.kind) {
          expect(isAllowed(to, result.source.kind, result.destination.kind)).toBe(true);
        }
      }
    }
  });

  it('refuses when there are no accounts to carry across', () => {
    const orphan = {
      ...withdrawal,
      source_id: null,
      source_name: null,
      destination_id: null,
      destination_name: null,
    };
    expect(planConversion(orphan, 'transfer')).toHaveProperty('error');
  });
});

describe('buildConversionPayload', () => {
  const chosen = (sourceId: string, destination: { id?: string; name: string }) => ({
    source: { id: sourceId, name: 'x' },
    destination,
  });

  it('sends both accounts on the right fields', () => {
    const payload = buildConversionPayload(
      [withdrawal],
      'transfer',
      chosen('104', { id: '106', name: 'Emergency Savings' }),
      null,
    );
    const [entry] = payload.transactions as Array<Record<string, unknown>>;
    expect(entry).toMatchObject({
      transaction_journal_id: '10',
      type: 'transfer',
      source_id: '104',
      destination_id: '106',
    });
  });

  it('names an account that does not exist yet instead of sending an id', () => {
    // Firefly creates expense and revenue accounts on the fly from a name.
    const payload = buildConversionPayload(
      [withdrawal],
      'deposit',
      { source: { name: 'New Employer' }, destination: { id: '104', name: 'Everyday Current' } },
      null,
    );
    const [entry] = payload.transactions as Array<Record<string, unknown>>;
    expect(entry).toMatchObject({ source_name: 'New Employer', destination_id: '104' });
    expect(entry).not.toHaveProperty('source_id');
  });

  it('includes EVERY split, because omitting one deletes it', () => {
    // Verified against 6.5.5: PUTting one split of a two-split group left the
    // group with one split and destroyed the other, with a 200.
    const second: SplitLike = { ...withdrawal, transaction_journal_id: '20' };
    const payload = buildConversionPayload(
      [withdrawal, second],
      'transfer',
      chosen('104', { id: '106', name: 'x' }),
      'Weekly shop',
    );
    const entries = payload.transactions as Array<Record<string, unknown>>;
    expect(entries.map((e) => e.transaction_journal_id)).toEqual(['10', '20']);
  });

  it("keeps each split's own account on a side the user did not replace", () => {
    // Two splits paid to two shops, converted to deposits: the shops become
    // irrelevant, but if the user swaps sides each split keeps its OWN payee.
    const second: SplitLike = {
      ...withdrawal,
      transaction_journal_id: '20',
      destination_id: '116',
      destination_name: 'Aldi',
    };
    const payload = buildConversionPayload(
      [withdrawal, second],
      'withdrawal',
      { source: { id: '104', name: 'Everyday Current' }, destination: { id: '115', name: 'Rewe' } },
      'Weekly shop',
    );
    const entries = payload.transactions as Array<Record<string, unknown>>;
    expect(entries.map((e) => e.destination_id)).toEqual(['115', '116']);
  });

  it('carries swapped accounts per split', () => {
    const payload = buildConversionPayload(
      [loanPayment],
      'deposit',
      {
        source: { id: '300', name: 'Car loan' },
        destination: { id: '104', name: 'Everyday Current' },
      },
      null,
    );
    const [entry] = payload.transactions as Array<Record<string, unknown>>;
    expect(entry).toMatchObject({ source_id: '300', destination_id: '104' });
  });

  it('sends group_title above one split, because Firefly 422s without it', () => {
    const second: SplitLike = { ...withdrawal, transaction_journal_id: '20' };
    const payload = buildConversionPayload(
      [withdrawal, second],
      'transfer',
      chosen('104', { id: '106', name: 'x' }),
      'Weekly shop',
    );
    expect(payload.group_title).toBe('Weekly shop');
  });

  it('substitutes a title when a split group somehow has none', () => {
    const second: SplitLike = { ...withdrawal, transaction_journal_id: '20' };
    const payload = buildConversionPayload(
      [withdrawal, second],
      'transfer',
      chosen('104', { id: '106', name: 'x' }),
      null,
    );
    expect(payload.group_title).toBeTruthy();
  });

  it('omits group_title for a single split', () => {
    const payload = buildConversionPayload(
      [withdrawal],
      'transfer',
      chosen('104', { id: '106', name: 'x' }),
      null,
    );
    expect(payload).not.toHaveProperty('group_title');
  });

  it('sets only the converted fields, leaving the rest for Firefly to preserve', () => {
    // Amount, description, category and tags are deliberately absent: a split
    // sent WITH its journal id keeps everything not mentioned.
    const payload = buildConversionPayload(
      [withdrawal],
      'transfer',
      chosen('104', { id: '106', name: 'x' }),
      null,
    );
    const entry = (payload.transactions as Array<Record<string, unknown>>)[0]!;
    expect(Object.keys(entry).sort()).toEqual(
      ['destination_id', 'source_id', 'transaction_journal_id', 'type'].sort(),
    );
  });
});

describe('conversionApplied', () => {
  it('is the guard against Firefly answering 200 to a no-op', () => {
    // `type` alone returns 200 with the transaction unchanged. Without this
    // check the UI reports success over a transaction that did not convert.
    expect(conversionApplied([{ type: 'withdrawal' }], 'transfer')).toBe(false);
    expect(conversionApplied([{ type: 'transfer' }], 'transfer')).toBe(true);
  });

  it('requires every split to have converted', () => {
    expect(conversionApplied([{ type: 'transfer' }, { type: 'withdrawal' }], 'transfer')).toBe(
      false,
    );
  });

  it('treats an empty response as a failure', () => {
    expect(conversionApplied([], 'transfer')).toBe(false);
  });

  it('compares case-insensitively, since Firefly echoes type casing', () => {
    expect(conversionApplied([{ type: 'Transfer' }], 'transfer')).toBe(true);
  });
});
