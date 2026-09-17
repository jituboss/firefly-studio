import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getAccountsSafe } from '@/server/firefly/queries';
import { getNetWorthChart } from '@/server/firefly/report-queries';
import { resolveReportScope } from '@/lib/report-scope';
import { buildNetWorth, type NetWorthAccountMeta } from '@/lib/reports';
import { Amount } from '@/components/ui/amount';
import { NetWorthArea } from '@/components/charts/net-worth-area';
import {
  CurrencyNotice,
  EmptyReport,
  ReportSection,
  ReportStat,
} from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Net worth report' };

/**
 * E14-02 — the net-worth report.
 *
 * Daily buckets for a month-or-shorter window, monthly beyond it: a year of
 * daily points is 365 ticks of noise, and Firefly computes each one.
 */
function bucketFor(start: string, end: string): '1D' | '1W' | '1M' {
  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 + 1;
  if (days <= 62) return '1D';
  if (days <= 190) return '1W';
  return '1M';
}

export default async function NetWorthReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const params = await searchParams;
  const scope = resolveReportScope(params, connection.primaryCurrency, session.user.timezone);

  const [chart, assets, liabilities] = await Promise.all([
    getNetWorthChart(
      { start: scope.start, end: scope.end, accounts: scope.accounts },
      bucketFor(scope.start, scope.end),
    ),
    getAccountsSafe({ type: 'asset', limit: 300 }),
    getAccountsSafe({ type: 'liabilities', limit: 300 }),
  ]);

  // The chart endpoint identifies accounts by NAME only — no id — so the name
  // is the only key available to join back to the account's type and its
  // include-in-net-worth flag.
  const meta = new Map<string, NetWorthAccountMeta>();
  for (const account of assets.data) {
    meta.set(account.attributes.name, {
      kind: 'asset',
      includeNetWorth: account.attributes.include_net_worth !== false,
    });
  }
  for (const account of liabilities.data) {
    meta.set(account.attributes.name, {
      kind: 'liability',
      includeNetWorth: account.attributes.include_net_worth !== false,
    });
  }

  const report = buildNetWorth(chart, meta, scope.currency);

  if (report.points.length === 0) {
    return (
      <EmptyReport message="No balance history for this period. Try a wider date range, or check that this connection has asset accounts." />
    );
  }

  const assetRows = report.accounts.filter((row) => row.kind === 'asset');
  const liabilityRows = report.accounts.filter((row) => row.kind === 'liability');

  const exportRows = report.points.map((point) => ({
    date: point.date,
    assets: point.assets,
    liabilities: point.liabilities,
    net_worth: point.net,
    currency: report.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Net worth"
          value={report.closingNet}
          currency={report.currency}
          tone="neutral"
          change={report.change}
        />
        <ReportStat
          label="Assets"
          value={report.closingAssets}
          currency={report.currency}
          tone="income"
          hint={`${assetRows.length} account${assetRows.length === 1 ? '' : 's'}`}
        />
        <ReportStat
          label="Liabilities"
          value={report.closingLiabilities}
          currency={report.currency}
          tone="expense"
          hint={`${liabilityRows.length} account${liabilityRows.length === 1 ? '' : 's'}`}
        />
        <ReportStat
          label="Change"
          value={report.change.absolute}
          currency={report.currency}
          tone="auto"
          hint={scope.label}
        />
      </div>

      <ReportSection
        title="Assets and liabilities over time"
        description={`${scope.label} · opening net worth ${report.openingNet}`}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`net-worth-${scope.start}-to-${scope.end}`}
          />
        }
      >
        <NetWorthArea
          data={report.points}
          currency={report.currency}
          timezone={session.user.timezone}
          locale={session.user.locale}
        />
        <CurrencyNotice currency={report.currency} otherCurrencies={report.otherCurrencies} />
        {report.excludedAccounts > 0 ? (
          <p className="text-muted-foreground text-xs">
            {report.excludedAccounts} account{report.excludedAccounts === 1 ? '' : 's'} excluded, as
            flagged in Firefly, so this figure matches your dashboard.
          </p>
        ) : null}
      </ReportSection>

      <ReportSection
        title="Per-account contribution"
        description="Opening and closing balance for every account inside the total."
        breakBefore
      >
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-0 text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-xs">
                <th scope="col" className="py-1.5 pr-3 font-medium">
                  Account
                </th>
                <th scope="col" className="hidden py-1.5 pr-3 text-right font-medium sm:table-cell">
                  Opening
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Closing
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {report.accounts.map((row) => (
                <tr key={`${row.kind}-${row.name}`} className="border-border/60 border-b">
                  <td className="max-w-[16rem] py-2 pr-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-full ${
                          row.kind === 'liability' ? 'bg-expense' : 'bg-income'
                        }`}
                      />
                      <span className="truncate">{row.name}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {row.percent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="hidden py-2 pr-3 text-right sm:table-cell">
                    <Amount
                      value={row.opening}
                      currency={report.currency}
                      showSign={false}
                      tone="neutral"
                    />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Amount
                      value={row.closing}
                      currency={report.currency}
                      showSign={false}
                      tone="neutral"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <Amount value={row.change} currency={report.currency} tone="auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-xs" data-print="hide">
          <Link href="/accounts" className="hover:text-primary hover:underline">
            Manage accounts →
          </Link>
        </p>
      </ReportSection>
    </div>
  );
}
