import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Plus, Workflow } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getBill, getBillTransactions, getRules } from '@/server/firefly/queries';
import { formatDate } from '@/lib/date';
import { describeRuleMatch, rulesLinkedToBill } from '@/lib/bill-rules';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { BillForm } from '../bill-form';
import { DeleteBillButton } from './delete-button';
import { Tabs } from '@/components/ui/tabs';

export const metadata: Metadata = { title: 'Subscription' };

export default async function BillDetailPage({
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
  const tab = typeof query.tab === 'string' ? query.tab : 'transactions';

  let bill;
  try {
    bill = (await getBill(id)).data;
  } catch {
    notFound();
  }

  const transactions = await getBillTransactions(id, { limit: 25 });
  const a = bill.attributes;

  /*
   * E8-07 — which rules automate this subscription.
   *
   * Read every rule and filter, because Firefly offers no reverse lookup: the
   * link lives in a rule's `link_to_bill` action and `/bills/{id}` never
   * mentions it. `getRules` is a safe read capped at 200 and tag-cached, and a
   * personal ledger does not have 200 rules — but the count is worth knowing
   * before anyone points this at an instance that does.
   */
  const rules = await getRules();
  const linkedRules = rulesLinkedToBill(rules.data, a.name);
  const currency = a.currency_code ?? connection.primaryCurrency;

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <Link
        href="/bills"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Subscriptions
      </Link>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{a.name}</h1>
          {!a.active ? <Badge variant="secondary">Inactive</Badge> : null}
        </div>
        <p className="text-muted-foreground text-sm capitalize">
          {a.repeat_freq} · {a.amount_min === a.amount_max ? '' : `${a.amount_min}–`}
          {a.amount_max} {currency}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Next expected
            </p>
            <p className="mt-1.5 text-lg font-semibold">
              {a.next_expected_match
                ? formatDate(a.next_expected_match.slice(0, 10), {
                    timezone: session.user.timezone,
                    style: 'relative',
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              First due
            </p>
            <p className="mt-1.5 text-lg font-semibold">
              {formatDate(a.date.slice(0, 10), { timezone: session.user.timezone })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Payments recorded
            </p>
            <p className="mt-1.5 text-lg font-semibold">{a.paid_dates?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        label="Subscription sections"
        basePath={`/bills/${id}`}
        active={tab}
        tabs={[
          { id: 'transactions', label: 'Transactions' },
          { id: 'rules', label: 'Rules', badge: linkedRules.length || undefined },
          { id: 'edit', label: 'Edit' },
        ]}
      />

      {tab === 'transactions' ? (
        <Card>
          <CardContent className="p-0">
            {transactions.data.length === 0 ? (
              <p className="text-muted-foreground p-10 text-center text-sm">
                No matched transactions yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {transactions.data.map((group) => {
                  const split = group.attributes.transactions[0];
                  if (!split) return null;
                  return (
                    <li key={group.id}>
                      <Link
                        href={`/transactions/${group.id}`}
                        className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{split.description}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {formatDate(split.date.slice(0, 10), {
                              timezone: session.user.timezone,
                            })}
                          </p>
                        </div>
                        <Amount
                          value={`-${split.amount}`}
                          currency={split.currency_code}
                          decimalPlaces={split.currency_decimal_places}
                          tone="expense"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : tab === 'rules' ? (
        <div className="space-y-4">
          {/*
            The CTA sits above the list, not below it, and is present whether or
            not rules already exist. "Add another" is the common case once one
            exists — a rule per description variant is how a bank that writes
            the same subscription three ways gets handled.
          */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="text-sm font-medium">Automate this subscription</p>
                <p className="text-muted-foreground text-sm">
                  A rule can link matching transactions to {a.name} as they arrive, so the
                  subscription stays up to date without anyone tagging it by hand.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/rules/new?bill=${encodeURIComponent(a.name)}`}>
                  <Plus className="size-4" aria-hidden="true" />
                  {linkedRules.length ? 'Add another rule' : 'Create a matching rule'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {linkedRules.length === 0 ? (
            /* EmptyState renders its own Card — nesting it in another gives a
               card inside a card with two borders. */
            <EmptyState
              icon={Workflow}
              title="No rules link to this subscription"
              description="Transactions are matched by amount and date until one does. A rule matching the description is more precise, and it works the moment the transaction lands."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-border divide-y">
                  {linkedRules.map((rule) => (
                    <li key={rule.id}>
                      <Link
                        href={`/rules/${rule.id}`}
                        className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{rule.attributes.title}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            Matches {describeRuleMatch(rule)}
                          </p>
                        </div>
                        {rule.attributes.active ? null : (
                          <Badge variant="secondary" className="shrink-0">
                            inactive
                          </Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <BillForm bill={bill} defaultCurrency={connection.primaryCurrency} />
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium">Delete this subscription</p>
                <p className="text-muted-foreground text-sm">
                  Matched transactions are not affected.
                </p>
              </div>
              <DeleteBillButton id={id} name={a.name} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
