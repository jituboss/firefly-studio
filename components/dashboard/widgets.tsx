import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import { divide, subtract, toDecimal } from '@/lib/money';
import type { Account, Bill, PiggyBank, Transaction } from '@/server/firefly/types';

export function WidgetCard({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('min-w-0 overflow-hidden', className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="truncate text-sm font-medium">{title}</CardTitle>
        {href ? (
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            View all
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="min-w-0 pt-0">{children}</CardContent>
    </Card>
  );
}

/** E3-04 — a KPI tile with a period-over-period delta. */
export function KpiTile({
  label,
  value,
  currency,
  previous,
  tone = 'auto',
}: {
  label: string;
  value: string;
  currency: string;
  previous?: string;
  tone?: 'auto' | 'neutral' | 'income' | 'expense';
}) {
  const hasDelta = previous !== undefined && !toDecimal(previous).isZero();
  const change = hasDelta
    ? divide(subtract(value, previous), toDecimal(previous).abs()).times(100)
    : null;

  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 p-5">
        <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <div className="mt-1.5 min-w-0">
          <Amount
            value={value}
            currency={currency}
            tone={tone}
            size="xl"
            showSign={false}
            compact
            className="block truncate"
          />
        </div>
        {change ? (
          <p className="text-muted-foreground mt-1 text-xs">
            <span className={cn(change.isNegative() ? 'text-expense' : 'text-income')}>
              {change.isNegative() ? '↓' : '↑'} {change.abs().toFixed(1)}%
            </span>{' '}
            vs. previous period
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-xs">No comparison available</p>
        )}
      </CardContent>
    </Card>
  );
}

/** E3-06 — asset account cards. */
export function AccountBalanceList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No asset accounts yet.</p>;
  }

  return (
    <ul className="divide-border divide-y">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between gap-3 py-2.5">
          <Link href={`/accounts/${account.id}`} className="min-w-0 flex-1 hover:underline">
            <p className="truncate text-sm font-medium">{account.attributes.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {account.attributes.account_role?.replace(/Asset$/, '') ?? account.attributes.type}
            </p>
          </Link>
          <Amount
            value={account.attributes.current_balance}
            currency={account.attributes.currency_code ?? 'EUR'}
            decimalPlaces={account.attributes.currency_decimal_places ?? 2}
            showSign={false}
            tone={
              toDecimal(account.attributes.current_balance).isNegative() ? 'expense' : 'neutral'
            }
          />
        </li>
      ))}
    </ul>
  );
}

/** E3-07 — recent transactions. */
export function RecentTransactions({
  transactions,
  timezone,
}: {
  transactions: Transaction[];
  timezone: string;
}) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No transactions yet.</p>;
  }

  return (
    <ul className="divide-border divide-y">
      {transactions.map((group) => {
        const split = group.attributes.transactions[0];
        if (!split) return null;
        const outgoing = split.type === 'withdrawal';
        return (
          <li key={group.id}>
            <Link
              href={`/transactions/${group.id}`}
              className="flex items-center justify-between gap-3 py-2.5 hover:underline"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{split.description}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {formatDate(split.date.slice(0, 10), { timezone, style: 'relative' })}
                  {split.category_name ? ` · ${split.category_name}` : ''}
                </p>
              </div>
              <Amount
                value={outgoing ? `-${split.amount}` : split.amount}
                currency={split.currency_code}
                decimalPlaces={split.currency_decimal_places}
                tone={split.type === 'transfer' ? 'transfer' : 'auto'}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** E3-09 — upcoming bills. */
export function UpcomingBills({
  bills,
  timezone,
  defaultCurrency,
}: {
  bills: Bill[];
  timezone: string;
  defaultCurrency: string;
}) {
  const upcoming = bills
    .filter((bill) => bill.attributes.active && bill.attributes.next_expected_match)
    .sort((a, b) =>
      (a.attributes.next_expected_match ?? '').localeCompare(
        b.attributes.next_expected_match ?? '',
      ),
    )
    .slice(0, 6);

  if (upcoming.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No upcoming bills.</p>;
  }

  return (
    <ul className="divide-border divide-y">
      {upcoming.map((bill) => {
        const paid = (bill.attributes.paid_dates?.length ?? 0) > 0;
        return (
          <li key={bill.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{bill.attributes.name}</p>
              <p className="text-muted-foreground text-xs">
                {bill.attributes.next_expected_match
                  ? formatDate(bill.attributes.next_expected_match.slice(0, 10), {
                      timezone,
                      style: 'relative',
                    })
                  : '—'}
              </p>
            </div>
            {paid ? <Badge variant="income">Paid</Badge> : null}
            <Amount
              value={bill.attributes.amount_max}
              currency={bill.attributes.currency_code ?? defaultCurrency}
              showSign={false}
            />
          </li>
        );
      })}
    </ul>
  );
}

/** E3-10 — piggy bank progress. */
export function PiggyProgress({
  piggies,
  defaultCurrency,
}: {
  piggies: PiggyBank[];
  defaultCurrency: string;
}) {
  if (piggies.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No piggy banks yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {piggies.slice(0, 5).map((piggy) => {
        const percent = Math.min(100, Math.max(0, piggy.attributes.percentage ?? 0));
        return (
          <li key={piggy.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{piggy.attributes.name}</span>
              <span className="text-muted-foreground tabular text-xs">{percent.toFixed(0)}%</span>
            </div>
            <div
              className="bg-muted h-1.5 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${piggy.attributes.name} savings progress`}
            >
              <div className="bg-income h-full rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <div className="text-muted-foreground flex justify-between text-xs">
              <Amount
                value={piggy.attributes.current_amount}
                currency={piggy.attributes.currency_code ?? defaultCurrency}
                size="sm"
                showSign={false}
                tone="neutral"
              />
              <Amount
                value={piggy.attributes.target_amount}
                currency={piggy.attributes.currency_code ?? defaultCurrency}
                size="sm"
                showSign={false}
                tone="neutral"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
