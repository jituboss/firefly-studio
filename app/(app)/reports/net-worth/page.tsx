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
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
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
        description={
          <>
            {scope.label} · opening net worth{' '}
            <Amount
              value={report.openingNet}
              currency={report.currency}
              showSign={false}
              tone="neutral"
              size="sm"
            />
          </>
        }
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`net-worth-${scope.start}-to-${scope.end}`}
            pdf={{
              title: 'Net worth',
              subtitle: scope.label,
              description:
                'Everything you own less everything you owe, over the period. Accounts marked “exclude from net worth” are left out.',
              period: { start: scope.start, end: scope.end },
              currency: report.currency,
              accent: 'teal',
              locale: session.user.locale,
              timezone: session.user.timezone,
              stats: [
                {
                  label: 'Net worth',
                  value: report.closingNet,
                  currency: report.currency,
                  tone: 'accent',
                  hint: 'At the end of the period',
                },
                {
                  label: 'Assets',
                  value: report.closingAssets,
                  currency: report.currency,
                  tone: 'income',
                  hint: `${assetRows.length} account${assetRows.length === 1 ? '' : 's'}`,
                },
                {
                  label: 'Liabilities',
                  value: report.closingLiabilities,
                  currency: report.currency,
                  tone: 'expense',
                  hint: `${liabilityRows.length} account${liabilityRows.length === 1 ? '' : 's'}`,
                },
                {
                  label: 'Change',
                  value: report.change.absolute,
                  currency: report.currency,
                  tone: 'auto',
                  hint: scope.label,
                },
              ],
              balance: {
                opening: report.openingNet,
                closing: report.closingNet,
                currency: report.currency,
                openingLabel: 'Opening net worth',
                closingLabel: 'Closing net worth',
              },
              charts: [
                {
                  title: 'Assets and liabilities over time',
                  labelKey: 'date',
                  labelKind: 'date',
                  rows: exportRows,
                  series: [
                    { key: 'assets', label: 'Assets', tone: 'income' },
                    { key: 'liabilities', label: 'Liabilities', tone: 'expense' },
                    { key: 'net_worth', label: 'Net worth', tone: 'accent' },
                  ],
                },
              ],
              tableTitle: 'Balances over time',
              columns: [
                { key: 'date', header: 'Date', kind: 'date', width: 1.3 },
                { key: 'assets', header: 'Assets', kind: 'money', tone: 'income' },
                { key: 'liabilities', header: 'Liabilities', kind: 'money', tone: 'expense' },
                { key: 'net_worth', header: 'Net worth', kind: 'money', tone: 'auto' },
              ],
              tables: [
                {
                  title: 'Per-account contribution',
                  description: 'Opening and closing balance of every account in the total.',
                  currency: report.currency,
                  rows: report.accounts.map((row) => ({
                    name: row.name,
                    kind: row.kind === 'asset' ? 'Asset' : 'Liability',
                    opening: row.opening,
                    closing: row.closing,
                    change: row.change,
                    share: row.percent,
                  })),
                  columns: [
                    { key: 'name', header: 'Account', width: 2.2 },
                    { key: 'kind', header: 'Type', width: 0.9 },
                    { key: 'opening', header: 'Opening', kind: 'money' },
                    { key: 'closing', header: 'Closing', kind: 'money' },
                    { key: 'change', header: 'Change', kind: 'money', tone: 'auto' },
                    { key: 'share', header: 'Share', kind: 'percent', bar: true, width: 0.9 },
                  ],
                },
              ],
              notes: [
                ...(report.otherCurrencies.length > 0
                  ? [`Balances in ${report.otherCurrencies.join(', ')} are not included.`]
                  : []),
                ...(report.excludedAccounts > 0
                  ? [
                      `${report.excludedAccounts} account${report.excludedAccounts === 1 ? ' is' : 's are'} excluded from net worth.`,
                    ]
                  : []),
              ],
            }}
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
        <Table label="Net worth by month" cards>
          <THead>
            <TR head>
              <TH>Account</TH>
              <TH align="right" hideBelow="sm">
                Opening
              </TH>
              <TH align="right">Closing</TH>
              <TH align="right">Change</TH>
            </TR>
          </THead>
          <TBody>
            {report.accounts.map((row) => (
              <TR key={`${row.kind}-${row.name}`}>
                <TD className="max-w-[16rem]">
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
                </TD>
                <TD label="Opening" align="right" hideBelow="sm">
                  <Amount
                    value={row.opening}
                    currency={report.currency}
                    showSign={false}
                    tone="neutral"
                  />
                </TD>
                <TD label="Closing" align="right">
                  <Amount
                    value={row.closing}
                    currency={report.currency}
                    showSign={false}
                    tone="neutral"
                  />
                </TD>
                <TD label="Change" align="right">
                  <Amount value={row.change} currency={report.currency} tone="auto" />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <p className="text-muted-foreground text-xs" data-print="hide">
          <Link href="/accounts" className="hover:text-primary hover:underline">
            Manage accounts →
          </Link>
        </p>
      </ReportSection>
    </div>
  );
}
