import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CalendarX } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBills } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { now, startOfMonth, endOfMonth, toApiDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Subscription calendar' };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface DayBill {
  id: string;
  name: string;
  amount: string;
  currency: string;
  paid: boolean;
}

interface Day {
  day: number;
  date: string;
  weekday: string;
  bills: DayBill[];
}

/**
 * E8-04 — the month's expected bill payments.
 *
 * **Two views of the same data, not one view that shrinks.** A seven-column
 * month grid needs about 110px a column before a subscription name and an
 * amount both fit; a phone has room for 50. It did shrink, and what that
 * produced was a grid of "Am…", "Do…", "Sp…" with the amounts spilling out of
 * their cells and across the neighbouring day — "BDT 25,000.00" printed over
 * Tuesday and Wednesday at once, which is worse than not showing it, because a
 * figure sitting in a column is a claim about which day it falls on.
 *
 * So below `xl` this is an agenda: the days that actually have something due,
 * in order, with room for the whole name and the whole amount. That is what a
 * month of subscriptions is on a phone — a short list, not a mostly-empty grid.
 *
 * **The grid returns at `xl`, and the reason it is not `lg` is a non-breaking
 * space.** At 1024px a column is about 97px and "BDT 25,000.00" needs 88, so it
 * clipped to "BDT 25,00…", which is the spill defect again in a politer font.
 * Letting the figure wrap looked like the answer and is not available:
 * `Intl.NumberFormat` separates the currency code from the number with U+00A0,
 * so there is no breakable space in it at all, and the only thing
 * `overflow-wrap` can do is split the number itself — "BDT 25,000." above "00".
 * A figure that has to be reassembled across two lines is not better than one
 * that is cut short. So the grid appears only where a column can hold a whole
 * amount, and everything narrower gets the agenda, which always can.
 */
export default async function BillCalendarPage({
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

  const today = now(session.user.timezone);
  const monthStart = startOfMonth(today);
  const firstWeekday = monthStart.getDay();

  const result = await getBills(range.start, range.end);
  const activeBills = result.data.filter((bill) => bill.attributes.active);

  const daysInMonth = endOfMonth(today).getDate();
  const days: Day[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({
      day,
      date,
      // Derived from the month's first weekday rather than by constructing a
      // Date per cell, which would resolve in the server's zone and drift a day.
      weekday: WEEKDAYS[(firstWeekday + day - 1) % 7]!,
      bills: activeBills
        .filter((bill) => bill.attributes.next_expected_match?.slice(0, 10) === date)
        .map((bill) => ({
          id: bill.id,
          name: bill.attributes.name,
          amount: bill.attributes.amount_max,
          currency: bill.attributes.currency_code ?? connection.primaryCurrency,
          paid: (bill.attributes.paid_dates?.length ?? 0) > 0,
        })),
    });
  }

  /*
   * `toApiDate`, not `toISOString().slice(0, 10)`.
   *
   * `toISOString` is always UTC, so the highlighted cell was the wrong day for
   * anyone far enough from Greenwich — a user at UTC+6 saw "today" jump to
   * tomorrow every evening at six.
   */
  const todayIso = toApiDate(today, session.user.timezone);
  const withBills = days.filter((day) => day.bills.length > 0);
  const monthLabel = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6">
      <Link
        href="/bills"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Subscriptions
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Subscription calendar</h1>
          <p className="text-muted-foreground truncate text-sm">
            {activeBills.length} active · {monthLabel}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/bills">List view</Link>
        </Button>
      </header>

      {/* --- phones and tablets: an agenda -------------------------------- */}
      <div className="xl:hidden">
        {withBills.length === 0 ? (
          <EmptyMonth monthLabel={monthLabel} />
        ) : (
          <Card>
            <CardContent className="divide-border divide-y p-0">
              {withBills.map((day) => (
                <section key={day.date} className="p-3">
                  <h2
                    className={cn(
                      'mb-2 text-xs font-semibold tracking-wide uppercase',
                      day.date === todayIso ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {day.weekday} {day.day}
                    {day.date === todayIso ? (
                      <span className="text-muted-foreground ml-1.5 font-normal normal-case">
                        · today
                      </span>
                    ) : null}
                  </h2>
                  <ul className="space-y-1.5">
                    {day.bills.map((bill) => (
                      <li key={bill.id}>
                        <Link
                          href={`/bills/${bill.id}`}
                          className="hover:bg-muted/60 -mx-1 flex min-w-0 items-center gap-3 rounded-md px-1 py-1.5"
                        >
                          <span
                            className={cn(
                              'size-2 shrink-0 rounded-full',
                              bill.paid ? 'bg-income' : 'bg-expense',
                            )}
                            aria-hidden="true"
                          />
                          {/* The name is the flexible part and the amount is
                              not: a truncated subscription name is still
                              recognisable, a truncated figure is a wrong one. */}
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {bill.name}
                          </span>
                          <Amount
                            value={bill.amount}
                            currency={bill.currency}
                            tone={bill.paid ? 'income' : 'expense'}
                            showSign={false}
                            className="shrink-0 text-sm font-semibold"
                          />
                          <span className="sr-only">{bill.paid ? 'paid' : 'due'}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* --- xl and up: the month grid ------------------------------------ */}
      <Card className="hidden xl:block">
        <CardContent className="p-4">
          <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs font-medium">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="py-1">
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <div key={`pad-${index}`} className="min-h-20" />
            ))}
            {days.map((day) => (
              <div
                key={day.day}
                className={cn(
                  'border-border min-h-20 min-w-0 rounded-md border p-1',
                  day.date === todayIso && 'bg-accent/40',
                )}
              >
                <div className="text-muted-foreground text-right text-xs">{day.day}</div>
                <ul className="mt-1 space-y-1">
                  {day.bills.map((bill) => (
                    <li key={bill.id} className="min-w-0">
                      <Link href={`/bills/${bill.id}`} className="block min-w-0">
                        <div
                          className={cn(
                            'min-w-0 rounded px-1 py-0.5 text-xs',
                            /* The measured tint, not `bg-expense/15`. An
                               arbitrary alpha over whatever sits behind it is
                               how the transactions strip ended up at 4.45:1
                               against a 4.5 requirement; globals.css carries a
                               tint per hue tuned against its own text colour. */
                            bill.paid
                              ? 'bg-income-muted text-income'
                              : 'bg-expense-muted text-expense',
                          )}
                        >
                          <span className="block truncate font-medium">{bill.name}</span>
                          {/*
                            An explicit tone, and a truncate that is a backstop.

                            Without the tone `Amount` colours by sign, so every
                            unpaid bill printed a green figure inside a red chip
                            — green means money coming in, and this is a payment
                            going out.

                            `truncate` stops a long figure spilling across the
                            neighbouring day, which is a claim about which day it
                            falls on. It should never actually fire: the grid
                            only renders from `xl`, where a column holds the
                            longest amount this app can produce. It is here for
                            the case that is longer still.
                          */}
                          <Amount
                            value={bill.amount}
                            currency={bill.currency}
                            tone={bill.paid ? 'income' : 'expense'}
                            size="sm"
                            showSign={false}
                            className="block truncate"
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyMonth({ monthLabel }: { monthLabel: string }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-8 text-center">
        <CalendarX className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
        <p className="text-sm font-medium">Nothing due in {monthLabel}</p>
        <p className="text-muted-foreground mx-auto max-w-xs text-sm">
          Subscriptions appear here on the date Firefly expects them next.
        </p>
      </CardContent>
    </Card>
  );
}
