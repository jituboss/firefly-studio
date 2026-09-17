import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBudgetLimits, getBudgets } from '@/server/firefly/queries';
import { createNotification } from '@/server/notifications';
import { resolveRangeFromParams } from '@/lib/date-range';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { abs, add, divide, subtract, toDecimal } from '@/lib/money';
import { now, toApiDate } from '@/lib/date';

export const metadata: Metadata = { title: 'Budgets' };

/** E6-01 — budget list with spent/limit/remaining and pacing. */
export default async function BudgetsPage({
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

  const [budgetsResult, limitsResult] = await Promise.all([
    getBudgets(range.start, range.end),
    getBudgetLimits(range.start, range.end),
  ]);

  const limitsByBudget = new Map<string, (typeof limitsResult.data)[number]>();
  for (const limit of limitsResult.data) {
    // Multiple limits can exist per budget across periods; keep the widest
    // overlap with the selected range as "the" limit for this list.
    limitsByBudget.set(limit.attributes.budget_id, limit);
  }

  // Ranked by how much of the limit is gone, so anything over or close to its
  // limit is the first thing on screen. Budgets with no limit sort last: there
  // is nothing to be over.
  const usageOf = (budget: (typeof budgetsResult.data)[number]) => {
    const limit = limitsByBudget.get(budget.id)?.attributes.amount;
    if (!limit || toDecimal(limit).isZero()) return -1;
    return divide(abs(budget.attributes.spent?.[0]?.sum ?? 0), limit).toNumber();
  };

  const budgets = [...budgetsResult.data].sort((a, b) => {
    const diff = usageOf(b) - usageOf(a);
    return diff !== 0 ? diff : a.attributes.name.localeCompare(b.attributes.name);
  });

  // Totals cover the connection's currency only; adding two currencies would
  // invent a number, as everywhere else in this codebase.
  const currency = connection.primaryCurrency;
  let totalLimit = toDecimal(0);
  let totalSpent = toDecimal(0);
  for (const budget of budgets) {
    const limit = limitsByBudget.get(budget.id)?.attributes;
    const spentEntry = budget.attributes.spent?.find((entry) => entry.currency_code === currency);
    if (limit && (limit.currency_code ?? currency) === currency) {
      totalLimit = add(totalLimit, limit.amount);
    }
    if (spentEntry) totalSpent = add(totalSpent, abs(spentEntry.sum));
  }
  const totalRemaining = subtract(totalLimit, totalSpent);

  await syncBudgetNotifications(session.user.id, budgetsResult.data, limitsByBudget);

  // Pacing: what fraction of the selected period has elapsed.
  const totalDays = Math.max(
    1,
    (Date.parse(`${range.end}T00:00:00Z`) - Date.parse(`${range.start}T00:00:00Z`)) / 86_400_000 +
      1,
  );
  // The user's today, not the server's: a budget's pacing is about their days.
  const today = toApiDate(now(session.user.timezone), session.user.timezone);
  const elapsedDays = Math.min(
    totalDays,
    Math.max(
      0,
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${range.start}T00:00:00Z`)) / 86_400_000 + 1,
    ),
  );
  const pacingPercent = Math.round((elapsedDays / totalDays) * 100);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground truncate text-sm">
            {budgets.length} budget{budgets.length === 1 ? '' : 's'} · {pacingPercent}% of period
            elapsed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker label={range.label} />
          <Button asChild size="sm">
            <Link href="/budgets/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      {budgets.length > 0 && !totalLimit.isZero() ? (
        <section className="grid min-w-0 gap-4 sm:grid-cols-3">
          <SummaryTile label="Budgeted" value={totalLimit.toString()} currency={currency} />
          <SummaryTile
            label="Spent"
            value={totalSpent.toString()}
            currency={currency}
            tone="expense"
            note={`${pacingPercent}% of the period elapsed`}
          />
          <SummaryTile
            label={totalRemaining.isNegative() ? 'Over budget' : 'Left to spend'}
            value={totalRemaining.abs().toString()}
            currency={currency}
            tone={totalRemaining.isNegative() ? 'expense' : 'income'}
          />
        </section>
      ) : null}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No budgets yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/budgets/new">Create your first budget</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/available-budgets">Available budgets</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/budgets/transactions-without-budget">Without budget</Link>
          </Button>
        </div>
      )}

      {budgets.length === 0 ? null : (
        <ul className="space-y-3">
          {budgets.map((budget) => {
            const b = budget.attributes;
            const spentEntry = b.spent?.[0];
            const limit = limitsByBudget.get(budget.id);
            const limitAmount = limit?.attributes.amount ?? null;
            const spentAmount = spentEntry ? abs(spentEntry.sum) : abs(0);
            const rowCurrency =
              spentEntry?.currency_code ??
              limit?.attributes.currency_code ??
              connection.primaryCurrency;

            const percentUsed = limitAmount
              ? Math.min(100, divide(spentAmount, limitAmount).times(100).toNumber())
              : null;
            const remaining = limitAmount ? subtract(limitAmount, spentAmount) : null;
            const overBudget = limitAmount
              ? toDecimal(spentAmount).greaterThan(limitAmount)
              : false;
            const behindPace =
              percentUsed !== null && percentUsed > pacingPercent + 10 && !overBudget;

            return (
              <li key={budget.id}>
                <Link href={`/budgets/${budget.id}`}>
                  <Card className="hover:bg-accent/30 min-w-0 transition-colors">
                    <CardContent className="min-w-0 space-y-2 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">{b.name}</span>
                          {!b.active ? <Badge variant="secondary">Inactive</Badge> : null}
                          {overBudget ? <Badge variant="expense">Over budget</Badge> : null}
                          {behindPace ? <Badge variant="warning">Spending fast</Badge> : null}
                        </div>
                        <div className="text-right text-sm">
                          <Amount
                            value={spentAmount}
                            currency={rowCurrency}
                            tone="expense"
                            showSign={false}
                          />
                          {limitAmount ? (
                            <span className="text-muted-foreground">
                              {' '}
                              /{' '}
                              <Amount
                                value={limitAmount}
                                currency={rowCurrency}
                                tone="neutral"
                                showSign={false}
                                size="sm"
                              />
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {limitAmount ? (
                        <>
                          <div
                            className="bg-muted h-1.5 overflow-hidden rounded-full"
                            role="progressbar"
                            aria-valuenow={percentUsed ?? 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${b.name} budget usage`}
                          >
                            <div
                              className={overBudget ? 'bg-expense h-full' : 'bg-primary h-full'}
                              style={{ width: `${percentUsed ?? 0}%` }}
                            />
                          </div>
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            {remaining && !toDecimal(remaining).isNegative() ? (
                              <>
                                <Amount
                                  value={remaining.toString()}
                                  currency={rowCurrency}
                                  size="sm"
                                  showSign={false}
                                  tone="neutral"
                                />
                                remaining
                              </>
                            ) : (
                              <>
                                Over by
                                <Amount
                                  value={abs(remaining ?? 0).toString()}
                                  currency={rowCurrency}
                                  size="sm"
                                  showSign={false}
                                  tone="expense"
                                />
                              </>
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          No limit set for this period.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  currency,
  tone = 'neutral',
  note,
}: {
  label: string;
  value: string;
  currency: string;
  tone?: 'neutral' | 'income' | 'expense';
  note?: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div className="mt-1.5 min-w-0">
          <Amount
            value={value}
            currency={currency}
            size="xl"
            compact
            showSign={false}
            tone={tone}
          />
        </div>
        {note ? <p className="text-muted-foreground mt-1 text-xs">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

/** E6-08 — emit a notification for every budget that is over its limit. */
async function syncBudgetNotifications(
  userId: string,
  budgets: Awaited<ReturnType<typeof getBudgets>>['data'],
  limitsByBudget: Map<string, Awaited<ReturnType<typeof getBudgetLimits>>['data'][number]>,
) {
  for (const budget of budgets) {
    const limit = limitsByBudget.get(budget.id);
    const spentEntry = budget.attributes.spent?.[0];
    if (!limit || !spentEntry) continue;
    const spent = toDecimal(spentEntry.sum).abs();
    const amount = toDecimal(limit.attributes.amount);
    if (spent.greaterThan(amount)) {
      await createNotification(userId, 'over_budget', {
        budgetId: budget.id,
        name: budget.attributes.name,
        spent: spent.toString(),
        limit: amount.toString(),
        currency: spentEntry.currency_code ?? limit.attributes.currency_code,
      });
    }
  }
}
