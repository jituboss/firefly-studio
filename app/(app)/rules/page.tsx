import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, FolderPlus, Workflow } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getRuleGroups, getRules } from '@/server/firefly/queries';
import { describeKeyword, findAction, findTrigger } from '@/lib/rule-vocabulary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Rule } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Rules' };

/** One line summarising what a rule does, for the list row. */
function summarise(rule: Rule): string {
  const [first] = rule.attributes.actions;
  if (!first) return 'No actions';
  const described = describeKeyword(findAction(first.type), first.value);
  const extra = rule.attributes.actions.length - 1;
  return extra > 0 ? `${described} +${extra} more` : described;
}

/** E11-01 / E11-03 — rules, grouped the way Firefly runs them. */
export default async function RulesPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const [groupsResult, rulesResult] = await Promise.all([getRuleGroups(), getRules()]);

  // Firefly runs groups in `order`, and the rules inside them in their own
  // `order`. Listing them any other way would misrepresent what happens.
  const groups = [...groupsResult.data].sort((a, b) => a.attributes.order - b.attributes.order);
  const byGroupId = new Map<string, Rule[]>();
  for (const rule of rulesResult.data) {
    const list = byGroupId.get(rule.attributes.rule_group_id) ?? [];
    list.push(rule);
    byGroupId.set(rule.attributes.rule_group_id, list);
  }
  for (const list of byGroupId.values()) {
    list.sort((a, b) => a.attributes.order - b.attributes.order);
  }

  const total = rulesResult.data.length;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Rules</h1>
          <p className="text-muted-foreground truncate text-sm">
            {total} rule{total === 1 ? '' : 's'} in {groups.length} group
            {groups.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/rules/groups/new">
              <FolderPlus className="size-4" aria-hidden="true" />
              New group
            </Link>
          </Button>
          {groups.length > 0 ? (
            <Button asChild size="sm">
              <Link href="/rules/new">
                <Plus className="size-4" aria-hidden="true" />
                New rule
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Workflow className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">No rules yet.</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
              Rules do the filing for you — categorise the weekly shop, tag every subscription, flag
              anything over a threshold. Rules live in groups, which run in order, so start with a
              group.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/rules/groups/new">Create your first group</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const rules = byGroupId.get(group.id) ?? [];
            return (
              <section key={group.id} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/rules/groups/${group.id}`}
                      className="hover:text-primary text-sm font-semibold transition-colors"
                    >
                      {group.attributes.title}
                    </Link>
                    {group.attributes.active ? null : (
                      <span className="text-muted-foreground ml-2 text-xs">(inactive)</span>
                    )}
                    {group.attributes.description ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {group.attributes.description}
                      </p>
                    ) : null}
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/rules/new?group=${group.id}`}>Add rule</Link>
                  </Button>
                </div>

                <Card className="min-w-0 overflow-hidden">
                  <CardContent className="p-0">
                    {rules.length === 0 ? (
                      <p className="text-muted-foreground p-6 text-center text-sm">
                        Nothing in this group yet.
                      </p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {rules.map((rule) => {
                          const [firstTrigger] = rule.attributes.triggers;
                          return (
                            <li key={rule.id}>
                              <Link
                                href={`/rules/${rule.id}`}
                                className="hover:bg-accent/50 block min-w-0 px-4 py-3 transition-colors"
                              >
                                <div className="flex items-baseline justify-between gap-3">
                                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                                    {rule.attributes.title}
                                  </p>
                                  {rule.attributes.active ? null : (
                                    <span className="text-muted-foreground shrink-0 text-xs">
                                      paused
                                    </span>
                                  )}
                                </div>
                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                  {firstTrigger
                                    ? describeKeyword(
                                        findTrigger(firstTrigger.type),
                                        firstTrigger.value,
                                      )
                                    : 'No conditions'}
                                  {' → '}
                                  {summarise(rule)}
                                </p>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
