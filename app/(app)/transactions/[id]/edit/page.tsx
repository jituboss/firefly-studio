import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getTransaction } from '@/server/firefly/queries';
import { splitsToInputs } from '@/server/firefly/transaction-actions';
import { TransactionForm } from '@/components/transactions/transaction-form';

export const metadata: Metadata = { title: 'Edit transaction' };

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const { id } = await params;

  let group;
  try {
    group = (await getTransaction(id)).data;
  } catch {
    notFound();
  }

  const splits = group.attributes.transactions;
  const first = splits[0];
  if (!first) notFound();

  // Firefly returns an ISO datetime; the form needs date and time separately.
  const date = first.date.slice(0, 10);
  const time = first.date.slice(11, 16) || '12:00';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href={`/transactions/${id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to transaction
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Edit transaction</h1>
      <TransactionForm
        transactionId={id}
        initialType={first.type as 'withdrawal' | 'deposit' | 'transfer'}
        initialDate={date}
        initialTime={time}
        initialCurrency={first.currency_code}
        initialGroupTitle={group.attributes.group_title ?? ''}
        initialSplits={await splitsToInputs(splits)}
      />
    </div>
  );
}
