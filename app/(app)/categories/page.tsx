import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Shapes } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/error-state';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, readFailure } from '@/server/firefly/api';
import { getCategories, getExchangeRates } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { add, divide, toDecimal } from '@/lib/money';
import { buildRateTable, convertSpent } from '@/lib/budget-currency';
import type { RateTable } from '@/lib/fx';
import type { Category } from '@/server/firefly/types';
import { classifyError } from '@/lib/error-taxonomy';

export const metadata: Metadata = { title: 'Categories' };

interface CategoryRow {
  id: string;
  name: string;
  /** Positive magnitude of money spent in this category. */
  spent: string;
  earned: string;
  currency: string;
  active: boolean;
}

function toRow(
  category: Category,
  fallbackCurrency: string,
  rateTable: RateTable | null,
): CategoryRow {
  // Firefly reports one entry per currency. Convert all entries to the
  // primary currency using the rate table, so the total matches the budget
  // screen and dashboard for the same period.
  const spentConverted = convertSpent(
    category.attributes.spent ?? [],
    fallbackCurrency,
    rateTable,
  );
  const earnedConverted = convertSpent(
    category.attributes.earned ?? [],
    fallbackCurrency,
    rateTable,
  );

  return {
    id: category.id,
    name: category.attributes.name,
    spent: spentConverted.amount,
    earned: earnedConverted.amount,
    currency: fallbackCurrency,
    active: !toDecimal(spentConverted.amount).isZero() || !toDecimal(earnedConverted.amount).isZero(),
  };
}

/**
 * E7-01 — category list with period spend/earn.
 *
 * Sorted by what was actually spent, not alphabetically. On a real ledger the
 * alphabetical list opened with a run of categories showing nothing but an
 * em-dash — every category that happened to be dormant this period — while the
 * one that had taken 1.1M sat below the fold. Dormant categories are still
 * here, folded away at the bottom, because the answer to "where did the money
 * go" should not be paginated behind twenty blanks.
 */
export default async function CategoriesPage({
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

  const [result, ratesResult] = await Promise.all([
    getCategories(range.start, range.end),
    getExchangeRates(),
  ]);
  const rateTable = buildRateTable(ratesResult.data);
  const rows = result.data.map((category) =>
    toRow(category, connection.primaryCurrency, rateTable),
  );

  const active = rows
    .filter((row) => row.active)
    .sort((a, b) => add(b.spent, b.earned).comparedTo(add(a.spent, a.earned)));
  const dormant = rows.filter((row) => !row.active).sort((a, b) => a.name.localeCompare(b.name));

  // All rows are now in the primary currency, so the total is a simple sum.
  const totalSpent = active.reduce((sum, row) => add(sum, row.spent), toDecimal(0));
  // Track which foreign currencies were converted for disclosure.
  const convertedCurrencies = new Set<string>();
  const unconvertible = new Set<string>();
  for (const category of result.data) {
    for (const entry of category.attributes.spent ?? []) {
      const code = entry.currency_code.toUpperCase();
      if (code === connection.primaryCurrency.toUpperCase()) continue;
      if (rateTable && rateTable.pairs.has(`${code}>${connection.primaryCurrency.toUpperCase()}`)) {
        convertedCurrencies.add(code);
      } else {
        unconvertible.add(code);
      }
    }
  }

  // Bars are relative to the biggest spender, so the largest fills the row and
  // everything else reads as a fraction of it at a glance.
  const largest = active.reduce((max, row) => {
    const value = toDecimal(row.spent);
    return value.greaterThan(max) ? value : max;
  }, toDecimal(0));

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground truncate text-sm">
            {active.length} active of {rows.length} · {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker label={range.label} />
          <Button asChild size="sm" variant="outline">
            <Link href="/categories/uncategorised">Uncategorised</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/categories/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      {rows.length === 0 ? (
        readFailure() ? (
          <ErrorState kind={classifyError(readFailure())} />
        ) : (
          <EmptyState
            icon={Shapes}
            title="No categories yet"
            description="Categories are what a transaction was for — groceries, fuel, rent — and they are what every spending report groups by."
            action={{ label: 'Create your first category', href: '/categories/new' }}
          />
        )
      ) : (
        <>
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="min-w-0 p-4">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Categorised spending
              </p>
              <div className="mt-1.5 min-w-0">
                <Amount
                  value={totalSpent.toString()}
                  currency={connection.primaryCurrency}
                  size="xl"
                  compact
                  showSign={false}
                  tone="expense"
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {range.label} · {active.length} categor{active.length === 1 ? 'y' : 'ies'} with
                activity
                {convertedCurrencies.size > 0
                  ? ` · includes ${[...convertedCurrencies].sort().join(', ')} converted to ${connection.primaryCurrency}` +
                    (rateTable?.asOf ? ` as of ${rateTable.asOf}` : '')
                  : ''}
                {unconvertible.size > 0
                  ? ` · ${[...unconvertible].sort().join(', ')} not converted`
                  : ''}
              </p>
            </CardContent>
          </Card>

          {active.length > 0 ? (
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="p-0">
                <ul className="divide-border divide-y">
                  {active.map((row) => {
                    const share = largest.isZero()
                      ? 0
                      : divide(row.spent, largest).times(100).toNumber();
                    return (
                      <li key={row.id}>
                        <Link
                          href={`/categories/${row.id}`}
                          className="hover:bg-accent/50 block min-w-0 px-4 py-3 transition-colors"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="min-w-0 flex-1 truncate text-sm font-medium">
                              {row.name}
                            </p>
                            <span className="flex shrink-0 items-baseline gap-3">
                              {toDecimal(row.earned).isZero() ? null : (
                                <Amount
                                  value={row.earned}
                                  currency={row.currency}
                                  size="sm"
                                  tone="income"
                                  showSign={false}
                                />
                              )}
                              {toDecimal(row.spent).isZero() ? null : (
                                <Amount
                                  value={row.spent}
                                  currency={row.currency}
                                  size="sm"
                                  tone="expense"
                                  showSign={false}
                                />
                              )}
                            </span>
                          </div>
                          {share > 0 ? (
                            <div
                              className="bg-muted mt-2 h-1 overflow-hidden rounded-full"
                              aria-hidden="true"
                            >
                              <div
                                className="bg-expense/70 h-full"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-10 text-center">
                <p className="text-sm font-medium">
                  No category saw any money in {range.label.toLowerCase()}.
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Pick a wider date range to see where spending went.
                </p>
              </CardContent>
            </Card>
          )}

          {dormant.length > 0 ? (
            <details className="group">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">
                {dormant.length} categor{dormant.length === 1 ? 'y' : 'ies'} with no activity in{' '}
                {range.label.toLowerCase()}
              </summary>
              <Card className="mt-2 min-w-0 overflow-hidden">
                <CardContent className="p-0">
                  <ul className="divide-border divide-y">
                    {dormant.map((row) => (
                      <li key={row.id}>
                        <Link
                          href={`/categories/${row.id}`}
                          className="hover:bg-accent/50 text-muted-foreground block truncate px-4 py-2.5 text-sm transition-colors"
                        >
                          {row.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
