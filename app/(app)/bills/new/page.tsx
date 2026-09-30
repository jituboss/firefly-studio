import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getActiveConnection } from '@/server/firefly/api';
import { getObjectGroupTitles } from '@/server/firefly/queries';
import { BillForm } from '../bill-form';

export const metadata: Metadata = { title: 'New subscription' };

export default async function NewBillPage() {
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');
  const groups = await getObjectGroupTitles();

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <Link
        href="/bills"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Subscriptions
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New subscription</h1>
      <BillForm defaultCurrency={connection.primaryCurrency} groups={groups} />
    </div>
  );
}
