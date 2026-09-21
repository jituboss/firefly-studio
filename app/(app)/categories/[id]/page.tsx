import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getCategory, getCategoryTransactions } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { CategoryForm } from '../category-form';
import { DeleteCategoryButton } from './delete-button';
import { MergeCategoryForm } from './merge-form';
import { Tabs } from '@/components/ui/tabs';

export const metadata: Metadata = { title: 'Category' };

export default async function CategoryDetailPage({
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

  let category;
  try {
    category = (await getCategory(id, range.start, range.end)).data;
  } catch {
    notFound();
  }

  const transactions = await getCategoryTransactions(id, {
    start: range.start,
    end: range.end,
    limit: 25,
  });

  const a = category.attributes;
  const spent = a.spent?.[0];
  const earned = a.earned?.[0];

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/categories"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Categories
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{a.name}</h1>
        <DateRangePicker label={range.label} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Spent this period
            </p>
            <div className="mt-1.5">
              {spent ? (
                <Amount value={spent.sum} currency={spent.currency_code} size="xl" tone="expense" />
              ) : (
                <span className="text-muted-foreground text-sm">Nothing spent</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Earned this period
            </p>
            <div className="mt-1.5">
              {earned ? (
                <Amount
                  value={earned.sum}
                  currency={earned.currency_code}
                  size="xl"
                  tone="income"
                />
              ) : (
                <span className="text-muted-foreground text-sm">Nothing earned</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        label="Category sections"
        basePath={`/categories/${id}`}
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
          <CategoryForm category={category} />
          {/* E7-05 — merging sits above deleting because it is what people
              actually want when they find a duplicate: deleting strips the
              category off every transaction, merging keeps the history. */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Merge into another category</p>
                <p className="text-muted-foreground text-sm">
                  Moves every transaction across, then removes this one.
                </p>
              </div>
              <MergeCategoryForm
                id={id}
                name={a.name}
                transactionCount={transactions.data.length}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this category</p>
                <p className="text-muted-foreground text-sm">
                  Transactions keep their history but lose this category.
                </p>
              </div>
              <DeleteCategoryButton id={id} name={a.name} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
