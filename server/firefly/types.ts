/** Hand-written views of the Firefly payloads M2 actually reads. */

export interface Pagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export interface Paged<T> {
  data: T[];
  meta: { pagination?: Pagination };
}

export interface Resource<A> {
  id: string;
  type: string;
  attributes: A;
}

export type AccountType =
  'asset' | 'expense' | 'revenue' | 'liabilities' | 'cash' | 'initial-balance' | 'reconciliation';

export interface AccountAttributes {
  name: string;
  type: AccountType;
  account_role: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
  currency_decimal_places: number | null;
  current_balance: string | null;
  current_balance_date: string | null;
  notes: string | null;
  active: boolean;
  order: number | null;
  iban: string | null;
  bic: string | null;
  account_number: string | null;
  opening_balance: string | null;
  opening_balance_date: string | null;
  virtual_balance: string | null;
  include_net_worth: boolean;
  liability_type: string | null;
  liability_direction: string | null;
  interest: string | null;
  interest_period: string | null;
  last_activity: string | null;
}

export type Account = Resource<AccountAttributes>;

export type TransactionType =
  'withdrawal' | 'deposit' | 'transfer' | 'opening balance' | 'reconciliation';

export interface TransactionSplit {
  transaction_journal_id: string;
  type: TransactionType;
  date: string;
  amount: string;
  currency_code: string;
  currency_symbol: string;
  currency_decimal_places: number;
  foreign_amount: string | null;
  foreign_currency_code: string | null;
  description: string;
  source_id: string | null;
  source_name: string | null;
  source_type: string | null;
  destination_id: string | null;
  destination_name: string | null;
  destination_type: string | null;
  category_id: string | null;
  category_name: string | null;
  budget_id: string | null;
  budget_name: string | null;
  bill_id: string | null;
  bill_name: string | null;
  tags: string[] | null;
  notes: string | null;
  reconciled: boolean;
  internal_reference: string | null;
  external_url: string | null;
  has_attachments?: boolean;
}

export interface TransactionAttributes {
  created_at: string;
  updated_at: string;
  user: string;
  group_title: string | null;
  transactions: TransactionSplit[];
}

export type Transaction = Resource<TransactionAttributes>;

export interface BasicSummaryEntry {
  key: string;
  title: string;
  monetary_value: number;
  currency_code: string;
  currency_symbol: string;
  currency_decimal_places: number;
  value_parsed: string;
  local_icon: string;
  sub_title: string;
}

export type BasicSummary = Record<string, BasicSummaryEntry>;

export interface ChartEntry {
  label: string;
  currency_code?: string;
  currency_symbol?: string;
  yAxisID?: number;
  type?: string;
  entries: Record<string, number | string>;
}

export interface InsightEntry {
  id?: string;
  name?: string;
  difference: string;
  difference_float: number;
  currency_code: string;
  currency_id?: string;
}

export interface BudgetAttributes {
  name: string;
  active: boolean;
  notes: string | null;
  auto_budget_type: string | null;
  auto_budget_amount: string | null;
  auto_budget_period: string | null;
  spent?: Array<{ sum: string; currency_code: string }> | null;
}

export type Budget = Resource<BudgetAttributes>;

export interface BudgetLimitAttributes {
  budget_id: string;
  start: string;
  end: string;
  amount: string;
  spent: string | null;
  currency_code: string;
}

export type BudgetLimit = Resource<BudgetLimitAttributes>;

export interface BillAttributes {
  name: string;
  amount_min: string;
  amount_max: string;
  currency_code: string;
  date: string;
  repeat_freq: string;
  active: boolean;
  next_expected_match: string | null;
  paid_dates?: Array<{ date: string }> | null;
  pay_dates?: string[] | null;
}

export type Bill = Resource<BillAttributes>;

export interface PiggyBankAttributes {
  name: string;
  account_name: string | null;
  target_amount: string | null;
  current_amount: string | null;
  percentage: number | null;
  target_date: string | null;
  currency_code: string;
}

export type PiggyBank = Resource<PiggyBankAttributes>;

export interface CategoryAttributes {
  name: string;
  notes: string | null;
}

export type Category = Resource<CategoryAttributes>;
