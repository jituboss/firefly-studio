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
  auto_budget_currency_code?: string | null;
  spent?: Array<{ sum: string; currency_code: string }> | null;
}

export type Budget = Resource<BudgetAttributes>;

export interface BudgetLimitAttributes {
  budget_id: string;
  start: string;
  end: string;
  amount: string;
  spent: Array<{ sum: string; currency_code: string }> | null;
  currency_code: string | null;
}

export type BudgetLimit = Resource<BudgetLimitAttributes>;

export interface BillAttributes {
  name: string;
  amount_min: string;
  amount_max: string;
  currency_code: string | null;
  date: string;
  end_date: string | null;
  extension_date: string | null;
  repeat_freq: string;
  skip: number;
  active: boolean;
  notes: string | null;
  object_group_title: string | null;
  next_expected_match: string | null;
  paid_dates?: Array<{ date: string }> | null;
  pay_dates?: string[] | null;
}

export type Bill = Resource<BillAttributes>;

export interface PiggyBankAttributes {
  name: string;
  accounts: Array<{ account_id: string; name: string; current_amount: string }>;
  target_amount: string | null;
  current_amount: string | null;
  left_to_save: string | null;
  save_per_month: string | null;
  percentage: number | null;
  start_date: string | null;
  target_date: string | null;
  active: boolean;
  notes: string | null;
  object_group_title: string | null;
  currency_code: string | null;
}

export type PiggyBank = Resource<PiggyBankAttributes>;

export interface CategoryAttributes {
  name: string;
  notes: string | null;
  spent?: Array<{ sum: string; currency_code: string }> | null;
  earned?: Array<{ sum: string; currency_code: string }> | null;
}

export type Category = Resource<CategoryAttributes>;

// ---------------------------------------------------------------------------
// M6 — automation and the long tail.
// Every shape below was read off a live Firefly III 6.5.5 instance, not the
// OpenAPI spec; §7 of LEARNING.md explains why that distinction has teeth.
// ---------------------------------------------------------------------------

/** A tag's name lives in `tag`, not `name` — unlike every other resource. */
export interface TagAttributes {
  tag: string;
  date: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  zoom_level: number | null;
}

export type Tag = Resource<TagAttributes>;

/**
 * `prohibited` is the NOT modifier and exists on triggers only — an action has
 * no such field. Firefly returns it even when the request omits it.
 */
export interface RuleTrigger {
  id?: string;
  type: string;
  value: string;
  prohibited?: boolean;
  order?: number;
  active: boolean;
  stop_processing: boolean;
}

export interface RuleAction {
  id?: string;
  type: string;
  value: string | null;
  order?: number;
  active: boolean;
  stop_processing: boolean;
}

/**
 * `trigger` (singular) is the firing mode — when the rule runs — and is a
 * different thing entirely from `triggers` (the conditions it matches on).
 * The two names are one letter apart and mean unrelated things.
 */
export interface RuleAttributes {
  title: string;
  description: string | null;
  rule_group_id: string;
  rule_group_title: string | null;
  order: number;
  trigger: 'store-journal' | 'update-journal' | 'manual';
  active: boolean;
  strict: boolean;
  stop_processing: boolean;
  triggers: RuleTrigger[];
  actions: RuleAction[];
}

export type Rule = Resource<RuleAttributes>;

export interface RuleGroupAttributes {
  title: string;
  description: string | null;
  order: number;
  active: boolean;
}

export type RuleGroup = Resource<RuleGroupAttributes>;

/**
 * Firefly computes `description` (human-readable, e.g. "Every month on the
 * 1(st/nd/rd/th) day") and `occurrences` (the next few firing dates) server
 * side. Both are read-only and worth rendering rather than re-deriving.
 */
export interface RecurrenceRepetition {
  id?: string;
  type: 'daily' | 'weekly' | 'ndom' | 'monthly' | 'yearly';
  moment: string;
  skip: number;
  weekend: number;
  description?: string;
  occurrences?: string[];
}

export interface RecurrenceTransaction {
  id?: string;
  description: string;
  amount: string;
  foreign_amount?: string | null;
  currency_id?: string | null;
  currency_code?: string | null;
  foreign_currency_code?: string | null;
  source_id: string | null;
  source_name?: string | null;
  destination_id: string | null;
  destination_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  budget_id?: string | null;
  budget_name?: string | null;
  piggy_bank_id?: string | null;
  tags?: string[] | null;
}

/**
 * Firefly requires exactly one of `nr_of_repetitions` or `repeat_until`:
 * sending neither is a 422, and so is sending both.
 */
export interface RecurrenceAttributes {
  type: 'withdrawal' | 'deposit' | 'transfer';
  title: string;
  description: string | null;
  first_date: string;
  latest_date: string | null;
  repeat_until: string | null;
  nr_of_repetitions: number | null;
  apply_rules: boolean;
  active: boolean;
  notes: string | null;
  repetitions: RecurrenceRepetition[];
  transactions: RecurrenceTransaction[];
}

export type Recurrence = Resource<RecurrenceAttributes>;

/**
 * Three booleans that all sound like "the main one". `primary` is the current
 * concept in 6.5.5; `default` and `native` are retained for older instances.
 */
export interface CurrencyAttributes {
  name: string;
  code: string;
  symbol: string;
  decimal_places: number;
  enabled: boolean;
  primary?: boolean;
  default?: boolean;
  native?: boolean;
}

export type Currency = Resource<CurrencyAttributes>;

/** `rate` is a string, like every other number Firefly returns. */
export interface ExchangeRateAttributes {
  from_currency_code: string;
  from_currency_name: string;
  to_currency_code: string;
  to_currency_name: string;
  rate: string;
  date: string;
}

export type ExchangeRate = Resource<ExchangeRateAttributes>;

/** The four stock link types report `editable: false` and cannot be changed. */
export interface LinkTypeAttributes {
  name: string;
  inward: string;
  outward: string;
  editable: boolean;
}

export type LinkType = Resource<LinkTypeAttributes>;

export interface TransactionLinkAttributes {
  inward_id: string;
  outward_id: string;
  link_type_id: string;
  link_type_name: string;
  notes: string | null;
}

export type TransactionLink = Resource<TransactionLinkAttributes>;

/** `data` is whatever the preference holds — string, number, bool or object. */
export interface PreferenceAttributes {
  name: string;
  data: unknown;
}

export type Preference = Resource<PreferenceAttributes>;

/**
 * `/configuration` is the one endpoint that returns a BARE ARRAY with no
 * `data` envelope, so it cannot go through the usual `{ data: T }` unwrap.
 */
export interface ConfigurationEntry {
  title: string;
  value: string | number | boolean | null;
  editable: boolean;
}

export interface FireflyUserAttributes {
  email: string;
  blocked: boolean;
  blocked_code: string | null;
  role: string | null;
}

export type FireflyUser = Resource<FireflyUserAttributes>;

export interface UserGroupAttributes {
  title: string;
  in_use: boolean;
  can_see_members: boolean;
  primary_currency_code: string | null;
}

export type UserGroup = Resource<UserGroupAttributes>;
