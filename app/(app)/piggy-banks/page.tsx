import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getPiggyBanks } from '@/server/firefly/queries';
import type { PiggyBank } from '@/server/firefly/types';
import { parseFireflyDate, now, differenceInCalendarDays } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Piggy banks' };

function piggyStatus(
  p: PiggyBank['attributes'],
  timezone: string,
): { label: string; variant: 'income' | 'expense' | 'warning' | 'secondary' } | null {
  const targetAmount = p.target_amount;
  const targetDate = p.target_date;
  const currentPercent = p.percentage ?? 0;

  if (!targetAmount || !targetDate) return null;
  if (currentPercent >= 100) return { label: 'Target reached', variant: 'income' };

  const today = now(timezone);
  const start = p.start_date ? parseFireflyDate(p.start_date, timezone) : today;
  const end = parseFireflyDate(targetDate, timezone);
  const totalDays = Math.max(1, differenceInCalendarDays(end, start));
  const elapsedDays = Math.max(0, Math.min(totalDays, differenceInCalendarDays(today, start)));
  const expectedPercent = (elapsedDays / totalDays) * 100;

  if (currentPercent >= expectedPercent) return { label: 'On track', variant: 'income' };
  if (currentPercent >= expectedPercent - 10)
    return { label: 'Slightly behind', variant: 'warning' };
  return { label: 'Behind', variant: 'expense' };
}

/** E9-01 / E9-04 — piggy bank list with progress rings, required-per-month, and on-track status. */
export default async function PiggyBanksPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const result = await getPiggyBanks();
  const piggies = [...result.data].sort((a, b) =>
    a.attributes.name.localeCompare(b.attributes.name),
  );

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Piggy banks</h1>
          <p className="text-muted-foreground text-sm">
            {piggies.length} goal{piggies.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/piggy-banks/new">
            <Plus className="size-4" aria-hidden="true" />
            New
          </Link>
        </Button>
      </header>

      {piggies.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No piggy banks yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/piggy-banks/new">Create your first piggy bank</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {piggies.map((piggy) => {
            const p = piggy.attributes;
            const currency = p.currency_code ?? connection.primaryCurrency;
            const percent = Math.min(100, Math.max(0, p.percentage ?? 0));
            const status = piggyStatus(p, session.user.timezone);

            return (
              <li key={piggy.id}>
                <Link href={`/piggy-banks/${piggy.id}`}>
                  <Card className="hover:bg-accent/30 min-w-0 transition-colors">
                    <CardContent className="min-w-0 space-y-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
                          <span className="text-muted-foreground tabular text-xs">
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div
                        className="bg-muted h-2 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${p.name} savings progress`}
                      >
                        <div
                          className="bg-income h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Amount
                          value={p.current_amount}
                          currency={currency}
                          showSign={false}
                          tone="neutral"
                        />
                        <span className="text-muted-foreground">
                          of{' '}
                          <Amount
                            value={p.target_amount}
                            currency={currency}
                            showSign={false}
                            tone="neutral"
                            size="sm"
                          />
                        </span>
                      </div>
                      {p.save_per_month && !p.save_per_month.startsWith('-') ? (
                        <p className="text-muted-foreground text-xs">
                          Save {p.save_per_month} {currency}/month to reach your target
                        </p>
                      ) : null}
                      {status?.label === 'Behind' || status?.label === 'Slightly behind' ? (
                        <p className="text-xs">
                          {status.label === 'Behind' ? (
                            <span className="text-expense">
                              Behind schedule — increase monthly savings or extend the target date.
                            </span>
                          ) : (
                            <span className="text-warning">Slightly behind schedule.</span>
                          )}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
