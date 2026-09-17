import 'server-only';
import { fireflyGetSafe } from './api';
import type { Bill, BudgetLimit, ChartEntry, InsightEntry, Paged, Transaction } from './types';

/**
 * E14 — the read layer for reports.
 *
 * Kept apart from `queries.ts` because reports differ in one important way:
 * every call here is scoped (date range plus an optional account filter) and
 * every one of them is failure-tolerant. A report is a page of a dozen
 * independent figures; one endpoint erroring should blank one panel, not the
 * whole page.
 */

export interface ScopeParams {
  start: string;
  end: string;
  /** Firefly asset-account ids. Empty means every account. */
  accounts?: string[];
}

/**
 * Firefly takes repeated `accounts[]=1&accounts[]=2`, not a comma list, so this
 * cannot use the plain `qs` helper in `queries.ts` (which is `set`-based and
 * would keep only the last id — a scoped report would silently report on one
 * account).
 */
function scopedQuery(
  scope: ScopeParams,
  extra: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams();
  params.set('start', scope.start);
  params.set('end', scope.end);
  for (const id of scope.accounts ?? []) params.append('accounts[]', id);
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return `?${params.toString()}`;
}

const insight = (path: string, scope: ScopeParams) =>
  fireflyGetSafe<InsightEntry[]>(`/v1/insight/${path}${scopedQuery(scope)}`, []);

// --- totals -----------------------------------------------------------------

export const getIncomeTotal = (scope: ScopeParams) => insight('income/total', scope);
export const getExpenseTotal = (scope: ScopeParams) => insight('expense/total', scope);
export const getTransferTotal = (scope: ScopeParams) => insight('transfer/total', scope);

// --- by dimension -----------------------------------------------------------

export const getExpenseByCategoryScoped = (scope: ScopeParams) =>
  insight('expense/category', scope);
export const getIncomeByCategoryScoped = (scope: ScopeParams) => insight('income/category', scope);
export const getExpenseWithoutCategory = (scope: ScopeParams) =>
  insight('expense/no-category', scope);

export const getExpenseByBudget = (scope: ScopeParams) => insight('expense/budget', scope);
export const getExpenseWithoutBudget = (scope: ScopeParams) => insight('expense/no-budget', scope);

export const getExpenseByBill = (scope: ScopeParams) => insight('expense/bill', scope);
export const getExpenseWithoutBill = (scope: ScopeParams) => insight('expense/no-bill', scope);

export const getExpenseByTag = (scope: ScopeParams) => insight('expense/tag', scope);
export const getIncomeByTag = (scope: ScopeParams) => insight('income/tag', scope);

/** Where the money went: expense accounts (merchants, landlords, …). */
export const getExpenseByDestination = (scope: ScopeParams) => insight('expense/expense', scope);
/** Where the money came from: revenue accounts (employers, clients, …). */
export const getIncomeBySource = (scope: ScopeParams) => insight('income/revenue', scope);

/** Per-asset-account movement, for the account report (E14-08). */
export const getExpenseByAsset = (scope: ScopeParams) => insight('expense/asset', scope);
export const getIncomeByAsset = (scope: ScopeParams) => insight('income/asset', scope);
export const getTransferByAsset = (scope: ScopeParams) => insight('transfer/asset', scope);

// --- charts -----------------------------------------------------------------

/**
 * Monthly earned/spent series. `period=1M` is not optional: without it Firefly
 * returns a single bucket for the whole range, which draws nothing.
 */
export const getCashFlowChart = (scope: ScopeParams) =>
  fireflyGetSafe<ChartEntry[]>(
    `/v1/chart/balance/balance${scopedQuery(scope, { period: '1M', preselected: scope.accounts?.length ? undefined : 'all' })}`,
    [],
  );

/** Per-account running balance, for the net-worth report (E14-02). */
export const getNetWorthChart = (scope: ScopeParams, period: '1D' | '1W' | '1M' = '1M') =>
  fireflyGetSafe<ChartEntry[]>(
    `/v1/chart/account/overview${scopedQuery(scope, { period, preselected: scope.accounts?.length ? undefined : 'all' })}`,
    [],
  );

/**
 * One snapshot bar per budget for the whole range — `budgeted`, `spent`,
 * `left`, `overspent`. NOT a time series, unlike the two above (docs/LEARNING.md §7).
 */
export const getBudgetOverviewChart = (scope: ScopeParams) =>
  fireflyGetSafe<ChartEntry[]>(`/v1/chart/budget/overview${scopedQuery(scope)}`, []);

/** One snapshot bar per category — `spent` and `earned`. Also not a series. */
export const getCategoryOverviewChart = (scope: ScopeParams) =>
  fireflyGetSafe<ChartEntry[]>(`/v1/chart/category/overview${scopedQuery(scope)}`, []);

// --- supporting reads --------------------------------------------------------

export const getBudgetLimitsInRange = (scope: ScopeParams) =>
  fireflyGetSafe<Paged<BudgetLimit>>(`/v1/budget-limits${scopedQuery(scope, { limit: 200 })}`, {
    data: [],
    meta: {},
  });

export const getBillsInRange = (scope: ScopeParams) =>
  fireflyGetSafe<Paged<Bill>>(`/v1/bills${scopedQuery(scope, { limit: 200 })}`, {
    data: [],
    meta: {},
  });

/**
 * Raw transactions for the range, used by the cash-flow Sankey (E14-06) which
 * needs the source→destination pairing that no aggregate endpoint exposes.
 * Capped rather than paged to the end: a Sankey built from more than a few
 * thousand transactions is unreadable long before it is inaccurate.
 */
export const getTransactionsInRange = (scope: ScopeParams, limit = 500) =>
  fireflyGetSafe<Paged<Transaction>>(`/v1/transactions${scopedQuery(scope, { limit })}`, {
    data: [],
    meta: {},
  });

/**
 * E14-10 — the custom builder resolves a metric/dimension pair to one of the
 * insight paths above and fetches it through here. `path` is never taken from
 * user input directly: `insightPathFor` in lib/custom-report.ts maps a
 * validated enum pair onto it, so an arbitrary string cannot reach the URL.
 */
export const getInsightByPath = (path: string, scope: ScopeParams) => insight(path, scope);
