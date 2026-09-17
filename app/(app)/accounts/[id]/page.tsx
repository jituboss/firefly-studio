import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getAccount,
  getAccountBalanceChart,
  getAccountExpenseInsight,
  getAccountIncomeInsight,
  getAccountTransactions,
} from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { toDecimal } from '@/lib/money';
import { buildBalanceTrend } from '@/lib/balance-trend';
import { accountBucket, roleLabel } from '@/lib/account-summary';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { HideBalancesToggle } from '@/components/hide-balances';
import { BalanceTrend } from '@/components/charts/balance-trend';
import { AccountForm } from '../account-form';
import { DeleteAccountButton } from './delete-button';

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

  const a = account.attributes;
  const currency = a.currency_code ?? connection.primaryCurrency;
  const decimals = a.currency_decimal_places ?? 2;
  const bucket = accountBucket(a.type);
  // The insight endpoints only answer for asset and liability accounts; asking
  // for a merchant's "money in" would return an empty array and render a pair
  // of confident zeroes.
  const hasCashflow = bucket === 'money';

  const [transactions, chart, expense, income] = await Promise.all([
    getAccountTransactions(id, { start: range.start, end: range.end, limit: 25 }),
    getAccountBalanceChart(id, range.start, range.end),
    hasCashflow ? getAccountExpenseInsight(id, range.start, range.end) : Promise.resolve([]),
    hasCashflow ? getAccountIncomeInsight(id, range.start, range.end) : Promise.resolve([]),
  ]);

  const trend = buildBalanceTrend(chart, currency);
  const moneyOut = expense[0];
  const moneyIn = income[0];

  const tabHref = (next: string) => `/accounts/${id}?tab=${next}&range=${range.preset}`;

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
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
            <Badge variant="secondary">{roleLabel(account)}</Badge>
            {!a.active ? <Badge variant="outline">Archived</Badge> : null}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {[
              currency,
              a.iban ?? a.account_number,
              a.last_activity
                ? `Last activity ${formatDate(a.last_activity.slice(0, 10), {
                    timezone: session.user.timezone,
                    style: 'relative',
                  }).toLowerCase()}`
                : 'No activity yet',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesToggle />
          <DateRangePicker label={range.label} />
        </div>
      </header>

      <div
        className={`grid min-w-0 gap-4 sm:grid-cols-2 ${hasCashflow ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}
      >
        <StatTile label="Current balance" note="Today">
          <Amount
            value={a.current_balance}
            currency={currency}
            decimalPlaces={decimals}
            size="xl"
            showSign={false}
            tone={toDecimal(a.current_balance).isNegative() ? 'expense' : 'neutral'}
          />
        </StatTile>

        <StatTile
          label="Change"
          note={
            trend.points.length > 0
              ? range.label
              : `${range.label} · no balance data for this period`
          }
        >
          <span className="flex flex-wrap items-baseline gap-1.5">
            <Amount value={trend.change} currency={currency} size="xl" compact tone="auto" />
            {trend.changePercent === null ? null : (
              <span className={`text-xs ${trend.change >= 0 ? 'text-income' : 'text-expense'}`}>
                {trend.changePercent >= 0 ? '+' : ''}
                {trend.changePercent.toFixed(1)}%
              </span>
            )}
          </span>
        </StatTile>

        {hasCashflow ? (
          <>
            <StatTile label="Money in" note={range.label}>
              <Amount
                value={moneyIn ? moneyIn.difference : '0'}
                currency={moneyIn?.currency_code ?? currency}
                size="xl"
                showSign={false}
                tone="income"
              />
            </StatTile>
            <StatTile label="Money out" note={range.label}>
              <Amount
                value={moneyOut ? toDecimal(moneyOut.difference).abs().toString() : '0'}
                currency={moneyOut?.currency_code ?? currency}
                size="xl"
                showSign={false}
                tone="expense"
              />
            </StatTile>
          </>
        ) : null}
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Balance over time</h2>
              <p className="text-muted-foreground text-xs">
                {range.label}
                {a.opening_balance_date
                  ? ` · opened ${formatDate(a.opening_balance_date.slice(0, 10), {
                      timezone: session.user.timezone,
                    })}`
                  : ''}
              </p>
            </div>
            {trend.points.length > 0 ? (
              <div className="min-w-0 text-right">
                <Amount
                  value={trend.closing}
                  currency={trend.currency}
                  size="lg"
                  showSign={false}
                  tone="neutral"
                  compact
                />
                <p className="text-muted-foreground mt-0.5 text-xs">
                  closing balance on {formatDate(range.end, { timezone: session.user.timezone })}
                </p>
              </div>
            ) : null}
          </div>

          <BalanceTrend
            data={trend}
            variant="single"
            seriesLabel="Balance"
            height={240}
            timezone={session.user.timezone}
            locale={session.user.locale}
          />
        </CardContent>
      </Card>

      <nav className="flex gap-1 border-b" aria-label="Account sections">
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={tabHref(entry.id)}
            aria-current={tab === entry.id ? 'page' : undefined}
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
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-0">
            {transactions.data.length === 0 ? (
              <div className="space-y-2 p-10 text-center">
                <p className="text-sm font-medium">
                  No transactions in {range.label.toLowerCase()}
                </p>
                <p className="text-muted-foreground text-sm">
                  Try a wider date range, or add one from the transactions page.
                </p>
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {transactions.data.map((group) => {
                  const split = group.attributes.transactions[0];
                  if (!split) return null;
                  const splits = group.attributes.transactions.length;
                  return (
                    <li key={group.id}>
                      <Link
                        href={`/transactions/${group.id}`}
                        className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{split.description}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {[
                              formatDate(split.date.slice(0, 10), {
                                timezone: session.user.timezone,
                              }),
                              // Whose money moved, not just when — the single
                              // most useful thing a ledger row can say.
                              split.type === 'withdrawal'
                                ? split.destination_name
                                : split.source_name,
                              split.category_name,
                              splits > 1 ? `${splits} splits` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
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

      {tab === 'transactions' && transactions.data.length > 0 ? (
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/transactions?account=${id}&range=${range.preset}`}>
              All transactions for this account
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div className="mt-1.5 min-w-0">{children}</div>
        {note ? <p className="text-muted-foreground mt-1 text-xs">{note}</p> : null}
      </CardContent>
    </Card>
  );
}
