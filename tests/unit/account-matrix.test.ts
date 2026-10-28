import { describe, expect, it } from 'vitest';
import {
  ALL_KINDS,
  FLOW_TYPES,
  acceptsNewName,
  autocompleteTypes,
  destinationKinds,
  isAllowed,
  kindFromFirefly,
  pairProblem,
  sourceKinds,
  typeFor,
} from '@/lib/account-matrix';

describe('the pair table', () => {
  it('allows exactly the thirteen source/kind pairs Firefly 6.7.9 allows', () => {
    // Counted as (type, source kind) rows of config('firefly.source_dests').
    let rows = 0;
    let pairs = 0;
    for (const type of FLOW_TYPES) {
      for (const source of ALL_KINDS) {
        const targets = ALL_KINDS.filter((kind) => isAllowed(type, source, kind));
        if (targets.length > 0) rows += 1;
        pairs += targets.length;
      }
    }
    expect(rows).toBe(13);
    expect(pairs).toBe(5 + 2 * 3 + 4 * 2 + 3 + 1 + 3 * 3);
  });

  it('gives every allowed pair exactly one type', () => {
    // The property that lets an import infer a row's type from its accounts.
    for (const source of ALL_KINDS) {
      for (const destination of ALL_KINDS) {
        const types = FLOW_TYPES.filter((type) => isAllowed(type, source, destination));
        expect(types.length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('treats paying a liability from an asset as a withdrawal, never a transfer', () => {
    expect(typeFor('asset', 'loan')).toBe('withdrawal');
    expect(typeFor('loan', 'asset')).toBe('deposit');
    expect(isAllowed('transfer', 'asset', 'mortgage')).toBe(false);
  });

  it('transfers only within a family', () => {
    expect(typeFor('asset', 'asset')).toBe('transfer');
    expect(typeFor('debt', 'mortgage')).toBe('transfer');
  });

  it('refuses money out of an expense or into a revenue account', () => {
    for (const kind of ALL_KINDS) {
      expect(typeFor('expense', kind)).toBeNull();
      expect(typeFor(kind, 'revenue')).toBeNull();
    }
  });
});

describe('side narrowing', () => {
  it('offers liabilities as a withdrawal source', () => {
    // The bug: the form searched asset accounts only, so a withdrawal paid
    // from a loan could not even be edited.
    expect(sourceKinds('withdrawal')).toEqual(['asset', 'loan', 'debt', 'mortgage']);
  });

  it('narrows the destination once the source is known', () => {
    expect(destinationKinds('withdrawal', 'loan')).toEqual(['expense', 'cash']);
    expect(destinationKinds('withdrawal', 'asset')).toEqual([
      'loan',
      'debt',
      'mortgage',
      'expense',
      'cash',
    ]);
    expect(sourceKinds('deposit', 'asset')).toEqual([
      'loan',
      'debt',
      'mortgage',
      'revenue',
      'cash',
    ]);
  });

  it('returns nothing when the other side cannot take part in the type at all', () => {
    expect(destinationKinds('transfer', 'expense')).toEqual([]);
  });
});

describe('kindFromFirefly', () => {
  it('reads split, autocomplete and resource spellings', () => {
    expect(kindFromFirefly('Asset account')).toBe('asset');
    expect(kindFromFirefly('Loan')).toBe('loan');
    expect(kindFromFirefly('Cash account')).toBe('cash');
    expect(kindFromFirefly('liabilities', 'mortgage')).toBe('mortgage');
    expect(kindFromFirefly('expense')).toBe('expense');
  });

  it('returns null for system accounts and blanks', () => {
    expect(kindFromFirefly('Initial balance account')).toBeNull();
    expect(kindFromFirefly('liabilities')).toBeNull();
    expect(kindFromFirefly('')).toBeNull();
  });
});

describe('autocompleteTypes', () => {
  it('joins with a bare comma, because Firefly validates each part as-is', () => {
    expect(autocompleteTypes(['asset', 'loan'])).toBe('Asset account,Loan');
  });
});

describe('acceptsNewName', () => {
  it('only where Firefly creates the account from a name', () => {
    expect(acceptsNewName(['expense', 'loan'])).toBe(true);
    expect(acceptsNewName(['asset', 'loan', 'debt', 'mortgage'])).toBe(false);
  });
});

describe('pairProblem', () => {
  it('is null for a valid pair', () => {
    expect(pairProblem('withdrawal', 'asset', 'expense')).toBeNull();
  });

  it('names the type that would fit', () => {
    const problem = pairProblem('transfer', 'asset', 'loan');
    expect(problem?.suggest).toBe('withdrawal');
    expect(problem?.message).toMatch(/withdrawal/);
  });

  it('spots swapped sides', () => {
    const problem = pairProblem('withdrawal', 'expense', 'asset');
    expect(problem?.suggest).toBeNull();
    expect(problem?.message).toMatch(/swapped/);
  });
});
