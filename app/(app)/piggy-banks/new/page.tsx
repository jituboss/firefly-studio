import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getActiveConnection } from '@/server/firefly/api';
import { PiggyForm } from '../piggy-form';

export const metadata: Metadata = { title: 'New piggy bank' };

export default async function NewPiggyBankPage() {
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <Link
        href="/piggy-banks"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Piggy banks
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New piggy bank</h1>
      <PiggyForm defaultCurrency={connection.primaryCurrency} />
    </div>
  );
}
