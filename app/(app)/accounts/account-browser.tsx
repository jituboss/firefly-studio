'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  Search,
  Settings2,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isNegative, toDecimal } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { AccountBucket, MoneyKind } from '@/lib/account-summary';

export interface AccountRow {
  id: string;
  name: string;
  bucket: AccountBucket;
  kind: MoneyKind | null;
  role: string;
  balance: string;
  currency: string;
  decimals: number;
  active: boolean;
  countsTowardNetWorth: boolean;
  lastActivity: string | null;
  detail: string | null;
}

type View = AccountBucket;

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'money', label: 'Your money' },
  { id: 'payee', label: 'Payees' },
  { id: 'income', label: 'Income' },
  { id: 'internal', label: 'Internal' },
];

/** Section order and presentation for the "Your money" view. */
const MONEY_SECTIONS: Array<{
  kind: MoneyKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { kind: 'checking', label: 'Checking', icon: Wallet },
  { kind: 'savings', label: 'Savings', icon: PiggyBank },
  { kind: 'cash', label: 'Cash', icon: Banknote },
  { kind: 'credit', label: 'Credit cards', icon: CreditCard },
  { kind: 'loan', label: 'Loans & debts', icon: Landmark },
];

const VIEW_COPY: Record<
  View,
  { empty: string; valueLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  money: { empty: 'No accounts yet.', valueLabel: 'Balance', icon: Wallet },
  // An expense account's "balance" is really lifetime spend at that payee, and
  // a revenue account's is lifetime received. Calling either a balance, as the
  // old page did, invited people to read a merchant like a bank account.
  payee: { empty: 'No payees yet.', valueLabel: 'Total spent', icon: Store },
  income: { empty: 'No income sources yet.', valueLabel: 'Total received', icon: Landmark },
  internal: { empty: 'Nothing here.', valueLabel: 'Balance', icon: Settings2 },
};

export function AccountBrowser({
  rows,
  view,
  timezone,
  locale,
}: {
  rows: AccountRow[];
  view: View;
  timezone: string;
  locale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);

  const counts = React.useMemo(() => {
    const result: Record<View, number> = { money: 0, payee: 0, income: 0, internal: 0 };
    for (const row of rows) result[row.bucket] += 1;
    return result;
  }, [rows]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.bucket !== view) return false;
      if (!row.active && !showArchived) return false;
      if (!needle) return true;
      return (
        row.name.toLowerCase().includes(needle) ||
        (row.detail ?? '').toLowerCase().includes(needle) ||
        row.role.toLowerCase().includes(needle)
      );
    });
  }, [rows, view, query, showArchived]);

  const archivedInView = rows.filter((row) => row.bucket === view && !row.active).length;

  function switchView(next: View) {
    const search = new URLSearchParams(params.toString());
    if (next === 'money') search.delete('view');
    else search.set('view', next);
    const qs = search.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Account category"
          className="bg-muted inline-flex min-w-0 flex-wrap gap-1 rounded-lg p-0.5"
        >
          {VIEWS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={view === entry.id}
              onClick={() => switchView(entry.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                view === entry.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {entry.label}
              <span className="text-muted-foreground tabular text-[0.6875rem]">
                {counts[entry.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search accounts…"
            aria-label="Search accounts"
            className="pl-8"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {archivedInView > 0 ? (
          <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
              className="size-3.5"
            />
            Show archived ({archivedInView})
          </label>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">
              {query ? `Nothing matches “${query}”.` : VIEW_COPY[view].empty}
            </p>
          </CardContent>
        </Card>
      ) : view === 'money' ? (
        <MoneyView rows={visible} timezone={timezone} locale={locale} />
      ) : (
        <RankedView rows={visible} view={view} timezone={timezone} locale={locale} />
      )}
    </div>
  );
}

function MoneyView({
  rows,
  timezone,
  locale,
}: {
  rows: AccountRow[];
  timezone: string;
  locale: string;
}) {
  return (
    <div className="min-w-0 space-y-5">
      {MONEY_SECTIONS.map((section) => {
        const items = rows
          .filter((row) => row.kind === section.kind)
          .sort((a, b) => toDecimal(b.balance).abs().comparedTo(toDecimal(a.balance).abs()));
        if (items.length === 0) return null;

        return (
          <section key={section.kind} className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <section.icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{section.label}</h2>
              <span className="text-muted-foreground text-xs">{items.length}</span>
            </div>
            <AccountList rows={items} timezone={timezone} locale={locale} />
          </section>
        );
      })}
    </div>
  );
}

/**
 * Payees and income sources are most useful ranked by size — "where does the
 * money actually go" — rather than alphabetically, which is how the old page
 * buried a 2M merchant between two 500-taka ones.
 */
function RankedView({
  rows,
  view,
  timezone,
  locale,
}: {
  rows: AccountRow[];
  view: View;
  timezone: string;
  locale: string;
}) {
  const ranked = [...rows].sort((a, b) =>
    toDecimal(b.balance).abs().comparedTo(toDecimal(a.balance).abs()),
  );

  return (
    <section className="min-w-0 space-y-2">
      <p className="text-muted-foreground text-xs">
        {ranked.length} sorted by {VIEW_COPY[view].valueLabel.toLowerCase()}, largest first
      </p>
      <AccountList rows={ranked} timezone={timezone} locale={locale} showRank />
    </section>
  );
}

function AccountList({
  rows,
  timezone,
  locale,
  showRank = false,
}: {
  rows: AccountRow[];
  timezone: string;
  locale: string;
  showRank?: boolean;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="p-0">
        <ul className="divide-border divide-y">
          {rows.map((row, index) => (
            <li key={row.id}>
              <Link
                href={`/accounts/${row.id}`}
                className="hover:bg-accent/50 flex items-center gap-3 px-4 py-2.5 transition-colors"
              >
                {showRank ? (
                  <span className="text-muted-foreground tabular w-5 shrink-0 text-right text-xs">
                    {index + 1}
                  </span>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">{row.name}</span>
                    {!row.active ? <Badge variant="secondary">Archived</Badge> : null}
                    {row.active && !row.countsTowardNetWorth ? (
                      <Badge variant="outline">Off net worth</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      row.role,
                      row.detail,
                      row.lastActivity
                        ? formatDate(row.lastActivity, { timezone, locale, style: 'relative' })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <Amount
                  value={row.balance}
                  currency={row.currency}
                  decimalPlaces={row.decimals}
                  showSign={false}
                  compact
                  tone={isNegative(row.balance) ? 'expense' : 'neutral'}
                  className="shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
