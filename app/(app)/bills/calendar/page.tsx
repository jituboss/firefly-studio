import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBills } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { now, startOfMonth, endOfMonth } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Subscription calendar' };

/** E8-04 — calendar view of expected bill payments across the selected month. */
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

  const result = await getBills(range.start, range.end);
  const activeBills = result.data.filter((b) => b.attributes.active);

  const daysInMonth = endOfMonth(today).getDate();
  const grid: {
    day: number;
    date: string;
    bills: Array<{
      id: string;
      name: string;
      amount: string;
      currency: string;
      paid: boolean;
      nextExpected: string | null;
    }>;
  }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayBills = activeBills
      .filter((bill) => {
        const next = bill.attributes.next_expected_match;
        return next && next.slice(0, 10) === date;
      })
      .map((bill) => ({
        id: bill.id,
        name: bill.attributes.name,
        amount: bill.attributes.amount_max,
        currency: bill.attributes.currency_code ?? connection.primaryCurrency,
        paid: (bill.attributes.paid_dates?.length ?? 0) > 0,
        nextExpected: bill.attributes.next_expected_match,
      }));
    grid.push({ day, date, bills: dayBills });
  }

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

      <Card>
        <CardContent className="p-4">
          <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs font-medium">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-20" />
            ))}
            {grid.map((cell) => {
              const isToday = cell.date === today.toISOString().slice(0, 10);
              return (
                <div
                  key={cell.day}
                  className={`border-border min-h-20 rounded-md border p-1 ${
                    isToday ? 'bg-accent/40' : ''
                  }`}
                >
                  <div className="text-muted-foreground text-right text-xs">{cell.day}</div>
                  <ul className="mt-1 space-y-1">
                    {cell.bills.map((bill) => (
                      <li key={bill.id}>
                        <Link href={`/bills/${bill.id}`}>
                          <div
                            className={`rounded px-1 py-0.5 text-xs ${
                              bill.paid ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'
                            }`}
                          >
                            <span className="block truncate font-medium">{bill.name}</span>
                            <Amount
                              value={bill.amount}
                              currency={bill.currency}
                              size="sm"
                              showSign={false}
                            />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
