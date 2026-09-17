import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAccount, getAccountTransactions } from '@/server/firefly/queries';
import { fireflyGetSafe } from '@/server/firefly/api';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { toDecimal } from '@/lib/money';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { AreaTrend, type TrendPoint } from '@/components/charts/area-trend';
import { AccountForm } from '../account-form';
import { DeleteAccountButton } from './delete-button';
import type { ChartEntry } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Account' };

export default async function AccountDetailPage({
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

  let account;
  try {
    account = (await getAccount(id)).data;
  } catch {
    notFound();
  }

  const [transactions, chart] = await Promise.all([
    getAccountTransactions(id, { start: range.start, end: range.end, limit: 25 }),
    fireflyGetSafe<ChartEntry[]>(
      `/v1/chart/account/overview?start=${range.start}&end=${range.end}&accounts[]=${id}`,
      [],
    ),
  ]);

  const a = account.attributes;
  const currency = a.currency_code ?? connection.primaryCurrency;

  const points: TrendPoint[] = [];
  const series: string[] = [];
  if (chart.length > 0) {
    for (const entry of chart) series.push(entry.label);
    const dates = new Set<string>();
    for (const entry of chart) for (const date of Object.keys(entry.entries)) dates.add(date);
    for (const date of [...dates].sort()) {
      const point: TrendPoint = { date: date.slice(0, 10) };
      for (const entry of chart)
        point[entry.label] = toDecimal(entry.entries[date] ?? 0).toNumber();
      points.push(point);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6">
      <Link
        href="/accounts"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Accounts
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
            {!a.active ? <Badge variant="secondary">Archived</Badge> : null}
          </div>
          <p className="text-muted-foreground text-sm capitalize">
            {a.type}
            {a.account_role ? ` · ${a.account_role.replace(/Asset$/, '')}` : ''}
            {a.iban ? ` · ${a.iban}` : ''}
          </p>
        </div>
        <DateRangePicker label={range.label} />
      </header>

      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Current balance
            </p>
            <div className="mt-1.5">
              <Amount
                value={a.current_balance}
                currency={currency}
                decimalPlaces={a.currency_decimal_places ?? 2}
                size="xl"
                showSign={false}
                tone={toDecimal(a.current_balance).isNegative() ? 'expense' : 'neutral'}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Opening balance
            </p>
            <div className="mt-1.5">
              <Amount
                value={a.opening_balance}
                currency={currency}
                size="lg"
                showSign={false}
                tone="neutral"
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {a.opening_balance_date
                ? formatDate(a.opening_balance_date.slice(0, 10), {
                    timezone: session.user.timezone,
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Last activity
            </p>
            <p className="mt-1.5 text-lg font-semibold">
              {a.last_activity
                ? formatDate(a.last_activity.slice(0, 10), {
                    timezone: session.user.timezone,
                    style: 'relative',
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0 p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium">Balance over time</h2>
          <AreaTrend data={points} series={series} currency={currency} height={220} />
        </CardContent>
      </Card>

      <nav className="flex gap-1 border-b" aria-label="Account sections">
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={`/accounts/${id}?tab=${entry.id}&range=${range.preset}`}
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
                            {split.category_name ? ` · ${split.category_name}` : ''}
                          </p>
                        </div>
                        <Amount
                          value={split.type === 'withdrawal' ? `-${split.amount}` : split.amount}
                          currency={split.currency_code}
                          decimalPlaces={split.currency_decimal_places}
                          tone={split.type === 'transfer' ? 'transfer' : 'auto'}
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
          <AccountForm account={account} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this account</p>
                <p className="text-muted-foreground text-sm">
                  Firefly III will also remove its transactions. This cannot be undone.
                </p>
              </div>
              <DeleteAccountButton id={id} name={a.name} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={`/transactions?account=${id}&range=${range.preset}`}>
            All transactions for this account
          </Link>
        </Button>
      </div>
    </div>
  );
}
