import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBills } from '@/server/firefly/queries';
import { createNotification } from '@/server/notifications';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toDecimal, divide, multiply, add } from '@/lib/money';

export const metadata: Metadata = { title: 'Subscriptions' };

/** E8-01 — bill list. */
export default async function BillsPage({
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

  const result = await getBills(range.start, range.end);
  const bills = [...result.data].sort((a, b) => a.attributes.name.localeCompare(b.attributes.name));
  await syncBillNotifications(session.user.id, bills);
  const active = bills.filter((b) => b.attributes.active);
  const inactive = bills.filter((b) => !b.attributes.active);

  // E8-05 — annualised cost summary for active subscriptions.
  const annualisedByBill = new Map(
    active.map((bill) => {
      const b = bill.attributes;
      const occurrencesPerYear: Record<string, number> = {
        weekly: 52,
        monthly: 12,
        quarterly: 4,
        'half-year': 2,
        yearly: 1,
      };
      const base = occurrencesPerYear[b.repeat_freq] ?? 12;
      const adjusted = divide(base, (b.skip ?? 0) + 1);
      const cost =
        b.amount_min === b.amount_max ? b.amount_max : divide(add(b.amount_min, b.amount_max), 2);
      const annualised = multiply(cost, adjusted.toNumber()).toString();
      return [bill.id, { annualised, currency: b.currency_code ?? connection.primaryCurrency }];
    }),
  );
  const rankedActive = [...active].sort((a, b) => {
    const aa = toDecimal(annualisedByBill.get(a.id)?.annualised ?? 0).negated();
    const bb = toDecimal(annualisedByBill.get(b.id)?.annualised ?? 0).negated();
    return aa.comparedTo(bb);
  });
  const topExpensive = rankedActive.slice(0, 5);
  const totalAnnualised = [...annualisedByBill.values()].reduce(
    (sum, { annualised }) => sum.plus(toDecimal(annualised)),
    toDecimal(0),
  );

  // Cross-currency totals are naive: we sum the numeric values without FX
  // conversion. A single-currency ledger is accurate; multi-currency ledgers
  // should revisit this when M5 reporting adds currency handling.

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            {bills.length} bill{bills.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/bills/calendar">Calendar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/bills/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No subscriptions yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/bills/new">Add your first subscription</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Annualised cost
                  </p>
                  <div className="mt-1.5">
                    <Amount
                      value={totalAnnualised.toString()}
                      currency={connection.primaryCurrency}
                      size="xl"
                      tone="expense"
                      showSign={false}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Across {active.length} active subscription{active.length === 1 ? '' : 's'} ·
                    naive cross-currency sum
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Most expensive
                  </p>
                  <div className="mt-2 space-y-2">
                    {topExpensive.map((bill) => {
                      const info = annualisedByBill.get(bill.id)!;
                      return (
                        <div key={bill.id} className="flex items-center justify-between gap-3">
                          <Link
                            href={`/bills/${bill.id}`}
                            className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                          >
                            {bill.attributes.name}
                          </Link>
                          <Amount
                            value={info.annualised}
                            currency={info.currency}
                            size="sm"
                            tone="expense"
                            showSign={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {[
            { label: 'Active', items: active },
            { label: 'Inactive', items: inactive },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.label} className="space-y-2">
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-border divide-y">
                      {group.items.map((bill) => {
                        const b = bill.attributes;
                        const paid = (b.paid_dates?.length ?? 0) > 0;
                        return (
                          <li key={bill.id}>
                            <Link
                              href={`/bills/${bill.id}`}
                              className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{b.name}</p>
                                <p className="text-muted-foreground truncate text-xs capitalize">
                                  {b.repeat_freq}
                                  {b.next_expected_match
                                    ? ` · next ${formatDate(b.next_expected_match.slice(0, 10), { timezone: session.user.timezone, style: 'relative' })}`
                                    : ''}
                                </p>
                              </div>
                              {paid ? <Badge variant="income">Paid</Badge> : null}
                              <Amount
                                value={b.amount_min === b.amount_max ? b.amount_max : b.amount_max}
                                currency={b.currency_code ?? connection.primaryCurrency}
                                showSign={false}
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            ))}
        </>
      )}
    </div>
  );
}

/** E8-06 — emit notifications for active bills whose next expected match is in
 *  the past and which have no paid_dates in the current range. */
async function syncBillNotifications(
  userId: string,
  bills: Awaited<ReturnType<typeof getBills>>['data'],
) {
  const today = new Date().toISOString().slice(0, 10);
  for (const bill of bills) {
    const b = bill.attributes;
    if (!b.active || !b.next_expected_match) continue;
    const next = b.next_expected_match.slice(0, 10);
    if (next > today) continue;
    if ((b.paid_dates?.length ?? 0) > 0) continue;
    await createNotification(userId, 'unpaid_bill', {
      billId: bill.id,
      name: b.name,
      nextExpected: next,
      currency: b.currency_code,
    });
  }
}
