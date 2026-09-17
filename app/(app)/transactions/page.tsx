import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, fireflyGetSafe } from '@/server/firefly/api';
import { resolveRangeFromParams } from '@/lib/date-range';
import { DateRangePicker } from '@/components/date-range-picker';
import { HideBalancesToggle } from '@/components/hide-balances';
import { TransactionFilters } from './filters';
import { TransactionTable } from './table';
import { Pagination } from './pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Paged, Transaction } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Transactions' };

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
  const basePath = search
    ? `/v1/search/transactions?query=${encodeURIComponent(search)}&page=${page}&limit=50`
    : accountId
      ? `/v1/accounts/${accountId}/transactions?${query.toString()}`
      : `/v1/transactions?${query.toString()}`;

  const result = await fireflyGetSafe<Paged<Transaction>>(basePath, { data: [], meta: {} });
  const pagination = result.meta.pagination;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            {pagination
              ? `${pagination.total.toLocaleString()} total · page ${pagination.current_page} of ${pagination.total_pages}`
              : `${result.data.length} shown`}
            {search ? ` · searching “${search}”` : ` · ${range.label}`}
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

      <TransactionFilters type={type} search={search} accountId={accountId} />

      {result.data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No transactions match these filters.</p>
          </CardContent>
        </Card>
      ) : (
        <TransactionTable
          transactions={result.data}
          timezone={session.user.timezone}
          density={typeof params.density === 'string' ? params.density : 'comfortable'}
        />
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
