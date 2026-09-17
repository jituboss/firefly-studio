import 'server-only';
import { fireflyGet, fireflyGetSafe } from './api';
import type {
  Resource,
  Account,
  BasicSummary,
  Bill,
  Budget,
  BudgetLimit,
  Category,
  ChartEntry,
  InsightEntry,
  Paged,
  PiggyBank,
  Transaction,
  Tag,
  Rule,
  RuleGroup,
  Recurrence,
  Currency,
  ExchangeRate,
  LinkType,
  TransactionLink,
  Preference,
  ConfigurationEntry,
  FireflyUser,
  UserGroup,
} from './types';

/** Read helpers used by the M2 server components. */

const qs = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
};

// --- dashboard --------------------------------------------------------------

export const getBasicSummary = (start: string, end: string) =>
  fireflyGetSafe<BasicSummary>(`/v1/summary/basic${qs({ start, end })}`, {});

/** Choose daily buckets for month-or-shorter ranges so the line has points to
 * draw; use monthly buckets for longer ranges to keep the chart readable.
 */
function chartPeriod(start: string, end: string): '1D' | '1M' {
  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 + 1;
  return days <= 31 ? '1D' : '1M';
}

export const getBalanceChart = (start: string, end: string) =>
  fireflyGetSafe<ChartEntry[]>(
    `/v1/chart/balance/balance${qs({ start, end, period: chartPeriod(start, end), preselected: 'all' })}`,
    [],
  );

export const getAccountOverviewChart = (start: string, end: string) =>
  fireflyGetSafe<ChartEntry[]>(
    `/v1/chart/account/overview${qs({ start, end, period: chartPeriod(start, end), preselected: 'all' })}`,
    [],
  );

export const getExpenseByCategory = (start: string, end: string) =>
  fireflyGetSafe<InsightEntry[]>(`/v1/insight/expense/category${qs({ start, end })}`, []);

// --- accounts ---------------------------------------------------------------

export const getAccounts = (
  params: { type?: string; page?: number; limit?: number; date?: string } = {},
) => fireflyGet<Paged<Account>>(`/v1/accounts${qs({ ...params, limit: params.limit ?? 100 })}`);

export const getAccountsSafe = (params: { type?: string; limit?: number } = {}) =>
  fireflyGetSafe<Paged<Account>>(`/v1/accounts${qs({ ...params, limit: params.limit ?? 100 })}`, {
    data: [],
    meta: {},
  });

export const getAccount = (id: string) => fireflyGet<{ data: Account }>(`/v1/accounts/${id}`);

/**
 * One account's running balance across the range.
 *
 * `period` is not optional in practice: without it Firefly buckets the range
 * monthly, so "This month" came back as a single point on the 1st and the
 * chart drew nothing. Verified against a live instance — 1 entry without it,
 * 30 with `period=1D`.
 */
export const getAccountBalanceChart = (id: string, start: string, end: string) =>
  fireflyGetSafe<ChartEntry[]>(
    `/v1/chart/account/overview${qs({
      start,
      end,
      period: chartPeriod(start, end),
      'accounts[]': id,
    })}`,
    [],
  );

/** Money that left this account in the range. Empty for non-asset accounts. */
export const getAccountExpenseInsight = (id: string, start: string, end: string) =>
  fireflyGetSafe<InsightEntry[]>(
    `/v1/insight/expense/asset${qs({ start, end, 'accounts[]': id })}`,
    [],
  );

/** Money that arrived in this account in the range. Empty for non-asset accounts. */
export const getAccountIncomeInsight = (id: string, start: string, end: string) =>
  fireflyGetSafe<InsightEntry[]>(
    `/v1/insight/income/asset${qs({ start, end, 'accounts[]': id })}`,
    [],
  );

/**
 * Asset + liability accounts, which is exactly the set the balance chart's
 * `preselected=all` covers. Used to find the accounts the user has flagged
 * `include_net_worth: false`, because the chart endpoint reports their balances
 * but Firefly's own net-worth figure ignores them — without this the dashboard
 * shows two different "total" numbers that cannot be reconciled.
 */
export const getNetWorthAccounts = async (): Promise<Account[]> => {
  const [assets, liabilities] = await Promise.all([
    getAccountsSafe({ type: 'asset', limit: 300 }),
    getAccountsSafe({ type: 'liabilities', limit: 300 }),
  ]);
  return [...assets.data, ...liabilities.data];
};

export const getAccountTransactions = (
  id: string,
  params: { start?: string; end?: string; page?: number; limit?: number } = {},
) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/accounts/${id}/transactions${qs({ ...params, limit: params.limit ?? 25 })}`,
    { data: [], meta: {} },
  );

// --- transactions -----------------------------------------------------------

export interface TransactionQuery {
  start?: string;
  end?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const getTransactions = (params: TransactionQuery = {}) =>
  fireflyGet<Paged<Transaction>>(`/v1/transactions${qs({ ...params, limit: params.limit ?? 50 })}`);

export const getTransaction = (id: string) =>
  fireflyGet<{ data: Transaction }>(`/v1/transactions/${id}`);

// --- search -----------------------------------------------------------------

export const searchTransactions = (query: string, page = 1) =>
  fireflyGetSafe<Paged<Transaction>>(`/v1/search/transactions${qs({ query, page, limit: 25 })}`, {
    data: [],
    meta: {},
  });

export const searchAccounts = (query: string) =>
  fireflyGetSafe<{ data: Array<{ id: string; name: string; type: string }> }>(
    `/v1/search/accounts${qs({ query, field: 'all', limit: 15 })}`,
    { data: [] },
  );

// --- secondary widgets ------------------------------------------------------

export const getBudgets = (start: string, end: string) =>
  fireflyGetSafe<Paged<Budget>>(`/v1/budgets${qs({ start, end, limit: 50 })}`, {
    data: [],
    meta: {},
  });

export const getBudgetLimits = (start: string, end: string) =>
  fireflyGetSafe<Paged<BudgetLimit>>(`/v1/budget-limits${qs({ start, end })}`, {
    data: [],
    meta: {},
  });

export const getBills = (start: string, end: string) =>
  fireflyGetSafe<Paged<Bill>>(`/v1/bills${qs({ start, end, limit: 50 })}`, { data: [], meta: {} });

export const getPiggyBanks = () =>
  fireflyGetSafe<Paged<PiggyBank>>(`/v1/piggy-banks${qs({ limit: 50 })}`, { data: [], meta: {} });

// --- M4: budgets, categories, bills, piggy banks -----------------------------

export const getBudget = (id: string, start?: string, end?: string) =>
  fireflyGet<{ data: Budget }>(`/v1/budgets/${id}${qs({ start, end })}`);

export const getBudgetLimitsForBudget = (id: string) =>
  fireflyGetSafe<Paged<BudgetLimit>>(`/v1/budgets/${id}/limits`, { data: [], meta: {} });

export const getBudgetTransactions = (
  id: string,
  params: { start?: string; end?: string; page?: number; limit?: number } = {},
) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/budgets/${id}/transactions${qs({ ...params, limit: params.limit ?? 25 })}`,
    { data: [], meta: {} },
  );

/** E6-05 — transactions that have no budget assigned. */
export const getTransactionsWithoutBudget = (params: {
  start?: string;
  end?: string;
  page?: number;
  limit?: number;
}) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/budgets/transactions-without-budget${qs({ ...params, limit: params.limit ?? 25 })}`,
    { data: [], meta: {} },
  );
/** E6-06 — envelope totals per period. */
export const getAvailableBudgets = (start?: string, end?: string) =>
  fireflyGetSafe<Paged<AvailableBudget>>(`/v1/available-budgets${qs({ start, end, limit: 50 })}`, {
    data: [],
    meta: {},
  });

/** E9-05 — object groups used to cluster bills and piggy banks. */
export const getObjectGroups = () =>
  fireflyGetSafe<Paged<ObjectGroup>>(`/v1/object-groups${qs({ limit: 200 })}`, {
    data: [],
    meta: {},
  });
export const getCategories = (start?: string, end?: string) =>
  fireflyGetSafe<Paged<Category>>(`/v1/categories${qs({ start, end, limit: 200 })}`, {
    data: [],
    meta: {},
  });

export const getCategory = (id: string, start?: string, end?: string) =>
  fireflyGet<{ data: Category }>(`/v1/categories/${id}${qs({ start, end })}`);

export const getCategoryTransactions = (
  id: string,
  params: { start?: string; end?: string; page?: number; limit?: number } = {},
) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/categories/${id}/transactions${qs({ ...params, limit: params.limit ?? 25 })}`,
    { data: [], meta: {} },
  );

export const getBill = (id: string) => fireflyGet<{ data: Bill }>(`/v1/bills/${id}`);

export const getBillTransactions = (id: string, params: { page?: number; limit?: number } = {}) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/bills/${id}/transactions${qs({ ...params, limit: params.limit ?? 25 })}`,
    { data: [], meta: {} },
  );

export const getPiggyBank = (id: string) =>
  fireflyGet<{ data: PiggyBank }>(`/v1/piggy-banks/${id}`);

export interface PiggyEvent {
  id: string;
  type: string;
  attributes: { amount: string; currency_code: string; created_at: string };
}

export const getPiggyEvents = (id: string) =>
  fireflyGetSafe<{ data: PiggyEvent[] }>(`/v1/piggy-banks/${id}/events`, { data: [] });

// --- types mirrored from vendored spec --------------------------------------

export interface AvailableBudget {
  id: string;
  type: string;
  attributes: {
    amount?: string;
    currency_code?: string;
    currency_decimal_places?: number;
    currency_name?: string;
    currency_symbol?: string;
    start?: string;
    end?: string;
    primary_currency_code?: string;
    primary_currency_symbol?: string;
    primary_currency_decimal_places?: number;
    pc_amount?: string;
    spent_in_budgets?: Array<{ sum: string; currency_code: string }>;
    spent_outside_budgets?: Array<{ sum: string; currency_code: string }>;
    pc_spent_in_budgets?: Array<{ sum: string; currency_code: string }>;
    pc_spent_outside_budgets?: Array<{ sum: string; currency_code: string }>;
  };
}

export interface ObjectGroup {
  id: string;
  type: string;
  attributes: {
    title: string;
    order: number;
    created_at?: string;
    updated_at?: string;
  };
}

// --- E16-05: attachment manager ---------------------------------------------

export interface AttachmentAttributes {
  attachable_id: string;
  attachable_type: string;
  filename: string;
  title: string | null;
  notes: string | null;
  mime: string;
  size: number;
  hash: string;
  created_at: string;
  updated_at: string;
}

export type Attachment = Resource<AttachmentAttributes>;

/**
 * Every attachment on the connected ledger.
 *
 * Firefly has no filter parameters here — no `attachable_type`, no search — so
 * the filtering in the manager is done after the fetch. Fine for a personal
 * ledger; a five-figure attachment count would need paging through instead.
 */
export const getAttachments = (params: { page?: number; limit?: number } = {}) =>
  fireflyGetSafe<Paged<Attachment>>(
    `/v1/attachments${qs({ ...params, limit: params.limit ?? 100 })}`,
    { data: [], meta: {} },
  );

// --- M6: tags ---------------------------------------------------------------

export const getTags = (params: { page?: number; limit?: number } = {}) =>
  fireflyGetSafe<Paged<Tag>>(`/v1/tags${qs({ ...params, limit: params.limit ?? 200 })}`, {
    data: [],
    meta: {},
  });

export const getTag = (tag: string) =>
  fireflyGet<{ data: Tag }>(`/v1/tags/${encodeURIComponent(tag)}`);

export const getTagTransactions = (
  tag: string,
  params: { page?: number; limit?: number; start?: string; end?: string } = {},
) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/tags/${encodeURIComponent(tag)}/transactions${qs({ ...params, limit: params.limit ?? 50 })}`,
    { data: [], meta: {} },
  );

// --- M6: rules --------------------------------------------------------------

export const getRuleGroups = () =>
  fireflyGetSafe<Paged<RuleGroup>>('/v1/rule-groups?limit=200', { data: [], meta: {} });

export const getRuleGroup = (id: string) =>
  fireflyGet<{ data: RuleGroup }>(`/v1/rule-groups/${id}`);

export const getRulesInGroup = (id: string) =>
  fireflyGetSafe<Paged<Rule>>(`/v1/rule-groups/${id}/rules?limit=200`, { data: [], meta: {} });

export const getRules = () =>
  fireflyGetSafe<Paged<Rule>>('/v1/rules?limit=200', { data: [], meta: {} });

export const getRule = (id: string) => fireflyGet<{ data: Rule }>(`/v1/rules/${id}`);

/**
 * E11-04 dry-run. Always uncached: the whole point is to show what matches the
 * ledger as it is right now, and a cached answer would quietly lie after an edit.
 */
export const testRule = (id: string, params: { start?: string; end?: string } = {}) =>
  fireflyGetSafe<Paged<Transaction>>(`/v1/rules/${id}/test${qs(params)}`, { data: [], meta: {} });

export const testRuleGroup = (id: string, params: { start?: string; end?: string } = {}) =>
  fireflyGetSafe<Paged<Transaction>>(`/v1/rule-groups/${id}/test${qs(params)}`, {
    data: [],
    meta: {},
  });

// --- M6: recurring ----------------------------------------------------------

export const getRecurrences = () =>
  fireflyGetSafe<Paged<Recurrence>>('/v1/recurrences?limit=200', { data: [], meta: {} });

export const getRecurrence = (id: string) =>
  fireflyGet<{ data: Recurrence }>(`/v1/recurrences/${id}`);

export const getRecurrenceTransactions = (id: string, params: { page?: number } = {}) =>
  fireflyGetSafe<Paged<Transaction>>(
    `/v1/recurrences/${id}/transactions${qs({ ...params, limit: 50 })}`,
    { data: [], meta: {} },
  );

// --- M6: currencies and exchange rates --------------------------------------

export const getCurrencies = () =>
  fireflyGetSafe<Paged<Currency>>('/v1/currencies?limit=200', { data: [], meta: {} });

export const getCurrency = (code: string) =>
  fireflyGet<{ data: Currency }>(`/v1/currencies/${encodeURIComponent(code)}`);

export const getExchangeRates = () =>
  fireflyGetSafe<Paged<ExchangeRate>>('/v1/exchange-rates?limit=200', { data: [], meta: {} });

// --- M6: transaction links --------------------------------------------------

export const getLinkTypes = () =>
  fireflyGetSafe<Paged<LinkType>>('/v1/link-types?limit=100', { data: [], meta: {} });

export const getTransactionLinks = () =>
  fireflyGetSafe<Paged<TransactionLink>>('/v1/transaction-links?limit=200', {
    data: [],
    meta: {},
  });

/** Links hang off the journal (split) id, not the transaction group id. */
export const getJournalLinks = (journalId: string) =>
  fireflyGetSafe<Paged<TransactionLink>>(`/v1/transaction-journals/${journalId}/links`, {
    data: [],
    meta: {},
  });

// --- M6: preferences, about, admin ------------------------------------------

export const getPreferences = () =>
  fireflyGetSafe<Paged<Preference>>('/v1/preferences', { data: [], meta: {} });

/**
 * The one endpoint that answers with a bare array instead of `{ data: … }`,
 * so it is typed as the array directly rather than unwrapped.
 */
export const getConfiguration = () => fireflyGetSafe<ConfigurationEntry[]>('/v1/configuration', []);

export const getFireflyUsers = () =>
  fireflyGetSafe<Paged<FireflyUser>>('/v1/users?limit=100', { data: [], meta: {} });

export const getUserGroups = () =>
  fireflyGetSafe<Paged<UserGroup>>('/v1/user-groups?limit=100', { data: [], meta: {} });

export const getAboutUser = () =>
  fireflyGetSafe<{ data: FireflyUser } | null>('/v1/about/user', null);
