import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getTags } from '@/server/firefly/queries';
import { getExpenseByTag, getIncomeByTag } from '@/server/firefly/report-queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { buildBreakdown, chooseReportCurrency } from '@/lib/reports';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { toDecimal } from '@/lib/money';

export const metadata: Metadata = { title: 'Tags' };

/**
 * Font sizes for the cloud. Five steps rather than a continuous scale: a
 * linear map from spend to pixels produces a wall of near-identical sizes on a
 * real ledger, because tag spend is heavily skewed — one or two tags carry most
 * of it and the rest cluster near zero. Buckets keep the difference readable.
 */
const CLOUD_STEPS = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'] as const;

/** E12-01 — tag list and a cloud weighted by what each tag actually cost. */
export default async function TagsPage({
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
  const scope = { start: range.start, end: range.end };

  const [tagsResult, expense, income] = await Promise.all([
    getTags(),
    getExpenseByTag(scope),
    getIncomeByTag(scope),
  ]);

  // Resolve the currency across both payloads first, then hand it to each
  // breakdown as the preferred one, so spend and income cannot land on
  // different currencies and be compared as if they were the same.
  const currency = chooseReportCurrency([...expense, ...income], connection.primaryCurrency);
  const spent = buildBreakdown(expense, currency);
  const earned = buildBreakdown(income, currency);

  // The insight endpoints key tags by name, which is also how the tag resource
  // identifies itself — there is no id to join on.
  const spentByName = new Map(spent.rows.map((row) => [row.name, row.amount]));
  const earnedByName = new Map(earned.rows.map((row) => [row.name, row.amount]));

  const rows = tagsResult.data
    .map((tag) => {
      const name = tag.attributes.tag;
      const tagSpent = spentByName.get(name) ?? '0';
      const tagEarned = earnedByName.get(name) ?? '0';
      return {
        name,
        description: tag.attributes.description,
        date: tag.attributes.date,
        located: tag.attributes.latitude !== null && tag.attributes.longitude !== null,
        spent: toDecimal(tagSpent).abs().toString(),
        earned: toDecimal(tagEarned).abs().toString(),
      };
    })
    .sort((a, b) => toDecimal(b.spent).comparedTo(toDecimal(a.spent)));

  const largest = rows.reduce(
    (max, row) => (toDecimal(row.spent).greaterThan(max) ? toDecimal(row.spent) : max),
    toDecimal(0),
  );

  const used = rows.filter((row) => !toDecimal(row.spent).isZero());

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
          <p className="text-muted-foreground truncate text-sm">
            {rows.length} tag{rows.length === 1 ? '' : 's'} · {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker label={range.label} />
          <Button asChild size="sm">
            <Link href="/tags/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No tags yet.</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              Tags cut across categories — a holiday, a house move, a reimbursable trip — and a
              transaction can carry as many as it needs.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/tags/new">Create your first tag</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {used.length > 0 ? (
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="p-5">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Weighted by spend
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  {used.map((row) => {
                    const share = largest.isZero()
                      ? 0
                      : toDecimal(row.spent).dividedBy(largest).toNumber();
                    const step = Math.min(
                      CLOUD_STEPS.length - 1,
                      Math.floor(share * CLOUD_STEPS.length),
                    );
                    return (
                      <Link
                        key={row.name}
                        href={`/tags/${encodeURIComponent(row.name)}`}
                        className={`hover:text-foreground text-muted-foreground transition-colors ${CLOUD_STEPS[step]}`}
                        title={`${row.name} — ${row.spent} ${currency}`}
                      >
                        {row.name}
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-border divide-y">
                {rows.map((row) => (
                  <li key={row.name}>
                    <Link
                      href={`/tags/${encodeURIComponent(row.name)}`}
                      className="hover:bg-accent/50 block min-w-0 px-4 py-3 transition-colors"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{row.name}</p>
                          {row.description ? (
                            <p className="text-muted-foreground truncate text-xs">
                              {row.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="flex shrink-0 items-baseline gap-3">
                          {toDecimal(row.earned).isZero() ? null : (
                            <Amount
                              value={row.earned}
                              currency={currency}
                              size="sm"
                              tone="income"
                              showSign={false}
                            />
                          )}
                          {toDecimal(row.spent).isZero() ? (
                            <span className="text-muted-foreground text-sm">—</span>
                          ) : (
                            <Amount
                              value={row.spent}
                              currency={currency}
                              size="sm"
                              tone="expense"
                              showSign={false}
                            />
                          )}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
