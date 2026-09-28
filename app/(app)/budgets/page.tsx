import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Wallet } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/error-state';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, readFailure } from '@/server/firefly/api';
import { getBudgetLimits, getBudgets } from '@/server/firefly/queries';
import { createNotification } from '@/server/notifications';
import { resolveRangeFromParams } from '@/lib/date-range';
import { Amount } from '@/components/ui/amount';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { abs, add, divide, subtract, toDecimal, type Decimal } from '@/lib/money';
import { now, toApiDate } from '@/lib/date';
import { classifyError } from '@/lib/error-taxonomy';

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

  // Index limits by budget id → currency → limit, so a budget with limits in
  // multiple currencies keeps all of them. When only one currency is in play
  // (the common case) the inner map has a single entry.
  // Capture before closures — TypeScript cannot keep the non-null narrowing
  // from the early `redirect` into nested function scopes.
  const primaryCurrency = connection.primaryCurrency;

  const limitsByBudgetAndCurrency = new Map<
    string,
    Map<string, (typeof limitsResult.data)[number]>
  >();
  for (const limit of limitsResult.data) {
    const bid = limit.attributes.budget_id;
    const cur = limit.attributes.currency_code ?? primaryCurrency;
    let inner = limitsByBudgetAndCurrency.get(bid);
    if (!inner) {
      inner = new Map();
      limitsByBudgetAndCurrency.set(bid, inner);
    }
    // If multiple limits exist for the same budget+currency (overlapping
    // periods), keep the one with the latest start — it is the active one.
    const existing = inner.get(cur);
    if (!existing || limit.attributes.start > existing.attributes.start) {
      inner.set(cur, limit);
    }
  }

  /** Pick the limit for a budget that matches a spent entry's currency. */
  function limitFor(
    budget: (typeof budgetsResult.data)[number],
    spentCurrency: string | undefined,
  ): (typeof limitsResult.data)[number] | undefined {
    const inner = limitsByBudgetAndCurrency.get(budget.id);
    if (!inner) return undefined;
    // Prefer a limit in the spent currency; fall back to the primary currency;
    // fall back to the first available.
    if (spentCurrency && inner.has(spentCurrency)) return inner.get(spentCurrency)!;
    if (inner.has(primaryCurrency)) return inner.get(primaryCurrency)!;
    return inner.values().next().value;
  }

  // Ranked by how much of the limit is gone, so anything over or close to its
  // limit is the first thing on screen. Budgets with no limit sort last: there
  // is nothing to be over.
  const usageOf = (budget: (typeof budgetsResult.data)[number]) => {
    const spentEntry = budget.attributes.spent?.[0];
    const limit = limitFor(budget, spentEntry?.currency_code)?.attributes.amount;
    if (!limit || toDecimal(limit).isZero()) return -1;
    return divide(abs(spentEntry?.sum ?? 0), limit).toNumber();
  };

  const budgets = [...budgetsResult.data].sort((a, b) => {
    const diff = usageOf(b) - usageOf(a);
    return diff !== 0 ? diff : a.attributes.name.localeCompare(b.attributes.name);
  });

  // Totals grouped per currency — adding across currencies would invent a
  // number. Each currency that has at least one limit or one spent entry gets
  // its own set of summary tiles.
  const totalsByCurrency = new Map<string, { limit: Decimal; spent: Decimal }>();
  for (const budget of budgets) {
    for (const spentEntry of budget.attributes.spent ?? []) {
      const cur = spentEntry.currency_code;
      const limit = limitFor(budget, cur)?.attributes;
      const limitCur = limit?.currency_code ?? primaryCurrency;
      // Accumulate the spent amount under its own currency.
      const spentTot = totalsByCurrency.get(cur) ?? { limit: toDecimal(0), spent: toDecimal(0) };
      spentTot.spent = add(spentTot.spent, abs(spentEntry.sum));
      // Accumulate the limit under the limit's currency, but only once per
      // budget per currency (a budget with two limits in BDT should not
      // double-count). We track that by only adding the limit when the spent
      // currency matches the limit currency — the limit for a different
      // currency will be picked up when we iterate that currency's spent.
      if (limit && limitCur === cur) {
        spentTot.limit = add(spentTot.limit, limit.amount);
      }
      totalsByCurrency.set(cur, spentTot);
      // Also ensure the limit's currency has an entry even if no spent entry
      // exists in that currency yet (budgeted but nothing spent).
      if (limit && limitCur !== cur) {
        const limitTot = totalsByCurrency.get(limitCur) ?? {
          limit: toDecimal(0),
          spent: toDecimal(0),
        };
        limitTot.limit = add(limitTot.limit, limit.amount);
        totalsByCurrency.set(limitCur, limitTot);
      }
    }
    // A budget with a limit but no spent entries at all still needs its limit
    // counted in the totals.
    if (!budget.attributes.spent || budget.attributes.spent.length === 0) {
      const inner = limitsByBudgetAndCurrency.get(budget.id);
      if (inner) {
        for (const [cur, limit] of inner) {
          const tot = totalsByCurrency.get(cur) ?? { limit: toDecimal(0), spent: toDecimal(0) };
          tot.limit = add(tot.limit, limit.attributes.amount);
          totalsByCurrency.set(cur, tot);
        }
      }
    }
  }

  await syncBudgetNotifications(session.user.id, budgetsResult.data, limitFor, primaryCurrency);

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

      {budgets.length > 0 && totalsByCurrency.size > 0 ? (
        <div className="space-y-4">
          {[...totalsByCurrency.entries()].map(([currency, totals]) => {
            const totalRemaining = subtract(totals.limit, totals.spent);
            return (
              <section
                key={currency}
                className="grid min-w-0 gap-4 sm:grid-cols-3"
                aria-label={`${currency} summary`}
              >
                <SummaryTile
                  label={totalsByCurrency.size > 1 ? `Budgeted (${currency})` : 'Budgeted'}
                  value={totals.limit.toString()}
                  currency={currency}
                />
                <SummaryTile
                  label={totalsByCurrency.size > 1 ? `Spent (${currency})` : 'Spent'}
                  value={totals.spent.toString()}
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
            );
          })}
        </div>
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
            // Pick the spent entry whose currency matches a limit for this
            // budget, preferring the primary currency. This prevents a USD
            // spent entry from being shown against a BDT limit.
            const spentEntry = b.spent?.[0];
            const limit = limitFor(budget, spentEntry?.currency_code);
            const limitAmount = limit?.attributes.amount ?? null;
            const spentAmount = spentEntry ? abs(spentEntry.sum) : abs(0);
            const rowCurrency =
              spentEntry?.currency_code ?? limit?.attributes.currency_code ?? primaryCurrency;

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
  limitFor: (
    budget: Awaited<ReturnType<typeof getBudgets>>['data'][number],
    spentCurrency: string | undefined,
  ) => Awaited<ReturnType<typeof getBudgetLimits>>['data'][number] | undefined,
  primaryCurrency: string,
) {
  for (const budget of budgets) {
    const spentEntry = budget.attributes.spent?.[0];
    const limit = limitFor(budget, spentEntry?.currency_code);
    if (!limit || !spentEntry) continue;
    // Only compare amounts in the same currency — a USD spend against a BDT
    // limit is not "over budget", it is a currency mismatch.
    const spentCur = spentEntry.currency_code;
    const limitCur = limit.attributes.currency_code ?? primaryCurrency;
    if (spentCur !== limitCur) continue;
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
