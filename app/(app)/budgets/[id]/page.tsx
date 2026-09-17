import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getBudget,
  getBudgetLimitsForBudget,
  getBudgetTransactions,
} from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { BudgetForm } from '../budget-form';
import { LimitsPanel } from './limits-panel';
import { DeleteBudgetButton } from './delete-button';

export const metadata: Metadata = { title: 'Budget' };

export default async function BudgetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { id } = await params;
  const query = await searchParams;
  const range = resolveRangeFromParams(query, session.user.timezone);
  const tab = typeof query.tab === 'string' ? query.tab : 'transactions';

  let budget;
  try {
    budget = (await getBudget(id, range.start, range.end)).data;
  } catch {
    notFound();
  }

  const [limits, transactions] = await Promise.all([
    getBudgetLimitsForBudget(id),
    getBudgetTransactions(id, { start: range.start, end: range.end, limit: 25 }),
  ]);

  const a = budget.attributes;
  const spent = a.spent?.[0];
  const currency = spent?.currency_code ?? connection.primaryCurrency;

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
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{a.name}</h1>
            {!a.active ? <Badge variant="secondary">Inactive</Badge> : null}
          </div>
        </div>
        <DateRangePicker label={range.label} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Spent this period
            </p>
            <div className="mt-1.5">
              {spent ? (
                <Amount value={spent.sum} currency={spent.currency_code} size="xl" tone="expense" />
              ) : (
                <span className="text-muted-foreground text-sm">Nothing spent</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Auto-budget
            </p>
            <p className="mt-1.5 text-lg font-semibold capitalize">
              {a.auto_budget_type
                ? `${a.auto_budget_type} · ${a.auto_budget_amount} / ${a.auto_budget_period}`
                : 'Off'}
            </p>
          </CardContent>
        </Card>
      </div>

      <nav className="flex gap-1 border-b" aria-label="Budget sections">
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'limits', label: 'Limits' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={`/budgets/${id}?tab=${entry.id}&range=${range.preset}`}
            className={`border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === entry.id
                ? 'border-primary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {tab === 'transactions' ? (
        <Card>
          <CardContent className="p-0">
            {transactions.data.length === 0 ? (
              <p className="text-muted-foreground p-10 text-center text-sm">
                No transactions in this period.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {transactions.data.map((group) => {
                  const split = group.attributes.transactions[0];
                  if (!split) return null;
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
                          </p>
                        </div>
                        <Amount
                          value={`-${split.amount}`}
                          currency={split.currency_code}
                          decimalPlaces={split.currency_decimal_places}
                          tone="expense"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : tab === 'limits' ? (
        <LimitsPanel
          budgetId={id}
          limits={limits.data}
          currency={currency}
          timezone={session.user.timezone}
        />
      ) : (
        <div className="space-y-6">
          <BudgetForm budget={budget} defaultCurrency={connection.primaryCurrency} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this budget</p>
                <p className="text-muted-foreground text-sm">
                  Transactions keep their history but lose this budget.
                </p>
              </div>
              <DeleteBudgetButton id={id} name={a.name} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
