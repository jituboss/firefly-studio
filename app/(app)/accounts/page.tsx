import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAccountsSafe } from '@/server/firefly/queries';
import { add, toDecimal } from '@/lib/money';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HideBalancesToggle } from '@/components/hide-balances';
import { AccountFilters } from './filters';
import type { Account } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Accounts' };

const GROUPS: Array<{ type: string; label: string }> = [
  { type: 'asset', label: 'Asset accounts' },
  { type: 'liabilities', label: 'Liabilities' },
  { type: 'revenue', label: 'Revenue accounts' },
  { type: 'expense', label: 'Expense accounts' },
  { type: 'cash', label: 'Cash' },
];

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
  const typeFilter = typeof params.type === 'string' ? params.type : 'all';
  const showInactive = params.inactive === '1';
  const sort = typeof params.sort === 'string' ? params.sort : 'name';

  const response = await getAccountsSafe({ type: typeFilter === 'all' ? undefined : typeFilter });

  const accounts = response.data
    .filter((account) => (showInactive ? true : account.attributes.active))
    .sort((a, b) => {
      if (sort === 'balance') {
        return toDecimal(b.attributes.current_balance).comparedTo(
          toDecimal(a.attributes.current_balance),
        );
      }
      if (sort === 'activity') {
        return (b.attributes.last_activity ?? '').localeCompare(a.attributes.last_activity ?? '');
      }
      return a.attributes.name.localeCompare(b.attributes.name);
    });

  const groups = GROUPS.map((group) => ({
    ...group,
    accounts: accounts.filter((account) => account.attributes.type === group.type),
  })).filter((group) => group.accounts.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground text-sm">
            {accounts.length} account{accounts.length === 1 ? '' : 's'}
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

      <AccountFilters type={typeFilter} showInactive={showInactive} sort={sort} />

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No accounts match these filters.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/accounts/new">Create your first account</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => <AccountGroup key={group.type} {...group} />)
      )}
    </div>
  );
}

function AccountGroup({ label, accounts }: { type: string; label: string; accounts: Account[] }) {
  // Totals are only meaningful within a single currency, so group by it.
  const byCurrency = new Map<string, string[]>();
  for (const account of accounts) {
    const code = account.attributes.currency_code ?? 'EUR';
    byCurrency.set(code, [
      ...(byCurrency.get(code) ?? []),
      account.attributes.current_balance ?? '0',
    ]);
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{label}</h2>
        <div className="flex gap-3">
          {[...byCurrency.entries()].map(([code, values]) => (
            <Amount key={code} value={add(...values)} currency={code} size="sm" showSign={false} />
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-border divide-y">
            {accounts.map((account) => (
              <li key={account.id}>
                <Link
                  href={`/accounts/${account.id}`}
                  className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{account.attributes.name}</p>
                      {!account.attributes.active ? (
                        <Badge variant="secondary">Archived</Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {account.attributes.iban ??
                        account.attributes.account_number ??
                        account.attributes.account_role?.replace(/Asset$/, '') ??
                        account.attributes.type}
                    </p>
                  </div>
                  <Amount
                    value={account.attributes.current_balance}
                    currency={account.attributes.currency_code ?? 'EUR'}
                    decimalPlaces={account.attributes.currency_decimal_places ?? 2}
                    showSign={false}
                    tone={
                      toDecimal(account.attributes.current_balance).isNegative()
                        ? 'expense'
                        : 'neutral'
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
