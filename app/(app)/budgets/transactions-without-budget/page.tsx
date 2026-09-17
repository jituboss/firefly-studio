import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getTransactionsWithoutBudget } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { Pagination } from '@/app/(app)/transactions/pagination';

export const metadata: Metadata = { title: 'Transactions without budget' };

/** E6-05 — list transactions that are not assigned to any budget. */
export default async function TransactionsWithoutBudgetPage({
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

  const result = await getTransactionsWithoutBudget({
    start: range.start,
    end: range.end,
    page,
    limit: 25,
  });
  const pagination = result.meta.pagination;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/budgets"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Budgets
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions without budget</h1>
          <p className="text-muted-foreground truncate text-sm">
            {pagination
              ? `${pagination.total.toLocaleString()} total · page ${pagination.current_page} of ${pagination.total_pages}`
              : `${result.data.length} shown`}
            {' · '}
            {range.label}
          </p>
        </div>
        <DateRangePicker label={range.label} />
      </header>

      {result.data.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">
              Every transaction in this period has a budget.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-border divide-y">
              {result.data.map((group) => {
                const split = group.attributes.transactions[0];
                if (!split) return null;
                const outgoing = split.type === 'withdrawal';
                return (
                  <li key={group.id}>
                    <Link
                      href={`/transactions/${group.id}`}
                      className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{split.description}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {formatDate(split.date.slice(0, 10), {
                            timezone: session.user.timezone,
                          })}
                          {split.budget_name ? ` · ${split.budget_name}` : ''}
                        </p>
                      </div>
                      <Amount
                        value={outgoing ? `-${split.amount}` : split.amount}
                        currency={split.currency_code}
                        decimalPlaces={split.currency_decimal_places}
                        tone={
                          outgoing ? 'expense' : split.type === 'deposit' ? 'income' : 'neutral'
                        }
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
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
