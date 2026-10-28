import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_PRESETS,
  BUDGET_PRESETS,
  accountPayload,
  budgetPayload,
  currencyForTimezone,
  monthBounds,
  planTotals,
  suggestBudget,
  validateSetup,
  type SetupInput,
} from '@/lib/setup';

describe('suggestBudget', () => {
  it('rounds a share of income to a number a person would pick', () => {
    expect(suggestBudget('4000', 0.3)).toBe('1200');
    expect(suggestBudget('4157', 0.12)).toBe('500'); // 498.84 → nearest 10
    expect(suggestBudget('85000', 0.3)).toBe('25500'); // nearest 50 above a thousand
    expect(suggestBudget('300', 0.05)).toBe('15'); // nearest 5 below a hundred
  });

  it('reads a typed income with separators', () => {
    expect(suggestBudget('4,000', 0.3)).toBe('1200');
    expect(suggestBudget('4000,50', 0.3)).toBe('1200');
  });

  it('suggests nothing without an income', () => {
    expect(suggestBudget('', 0.3)).toBe('');
    expect(suggestBudget('0', 0.3)).toBe('');
  });

  it('leaves a quarter of the income unplanned across the presets', () => {
    const total = BUDGET_PRESETS.reduce((sum, preset) => sum + preset.share, 0);
    expect(total).toBeCloseTo(0.75);
  });
});

describe('planTotals', () => {
  it('sums enabled budgets against the income', () => {
    const totals = planTotals('4000', [
      { key: 'a', name: 'A', amount: '1200', enabled: true },
      { key: 'b', name: 'B', amount: '800', enabled: true },
      { key: 'c', name: 'C', amount: '999', enabled: false },
    ]);
    expect(totals).toEqual({ planned: '2000', left: '2000', percent: 50 });
  });
});

describe('currencyForTimezone', () => {
  it('guesses from the timezone, most specific rule first', () => {
    expect(currencyForTimezone('Asia/Dhaka')).toBe('BDT');
    expect(currencyForTimezone('Europe/London')).toBe('GBP');
    expect(currencyForTimezone('Europe/Berlin')).toBe('EUR');
    expect(currencyForTimezone('America/Toronto')).toBe('CAD');
    expect(currencyForTimezone('America/Chicago')).toBe('USD');
    expect(currencyForTimezone('UTC')).toBeNull();
  });
});

describe('monthBounds', () => {
  it('knows month lengths and leap years', () => {
    expect(monthBounds('2026-10-28')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(monthBounds('2028-02-10')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });
});

describe('accountPayload', () => {
  const today = '2026-10-28';

  it('gives an asset its role and an opening balance with its date', () => {
    expect(
      accountPayload(
        {
          key: 'main',
          name: ' City Bank ',
          role: 'defaultAsset',
          balance: '1,250.50',
          enabled: true,
        },
        'BDT',
        today,
      ),
    ).toEqual({
      name: 'City Bank',
      type: 'asset',
      account_role: 'defaultAsset',
      currency_code: 'BDT',
      opening_balance: '1250.5',
      opening_balance_date: today,
    });
  });

  it('leaves the opening balance out at zero, since it needs a date to go with it', () => {
    const payload = accountPayload(
      { key: 'cash', name: 'Cash', role: 'cashWalletAsset', balance: '', enabled: true },
      'EUR',
      today,
    );
    expect(payload).not.toHaveProperty('opening_balance');
    expect(payload).not.toHaveProperty('opening_balance_date');
  });

  it('gives a credit card the fields Firefly requires, opening below zero', () => {
    expect(
      accountPayload(
        { key: 'card', name: 'Visa', role: 'ccAsset', balance: '300', enabled: true },
        'EUR',
        today,
      ),
    ).toMatchObject({
      account_role: 'ccAsset',
      credit_card_type: 'monthlyFull',
      monthly_payment_date: '2026-10-31',
      opening_balance: '-300',
    });
  });

  it('makes a loan a liability you owe', () => {
    expect(
      accountPayload(
        { key: 'loan', name: 'Car loan', role: 'loan', balance: '12000', enabled: true },
        'EUR',
        today,
      ),
    ).toEqual({
      name: 'Car loan',
      type: 'liabilities',
      liability_type: 'loan',
      liability_direction: 'debit',
      currency_code: 'EUR',
      liability_amount: '12000',
      liability_start_date: today,
    });
  });
});

describe('budgetPayload', () => {
  it('turns a monthly amount into a resetting auto-budget', () => {
    expect(
      budgetPayload({ key: 'g', name: 'Groceries', amount: '500', enabled: true }, 'EUR'),
    ).toEqual({
      name: 'Groceries',
      auto_budget_type: 'reset',
      auto_budget_amount: '500',
      auto_budget_period: 'monthly',
      auto_budget_currency_code: 'EUR',
    });
  });

  it('creates a plain budget with no amount', () => {
    expect(budgetPayload({ key: 'g', name: 'Fun', amount: '', enabled: true }, 'EUR')).toEqual({
      name: 'Fun',
    });
  });
});

describe('validateSetup', () => {
  const base = (): SetupInput => ({
    currency: 'EUR',
    accounts: ACCOUNT_PRESETS.map((preset) => ({
      key: preset.key,
      name: preset.name,
      role: preset.role,
      balance: '',
      enabled: preset.enabled,
    })),
    income: { amount: '', from: '' },
    budgets: [],
  });

  it('accepts the defaults', () => {
    expect(validateSetup(base())).toEqual([]);
  });

  it('needs at least one account that holds money, not just a loan', () => {
    const input = base();
    input.accounts = input.accounts.map((account) => ({
      ...account,
      enabled: account.role === 'loan',
    }));
    expect(validateSetup(input).join(' ')).toMatch(/at least one account/);
  });

  it('refuses two accounts with the same name and a balance that is not a number', () => {
    const input = base();
    input.accounts[1] = { ...input.accounts[1]!, name: 'main ACCOUNT', balance: 'lots' };
    const problems = validateSetup(input).join(' ');
    expect(problems).toMatch(/Two accounts/);
    expect(problems).toMatch(/not a number/);
  });
});
