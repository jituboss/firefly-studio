import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { RuleGroupForm } from '../group-form';

export const metadata: Metadata = { title: 'New rule group' };

export default async function NewRuleGroupPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6">
      <div className="space-y-1">
        <Link
          href="/rules"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Rules
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New rule group</h1>
        <p className="text-muted-foreground text-sm">
          Groups run in order, and so do the rules inside them.
        </p>
      </div>
      <RuleGroupForm />
    </div>
  );
}
