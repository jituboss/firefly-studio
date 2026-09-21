import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getTag, getTagTransactions } from '@/server/firefly/queries';
import { getExpenseByTag, getIncomeByTag } from '@/server/firefly/report-queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { buildBreakdown, chooseReportCurrency } from '@/lib/reports';
import { toDecimal } from '@/lib/money';
import { Amount } from '@/components/ui/amount';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { TransactionList } from '@/components/transactions/transaction-list';
import { TagForm } from '../tag-form';
import { DeleteTagButton } from './delete-button';
import { Tabs } from '@/components/ui/tabs';

export const metadata: Metadata = { title: 'Tag' };

/** E12-03 — tag detail: totals from the insight endpoints, plus transactions. */
export default async function TagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { tag: raw } = await params;
  const name = decodeURIComponent(raw);
  const query = await searchParams;
  const range = resolveRangeFromParams(query, session.user.timezone);
  const tab = typeof query.tab === 'string' ? query.tab : 'transactions';

  let tag;
  try {
    tag = (await getTag(name)).data;
  } catch {
    notFound();
  }

  const scope = { start: range.start, end: range.end };
  const [transactions, expense, income] = await Promise.all([
    getTagTransactions(name, { ...scope, limit: 25 }),
    getExpenseByTag(scope),
    getIncomeByTag(scope),
  ]);

  const currency = chooseReportCurrency([...expense, ...income], connection.primaryCurrency);
  // `buildBreakdown` already collapses the one-row-per-currency duplication the
  // insight endpoints return; picking this tag's row out of it is all that is
  // left. Summing the raw arrays here would add euros to dollars.
  const spentRow = buildBreakdown(expense, currency).rows.find((row) => row.name === name);
  const earnedRow = buildBreakdown(income, currency).rows.find((row) => row.name === name);
  const spent = toDecimal(spentRow?.amount ?? '0').abs();
  const earned = toDecimal(earnedRow?.amount ?? '0').abs();

  const a = tag.attributes;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/tags"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Tags
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{a.tag}</h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
            {a.date ? (
              <span>{formatDate(a.date.slice(0, 10), { timezone: session.user.timezone })}</span>
            ) : null}
            {a.latitude !== null && a.longitude !== null ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
              </span>
            ) : null}
          </p>
          {a.description ? <p className="text-muted-foreground text-sm">{a.description}</p> : null}
        </div>
        <DateRangePicker label={range.label} />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Spent
            </p>
            <div className="mt-1.5">
              {spent.isZero() ? (
                <span className="text-muted-foreground text-sm">Nothing spent</span>
              ) : (
                <Amount
                  value={spent.toString()}
                  currency={currency}
                  size="xl"
                  tone="expense"
                  showSign={false}
                  compact
                />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Earned
            </p>
            <div className="mt-1.5">
              {earned.isZero() ? (
                <span className="text-muted-foreground text-sm">Nothing earned</span>
              ) : (
                <Amount
                  value={earned.toString()}
                  currency={currency}
                  size="xl"
                  tone="income"
                  showSign={false}
                  compact
                />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Net</p>
            <div className="mt-1.5">
              <Amount
                value={earned.minus(spent).toString()}
                currency={currency}
                size="xl"
                compact
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        label="Tag sections"
        basePath={`/tags/${encodeURIComponent(name)}`}
        query={{ range: range.preset }}
        active={tab}
        tabs={[
          { id: 'transactions', label: 'Transactions' },
          { id: 'edit', label: 'Edit' },
        ]}
      />

      {tab === 'transactions' ? (
        <Card>
          <CardContent className="p-0">
            <TransactionList
              groups={transactions.data}
              timezone={session.user.timezone}
              empty="Nothing carries this tag in this period."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <TagForm tag={tag} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this tag</p>
                <p className="text-muted-foreground text-sm">
                  Transactions keep their history but lose this tag.
                </p>
              </div>
              <DeleteTagButton tag={a.tag} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
