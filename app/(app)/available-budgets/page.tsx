import * as React from 'react';
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
import { toDecimal, add, subtract, divide, abs } from '@/lib/money';
import type { AvailableBudget } from '@/server/firefly/queries';

export const metadata: Metadata = { title: 'Available budgets' };

interface CurrencyBreakdown {
  amount: string;
  spentIn: string;
  spentOut: string;
  remaining: string;
}

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

  const totalsByCurrency = new Map<string, CurrencyBreakdown>();
  const hasPc = items.every((item) => item.attributes.pc_amount !== null);

  for (const item of items) {
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
    const spent = add(abs(spentIn), abs(spentOut)).toString();
    const remaining = subtract(amount, spent);

    const existing = totalsByCurrency.get(currency);
    if (existing) {
      totalsByCurrency.set(currency, {
        amount: add(existing.amount, amount).toString(),
        spentIn: add(existing.spentIn, abs(spentIn)).toString(),
        spentOut: add(existing.spentOut, abs(spentOut)).toString(),
        remaining: add(existing.remaining, remaining).toString(),
      });
    } else {
      totalsByCurrency.set(currency, {
        amount,
        spentIn: abs(spentIn).toString(),
        spentOut: abs(spentOut).toString(),
        remaining: remaining.toString(),
      });
    }
  }

  const primaryCurrency = items[0]?.attributes.primary_currency_code ?? connection.primaryCurrency;
  const primaryTotals: CurrencyBreakdown | null = hasPc
    ? {
        amount: items
          .reduce((sum, item) => sum.plus(toDecimal(item.attributes.pc_amount ?? 0)), toDecimal(0))
          .toString(),
        spentIn: items
          .reduce(
            (sum, item) =>
              sum.plus(
                toDecimal(
                  item.attributes.pc_spent_in_budgets?.find(() => true)?.sum ??
                    item.attributes.spent_in_budgets?.find(
                      (s) => s.currency_code === item.attributes.currency_code,
                    )?.sum ??
                    0,
                ).abs(),
              ),
            toDecimal(0),
          )
          .toString(),
        spentOut: items
          .reduce(
            (sum, item) =>
              sum.plus(
                toDecimal(
                  item.attributes.pc_spent_outside_budgets?.find(() => true)?.sum ??
                    item.attributes.spent_outside_budgets?.find(
                      (s) => s.currency_code === item.attributes.currency_code,
                    )?.sum ??
                    0,
                ).abs(),
              ),
            toDecimal(0),
          )
          .toString(),
        remaining: subtract(
          items
            .reduce(
              (sum, item) => sum.plus(toDecimal(item.attributes.pc_amount ?? 0)),
              toDecimal(0),
            )
            .toString(),
          add(
            items
              .reduce(
                (sum, item) =>
                  sum.plus(
                    toDecimal(
                      item.attributes.pc_spent_in_budgets?.find(() => true)?.sum ?? 0,
                    ).abs(),
                  ),
                toDecimal(0),
              )
              .toString(),
            items
              .reduce(
                (sum, item) =>
                  sum.plus(
                    toDecimal(
                      item.attributes.pc_spent_outside_budgets?.find(() => true)?.sum ?? 0,
                    ).abs(),
                  ),
                toDecimal(0),
              )
              .toString(),
          ),
        ).toString(),
      }
    : null;

  const totals = primaryTotals
    ? { [primaryCurrency]: primaryTotals }
    : Object.fromEntries(totalsByCurrency);
  const totalCurrencies = Object.keys(totals);

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
          {totalCurrencies.map((currency) => {
            const t = totals[currency]!;
            return (
              <React.Fragment key={currency}>
                <Card className="min-w-0 overflow-hidden">
                  <CardContent className="min-w-0 p-4">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Total envelope
                    </p>
                    <Amount
                      value={t.amount}
                      currency={currency}
                      size="xl"
                      compact
                      className="block truncate"
                    />
                  </CardContent>
                </Card>
                <Card className="min-w-0 overflow-hidden">
                  <CardContent className="min-w-0 p-4">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Spent in budgets
                    </p>
                    <Amount
                      value={t.spentIn}
                      currency={currency}
                      size="xl"
                      tone="expense"
                      showSign={false}
                      compact
                      className="block truncate"
                    />
                  </CardContent>
                </Card>
                <Card className="min-w-0 overflow-hidden">
                  <CardContent className="min-w-0 p-4">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Spent outside budgets
                    </p>
                    <Amount
                      value={t.spentOut}
                      currency={currency}
                      size="xl"
                      tone="expense"
                      showSign={false}
                      compact
                      className="block truncate"
                    />
                  </CardContent>
                </Card>
                <Card className="min-w-0 overflow-hidden">
                  <CardContent className="min-w-0 p-4">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Remaining
                    </p>
                    <Amount
                      value={t.remaining}
                      currency={currency}
                      size="xl"
                      tone={toDecimal(t.remaining).isNegative() ? 'expense' : 'income'}
                      compact
                      className="block truncate"
                    />
                  </CardContent>
                </Card>
              </React.Fragment>
            );
          })}
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
              {items.map((item) => (
                <EnvelopeRow key={item.id} item={item} timezone={session.user.timezone} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EnvelopeRow({ item, timezone }: { item: AvailableBudget; timezone: string }) {
  const a = item.attributes;
  const currency = a.currency_code ?? 'EUR';
  const amount = a.amount ?? '0';

  const spentInRaw =
    a.spent_in_budgets?.find((s) => s.currency_code === currency)?.sum ??
    a.pc_spent_in_budgets?.find(() => true)?.sum ??
    '0';
  const spentOutRaw =
    a.spent_outside_budgets?.find((s) => s.currency_code === currency)?.sum ??
    a.pc_spent_outside_budgets?.find(() => true)?.sum ??
    '0';

  const spentIn = abs(spentInRaw);
  const spentOut = abs(spentOutRaw);
  const envelopeSpent = add(spentIn, spentOut).toString();
  const envelopeRemaining = subtract(amount, envelopeSpent);
  const percentUsed = toDecimal(amount).isZero()
    ? 0
    : divide(envelopeSpent, amount).times(100).toNumber();
  const overBudget = percentUsed > 100;

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-medium">
            {a.start && a.end
              ? `${formatDate(a.start.slice(0, 10), { timezone })} – ${formatDate(a.end.slice(0, 10), { timezone })}`
              : 'No period'}
          </p>
          <p className="text-muted-foreground truncate text-xs">{a.currency_name ?? currency}</p>
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
              : `${Math.abs(percentUsed).toFixed(0)}% used`}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div
          className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={Math.min(100, percentUsed)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Envelope usage"
        >
          <div
            className={overBudget ? 'bg-expense h-full' : 'bg-primary h-full'}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
        <Amount value={amount} currency={currency} size="sm" tone="neutral" showSign={false} />
      </div>
    </li>
  );
}
