import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Repeat, CalendarClock } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getRecurrences } from '@/server/firefly/queries';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Recurring' };

/**
 * E10-01 / E10-05 — what repeats, and what is coming.
 *
 * The forecast needs no arithmetic here: Firefly computes `occurrences` per
 * repetition and hands them over, so the timeline is its answer rather than a
 * second implementation of its calendar rules that could disagree with it.
 */
export default async function RecurringPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const result = await getRecurrences();
  const rows = result.data;

  const upcoming = rows
    .filter((entry) => entry.attributes.active)
    .flatMap((entry) =>
      (entry.attributes.repetitions[0]?.occurrences ?? []).map((date) => ({
        date,
        id: entry.id,
        title: entry.attributes.title,
        type: entry.attributes.type,
        amount: entry.attributes.transactions[0]?.amount ?? '0',
        currency: entry.attributes.transactions[0]?.currency_code ?? connection.primaryCurrency,
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recurring</h1>
          <p className="text-muted-foreground truncate text-sm">
            {rows.length} recurring transaction{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/recurring/new">
            <Plus className="size-4" aria-hidden="true" />
            New
          </Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Repeat className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Nothing repeats yet.</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
              Rent, salary, the standing order to savings — describe it once and Firefly creates the
              transaction on schedule.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/recurring/new">Set up the first one</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b px-4 py-3">
                  <CalendarClock className="text-muted-foreground size-4" aria-hidden="true" />
                  <p className="text-sm font-medium">What is coming</p>
                </div>
                <ul className="divide-border divide-y">
                  {upcoming.map((entry, index) => (
                    <li
                      key={`${entry.id}-${entry.date}-${index}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/recurring/${entry.id}`}
                          className="hover:text-primary truncate text-sm font-medium transition-colors"
                        >
                          {entry.title}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(entry.date.slice(0, 10), { timezone: session.user.timezone })}
                        </p>
                      </div>
                      <Amount
                        value={entry.type === 'withdrawal' ? `-${entry.amount}` : entry.amount}
                        currency={entry.currency}
                        size="sm"
                        tone={entry.type === 'transfer' ? 'transfer' : 'auto'}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-border divide-y">
                {rows.map((entry) => {
                  const a = entry.attributes;
                  const repetition = a.repetitions[0];
                  const transaction = a.transactions[0];
                  return (
                    <li key={entry.id}>
                      <Link
                        href={`/recurring/${entry.id}`}
                        className="hover:bg-accent/50 block min-w-0 px-4 py-3 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium">
                            {a.title}
                            {a.active ? null : (
                              <span className="text-muted-foreground ml-2 text-xs">paused</span>
                            )}
                          </p>
                          {transaction ? (
                            <Amount
                              value={
                                a.type === 'withdrawal'
                                  ? `-${transaction.amount}`
                                  : transaction.amount
                              }
                              currency={transaction.currency_code ?? connection.primaryCurrency}
                              size="sm"
                              tone={a.type === 'transfer' ? 'transfer' : 'auto'}
                            />
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {/* Firefly writes this sentence itself. */}
                          {repetition?.description ?? 'No schedule'}
                          {a.nr_of_repetitions
                            ? ` · ${a.nr_of_repetitions} times`
                            : a.repeat_until
                              ? ` · until ${a.repeat_until.slice(0, 10)}`
                              : ''}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
