import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAccountsSafe, getBasicSummary } from '@/server/firefly/queries';
import { toDecimal } from '@/lib/money';
import type { Decimal } from 'decimal.js';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HideBalancesToggle } from '@/components/hide-balances';
import { AccountFilters } from './filters';
import type { Account, AccountType, BasicSummary } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Accounts' };

/** Display order requested by the user. Types that are not present are hidden. */
const TYPE_ORDER: AccountType[] = [
  'asset',
  'expense',
  'revenue',
  'liabilities',
  'cash',
  'initial-balance',
  'reconciliation',
];

const TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset accounts',
  expense: 'Expense accounts',
  revenue: 'Revenue accounts',
  liabilities: 'Liabilities',
  cash: 'Cash',
  'initial-balance': 'Initial balance',
  reconciliation: 'Reconciliation',
};

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

  const today = new Date().toISOString().slice(0, 10);
  const [allTypeResponses, summary] = await Promise.all([
    fetchAccountsByType(typeFilter),
    getBasicSummary(today, today),
  ]);

  const accounts = allTypeResponses
    .flatMap((response) => response.data)
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

  const isFiltered = typeFilter !== 'all';

  const groups = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    accounts: accounts.filter((account) => account.attributes.type === type),
  })).filter((group) => group.accounts.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground truncate text-sm">
            {accounts.length} account{accounts.length === 1 ? '' : 's'}
            {isFiltered ? ` · ${TYPE_LABELS[typeFilter as AccountType] ?? typeFilter}` : ''}
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

      {!isFiltered && (
        <section className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedTile
            label="Net worth"
            accounts={accounts}
            types={['asset', 'cash']}
            minusTypes={['liabilities']}
          />
          <ComputedTile label="Total assets" accounts={accounts} types={['asset', 'cash']} />
          <ComputedTile label="Total liabilities" accounts={accounts} types={['liabilities']} />
          <SummaryTile label="Balance" summary={summary} prefix="balance-in-" />
        </section>
      )}

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
        groups.map((group) => (
          <AccountGroup
            key={group.type}
            type={group.type}
            label={group.label}
            accounts={group.accounts}
            filtered={isFiltered}
          />
        ))
      )}
    </div>
  );
}

function fetchAccountsByType(typeFilter: string) {
  if (typeFilter !== 'all') {
    return Promise.all([getAccountsSafe({ type: typeFilter })]);
  }
  // Firefly's unfiltered /v1/accounts endpoint can default to a subset of
  // types in some configurations, so explicitly request every type we care
  // about and merge the results. This guarantees Assets appear first on the
  // landing page regardless of API defaults.
  return Promise.all(TYPE_ORDER.map((type) => getAccountsSafe({ type })));
}

function ComputedTile({
  label,
  accounts,
  types,
  minusTypes = [],
}: {
  label: string;
  accounts: Account[];
  types: AccountType[];
  minusTypes?: AccountType[];
}) {
  const included = accounts.filter((a) => types.includes(a.attributes.type));
  const subtracted = accounts.filter((a) => minusTypes.includes(a.attributes.type));
  const values = new Map<string, Decimal>();

  for (const account of included) {
    const code = account.attributes.currency_code ?? 'EUR';
    values.set(
      code,
      (values.get(code) ?? toDecimal(0)).plus(toDecimal(account.attributes.current_balance)),
    );
  }
  for (const account of subtracted) {
    const code = account.attributes.currency_code ?? 'EUR';
    values.set(
      code,
      (values.get(code) ?? toDecimal(0)).minus(toDecimal(account.attributes.current_balance)),
    );
  }

  const perCurrency = [...values.entries()]
    .map(([code, value]) => ({ code, value: value.toString() }))
    .filter(({ value }) => !toDecimal(value).isZero())
    .sort((a, b) => a.code.localeCompare(b.code));

  if (perCurrency.length === 0) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0 p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="text-muted-foreground mt-1.5 text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div className="mt-1.5 min-w-0 space-y-0.5">
          {perCurrency.map(({ code, value }) => (
            <Amount
              key={code}
              value={value}
              currency={code}
              size="xl"
              compact
              className="block truncate"
              showSign={false}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  label,
  summary,
  prefix,
}: {
  label: string;
  summary: BasicSummary;
  prefix: string;
}) {
  const matches = Object.entries(summary).filter(([key]) => key.startsWith(prefix));
  if (matches.length === 0) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0 p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="text-muted-foreground mt-1.5 text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div className="mt-1.5 min-w-0 space-y-0.5">
          {matches.map(([key, entry]) => (
            <Amount
              key={key}
              value={String(entry.monetary_value)}
              currency={entry.currency_code}
              size="xl"
              compact
              className="block truncate"
              showSign={false}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountGroup({
  type,
  label,
  accounts,
  filtered,
}: {
  type: string;
  label: string;
  accounts: Account[];
  filtered: boolean;
}) {
  const totals = new Map<string, Decimal>();
  for (const account of accounts) {
    const code = account.attributes.currency_code ?? 'EUR';
    totals.set(
      code,
      (totals.get(code) ?? toDecimal(0)).plus(toDecimal(account.attributes.current_balance)),
    );
  }

  const perCurrency = [...totals.entries()]
    .map(([code, value]) => ({ code, value: value.toString() }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{label}</h2>
          <p className="text-muted-foreground text-xs">
            {accounts.length} account{accounts.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {perCurrency.map(({ code, value }) => (
            <Amount key={code} value={value} currency={code} size="sm" showSign={false} compact />
          ))}
          {!filtered && (
            <Link
              href={`/accounts?type=${type}`}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              View all {accounts.length}
            </Link>
          )}
        </div>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-border divide-y">
            {(filtered ? accounts : accounts.slice(0, 15)).map((account) => (
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
                      {accountSubtitle(account)}
                    </p>
                  </div>
                  <Amount
                    value={account.attributes.current_balance}
                    currency={account.attributes.currency_code ?? 'EUR'}
                    decimalPlaces={account.attributes.currency_decimal_places ?? 2}
                    showSign={false}
                    compact={filtered}
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

function accountSubtitle(account: Account): string {
  const { attributes } = account;
  const role = attributes.account_role?.replace(/Asset$/, '') ?? attributes.account_role;
  const parts = [
    role,
    attributes.liability_type,
    attributes.iban,
    attributes.account_number,
    attributes.last_activity ? `Last activity ${attributes.last_activity.slice(0, 10)}` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : attributes.type;
}
