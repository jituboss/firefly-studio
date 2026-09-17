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
          />
        }
      >
        {report.rows.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No account movement in this period.
          </p>
        ) : (
          <div className="relative min-w-0 overflow-x-auto">
            <table className="w-full min-w-0 text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs">
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    Account
                  </th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                    In
                  </th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                    Out
                  </th>
                  <th
                    scope="col"
                    className="hidden py-1.5 pr-3 text-right font-medium sm:table-cell"
                  >
                    Transfers
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.id ?? row.name} className="border-border/60 border-b">
                    <td className="max-w-[14rem] py-2 pr-3">
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
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Amount
                        value={row.income}
                        currency={report.currency}
                        tone="income"
                        showSign={false}
                      />
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Amount
                        value={row.expense}
                        currency={report.currency}
                        tone="expense"
                        showSign={false}
                      />
                    </td>
                    <td className="hidden py-2 pr-3 text-right sm:table-cell">
                      <Amount value={row.transfers} currency={report.currency} tone="transfer" />
                    </td>
                    <td className="py-2 text-right">
                      <Amount value={row.net} currency={report.currency} tone="auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2 pr-3">Total</td>
                  <td className="py-2 pr-3 text-right">
                    <Amount
                      value={report.totalIncome}
                      currency={report.currency}
                      tone="income"
                      showSign={false}
                    />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Amount
                      value={report.totalExpense}
                      currency={report.currency}
                      tone="expense"
                      showSign={false}
                    />
                  </td>
                  <td className="hidden sm:table-cell" />
                  <td className="py-2 text-right">
                    <Amount value={net} currency={report.currency} tone="auto" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
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
