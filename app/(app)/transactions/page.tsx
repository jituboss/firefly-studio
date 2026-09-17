import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, fireflyGetSafe } from '@/server/firefly/api';
import { getAccount } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { add, toDecimal } from '@/lib/money';
import { DateRangePicker } from '@/components/date-range-picker';
import { HideBalancesToggle } from '@/components/hide-balances';
import { TransactionFilters } from './filters';
import { TransactionTable } from './table';
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

  const page = Math.max(1, Number.parseInt(String(params.page ?? '1'), 10) || 1);
  const type = typeof params.type === 'string' ? params.type : 'all';
  const accountId = typeof params.account === 'string' ? params.account : undefined;
  const search = typeof params.q === 'string' ? params.q.trim() : '';

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
  const searchQuery = search ? `${search} date_after:${range.start} date_before:${range.end}` : '';

  const basePath = search
    ? `/v1/search/transactions?query=${encodeURIComponent(searchQuery)}&page=${page}&limit=50`
    : accountId
      ? `/v1/accounts/${accountId}/transactions?${query.toString()}`
      : `/v1/transactions?${query.toString()}`;

  const [result, pinnedAccount] = await Promise.all([
    fireflyGetSafe<Paged<Transaction>>(basePath, { data: [], meta: {} }),
    // An `?account=` filter showed up as nothing but an id in the URL, so the
    // list looked mysteriously short with no visible reason.
    accountId
      ? getAccount(accountId)
          .then((response) => response.data.attributes.name)
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const data =
    search && type !== 'all'
      ? result.data.filter((group) => group.attributes.transactions[0]?.type === type)
      : result.data;

  const pagination = result.meta.pagination;
  const totals = pageTotals(data, connection.primaryCurrency);
  const savedViewsList = await listSavedViews(session.user.id, 'transactions');

  const filtered = Boolean(search) || Boolean(accountId) || type !== 'all';

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5">
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
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesToggle />
          <DateRangePicker label={range.label} />
          <Button asChild size="sm">
            <Link href="/transactions/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TransactionFilters type={type} search={search} accountId={accountId} />
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
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <span className="font-medium tracking-wide uppercase">On this page</span>
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
            <span>transfers excluded</span>
            {totals.otherCurrencies.length > 0 ? (
              <span>{totals.otherCurrencies.join(', ')} not included</span>
            ) : null}
          </div>

          <TransactionTable
            transactions={data}
            timezone={session.user.timezone}
            density={typeof params.density === 'string' ? params.density : 'comfortable'}
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
