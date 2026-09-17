import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBill, getBillTransactions } from '@/server/firefly/queries';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BillForm } from '../bill-form';
import { DeleteBillButton } from './delete-button';

export const metadata: Metadata = { title: 'Subscription' };

export default async function BillDetailPage({
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
  const tab = typeof query.tab === 'string' ? query.tab : 'transactions';

  let bill;
  try {
    bill = (await getBill(id)).data;
  } catch {
    notFound();
  }

  const transactions = await getBillTransactions(id, { limit: 25 });
  const a = bill.attributes;
  const currency = a.currency_code ?? connection.primaryCurrency;

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <Link
        href="/bills"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Subscriptions
      </Link>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{a.name}</h1>
          {!a.active ? <Badge variant="secondary">Inactive</Badge> : null}
        </div>
        <p className="text-muted-foreground text-sm capitalize">
          {a.repeat_freq} · {a.amount_min === a.amount_max ? '' : `${a.amount_min}–`}
          {a.amount_max} {currency}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Next expected
            </p>
            <p className="mt-1.5 text-lg font-semibold">
              {a.next_expected_match
                ? formatDate(a.next_expected_match.slice(0, 10), {
                    timezone: session.user.timezone,
                    style: 'relative',
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              First due
            </p>
            <p className="mt-1.5 text-lg font-semibold">
              {formatDate(a.date.slice(0, 10), { timezone: session.user.timezone })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Payments recorded
            </p>
            <p className="mt-1.5 text-lg font-semibold">{a.paid_dates?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <nav className="flex gap-1 border-b" aria-label="Subscription sections">
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={`/bills/${id}?tab=${entry.id}`}
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
                No matched transactions yet.
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
      ) : (
        <div className="space-y-6">
          <BillForm bill={bill} defaultCurrency={connection.primaryCurrency} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this subscription</p>
                <p className="text-muted-foreground text-sm">
                  Matched transactions are not affected.
                </p>
              </div>
              <DeleteBillButton id={id} name={a.name} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
