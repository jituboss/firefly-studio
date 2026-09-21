import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Ban, ExternalLink } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getAllBills,
  getRule,
  getRuleGroups,
  getRuleTestAccounts,
  testRule,
} from '@/server/firefly/queries';
import { resolveRangeFromParams } from '@/lib/date-range';
import { describeKeyword, findAction, findTrigger } from '@/lib/rule-vocabulary';
import { LINK_TO_BILL } from '@/lib/bill-rules';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { TransactionList } from '@/components/transactions/transaction-list';
import { RuleBuilder } from '../rule-builder';
import { DeleteRuleButton, RunPanel } from './run-panel';
import { Tabs } from '@/components/ui/tabs';

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

  const linksToBill = rule.attributes.actions.some((action) => action.type === LINK_TO_BILL);

  const [groups, matches, bills] = await Promise.all([
    getRuleGroups(),
    // E11-04 — the dry-run. A GET that changes nothing, so it is safe to do on
    // every page view and is the thing worth showing first.
    tab === 'matches'
      ? testRule(id, { start: range.start, end: range.end, accountIds })
      : Promise.resolve({ data: [], meta: {} }),
    // Only when there is a link to resolve — most rules have none, and this
    // would otherwise add a request to every rule page to answer a question
    // nobody asked.
    linksToBill ? getAllBills() : Promise.resolve({ data: [], meta: {} }),
  ]);

  // Keyed the way the values compare: trimmed and lowercased, matching
  // lib/bill-rules.
  const billIdsByName = new Map(
    bills.data.map((bill) => [bill.attributes.name.trim().toLowerCase(), bill.id]),
  );

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
              {a.actions.map((action, index) => {
                /*
                 * A `link_to_bill` action names a real subscription, so make it
                 * one click away. Reading a rule and wanting to see what it
                 * feeds is the obvious next question, and before this the
                 * answer was to memorise the name and go and search for it.
                 *
                 * Falls back to plain text when the name resolves to nothing:
                 * Firefly validates the name on save, so a miss here means the
                 * subscription was deleted afterwards, and a dead link is a
                 * worse answer than none.
                 */
                const billId =
                  action.type === LINK_TO_BILL && action.value
                    ? billIdsByName.get(action.value.trim().toLowerCase())
                    : undefined;
                const label = describeKeyword(findAction(action.type), action.value);
                return (
                  <li
                    key={action.id ?? index}
                    className={`text-sm ${action.active ? '' : 'text-muted-foreground line-through'}`}
                  >
                    {billId ? (
                      <Link
                        href={`/bills/${billId}?tab=rules`}
                        className="hover:text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        {label}
                        <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                      </Link>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs
        label="Rule sections"
        basePath={`/rules/${id}`}
        query={{ range: range.preset }}
        active={tab}
        tabs={[
          { id: 'matches', label: 'Matches' },
          { id: 'edit', label: 'Edit' },
        ]}
      />

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
