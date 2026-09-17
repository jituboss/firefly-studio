import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAccountsSafe } from '@/server/firefly/queries';
import {
  accountBucket,
  countsTowardNetWorth,
  moneyKind,
  roleLabel,
  summariseNetWorth,
} from '@/lib/account-summary';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HideBalancesToggle } from '@/components/hide-balances';
import { AccountBrowser, type AccountRow } from './account-browser';
import type { Account } from '@/server/firefly/types';
import type { AccountBucket as Bucket } from '@/lib/account-summary';

export const metadata: Metadata = { title: 'Accounts' };

/**
 * Firefly's unfiltered /v1/accounts can default to a subset of types depending
 * on configuration, so each type is requested explicitly and merged.
 */
const FETCH_TYPES = [
  'asset',
  'liabilities',
  'cash',
  'expense',
  'revenue',
  'initial-balance',
  'reconciliation',
] as const;

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const params = await searchParams;
  const rawView = typeof params.view === 'string' ? params.view : 'money';
  const view: Bucket = (['money', 'payee', 'income', 'internal'] as const).includes(
    rawView as Bucket,
  )
    ? (rawView as Bucket)
    : 'money';

  const responses = await Promise.all(FETCH_TYPES.map((type) => getAccountsSafe({ type })));

  // Firefly can return the same account under more than one type query, so
  // de-duplicate before anything is counted or totalled.
  const byId = new Map<string, Account>();
  for (const response of responses) {
    for (const account of response.data) byId.set(account.id, account);
  }
  const accounts = [...byId.values()];

  const summary = summariseNetWorth(accounts, connection.primaryCurrency);

  const rows: AccountRow[] = accounts.map((account) => {
    const a = account.attributes;
    const bucket = accountBucket(a.type);
    return {
      id: account.id,
      name: a.name,
      bucket,
      kind: bucket === 'money' ? moneyKind(account) : null,
      role: bucket === 'money' ? roleLabel(account) : '',
      balance: a.current_balance ?? '0',
      currency: a.currency_code ?? connection.primaryCurrency,
      decimals: a.currency_decimal_places ?? 2,
      active: a.active !== false,
      countsTowardNetWorth: countsTowardNetWorth(account),
      lastActivity: a.last_activity ? a.last_activity.slice(0, 10) : null,
      detail: a.iban ?? a.account_number ?? null,
    };
  });

  const moneyCount = rows.filter((row) => row.bucket === 'money').length;

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground truncate text-sm">
            {moneyCount} of your own account{moneyCount === 1 ? '' : 's'} · {rows.length} total in
            Firefly
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesToggle />
          <Button asChild size="sm">
            <Link href="/accounts/new">
              <Plus className="size-4" aria-hidden="true" />
              New account
            </Link>
          </Button>
        </div>
      </header>

      {view === 'money' ? (
        <section className="grid min-w-0 gap-4 sm:grid-cols-3">
          <SummaryTile
            label="Net worth"
            value={summary.netWorth}
            currency={summary.currency}
            tone="auto"
            note={
              summary.excludedAccounts > 0
                ? `Today · ${summary.countedAccounts} counted, ${summary.excludedAccounts} archived or off net worth`
                : `Today · ${summary.countedAccounts} accounts counted`
            }
          />
          <SummaryTile
            label="Assets"
            value={summary.assets}
            currency={summary.currency}
            tone="neutral"
          />
          <SummaryTile
            label="Liabilities"
            value={summary.liabilities}
            currency={summary.currency}
            tone="auto"
            note={
              summary.otherCurrencies.length > 0
                ? `Excludes ${summary.otherCurrencies.map((entry) => entry.currency).join(', ')} — no conversion rate`
                : undefined
            }
          />
        </section>
      ) : null}

      <AccountBrowser
        rows={rows}
        view={view}
        timezone={session.user.timezone}
        locale={session.user.locale}
      />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  currency,
  tone,
  note,
}: {
  label: string;
  value: string;
  currency: string;
  tone: 'auto' | 'neutral' | 'income' | 'expense';
  note?: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div className="mt-1.5 min-w-0">
          <Amount
            value={value}
            currency={currency}
            size="xl"
            compact
            showSign={false}
            tone={tone}
          />
        </div>
        {note ? <p className="text-muted-foreground mt-1 text-xs">{note}</p> : null}
      </CardContent>
    </Card>
  );
}
