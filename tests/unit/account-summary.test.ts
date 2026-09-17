import { describe, expect, it } from 'vitest';
import {
  accountBucket,
  countsTowardNetWorth,
  moneyKind,
  roleLabel,
  summariseNetWorth,
  totalsByCurrency,
} from '@/lib/account-summary';
import type { Account } from '@/server/firefly/types';

const account = (attributes: Record<string, unknown>): Account =>
  ({
    id: String(attributes.name ?? 'x'),
    type: 'accounts',
    attributes: {
      name: 'Account',
      type: 'asset',
      current_balance: '0',
      currency_code: 'BDT',
      active: true,
      include_net_worth: true,
      account_role: null,
      liability_type: null,
      ...attributes,
    },
  }) as never;

describe('moneyKind', () => {
  it('groups a liability by what kind of debt it is', () => {
    expect(moneyKind(account({ type: 'liabilities', liability_type: 'creditcard' }))).toBe(
      'credit',
    );
    expect(moneyKind(account({ type: 'liabilities', liability_type: 'mortgage' }))).toBe('loan');
    expect(moneyKind(account({ type: 'liabilities', liability_type: null }))).toBe('loan');
  });

  it('reads the asset role, defaulting to a current account', () => {
    expect(moneyKind(account({ account_role: 'savingAsset' }))).toBe('savings');
    expect(moneyKind(account({ account_role: 'ccAsset' }))).toBe('credit');
    expect(moneyKind(account({ account_role: 'cashWalletAsset' }))).toBe('cash');
    expect(moneyKind(account({ account_role: 'defaultAsset' }))).toBe('checking');
    // Firefly leaves the role null on plenty of imported accounts.
    expect(moneyKind(account({ account_role: null }))).toBe('checking');
    expect(moneyKind(account({ type: 'cash' }))).toBe('cash');
  });
});

describe('roleLabel', () => {
  it('names each liability type', () => {
    expect(roleLabel(account({ type: 'liabilities', liability_type: 'mortgage' }))).toBe(
      'Mortgage',
    );
    expect(roleLabel(account({ type: 'liabilities', liability_type: 'debt' }))).toBe('Debt');
  });

  it('falls back to a neutral word rather than leaking an enum', () => {
    expect(roleLabel(account({ account_role: null }))).toBe('Account');
    expect(roleLabel(account({ type: 'cash' }))).toBe('Cash');
  });
});

describe('accountBucket', () => {
  it('treats anything it does not recognise as bookkeeping, not as money', () => {
    // The safe direction: a future Firefly type must not silently join the net
    // worth total before anyone has looked at what it means.
    expect(accountBucket('debt')).toBe('internal');
    expect(accountBucket('liability credit')).toBe('internal');
    expect(accountBucket('import')).toBe('internal');
  });
});

describe('countsTowardNetWorth', () => {
  it('excludes archived accounts and explicit opt-outs', () => {
    expect(countsTowardNetWorth(account({}))).toBe(true);
    expect(countsTowardNetWorth(account({ active: false }))).toBe(false);
    expect(countsTowardNetWorth(account({ include_net_worth: false }))).toBe(false);
  });
});

describe('summariseNetWorth', () => {
  it('matches the currency case-insensitively', () => {
    // Firefly is consistent about upper case, but the connection's stored
    // currency comes from our own database and has been lower case before.
    const summary = summariseNetWorth(
      [account({ current_balance: '100', currency_code: 'bdt' })],
      'BDT',
    );
    expect(summary.countedAccounts).toBe(1);
    expect(summary.netWorth).toBe('100');
  });

  it('reports nothing rather than a zero when there are no accounts', () => {
    const summary = summariseNetWorth([], 'BDT');
    expect(summary).toMatchObject({
      currency: 'BDT',
      netWorth: '0',
      countedAccounts: 0,
      excludedAccounts: 0,
      otherCurrencies: [],
    });
  });

  it('drops a foreign currency that nets to zero instead of listing it', () => {
    const summary = summariseNetWorth(
      [
        account({ name: 'a', current_balance: '500', currency_code: 'USD' }),
        account({ name: 'b', current_balance: '-500', currency_code: 'USD' }),
      ],
      'BDT',
    );
    expect(summary.otherCurrencies).toEqual([]);
  });

  it('lists several foreign currencies in a stable order', () => {
    const summary = summariseNetWorth(
      [
        account({ name: 'u', current_balance: '10', currency_code: 'USD' }),
        account({ name: 'e', current_balance: '20', currency_code: 'EUR' }),
      ],
      'BDT',
    );
    expect(summary.otherCurrencies.map((entry) => entry.currency)).toEqual(['EUR', 'USD']);
  });

  it('keeps decimals exact across many accounts', () => {
    // Floating point would drift here; the whole module is Decimal for this.
    const cents = Array.from({ length: 10 }, (_, index) =>
      account({ name: `a${index}`, current_balance: '0.1' }),
    );
    expect(summariseNetWorth(cents, 'BDT').netWorth).toBe('1');
  });
});

describe('totalsByCurrency', () => {
  it('totals per currency and ranks by magnitude, not by sign', () => {
    const totals = totalsByCurrency(
      [
        account({ name: 'a', current_balance: '100', currency_code: 'BDT' }),
        account({ name: 'b', current_balance: '50', currency_code: 'BDT' }),
        account({ name: 'c', current_balance: '-900', currency_code: 'USD' }),
      ],
      'BDT',
    );
    // The 900 debt outranks the 150 balance: a large debt is not a footnote.
    expect(totals).toEqual([
      { currency: 'USD', amount: '-900' },
      { currency: 'BDT', amount: '150' },
    ]);
  });

  it('falls back to the given currency when an account declares none', () => {
    const totals = totalsByCurrency(
      [account({ current_balance: '5', currency_code: null })],
      'BDT',
    );
    expect(totals).toEqual([{ currency: 'BDT', amount: '5' }]);
  });
});
