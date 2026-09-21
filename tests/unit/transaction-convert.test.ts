import { describe, expect, it } from 'vitest';
import {
  assetSide,
  buildConversionPayload,
  conversionApplied,
  planConversion,
  type ConversionPlan,
  type SplitLike,
} from '@/lib/transaction-convert';

const withdrawal: SplitLike = {
  transaction_journal_id: '10',
  type: 'withdrawal',
  source_id: '104',
  source_name: 'Everyday Current',
  destination_id: '115',
  destination_name: 'Rewe',
};

const deposit: SplitLike = {
  transaction_journal_id: '11',
  type: 'deposit',
  source_id: '200',
  source_name: 'Employer',
  destination_id: '104',
  destination_name: 'Everyday Current',
};

const transfer: SplitLike = {
  transaction_journal_id: '12',
  type: 'transfer',
  source_id: '104',
  source_name: 'Everyday Current',
  destination_id: '106',
  destination_name: 'Emergency Savings',
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

  it('withdrawal to transfer keeps the source and asks for a destination asset', () => {
    const p = plan(planConversion(withdrawal, 'transfer'));
    expect(p.keep).toEqual({ side: 'source', id: '104', name: 'Everyday Current' });
    expect(p.askFor).toBe('destination');
    expect(p.askForKind).toBe('asset');
  });

  it('withdrawal to deposit moves the kept account from source to destination', () => {
    // The account you own stays yours; it is the FIELD that changes, because a
    // deposit arrives into the destination.
    const p = plan(planConversion(withdrawal, 'deposit'));
    expect(p.keep).toEqual({ side: 'destination', id: '104', name: 'Everyday Current' });
    expect(p.askFor).toBe('source');
    expect(p.askForKind).toBe('revenue');
  });

  it('deposit to withdrawal moves it back to source and asks for an expense', () => {
    const p = plan(planConversion(deposit, 'withdrawal'));
    expect(p.keep).toEqual({ side: 'source', id: '104', name: 'Everyday Current' });
    expect(p.askFor).toBe('destination');
    expect(p.askForKind).toBe('expense');
  });

  it('transfer to withdrawal keeps the source asset', () => {
    const p = plan(planConversion(transfer, 'withdrawal'));
    expect(p.keep.id).toBe('104');
    expect(p.askForKind).toBe('expense');
  });

  it('transfer to deposit keeps an asset on the destination side', () => {
    const p = plan(planConversion(transfer, 'deposit'));
    expect(p.keep.side).toBe('destination');
    expect(p.askForKind).toBe('revenue');
  });

  it('refuses when there is no asset account to carry across', () => {
    const orphan = { ...withdrawal, source_id: null, source_name: null };
    expect(planConversion(orphan, 'transfer')).toHaveProperty('error');
  });
});

describe('buildConversionPayload', () => {
  it('sends the kept account and the new counter-account on the right fields', () => {
    const p = plan(planConversion(withdrawal, 'transfer'));
    const payload = buildConversionPayload(
      [withdrawal],
      p,
      'transfer',
      { id: '106', name: 'Emergency Savings' },
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
    const p = plan(planConversion(withdrawal, 'deposit'));
    const payload = buildConversionPayload(
      [withdrawal],
      p,
      'deposit',
      { name: 'New Employer' },
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
    const p = plan(planConversion(withdrawal, 'transfer'));
    const payload = buildConversionPayload(
      [withdrawal, second],
      p,
      'transfer',
      { id: '106', name: 'x' },
      'Weekly shop',
    );
    const entries = payload.transactions as Array<Record<string, unknown>>;
    expect(entries.map((e) => e.transaction_journal_id)).toEqual(['10', '20']);
  });

  it('sends group_title above one split, because Firefly 422s without it', () => {
    const second: SplitLike = { ...withdrawal, transaction_journal_id: '20' };
    const p = plan(planConversion(withdrawal, 'transfer'));
    const payload = buildConversionPayload(
      [withdrawal, second],
      p,
      'transfer',
      { id: '106', name: 'x' },
      'Weekly shop',
    );
    expect(payload.group_title).toBe('Weekly shop');
  });

  it('substitutes a title when a split group somehow has none', () => {
    const second: SplitLike = { ...withdrawal, transaction_journal_id: '20' };
    const p = plan(planConversion(withdrawal, 'transfer'));
    const payload = buildConversionPayload(
      [withdrawal, second],
      p,
      'transfer',
      { id: '106', name: 'x' },
      null,
    );
    expect(payload.group_title).toBeTruthy();
  });

  it('omits group_title for a single split', () => {
    const p = plan(planConversion(withdrawal, 'transfer'));
    const payload = buildConversionPayload(
      [withdrawal],
      p,
      'transfer',
      { id: '106', name: 'x' },
      null,
    );
    expect(payload).not.toHaveProperty('group_title');
  });

  it('sets only the converted fields, leaving the rest for Firefly to preserve', () => {
    // Amount, description, category and tags are deliberately absent: a split
    // sent WITH its journal id keeps everything not mentioned.
    const p = plan(planConversion(withdrawal, 'transfer'));
    const payload = buildConversionPayload(
      [withdrawal],
      p,
      'transfer',
      { id: '106', name: 'x' },
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
