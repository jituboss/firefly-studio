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

  /*
   * E8-07 — "Create a matching rule" on a subscription lands here with the
   * subscription's name, and the builder opens already filled in: match the
   * description, link the result to that subscription.
   *
   * `description_contains` rather than `description_is`, because a bank writes
   * "NETFLIX.COM 866-579-7172" where the subscription is called "Netflix". An
   * exact match would produce a rule that matches nothing and looks like the
   * feature is broken.
   */
  const bill = typeof params.bill === 'string' ? params.bill : undefined;
  const prefill = bill
    ? {
        title: `Link ${bill} payments`,
        triggers: [{ type: 'description_contains', value: bill }],
        actions: [{ type: 'link_to_bill', value: bill }],
      }
    : undefined;

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
        {bill ? (
          <p className="text-muted-foreground text-sm">
            Started from the <strong className="font-medium">{bill}</strong> subscription. Check the
            description it matches on — your bank may write it differently.
          </p>
        ) : null}
      </div>
      <RuleBuilder groups={groups.data} defaultGroupId={group} prefill={prefill} />
    </div>
  );
}
