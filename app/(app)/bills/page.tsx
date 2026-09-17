import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBills } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  const active = bills.filter((b) => b.attributes.active);
  const inactive = bills.filter((b) => !b.attributes.active);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            {bills.length} bill{bills.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/bills/new">
            <Plus className="size-4" aria-hidden="true" />
            New
          </Link>
        </Button>
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
