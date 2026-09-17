import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { resolveRangeFromParams } from '@/lib/date-range';
import { searchTransactions } from '@/server/firefly/queries';
import { DateRangePicker } from '@/components/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { UncategorisedClient } from './client';

export const metadata: Metadata = { title: 'Uncategorised transactions' };

/**
 * E7-04 — uncategorised transaction inbox.
 *
 * Uses the Firefly search operator `has_no_category:true` so pagination and
 * totals are accurate. The user selects splits and applies a category in bulk.
 */
export default async function UncategorisedPage({
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
  const page = Math.max(1, Number.parseInt(String(params.page ?? '1'), 10) || 1);

  // Firefly search returns every uncategorised transaction across all time by
  // default; scope to the selected date range so the inbox is actionable.
  const query = [
    'has_no_category:true',
    `date_after:${range.start}`,
    `date_before:${range.end}`,
  ].join(' ');

  const result = await searchTransactions(query, page);
  const pagination = result.meta.pagination;

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Uncategorised</h1>
          <p className="text-muted-foreground text-sm">
            {pagination
              ? `${pagination.total.toLocaleString()} total · page ${pagination.current_page} of ${pagination.total_pages}`
              : `${result.data.length} shown`}
            {' · '}
            {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker label={range.label} />
          <Button asChild size="sm" variant="outline">
            <Link href="/categories">Categories</Link>
          </Button>
        </div>
      </header>

      <UncategorisedClient transactions={result.data} timezone={session.user.timezone} />

      {result.data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No uncategorised transactions.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pagination && pagination.total_pages > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={pagination.current_page <= 1}>
                  <Link
                    href={
                      page <= 2
                        ? '/categories/uncategorised'
                        : `/categories/uncategorised?page=${page - 1}`
                    }
                  >
                    Previous
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page >= pagination.total_pages}
                >
                  <Link href={`/categories/uncategorised?page=${page + 1}`}>Next</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
