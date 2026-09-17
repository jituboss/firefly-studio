import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Ban } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getRule, getRuleGroups, getRuleTestAccounts, testRule } from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { describeKeyword, findAction, findTrigger } from '@/lib/rule-vocabulary';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { TransactionList } from '@/components/transactions/transaction-list';
import { RuleBuilder } from '../rule-builder';
import { DeleteRuleButton, RunPanel } from './run-panel';

export const metadata: Metadata = { title: 'Rule' };

export default async function RuleDetailPage({
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
  const tab = typeof query.tab === 'string' ? query.tab : 'matches';

  let rule;
  try {
    rule = (await getRule(id)).data;
  } catch {
    notFound();
  }

  // The dry-run has to be scoped to accounts or it silently matches nothing —
  // see `testRule` in server/firefly/queries.ts.
  const accountIds = tab === 'matches' ? await getRuleTestAccounts() : [];

  const [groups, matches] = await Promise.all([
    getRuleGroups(),
    // E11-04 — the dry-run. A GET that changes nothing, so it is safe to do on
    // every page view and is the thing worth showing first.
    tab === 'matches'
      ? testRule(id, { start: range.start, end: range.end, accountIds })
      : Promise.resolve({ data: [], meta: {} }),
  ]);

  const a = rule.attributes;

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
          <h1 className="truncate text-2xl font-semibold tracking-tight">{a.title}</h1>
          <p className="text-muted-foreground text-sm">
            {a.rule_group_title ?? 'Ungrouped'}
            {a.active ? '' : ' · paused'}
            {a.strict ? ' · all conditions' : ' · any condition'}
          </p>
          {a.description ? <p className="text-muted-foreground text-sm">{a.description}</p> : null}
        </div>
        <DateRangePicker label={range.label} />
      </header>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              When
            </p>
            <ul className="mt-2 space-y-1">
              {a.triggers.map((trigger, index) => (
                <li key={trigger.id ?? index} className="flex items-start gap-1.5 text-sm">
                  {trigger.prohibited ? (
                    <Ban className="text-expense mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                  <span className={trigger.active ? '' : 'text-muted-foreground line-through'}>
                    {describeKeyword(findTrigger(trigger.type), trigger.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Then
            </p>
            <ul className="mt-2 space-y-1">
              {a.actions.map((action, index) => (
                <li
                  key={action.id ?? index}
                  className={`text-sm ${action.active ? '' : 'text-muted-foreground line-through'}`}
                >
                  {describeKeyword(findAction(action.type), action.value)}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <nav className="flex gap-1 border-b" aria-label="Rule sections">
        {[
          { id: 'matches', label: 'Matches' },
          { id: 'edit', label: 'Edit' },
        ].map((entry) => (
          <Link
            key={entry.id}
            href={`/rules/${id}?tab=${entry.id}&range=${range.preset}`}
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

      {tab === 'matches' ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">
                  {matches.data.length} match{matches.data.length === 1 ? '' : 'es'} in{' '}
                  {range.label.toLowerCase()}
                </p>
                <p className="text-muted-foreground text-xs">
                  A dry run — nothing here has been changed.
                </p>
              </div>
              <TransactionList
                groups={matches.data}
                timezone={session.user.timezone}
                empty="Nothing in this period matches these conditions."
              />
            </CardContent>
          </Card>

          <RunPanel id={id} scope="rule" start={range.start} end={range.end} />
        </div>
      ) : (
        <div className="space-y-6">
          <RuleBuilder rule={rule} groups={groups.data} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this rule</p>
                <p className="text-muted-foreground text-sm">
                  Transactions it already changed keep those changes.
                </p>
              </div>
              <DeleteRuleButton id={id} title={a.title} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
