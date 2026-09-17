import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getActiveConnection } from '@/server/firefly/api';
import { BudgetForm } from '../budget-form';

export const metadata: Metadata = { title: 'New budget' };

export default async function NewBudgetPage() {
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <Link
        href="/budgets"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Budgets
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New budget</h1>
      <BudgetForm defaultCurrency={connection.primaryCurrency} />
    </div>
  );
}
