import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAccountsSafe } from '@/server/firefly/queries';
import { ReportScopeBar, type ScopeAccount } from '@/components/reports/report-scope-bar';
import { ReportTabs } from '@/components/reports/report-tabs';

export const metadata: Metadata = { title: 'Reports' };

/**
 * E14-01 — the report shell.
 *
 * The scope bar and the tab strip live here rather than in each report, so
 * switching between reports keeps the period, account scope and currency you
 * picked. The account list is fetched once for the whole section.
 */
export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  // Asset accounts only: scoping a report to an expense account (a merchant)
  // is not a thing Firefly's insight endpoints support.
  const assets = await getAccountsSafe({ type: 'asset', limit: 300 });

  const accounts: ScopeAccount[] = assets.data
    .filter((account) => account.attributes.active !== false)
    .map((account) => ({
      id: account.id,
      name: account.attributes.name,
      currency: account.attributes.currency_code,
    }));

  const currencies = [
    ...new Set(
      [connection.primaryCurrency, ...accounts.map((account) => account.currency)].filter(
        (code): code is string => Boolean(code),
      ),
    ),
  ].sort();

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground truncate text-sm">{connection.label}</p>
        </div>
        <ReportScopeBar
          accounts={accounts}
          currencies={currencies}
          defaultCurrency={connection.primaryCurrency}
        />
      </header>

      <ReportTabs />

      {children}
    </div>
  );
}
