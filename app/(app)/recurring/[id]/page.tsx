import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getRecurrence, getRecurrenceTransactions } from '@/server/firefly/queries';
import { formatDate, now, toApiDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionList } from '@/components/transactions/transaction-list';
import { RecurrenceForm } from '../recurrence-form';
import { loadRecurrenceFormData } from '../form-data';
import { DeleteRecurrenceButton, TriggerPanel } from './trigger-panel';
import { Tabs } from '@/components/ui/tabs';

export const metadata: Metadata = { title: 'Recurring transaction' };

export default async function RecurrenceDetailPage({
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
  const tab = typeof query.tab === 'string' ? query.tab : 'schedule';

  let recurrence;
  try {
    recurrence = (await getRecurrence(id)).data;
  } catch {
    notFound();
  }

  const [created, formData] = await Promise.all([
    tab === 'created' ? getRecurrenceTransactions(id) : Promise.resolve({ data: [], meta: {} }),
    tab === 'edit' ? loadRecurrenceFormData() : Promise.resolve(null),
  ]);

  const a = recurrence.attributes;
  const repetition = a.repetitions[0];
  const transaction = a.transactions[0];
  const occurrences = repetition?.occurrences ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/recurring"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Recurring
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{a.title}</h1>
          <p className="text-muted-foreground text-sm">
            {repetition?.description ?? 'No schedule'}
            {a.active ? '' : ' · paused'}
          </p>
        </div>
        {transaction ? (
          <Amount
            value={a.type === 'withdrawal' ? `-${transaction.amount}` : transaction.amount}
            currency={transaction.currency_code ?? connection.primaryCurrency}
            size="xl"
            tone={a.type === 'transfer' ? 'transfer' : 'auto'}
          />
        ) : null}
      </header>

      <Tabs
        label="Sections"
        basePath={`/recurring/${id}`}
        active={tab}
        tabs={[
          { id: 'schedule', label: 'Schedule' },
          { id: 'created', label: 'Created' },
          { id: 'edit', label: 'Edit' },
        ]}
      />

      {tab === 'schedule' ? (
        <div className="space-y-4">
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">Next occurrences</p>
                <p className="text-muted-foreground text-xs">
                  Firefly works these out from the schedule — this is its answer, not ours.
                </p>
              </div>
              {occurrences.length === 0 ? (
                <p className="text-muted-foreground p-8 text-center text-sm">
                  No further occurrences.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {occurrences.map((date) => (
                    <li key={date} className="px-4 py-2.5 text-sm">
                      {formatDate(date.slice(0, 10), { timezone: session.user.timezone })}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <TriggerPanel
            id={id}
            today={toApiDate(now(session.user.timezone), session.user.timezone)}
          />
        </div>
      ) : null}

      {tab === 'created' ? (
        <Card>
          <CardContent className="p-0">
            <TransactionList
              groups={created.data}
              timezone={session.user.timezone}
              empty="This has not created anything yet."
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === 'edit' && formData ? (
        <div className="space-y-6">
          <RecurrenceForm recurrence={recurrence} {...formData} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this</p>
                <p className="text-muted-foreground text-sm">
                  Transactions it already created stay where they are.
                </p>
              </div>
              <DeleteRecurrenceButton id={id} title={a.title} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
