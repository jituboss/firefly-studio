import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getCategories } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { add, divide, toDecimal } from '@/lib/money';
import type { Category } from '@/server/firefly/types';

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

function toRow(category: Category, fallbackCurrency: string): CategoryRow {
  // Firefly reports one entry per currency. Taking `[0]` blindly can report a
  // secondary currency's figure as if it were the headline, so prefer the
  // connection's own currency when it is present.
  const pick = (entries: Category['attributes']['spent']) =>
    entries?.find((entry) => entry.currency_code === fallbackCurrency) ?? entries?.[0];

  const spent = pick(category.attributes.spent);
  const earned = pick(category.attributes.earned);
  const spentAmount = spent ? toDecimal(spent.sum).abs() : toDecimal(0);
  const earnedAmount = earned ? toDecimal(earned.sum).abs() : toDecimal(0);

  return {
    id: category.id,
    name: category.attributes.name,
    spent: spentAmount.toString(),
    earned: earnedAmount.toString(),
    currency: spent?.currency_code ?? earned?.currency_code ?? fallbackCurrency,
    active: !spentAmount.isZero() || !earnedAmount.isZero(),
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

  const result = await getCategories(range.start, range.end);
  const rows = result.data.map((category) => toRow(category, connection.primaryCurrency));

  const active = rows
    .filter((row) => row.active)
    .sort((a, b) => add(b.spent, b.earned).comparedTo(add(a.spent, a.earned)));
  const dormant = rows.filter((row) => !row.active).sort((a, b) => a.name.localeCompare(b.name));

  // One currency at a time — the rule everywhere else in this codebase.
  const totalSpent = active
    .filter((row) => row.currency === connection.primaryCurrency)
    .reduce((sum, row) => add(sum, row.spent), toDecimal(0));
  const otherCurrencies = [
    ...new Set(
      active.map((row) => row.currency).filter((code) => code !== connection.primaryCurrency),
    ),
  ].sort();

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
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No categories yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/categories/new">Create your first category</Link>
            </Button>
          </CardContent>
        </Card>
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
                {otherCurrencies.length > 0
                  ? ` · excludes ${otherCurrencies.join(', ')} — no conversion rate`
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
