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
import { toDecimal } from '@/lib/money';

export const metadata: Metadata = { title: 'Categories' };

/** E7-01 — category list with period spend/earn. */
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
  const categories = [...result.data].sort((a, b) =>
    a.attributes.name.localeCompare(b.attributes.name),
  );

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground truncate text-sm">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · {range.label}
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

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No categories yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/categories/new">Create your first category</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-border divide-y">
              {categories.map((category) => {
                const spent = category.attributes.spent?.[0];
                const earned = category.attributes.earned?.[0];
                return (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.id}`}
                      className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                    >
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {category.attributes.name}
                      </p>
                      <div className="flex gap-4 text-right">
                        {spent && !toDecimal(spent.sum).isZero() ? (
                          <Amount
                            value={spent.sum}
                            currency={spent.currency_code}
                            size="sm"
                            tone="expense"
                          />
                        ) : null}
                        {earned && !toDecimal(earned.sum).isZero() ? (
                          <Amount
                            value={earned.sum}
                            currency={earned.currency_code}
                            size="sm"
                            tone="income"
                          />
                        ) : null}
                        {(!spent || toDecimal(spent.sum).isZero()) &&
                        (!earned || toDecimal(earned.sum).isZero()) ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
