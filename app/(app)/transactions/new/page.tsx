import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getTransaction } from '@/server/firefly/queries';
import { splitsToInputs } from '@/server/firefly/transaction-actions';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { toApiDate, now } from '@/lib/date';

export const metadata: Metadata = { title: 'New transaction' };

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const { from } = await searchParams;
  const today = toApiDate(now(session.user.timezone), session.user.timezone);

  // E5-10 — "duplicate" lands here with ?from=, pre-filling from the original
  // but dated today.
  if (from) {
    try {
      const source = (await getTransaction(from)).data;
      const splits = source.attributes.transactions;
      const first = splits[0];
      if (first) {
        return (
          <Shell title="Duplicate transaction">
            <TransactionForm
              initialType={first.type as 'withdrawal' | 'deposit' | 'transfer'}
              initialDate={today}
              initialCurrency={first.currency_code}
              initialGroupTitle={source.attributes.group_title ?? ''}
              initialSplits={await splitsToInputs(splits)}
            />
          </Shell>
        );
      }
    } catch {
      // fall through to a blank form
    }
  }

  return (
    <Shell title="New transaction">
      <TransactionForm initialDate={today} initialCurrency={connection.primaryCurrency} />
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/transactions"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Transactions
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}
