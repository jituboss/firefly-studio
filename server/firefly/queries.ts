import 'server-only';
import { fireflyGet, fireflyGetSafe } from './api';
import type {
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

export const getBalanceChart = (start: string, end: string) =>
  fireflyGetSafe<ChartEntry[]>(`/v1/chart/balance/balance${qs({ start, end })}`, []);

export const getAccountOverviewChart = (start: string, end: string) =>
  fireflyGetSafe<ChartEntry[]>(`/v1/chart/account/overview${qs({ start, end })}`, []);

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
