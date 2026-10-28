import { toDecimal } from './money';

/** A typed amount — "1,250" or "1250.5" or "1250,5" — as a Decimal. */
function amountOf(text: string) {
  const value = text.trim();
  // A lone comma followed by one or two digits is a decimal comma; any other
  // comma is grouping. Same rule the form inputs and the import follow.
  return toDecimal(/^\d+,\d{1,2}$/.test(value) ? value.replace(',', '.') : value.replace(/,/g, ''));
}

/**
 * First-run setup for an empty ledger — the minimum a personal-finance ledger
 * needs to be useful on day one, and nothing more: a currency, the places your
 * money lives, and a plan for the month.
 *
 * Kept small on purpose. Firefly has piggy banks, bills, rules, recurring
 * transactions, object groups; asking about any of them before the first
 * transaction exists is how a setup wizard becomes a reason to leave. Each of
 * those is one click away later, and the import (lib/import) builds the rest
 * from real transactions.
 *
 * Everything here is pure, so the suggestions — the account presets, the
 * budget split of an income, the currency guessed from a timezone — are pinned
 * by tests rather than discovered in a browser.
 */

export type SetupAccountRole =
  'defaultAsset' | 'savingAsset' | 'cashWalletAsset' | 'ccAsset' | 'loan';

export interface SetupAccount {
  key: string;
  name: string;
  role: SetupAccountRole;
  /**
   * What is in it today — or, for a credit card or a loan, what is owed. A
   * positive number either way; the sign is applied when the payload is built.
   */
  balance: string;
  enabled: boolean;
}

export interface AccountPreset {
  key: string;
  role: SetupAccountRole;
  name: string;
  title: string;
  hint: string;
  balanceLabel: string;
  enabled: boolean;
}

export const ACCOUNT_PRESETS: AccountPreset[] = [
  {
    key: 'main',
    role: 'defaultAsset',
    name: 'Main account',
    title: 'Everyday account',
    hint: 'Where your pay arrives and your bills leave from.',
    balanceLabel: 'Balance today',
    enabled: true,
  },
  {
    key: 'savings',
    role: 'savingAsset',
    name: 'Savings',
    title: 'Savings',
    hint: 'Money set aside for later.',
    balanceLabel: 'Balance today',
    enabled: true,
  },
  {
    key: 'cash',
    role: 'cashWalletAsset',
    name: 'Cash wallet',
    title: 'Cash',
    hint: 'Notes and coins you carry.',
    balanceLabel: 'In your wallet',
    enabled: true,
  },
  {
    key: 'card',
    role: 'ccAsset',
    name: 'Credit card',
    title: 'Credit card',
    hint: 'Spend now, pay off at the end of the month.',
    balanceLabel: 'Owed today',
    enabled: false,
  },
  {
    key: 'loan',
    role: 'loan',
    name: 'Loan',
    title: 'Loan or mortgage',
    hint: 'Something you are paying back.',
    balanceLabel: 'Still owed',
    enabled: false,
  },
];

export const ROLE_LABELS: Record<SetupAccountRole, string> = {
  defaultAsset: 'Bank account',
  savingAsset: 'Savings',
  cashWalletAsset: 'Cash',
  ccAsset: 'Credit card',
  loan: 'Loan',
};

export interface BudgetPreset {
  key: string;
  name: string;
  /** Share of a monthly income suggested for it. Together they leave a quarter unplanned — saving. */
  share: number;
  hint: string;
  enabled: boolean;
}

export const BUDGET_PRESETS: BudgetPreset[] = [
  { key: 'housing', name: 'Housing', share: 0.3, hint: 'Rent or mortgage', enabled: true },
  { key: 'groceries', name: 'Groceries', share: 0.12, hint: 'Food for home', enabled: true },
  {
    key: 'bills',
    name: 'Bills & utilities',
    share: 0.07,
    hint: 'Power, water, phone, internet',
    enabled: true,
  },
  { key: 'transport', name: 'Transport', share: 0.08, hint: 'Fuel, fares, parking', enabled: true },
  {
    key: 'eating-out',
    name: 'Eating out',
    share: 0.05,
    hint: 'Restaurants, coffee, delivery',
    enabled: true,
  },
  { key: 'health', name: 'Health', share: 0.04, hint: 'Pharmacy, doctor, gym', enabled: false },
  {
    key: 'shopping',
    name: 'Shopping',
    share: 0.05,
    hint: 'Clothes, household, gadgets',
    enabled: false,
  },
  { key: 'fun', name: 'Fun', share: 0.04, hint: 'Hobbies, outings, subscriptions', enabled: false },
];

export interface SetupBudget {
  key: string;
  name: string;
  /** Monthly amount; blank creates the budget with no limit. */
  amount: string;
  enabled: boolean;
}

/**
 * A suggested monthly amount: the preset's share of the income, rounded to a
 * number a person would actually pick — nearest 50 above a thousand, nearest
 * 10 above a hundred, nearest 5 below. "1,247.36 for groceries" reads as a
 * calculation; "1,250" reads as a plan.
 */
export function suggestBudget(income: string, share: number): string {
  const raw = amountOf(income).times(share);
  if (raw.lte(0)) return '';
  const step = raw.gte(1000) ? 50 : raw.gte(100) ? 10 : 5;
  const rounded = raw.dividedBy(step).toDecimalPlaces(0).times(step);
  return (rounded.isZero() ? toDecimal(step) : rounded).toFixed(0);
}

/** How much of an income the enabled budgets plan for, and what is left. */
export function planTotals(
  income: string,
  budgets: SetupBudget[],
): { planned: string; left: string; percent: number } {
  const planned = budgets
    .filter((budget) => budget.enabled && budget.amount.trim())
    .reduce((sum, budget) => sum.plus(amountOf(budget.amount)), toDecimal(0));
  const total = amountOf(income);
  const left = total.minus(planned);
  const percent = total.gt(0)
    ? planned.dividedBy(total).times(100).toDecimalPlaces(0).toNumber()
    : 0;
  return { planned: planned.toFixed(), left: left.toFixed(), percent };
}

/**
 * A currency guessed from the browser's timezone. Firefly creates every ledger
 * in euros, which is the wrong answer for most of the world, and a timezone is
 * the one locale signal the app already has. Only a suggestion: the picker
 * shows it first and lets anything else be chosen.
 */
const TIMEZONE_CURRENCY: Array<[RegExp, string]> = [
  [/^Asia\/Dhaka$/, 'BDT'],
  [/^Asia\/(Kolkata|Calcutta)$/, 'INR'],
  [/^Asia\/Karachi$/, 'PKR'],
  [/^Asia\/Colombo$/, 'LKR'],
  [/^Asia\/Kathmandu$/, 'NPR'],
  [/^Asia\/(Tokyo)$/, 'JPY'],
  [/^Asia\/(Shanghai|Chongqing|Urumqi)$/, 'CNY'],
  [/^Asia\/Hong_Kong$/, 'HKD'],
  [/^Asia\/Singapore$/, 'SGD'],
  [/^Asia\/Seoul$/, 'KRW'],
  [/^Asia\/Jakarta$/, 'IDR'],
  [/^Asia\/Manila$/, 'PHP'],
  [/^Asia\/Bangkok$/, 'THB'],
  [/^Asia\/Kuala_Lumpur$/, 'MYR'],
  [/^Asia\/(Dubai|Muscat)$/, 'AED'],
  [/^Asia\/Riyadh$/, 'SAR'],
  [/^Asia\/Qatar$/, 'QAR'],
  [/^Europe\/London$/, 'GBP'],
  [/^Europe\/Zurich$/, 'CHF'],
  [/^Europe\/Stockholm$/, 'SEK'],
  [/^Europe\/Oslo$/, 'NOK'],
  [/^Europe\/Copenhagen$/, 'DKK'],
  [/^Europe\/Warsaw$/, 'PLN'],
  [/^Europe\/Prague$/, 'CZK'],
  [/^Europe\/Budapest$/, 'HUF'],
  [/^Europe\/Istanbul$/, 'TRY'],
  [/^Europe\//, 'EUR'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns)$/, 'CAD'],
  [/^America\/Mexico_City$/, 'MXN'],
  [/^America\/Sao_Paulo$/, 'BRL'],
  [/^America\/(Argentina\/.+|Buenos_Aires)$/, 'ARS'],
  [/^America\//, 'USD'],
  [/^Australia\//, 'AUD'],
  [/^Pacific\/Auckland$/, 'NZD'],
  [/^Africa\/Lagos$/, 'NGN'],
  [/^Africa\/Nairobi$/, 'KES'],
  [/^Africa\/Johannesburg$/, 'ZAR'],
  [/^Africa\/Cairo$/, 'EGP'],
];

export function currencyForTimezone(timezone: string): string | null {
  for (const [pattern, code] of TIMEZONE_CURRENCY) if (pattern.test(timezone)) return code;
  return null;
}

/** The picker's list: the suggestion first, then the currencies most people use. */
export const COMMON_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'BDT',
  'INR',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'SGD',
  'AED',
  'PKR',
  'CNY',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'NZD',
  'ZAR',
  'BRL',
  'MXN',
];

/** Last day of the month containing `today` (YYYY-MM-DD), as YYYY-MM-DD. */
export function monthBounds(today: string): { start: string; end: string } {
  const [year, month] = today.split('-').map((part) => Number.parseInt(part, 10)) as [
    number,
    number,
  ];
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const last = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  const mm = String(month).padStart(2, '0');
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(last).padStart(2, '0')}` };
}

/**
 * The `POST /accounts` body for one account.
 *
 * Firefly's rules, each of which is a 422 if missed (docs/LEARNING.md §7):
 * an asset needs `account_role`; a credit card (`ccAsset`) also needs
 * `credit_card_type` and `monthly_payment_date`; an opening balance needs its
 * date and vice versa; a liability needs `liability_type` and
 * `liability_direction`, and its amount owed travels as `liability_amount`
 * with a start date.
 */
export function accountPayload(
  account: SetupAccount,
  currency: string,
  today: string,
): Record<string, unknown> {
  const amount = amountOf(account.balance || '0').abs();
  const name = account.name.trim();

  if (account.role === 'loan') {
    return {
      name,
      type: 'liabilities',
      liability_type: 'loan',
      liability_direction: 'debit',
      currency_code: currency,
      ...(amount.gt(0) ? { liability_amount: amount.toFixed(), liability_start_date: today } : {}),
    };
  }

  const payload: Record<string, unknown> = {
    name,
    type: 'asset',
    account_role: account.role,
    currency_code: currency,
  };
  if (account.role === 'ccAsset') {
    payload.credit_card_type = 'monthlyFull';
    payload.monthly_payment_date = monthBounds(today).end;
  }
  if (amount.gt(0)) {
    // A card's balance is what is owed, so it opens below zero.
    payload.opening_balance =
      account.role === 'ccAsset' ? amount.negated().toFixed() : amount.toFixed();
    payload.opening_balance_date = today;
  }
  return payload;
}

/**
 * The `POST /budgets` body. A monthly amount becomes an auto-budget that
 * resets each month, so the plan carries on without anyone re-entering it.
 */
export function budgetPayload(budget: SetupBudget, currency: string): Record<string, unknown> {
  const amount = budget.amount.trim() ? amountOf(budget.amount).abs() : null;
  return {
    name: budget.name.trim(),
    ...(amount && amount.gt(0)
      ? {
          auto_budget_type: 'reset',
          auto_budget_amount: amount.toFixed(),
          auto_budget_period: 'monthly',
          auto_budget_currency_code: currency,
        }
      : {}),
  };
}

export interface SetupInput {
  currency: string;
  accounts: SetupAccount[];
  income: { amount: string; from: string };
  budgets: SetupBudget[];
}

/** Problems that stop the setup, in the user's terms. Empty when it can run. */
export function validateSetup(input: SetupInput): string[] {
  const problems: string[] = [];
  if (!/^[A-Z]{3}$/.test(input.currency)) problems.push('Choose a currency.');
  const accounts = input.accounts.filter((account) => account.enabled);
  if (!accounts.some((account) => account.role !== 'loan')) {
    problems.push('Add at least one account your money lives in.');
  }
  const names = new Set<string>();
  for (const account of accounts) {
    const name = account.name.trim().toLowerCase();
    if (!name) problems.push('Every account needs a name.');
    else if (names.has(name)) problems.push(`Two accounts are called “${account.name.trim()}”.`);
    names.add(name);
    if (account.balance.trim() && !/^\d[\d,]*([.,]\d+)?$/.test(account.balance.trim())) {
      problems.push(`The balance for ${account.name.trim() || 'an account'} is not a number.`);
    }
  }
  for (const budget of input.budgets.filter((entry) => entry.enabled)) {
    if (!budget.name.trim()) problems.push('Every budget needs a name.');
    if (budget.amount.trim() && !/^\d[\d,]*([.,]\d+)?$/.test(budget.amount.trim())) {
      problems.push(`The amount for ${budget.name.trim() || 'a budget'} is not a number.`);
    }
  }
  if (input.income.amount.trim() && !/^\d[\d,]*([.,]\d+)?$/.test(input.income.amount.trim())) {
    problems.push('Your monthly income is not a number.');
  }
  return [...new Set(problems)];
}
