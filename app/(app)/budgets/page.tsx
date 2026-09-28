import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Wallet } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/error-state';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, readFailure } from '@/server/firefly/api';
import { getBudgetLimits, getBudgets, getExchangeRates } from '@/server/firefly/queries';
import { createNotification } from '@/server/notifications';
import { resolveRangeFromParams } from '@/lib/date-range';
import { Amount } from '@/components/ui/amount';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { abs, add, divide, subtract, toDecimal } from '@/lib/money';
import { now, toApiDate } from '@/lib/date';
import { classifyError } from '@/lib/error-taxonomy';
import { buildRateTable, convertSpent, type ConvertedSpent } from '@/lib/budget-currency';

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

  const [budgetsResult, limitsResult, ratesResult] = await Promise.all([
    getBudgets(range.start, range.end),
    getBudgetLimits(range.start, range.end),
    getExchangeRates(),
  ]);

  const primaryCurrency = connection.primaryCurrency;
  const rateTable = buildRateTable(ratesResult.data);

  // Index limits by budget id. Prefer the limit in the primary currency;
  // fall back to the first available. All spending is converted to the
  // primary currency, so we display against the primary-currency limit.
  const limitForBudget = new Map<string, (typeof limitsResult.data)[number]>();
  for (const limit of limitsResult.data) {
    const bid = limit.attributes.budget_id;
    const cur = limit.attributes.currency_code ?? primaryCurrency;
    const existing = limitForBudget.get(bid);
    if (!existing) {
      limitForBudget.set(bid, limit);
    } else {
      const existingCur = existing.attributes.currency_code ?? primaryCurrency;
      if (cur === primaryCurrency && existingCur !== primaryCurrency) {
        limitForBudget.set(bid, limit);
      } else if (cur === existingCur && limit.attributes.start > existing.attributes.start) {
        limitForBudget.set(bid, limit);
      }
    }
  }

  // Pre-compute converted spent for each budget — all in the primary currency.
  const convertedByBudget = new Map<string, ConvertedSpent>();
  for (const budget of budgetsResult.data) {
    convertedByBudget.set(
      budget.id,
      convertSpent(budget.attributes.spent, primaryCurrency, rateTable),
    );
  }

  // Ranked by how much of the limit is gone, so anything over or close to its
  // limit is the first thing on screen. Budgets with no limit sort last.
  const usageOf = (budget: (typeof budgetsResult.data)[number]) => {
    const limit = limitForBudget.get(budget.id)?.attributes.amount;
    if (!limit || toDecimal(limit).isZero()) return -1;
    const converted = convertedByBudget.get(budget.id);
    if (!converted) return -1;
    return divide(converted.amount, limit).toNumber();
  };

  const budgets = [...budgetsResult.data].sort((a, b) => {
    const diff = usageOf(b) - usageOf(a);
    return diff !== 0 ? diff : a.attributes.name.localeCompare(b.attributes.name);
  });

  // Totals in the primary currency — all spending is converted, so one set of
  // summary tiles is correct.
  let totalLimit = toDecimal(0);
  let totalSpent = toDecimal(0);
  for (const budget of budgets) {
    const limit = limitForBudget.get(budget.id);
    if (limit && (limit.attributes.currency_code ?? primaryCurrency) === primaryCurrency) {
      totalLimit = add(totalLimit, limit.attributes.amount);
    }
    const converted = convertedByBudget.get(budget.id);
    if (converted) totalSpent = add(totalSpent, converted.amount);
  }
  const totalRemaining = subtract(totalLimit, totalSpent);
  const hasConversion = [...convertedByBudget.values()].some(
    (c) => c.convertedCurrencies.length > 0,
  );

  await syncBudgetNotifications(
    session.user.id,
    budgetsResult.data,
    limitForBudget,
    primaryCurrency,
    convertedByBudget,
  );

  // Pacing: what fraction of the selected period has elapsed.
  const totalDays = Math.max(
    1,
    (Date.parse(`${range.end}T00:00:00Z`) - Date.parse(`${range.start}T00:00:00Z`)) / 86_400_000 +
      1,
  );
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
          <SummaryTile label="Budgeted" value={totalLimit.toString()} currency={primaryCurrency} />
          <SummaryTile
            label="Spent"
            value={totalSpent.toString()}
            currency={primaryCurrency}
            tone="expense"
            note={`${pacingPercent}% of the period elapsed`}
          />
          <SummaryTile
            label={totalRemaining.isNegative() ? 'Over budget' : 'Left to spend'}
            value={totalRemaining.abs().toString()}
            currency={primaryCurrency}
            tone={totalRemaining.isNegative() ? 'expense' : 'income'}
          />
        </section>
      ) : null}

      {hasConversion && rateTable.asOf ? (
        <p className="text-muted-foreground text-xs">
          Foreign-currency spending converted to {primaryCurrency} using exchange rates as of{' '}
          {rateTable.asOf}.
        </p>
      ) : null}

      {budgets.length === 0 ? (
        readFailure() ? (
          <ErrorState kind={classifyError(readFailure())} />
        ) : (
          <EmptyState
            icon={Wallet}
            title="No budgets yet"
            description="A budget caps what you plan to spend on something over a period, and this page then shows how much of it is left."
            action={{ label: 'Create your first budget', href: '/budgets/new' }}
          />
        )
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
            const limit = limitForBudget.get(budget.id);
            const limitAmount = limit?.attributes.amount ?? null;
            const converted = convertedByBudget.get(budget.id);
            const spentAmount = converted ? abs(converted.amount) : abs(0);

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
                            currency={primaryCurrency}
                            tone="expense"
                            showSign={false}
                          />
                          {limitAmount ? (
                            <span className="text-muted-foreground">
                              {' '}
                              /{' '}
                              <Amount
                                value={limitAmount}
                                currency={primaryCurrency}
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
                          <ProgressBar
                            value={percentUsed ?? 0}
                            over={overBudget}
                            size="sm"
                            label={`${b.name} budget usage`}
                          />
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            {remaining && !toDecimal(remaining).isNegative() ? (
                              <>
                                <Amount
                                  value={remaining.toString()}
                                  currency={primaryCurrency}
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
                                  currency={primaryCurrency}
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
  limitForBudget: Map<string, Awaited<ReturnType<typeof getBudgetLimits>>['data'][number]>,
  primaryCurrency: string,
  convertedByBudget: Map<string, ConvertedSpent>,
) {
  for (const budget of budgets) {
    const limit = limitForBudget.get(budget.id);
    if (!limit) continue;
    const converted = convertedByBudget.get(budget.id);
    if (!converted) continue;
    const spent = toDecimal(converted.amount);
    const amount = toDecimal(limit.attributes.amount);
    if (spent.greaterThan(amount)) {
      await createNotification(userId, 'over_budget', {
        budgetId: budget.id,
        name: budget.attributes.name,
        spent: spent.toString(),
        limit: amount.toString(),
        currency: primaryCurrency,
      });
    }
  }
}
