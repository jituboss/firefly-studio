import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAvailableBudgets } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { toDecimal, add, subtract, divide } from '@/lib/money';

export const metadata: Metadata = { title: 'Available budgets' };

/** E6-06 — envelope totals that roll up budget limits and spending. */
export default async function AvailableBudgetsPage({
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

  const result = await getAvailableBudgets(range.start, range.end);
  const items = [...result.data].sort((a, b) => {
    const startA = a.attributes.start ?? '';
    const startB = b.attributes.start ?? '';
    return startA.localeCompare(startB);
  });

  const totalAmount = items.reduce(
    (sum, item) => sum.plus(toDecimal(item.attributes.amount ?? 0)),
    toDecimal(0),
  );
  const totalSpentIn = items.reduce(
    (sum, item) =>
      sum.plus(
        toDecimal(
          item.attributes.spent_in_budgets?.find(() => true)?.sum ??
            item.attributes.pc_spent_in_budgets?.find(() => true)?.sum ??
            0,
        ),
      ),
    toDecimal(0),
  );
  const totalSpentOut = items.reduce(
    (sum, item) =>
      sum.plus(
        toDecimal(
          item.attributes.spent_outside_budgets?.find(() => true)?.sum ??
            item.attributes.pc_spent_outside_budgets?.find(() => true)?.sum ??
            0,
        ),
      ),
    toDecimal(0),
  );
  const remaining = subtract(
    totalAmount.toString(),
    add(totalSpentIn.toString(), totalSpentOut.toString()),
  );

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/budgets"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Budgets
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Available budgets</h1>
          <p className="text-muted-foreground truncate text-sm">
            {items.length} envelope{items.length === 1 ? '' : 's'} · {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker label={range.label} />
          <Button asChild size="sm">
            <Link href="/budgets/new">
              <Plus className="size-4" aria-hidden="true" />
              New budget
            </Link>
          </Button>
        </div>
      </header>

      {items.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Total envelope
              </p>
              <Amount
                value={totalAmount.toString()}
                currency={connection.primaryCurrency}
                size="xl"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Spent in budgets
              </p>
              <Amount
                value={totalSpentIn.toString()}
                currency={connection.primaryCurrency}
                size="xl"
                tone="expense"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Spent outside budgets
              </p>
              <Amount
                value={totalSpentOut.toString()}
                currency={connection.primaryCurrency}
                size="xl"
                tone="expense"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Remaining
              </p>
              <Amount
                value={remaining.toString()}
                currency={connection.primaryCurrency}
                size="xl"
                tone={toDecimal(remaining).isNegative() ? 'expense' : 'income'}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No available budget periods found.</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Set budget limits to see envelope totals here.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/budgets">Back to budgets</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-border divide-y">
              {items.map((item) => {
                const a = item.attributes;
                const currency = a.currency_code ?? connection.primaryCurrency;
                const amount = a.amount ?? '0';
                const spentIn =
                  a.spent_in_budgets?.find((s) => s.currency_code === currency)?.sum ??
                  a.pc_spent_in_budgets?.find(() => true)?.sum ??
                  '0';
                const spentOut =
                  a.spent_outside_budgets?.find((s) => s.currency_code === currency)?.sum ??
                  a.pc_spent_outside_budgets?.find(() => true)?.sum ??
                  '0';
                const envelopeSpent = add(spentIn, spentOut);
                const envelopeRemaining = subtract(amount, envelopeSpent);
                const percentUsed = toDecimal(amount).isZero()
                  ? 0
                  : Math.min(100, divide(envelopeSpent, amount).times(100).toNumber());

                return (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-medium">
                          {a.start && a.end
                            ? `${formatDate(a.start.slice(0, 10), { timezone: session.user.timezone })} – ${formatDate(a.end.slice(0, 10), { timezone: session.user.timezone })}`
                            : 'No period'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {a.currency_name ?? currency}
                        </p>
                      </div>
                      <div className="text-right">
                        <Amount
                          value={envelopeRemaining.toString()}
                          currency={currency}
                          tone={toDecimal(envelopeRemaining).isNegative() ? 'expense' : 'income'}
                        />
                        <p className="text-muted-foreground text-xs">
                          {toDecimal(envelopeSpent).isZero()
                            ? 'No spend'
                            : `${percentUsed.toFixed(0)}% used`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-valuenow={percentUsed}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Envelope usage"
                      >
                        <div
                          className={percentUsed > 100 ? 'bg-expense h-full' : 'bg-primary h-full'}
                          style={{ width: `${Math.min(100, percentUsed)}%` }}
                        />
                      </div>
                      <Amount
                        value={amount}
                        currency={currency}
                        size="sm"
                        tone="neutral"
                        showSign={false}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
