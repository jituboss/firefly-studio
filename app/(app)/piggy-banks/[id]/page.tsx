import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getPiggyBank, getPiggyEvents } from '@/server/firefly/queries';
import { formatDate } from '@/lib/date';
import { isNegative } from '@/lib/money';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PiggyForm } from '../piggy-form';
import { AdjustForm } from './adjust-form';
import { DeletePiggyButton } from './delete-button';

export const metadata: Metadata = { title: 'Piggy bank' };

export default async function PiggyBankDetailPage({
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
  const tab = typeof query.tab === 'string' ? query.tab : 'overview';

  let piggy;
  try {
    piggy = (await getPiggyBank(id)).data;
  } catch {
    notFound();
  }

  const events = await getPiggyEvents(id);
  const a = piggy.attributes;
  const currency = a.currency_code ?? connection.primaryCurrency;
  const account = a.accounts[0];
  const percent = Math.min(100, Math.max(0, a.percentage ?? 0));

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <Link
        href="/piggy-banks"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Piggy banks
      </Link>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{a.name}</h1>
          {!a.active ? <Badge variant="secondary">Inactive</Badge> : null}
        </div>
        {account ? <p className="text-muted-foreground text-sm">{account.name}</p> : null}
      </header>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <Amount
              value={a.current_amount}
              currency={currency}
              size="xl"
              showSign={false}
              tone="neutral"
            />
            <span className="text-muted-foreground tabular text-sm">{percent.toFixed(0)}%</span>
          </div>
          <div
            className="bg-muted h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${a.name} savings progress`}
          >
            <div className="bg-income h-full rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-sm">
            <span>
              Target:{' '}
              <Amount
                value={a.target_amount}
                currency={currency}
                showSign={false}
                tone="neutral"
                size="sm"
              />
            </span>
            {a.left_to_save ? (
              <span>
                Left to save:{' '}
                <Amount
                  value={a.left_to_save}
                  currency={currency}
                  showSign={false}
                  tone="neutral"
                  size="sm"
                />
              </span>
            ) : null}
            {a.target_date ? (
              <span>
                By {formatDate(a.target_date.slice(0, 10), { timezone: session.user.timezone })}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <nav className="flex gap-1 border-b" aria-label="Piggy bank sections">
        {[
          { id: 'overview', label: 'Add / remove' },
          { id: 'history', label: 'History' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={`/piggy-banks/${id}?tab=${entry.id}`}
            className={`border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === entry.id
                ? 'border-primary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {tab === 'overview' && account ? (
        <Card>
          <CardContent className="p-5">
            <AdjustForm piggyId={id} accountId={account.account_id} />
          </CardContent>
        </Card>
      ) : tab === 'history' ? (
        <Card>
          <CardContent className="p-0">
            {events.data.length === 0 ? (
              <p className="text-muted-foreground p-10 text-center text-sm">No activity yet.</p>
            ) : (
              <ul className="divide-border divide-y">
                {[...events.data].reverse().map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-muted-foreground text-sm">
                      {formatDate(event.attributes.created_at.slice(0, 10), {
                        timezone: session.user.timezone,
                      })}
                    </span>
                    <Amount
                      value={event.attributes.amount}
                      currency={event.attributes.currency_code}
                      tone={isNegative(event.attributes.amount) ? 'expense' : 'income'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : tab === 'edit' ? (
        <div className="space-y-6">
          <PiggyForm piggy={piggy} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this piggy bank</p>
                <p className="text-muted-foreground text-sm">This cannot be undone.</p>
              </div>
              <DeletePiggyButton id={id} name={a.name} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
