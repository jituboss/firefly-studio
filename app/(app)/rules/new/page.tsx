import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getRuleGroups } from '@/server/firefly/queries';
import { RuleBuilder } from '../rule-builder';

export const metadata: Metadata = { title: 'New rule' };

export default async function NewRulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const groups = await getRuleGroups();
  // A rule cannot exist outside a group, so there is nothing to show yet.
  if (groups.data.length === 0) redirect('/rules/groups/new');

  const params = await searchParams;
  const group = typeof params.group === 'string' ? params.group : undefined;

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
        <h1 className="text-2xl font-semibold tracking-tight">New rule</h1>
      </div>
      <RuleBuilder groups={groups.data} defaultGroupId={group} />
    </div>
  );
}
