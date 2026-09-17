import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, fireflyGetSafe } from '@/server/firefly/api';
import { getAccount, getBudget, getCategory } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { now, toApiDate } from '@/lib/date';
import { add, toDecimal } from '@/lib/money';
import { DateRangePicker } from '@/components/date-range-picker';
import { HideBalancesToggle } from '@/components/hide-balances';
import { TransactionFilters } from './filters';
import { TransactionGrid } from './grid';
import { QuickAdd } from './quick-add';
import { Pagination } from './pagination';
import { SavedViews } from './saved-views';
import { listSavedViews } from '@/server/saved-views';
import { Amount } from '@/components/ui/amount';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Paged, Transaction, TransactionSplit } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Transactions' };

/**
 * In, out and net for the rows on screen.
 *
 * Deliberately scoped to the current page rather than the whole result set:
 * Firefly's list endpoints carry no totals, and summing only page one while
 * labelling it "this period" would state a number that is simply wrong. One
 * currency at a time, as everywhere else.
 */
function pageTotals(transactions: Transaction[], preferred: string) {
  const splits = transactions.flatMap((group) => group.attributes.transactions);
  const currencies = new Map<string, TransactionSplit[]>();
  for (const split of splits) {
    const bucket = currencies.get(split.currency_code) ?? [];
    bucket.push(split);
    currencies.set(split.currency_code, bucket);
  }

  const currency = currencies.has(preferred)
    ? preferred
    : ([...currencies.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0] ?? preferred);

  let inflow = toDecimal(0);
  let outflow = toDecimal(0);
  for (const split of currencies.get(currency) ?? []) {
    // Transfers move money between the user's own accounts; counting them as
    // either income or spending would double the day's activity.
    if (split.type === 'deposit') inflow = add(inflow, split.amount);
    else if (split.type === 'withdrawal') outflow = add(outflow, split.amount);
  }

  return {
    currency,
    inflow: inflow.toString(),
    outflow: outflow.toString(),
    net: inflow.minus(outflow).toString(),
    otherCurrencies: [...currencies.keys()].filter((code) => code !== currency).sort(),
  };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const params = await searchParams;
  const range = resolveRangeFromParams(params, session.user.timezone);
  // Default the quick-add date to today, unless the selected range ends in the
  // past — entering a transaction dated outside the view you are looking at
  // means it vanishes the moment you save it.
  const today = toApiDate(now(session.user.timezone), session.user.timezone);

  const page = Math.max(1, Number.parseInt(String(params.page ?? '1'), 10) || 1);
  const type = typeof params.type === 'string' ? params.type : 'all';
  const accountId = typeof params.account === 'string' ? params.account : undefined;
  const search = typeof params.q === 'string' ? params.q.trim() : '';

  // E14-12 — report drill-through. Each of these scopes the list to one
  // Firefly resource using its own `/…/{id}/transactions` endpoint, the same
  // way `?account=` already does, so a chart element can link to exactly the
  // rows behind it.
  const categoryId = typeof params.category === 'string' ? params.category : undefined;
  const budgetId = typeof params.budget === 'string' ? params.budget : undefined;
  const tag = typeof params.tag === 'string' ? params.tag.trim() : undefined;

  const query = new URLSearchParams({
    start: range.start,
    end: range.end,
    page: String(page),
    limit: '50',
  });
  if (type !== 'all') query.set('type', type);

  // A free-text query uses the search endpoint; everything else is a filtered
  // list, or the account-scoped list when an account is pinned.
  //
  // The search endpoint takes no start/end parameters — it takes operators
  // inside the query string. Without them a search silently ignored the date
  // range the picker was still showing (verified on a live ledger: 23 hits
  // unfiltered against 3 within the month). `type:` and `account_id:` are NOT
  // supported there — they are accepted and ignored — so those two filters are
  // applied below instead of being quietly dropped.
  //
  // E15-02 — the range is only appended when the user has not written their own
  // date operator. Firefly ANDs every term, so a query of `date_after:2026-01-01`
  // combined with an injected `date_after:2026-09-01` silently narrows to the
  // later of the two and the typed operator appears to do nothing.
  const typedDateOperator = /\b(date_after|date_before|date_is):/.test(search);
  const searchQuery = search
    ? typedDateOperator
      ? search
      : `${search} date_after:${range.start} date_before:${range.end}`
    : '';

  const basePath = search
    ? `/v1/search/transactions?query=${encodeURIComponent(searchQuery)}&page=${page}&limit=50`
    : accountId
      ? `/v1/accounts/${accountId}/transactions?${query.toString()}`
      : categoryId
        ? `/v1/categories/${categoryId}/transactions?${query.toString()}`
        : budgetId
          ? `/v1/budgets/${budgetId}/transactions?${query.toString()}`
          : tag
            ? `/v1/tags/${encodeURIComponent(tag)}/transactions?${query.toString()}`
            : `/v1/transactions?${query.toString()}`;

  const [result, pinnedAccount, scopeName] = await Promise.all([
    fireflyGetSafe<Paged<Transaction>>(basePath, { data: [], meta: {} }),
    // An `?account=` filter showed up as nothing but an id in the URL, so the
    // list looked mysteriously short with no visible reason.
    accountId
      ? getAccount(accountId)
          .then((response) => response.data.attributes.name)
          .catch(() => null)
      : Promise.resolve(null),
    // Same problem for a report drill-through: the header has to name what the
    // list is scoped to, or the short list looks like a bug.
    categoryId
      ? getCategory(categoryId)
          .then((response) => `category: ${response.data.attributes.name}`)
          .catch(() => null)
      : budgetId
        ? getBudget(budgetId)
            .then((response) => `budget: ${response.data.attributes.name}`)
            .catch(() => null)
        : tag
          ? Promise.resolve(`tag: ${tag}`)
          : Promise.resolve(null),
  ]);

  const data =
    search && type !== 'all'
      ? result.data.filter((group) => group.attributes.transactions[0]?.type === type)
      : result.data;

  const pagination = result.meta.pagination;
  const totals = pageTotals(data, connection.primaryCurrency);
  const savedViewsList = await listSavedViews(session.user.id, 'transactions');

  const filtered = Boolean(search) || Boolean(accountId) || Boolean(scopeName) || type !== 'all';

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            {pagination
              ? `${pagination.total.toLocaleString()} match${pagination.total === 1 ? '' : 'es'} · page ${pagination.current_page} of ${pagination.total_pages}`
              : `${data.length} shown`}
            {search
              ? ` · searching “${search}” in ${range.label.toLowerCase()}`
              : ` · ${range.label}`}
            {pinnedAccount ? ` · ${pinnedAccount}` : ''}
            {scopeName ? ` · ${scopeName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesToggle />
          <DateRangePicker label={range.label} />
          <QuickAdd today={range.end > today ? today : range.end} />
          <Button asChild size="sm">
            <Link href="/transactions/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      {/* One toolbar rather than two stacked bands. On a 390px phone the page
          previously spent ~800px on chrome before the first transaction; every
          row removed here is a row of data gained. */}
      <div className="flex flex-wrap items-center gap-2">
        <TransactionFilters
          type={type}
          search={search}
          accountId={accountId}
          scopeLabel={scopeName}
        />
        <SavedViews
          views={savedViewsList}
          currentQuery={{
            q: search || undefined,
            type: type === 'all' ? undefined : type,
            account: accountId,
          }}
        />
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-12 text-center">
            <p className="text-sm font-medium">
              {filtered
                ? 'No transactions match these filters.'
                : `Nothing recorded in ${range.label.toLowerCase()}.`}
            </p>
            <p className="text-muted-foreground text-sm">
              {filtered
                ? 'Try a wider date range, or clear the filters above.'
                : 'Pick a different date range, or add the first one.'}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/transactions/new">
                <Plus className="size-4" aria-hidden="true" />
                New transaction
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <TransactionGrid
            transactions={data}
            timezone={session.user.timezone}
            density={typeof params.density === 'string' ? params.density : 'comfortable'}
            rangeLabel={search ? `search-${search}` : range.label}
            /* Handed in as a slot so the page totals and the export button share
               one line instead of stacking into two bands — on a phone those two
               rows cost ~90px before any transaction is visible. */
            summary={
              <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="hidden font-medium tracking-wide uppercase sm:inline">
                  On this page
                </span>
                <span className="flex items-center gap-1.5">
                  In
                  <Amount
                    value={totals.inflow}
                    currency={totals.currency}
                    size="sm"
                    showSign={false}
                    tone="income"
                  />
                </span>
                <span className="flex items-center gap-1.5">
                  Out
                  <Amount
                    value={totals.outflow}
                    currency={totals.currency}
                    size="sm"
                    showSign={false}
                    tone="expense"
                  />
                </span>
                <span className="flex items-center gap-1.5">
                  Net
                  <Amount value={totals.net} currency={totals.currency} size="sm" tone="auto" />
                </span>
                <span className="hidden sm:inline">transfers excluded</span>
                {totals.otherCurrencies.length > 0 ? (
                  <span>{totals.otherCurrencies.join(', ')} not included</span>
                ) : null}
              </div>
            }
          />
        </>
      )}

      {pagination && pagination.total_pages > 1 ? (
        <Pagination
          page={pagination.current_page}
          totalPages={pagination.total_pages}
          total={pagination.total}
        />
      ) : null}
    </div>
  );
}
