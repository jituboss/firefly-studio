import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getRuleGroup,
  getRuleTestAccounts,
  getRulesInGroup,
  testRuleGroup,
} from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { describeKeyword, findAction, findTrigger } from '@/lib/rule-vocabulary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { TransactionList } from '@/components/transactions/transaction-list';
import { RuleGroupForm } from '../group-form';
import { DeleteRuleGroupButton } from './delete-button';
import { RunPanel } from '../../[id]/run-panel';

export const metadata: Metadata = { title: 'Rule group' };

/** E11-01 / E11-06 — a group, the rules in it, and a group-wide dry run. */
export default async function RuleGroupPage({
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
  const range = resolveRangeFromParams(query, session.user.timezone);
  const tab = typeof query.tab === 'string' ? query.tab : 'rules';

  let group;
  try {
    group = (await getRuleGroup(id)).data;
  } catch {
    notFound();
  }

  const accountIds = tab === 'matches' ? await getRuleTestAccounts() : [];

  const [rulesResult, matches] = await Promise.all([
    getRulesInGroup(id),
    tab === 'matches'
      ? testRuleGroup(id, { start: range.start, end: range.end, accountIds })
      : Promise.resolve({ data: [], meta: {} }),
  ]);

  const rules = [...rulesResult.data].sort((a, b) => a.attributes.order - b.attributes.order);

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <Link
        href="/rules"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Rules
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {group.attributes.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {rules.length} rule{rules.length === 1 ? '' : 's'}
            {group.attributes.active ? '' : ' · inactive'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker label={range.label} />
          <Button asChild size="sm">
            <Link href={`/rules/new?group=${id}`}>
              <Plus className="size-4" aria-hidden="true" />
              Add rule
            </Link>
          </Button>
        </div>
      </header>

      <nav className="flex gap-1 border-b" aria-label="Group sections">
        {[
          { id: 'rules', label: 'Rules' },
          { id: 'matches', label: 'Matches' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={`/rules/groups/${id}?tab=${entry.id}&range=${range.preset}`}
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

      {tab === 'rules' ? (
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-0">
            {rules.length === 0 ? (
              <p className="text-muted-foreground p-10 text-center text-sm">
                Nothing in this group yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {rules.map((rule) => {
                  const [trigger] = rule.attributes.triggers;
                  const [action] = rule.attributes.actions;
                  return (
                    <li key={rule.id}>
                      <Link
                        href={`/rules/${rule.id}`}
                        className="hover:bg-accent/50 block min-w-0 px-4 py-3 transition-colors"
                      >
                        <p className="truncate text-sm font-medium">
                          {rule.attributes.title}
                          {rule.attributes.active ? null : (
                            <span className="text-muted-foreground ml-2 text-xs">paused</span>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {trigger
                            ? describeKeyword(findTrigger(trigger.type), trigger.value)
                            : 'No conditions'}
                          {' → '}
                          {action
                            ? describeKeyword(findAction(action.type), action.value)
                            : 'No actions'}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'matches' ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">
                  {matches.data.length} match{matches.data.length === 1 ? '' : 'es'} across the
                  group
                </p>
                <p className="text-muted-foreground text-xs">
                  A dry run — nothing here has been changed.
                </p>
              </div>
              <TransactionList
                groups={matches.data}
                timezone={session.user.timezone}
                empty="Nothing in this period matches any rule in this group."
              />
            </CardContent>
          </Card>
          <RunPanel id={id} scope="group" start={range.start} end={range.end} />
        </div>
      ) : null}

      {tab === 'edit' ? (
        <div className="space-y-6">
          <RuleGroupForm group={group} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this group</p>
                <p className="text-muted-foreground text-sm">
                  Deletes every rule inside it. This cannot be undone.
                </p>
              </div>
              <DeleteRuleGroupButton id={id} title={group.attributes.title} count={rules.length} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
