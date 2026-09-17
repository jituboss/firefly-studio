import { add, subtract, toDecimal } from '@/lib/money';
import type { Account, AccountType } from '@/server/firefly/types';

/**
 * Classification and totals for the accounts page.
 *
 * Firefly models a lot of things as "accounts" that a person would never call
 * one. On a real ledger of 142 accounts, only 29 were the user's own money —
 * the other 113 were 100 merchants (`expense`), 4 employers (`revenue`) and 13
 * reconciliation rows Firefly maintains for itself. Listing all of them with
 * identical styling is what made the page unusable, so the first job here is to
 * separate them.
 *
 * The net-worth arithmetic deliberately mirrors the dashboard's: skip archived
 * accounts and anything flagged `include_net_worth: false`, and never add two
 * currencies together. Firefly's own `/summary/basic` net worth applies exactly
 * those rules, so the two screens agree to the cent instead of showing two
 * different totals for the same money.
 */

export type AccountBucket = 'money' | 'payee' | 'income' | 'internal';

export type MoneyKind = 'checking' | 'savings' | 'cash' | 'credit' | 'loan';

const INTERNAL_TYPES: ReadonlySet<string> = new Set([
  'initial-balance',
  'reconciliation',
  'import',
  'liability credit',
]);

export function accountBucket(type: AccountType | string): AccountBucket {
  if (INTERNAL_TYPES.has(type)) return 'internal';
  if (type === 'expense') return 'payee';
  if (type === 'revenue') return 'income';
  if (type === 'asset' || type === 'liabilities' || type === 'cash') return 'money';
  return 'internal';
}

/** Which section of the "Your money" view an account belongs in. */
export function moneyKind(account: Account): MoneyKind {
  const { type, account_role: role, liability_type: liabilityType } = account.attributes;

  if (type === 'liabilities') {
    return liabilityType === 'creditcard' ? 'credit' : 'loan';
  }
  if (type === 'cash') return 'cash';

  switch (role) {
    case 'savingAsset':
      return 'savings';
    case 'ccAsset':
      return 'credit';
    case 'cashWalletAsset':
      return 'cash';
    default:
      return 'checking';
  }
}

/**
 * Firefly's internal role enum leaks into the UI as `defaultAsset` /
 * `cashWalletAsset` unless it is translated.
 */
export function roleLabel(account: Account): string {
  const { type, account_role: role, liability_type: liabilityType } = account.attributes;

  if (type === 'liabilities') {
    if (liabilityType === 'creditcard') return 'Credit card';
    if (liabilityType === 'mortgage') return 'Mortgage';
    if (liabilityType === 'debt') return 'Debt';
    return 'Loan';
  }
  if (type === 'cash') return 'Cash';

  switch (role) {
    case 'defaultAsset':
      return 'Checking';
    case 'savingAsset':
      return 'Savings';
    case 'ccAsset':
      return 'Credit card';
    case 'cashWalletAsset':
      return 'Cash wallet';
    default:
      return 'Account';
  }
}

export interface CurrencyTotal {
  currency: string;
  amount: string;
}

export interface NetWorthSummary {
  /** The currency the headline figures are in. */
  currency: string;
  netWorth: string;
  assets: string;
  liabilities: string;
  /** Accounts counted toward the headline figures. */
  countedAccounts: number;
  /** Balances held in other currencies, which cannot be converted. */
  otherCurrencies: CurrencyTotal[];
  /** Archived or explicitly excluded from net worth. */
  excludedAccounts: number;
}

function currencyOf(account: Account, fallback: string): string {
  return (account.attributes.currency_code ?? fallback).toUpperCase();
}

/** Counts toward net worth only if active and not opted out by the user. */
export function countsTowardNetWorth(account: Account): boolean {
  return account.attributes.active !== false && account.attributes.include_net_worth !== false;
}

export function summariseNetWorth(accounts: Account[], preferredCurrency: string): NetWorthSummary {
  const preferred = preferredCurrency.toUpperCase();
  const money = accounts.filter((account) => accountBucket(account.attributes.type) === 'money');

  const counted = money.filter(countsTowardNetWorth);
  const excludedAccounts = money.length - counted.length;

  let assets = toDecimal(0);
  let liabilities = toDecimal(0);
  let countedAccounts = 0;
  const otherByCurrency = new Map<string, ReturnType<typeof toDecimal>>();

  for (const account of counted) {
    const balance = account.attributes.current_balance;
    const currency = currencyOf(account, preferred);

    if (currency !== preferred) {
      otherByCurrency.set(currency, add(otherByCurrency.get(currency) ?? 0, balance));
      continue;
    }

    countedAccounts += 1;
    if (account.attributes.type === 'liabilities') {
      liabilities = add(liabilities, balance);
    } else {
      assets = add(assets, balance);
    }
  }

  // Liability balances are already signed by Firefly (a card you owe on is
  // negative), so net worth is a straight sum rather than assets minus debts —
  // subtracting would double-count the sign and turn debt into wealth.
  const netWorth = add(assets, liabilities);

  const otherCurrencies: CurrencyTotal[] = [...otherByCurrency.entries()]
    .filter(([, value]) => !value.isZero())
    .map(([currency, value]) => ({ currency, amount: value.toString() }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  return {
    currency: preferred,
    netWorth: netWorth.toString(),
    assets: assets.toString(),
    liabilities: liabilities.toString(),
    countedAccounts,
    otherCurrencies,
    excludedAccounts,
  };
}

/** Per-currency totals for a set of accounts, used by the group headers. */
export function totalsByCurrency(accounts: Account[], fallback: string): CurrencyTotal[] {
  const totals = new Map<string, ReturnType<typeof toDecimal>>();
  for (const account of accounts) {
    const currency = currencyOf(account, fallback);
    totals.set(currency, add(totals.get(currency) ?? 0, account.attributes.current_balance));
  }
  return [...totals.entries()]
    .map(([currency, value]) => ({ currency, amount: value.toString() }))
    .sort((a, b) => toDecimal(b.amount).abs().comparedTo(toDecimal(a.amount).abs()));
}

export { subtract };
