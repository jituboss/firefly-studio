import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getExpenseByAsset,
  getIncomeByAsset,
  getTransferByAsset,
} from '@/server/firefly/report-queries';
import { drillToTransactions, resolveReportScope } from '@/lib/report-scope';
import { buildAccountReport } from '@/lib/reports';
import { subtract } from '@/lib/money';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { Amount } from '@/components/ui/amount';
import { CurrencyNotice, ReportSection, ReportStat } from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Account report' };

export default async function AccountReportPage({
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
  const current = { start: scope.start, end: scope.end, accounts: scope.accounts };

  const [income, expense, transfers] = await Promise.all([
    getIncomeByAsset(current),
    getExpenseByAsset(current),
    getTransferByAsset(current),
  ]);

  const report = buildAccountReport(income, expense, transfers, scope.currency);
  const net = subtract(report.totalIncome, report.totalExpense).toString();

  const exportRows = report.rows.map((row) => ({
    account: row.name,
    income: row.income,
    expense: row.expense,
    transfers_net: row.transfers,
    net: row.net,
    currency: report.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Money in"
          value={report.totalIncome}
          currency={report.currency}
          tone="income"
          hint={scope.label}
        />
        <ReportStat
          label="Money out"
          value={report.totalExpense}
          currency={report.currency}
          tone="expense"
          hint={scope.label}
        />
        <ReportStat
          label="Net"
          value={net}
          currency={report.currency}
          tone="auto"
          hint="Across all accounts"
        />
        <ReportStat
          label="Accounts active"
          value="0"
          raw={String(report.rows.length)}
          hint="With movement this period"
        />
      </div>

      <ReportSection
        title="Per-account movement"
        description={`${scope.label} · transfers keep their direction, so an account that funded another shows negative`}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`accounts-${scope.start}-to-${scope.end}`}
            pdf={{
              title: 'Account report',
              subtitle: scope.label,
              description:
                'Money in, money out and transfers for each asset account. Transfers keep their direction, so an account that funded another shows a negative figure.',
              period: { start: scope.start, end: scope.end },
              locale: session.user.locale,
              timezone: session.user.timezone,
              currency: report.currency,
              accent: 'indigo',
              stats: [
                {
                  label: 'Money in',
                  value: report.totalIncome,
                  currency: report.currency,
                  tone: 'income',
                  hint: scope.label,
                },
                {
                  label: 'Money out',
                  value: report.totalExpense,
                  currency: report.currency,
                  tone: 'expense',
                  hint: scope.label,
                },
                {
                  label: 'Net',
                  value: net,
                  currency: report.currency,
                  tone: 'auto',
                  hint: 'Across all accounts',
                },
                {
                  label: 'Accounts active',
                  value: report.rows.length,
                  kind: 'count',
                  tone: 'accent',
                  hint: 'With movement this period',
                },
              ],
              tableTitle: 'Per-account movement',
              totalLabel: 'All accounts',
              columns: [
                { key: 'account', header: 'Account', width: 2.2 },
                { key: 'income', header: 'In', kind: 'money', tone: 'income', total: true },
                { key: 'expense', header: 'Out', kind: 'money', tone: 'expense', total: true },
                {
                  key: 'transfers_net',
                  header: 'Transfers',
                  kind: 'money',
                  tone: 'auto',
                  total: true,
                },
                { key: 'net', header: 'Net', kind: 'money', tone: 'auto', total: true },
              ],
            }}
          />
        }
      >
        {report.rows.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No account movement in this period.
          </p>
        ) : (
          <Table label="Account movement" cards>
            <THead>
              <TR head>
                <TH>Account</TH>
                <TH align="right">In</TH>
                <TH align="right">Out</TH>
                <TH align="right" hideBelow="sm">
                  Transfers
                </TH>
                <TH align="right">Net</TH>
              </TR>
            </THead>
            <TBody>
              {report.rows.map((row) => (
                <TR key={row.id ?? row.name}>
                  <TD className="max-w-[14rem] max-sm:font-medium">
                    {row.id ? (
                      <Link
                        href={`/accounts/${row.id}`}
                        className="hover:text-primary block truncate hover:underline"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      <span className="block truncate">{row.name}</span>
                    )}
                  </TD>
                  <TD align="right" label="In">
                    <Amount
                      value={row.income}
                      currency={report.currency}
                      tone="income"
                      showSign={false}
                    />
                  </TD>
                  <TD align="right" label="Out">
                    <Amount
                      value={row.expense}
                      currency={report.currency}
                      tone="expense"
                      showSign={false}
                    />
                  </TD>
                  <TD align="right" hideBelow="sm" label="Transfers">
                    <Amount value={row.transfers} currency={report.currency} tone="transfer" />
                  </TD>
                  <TD align="right" label="Net">
                    <Amount value={row.net} currency={report.currency} tone="auto" />
                  </TD>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR>
                <TD className="max-sm:font-semibold">Total</TD>
                <TD align="right" label="In">
                  <Amount
                    value={report.totalIncome}
                    currency={report.currency}
                    tone="income"
                    showSign={false}
                  />
                </TD>
                <TD align="right" label="Out">
                  <Amount
                    value={report.totalExpense}
                    currency={report.currency}
                    tone="expense"
                    showSign={false}
                  />
                </TD>
                <TD align="right" hideBelow="sm" />
                <TD align="right" label="Net">
                  <Amount value={net} currency={report.currency} tone="auto" />
                </TD>
              </TR>
            </TFoot>
          </Table>
        )}
        <CurrencyNotice currency={report.currency} otherCurrencies={report.otherCurrencies} />
        <p className="text-muted-foreground text-xs" data-print="hide">
          <Link href={drillToTransactions(scope)} className="hover:text-primary hover:underline">
            See every transaction in this period →
          </Link>
        </p>
      </ReportSection>
    </div>
  );
}
