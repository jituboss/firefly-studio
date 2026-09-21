import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getBudgetOverviewChart,
  getExpenseByBudget,
  getExpenseWithoutBudget,
} from '@/server/firefly/report-queries';
import { drillToTransactions, resolveReportScope } from '@/lib/report-scope';
import { buildBreakdown, buildBudgetReport, buildMonthlyGrid } from '@/lib/reports';
import { eachMonthInRange } from '@/lib/date';
import { subtract, toDecimal } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Amount } from '@/components/ui/amount';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { ProgressBar } from '@/components/ui/progress-bar';
import { MonthlyGridTable } from '@/components/reports/monthly-grid';
import { CurrencyNotice, ReportSection, ReportStat } from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Budget report' };

const MAX_GRID_MONTHS = 12;

export default async function BudgetReportPage({
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

  const months = eachMonthInRange(scope.start, scope.end, session.user.timezone).slice(
    -MAX_GRID_MONTHS,
  );

  const [overview, unbudgeted, ...monthly] = await Promise.all([
    getBudgetOverviewChart(current),
    getExpenseWithoutBudget(current),
    ...months.map((month) =>
      getExpenseByBudget({ ...current, start: month.start, end: month.end }),
    ),
  ]);

  const report = buildBudgetReport(overview, scope.currency);
  const grid = buildMonthlyGrid(months, monthly, report.currency, { limit: 12 });
  const unbudgetedTotal = buildBreakdown(unbudgeted, scope.currency).total;

  const remaining = subtract(report.totalBudgeted, report.totalSpent).toString();
  const overBudgetCount = report.rows.filter((row) => row.usage > 100).length;

  const exportRows = report.rows.map((row) => ({
    budget: row.name,
    budgeted: row.budgeted,
    spent: row.spent,
    remaining: row.left,
    overspent: row.overspent,
    usage_percent: row.usage.toFixed(2),
    currency: report.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Budgeted"
          value={report.totalBudgeted}
          currency={report.currency}
          tone="neutral"
          hint={scope.label}
        />
        <ReportStat
          label="Spent"
          value={report.totalSpent}
          currency={report.currency}
          tone="expense"
          hint={`${report.rows.length} budget${report.rows.length === 1 ? '' : 's'}`}
        />
        <ReportStat
          label={toDecimal(remaining).isNegative() ? 'Over budget by' : 'Remaining'}
          value={toDecimal(remaining).abs().toString()}
          currency={report.currency}
          tone={toDecimal(remaining).isNegative() ? 'expense' : 'income'}
          hint={`${overBudgetCount} budget${overBudgetCount === 1 ? '' : 's'} over`}
        />
        <ReportStat
          label="Unbudgeted spend"
          value={unbudgetedTotal}
          currency={scope.currency}
          tone="expense"
          hint="Spending with no budget set"
        />
      </div>

      <ReportSection
        title="Planned against actual"
        description={`${scope.label} · variance is what is left of the plan`}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`budgets-${scope.start}-to-${scope.end}`}
          />
        }
      >
        {report.rows.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No budgets with activity in this period. Set a budget limit to see it here.
          </p>
        ) : (
          <Table label="Budget performance" cards>
            <THead>
              <TR head>
                <TH>Budget</TH>
                <TH align="right" hideBelow="sm">
                  Budgeted
                </TH>
                <TH align="right">Spent</TH>
                <TH className="w-32">Usage</TH>
                <TH align="right">Variance</TH>
              </TR>
            </THead>
            <TBody>
              {report.rows.map((row) => {
                const over = row.usage > 100;
                return (
                  <TR key={row.name}>
                    <TD className="max-w-[14rem]">
                      <span className="block truncate">{row.name}</span>
                    </TD>
                    <TD label="Budgeted" align="right" hideBelow="sm">
                      <Amount
                        value={row.budgeted}
                        currency={report.currency}
                        showSign={false}
                        tone="neutral"
                      />
                    </TD>
                    <TD label="Spent" align="right">
                      <Amount
                        value={row.spent}
                        currency={report.currency}
                        showSign={false}
                        tone="neutral"
                      />
                    </TD>
                    <TD label="Usage">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={row.usage}
                          over={over}
                          size="sm"
                          className="flex-1"
                          label={`${row.name} budget usage`}
                        />
                        <span
                          className={cn(
                            'tabular w-12 text-right text-xs',
                            over ? 'text-expense font-medium' : 'text-muted-foreground',
                          )}
                        >
                          {row.usage.toFixed(0)}%
                        </span>
                      </div>
                    </TD>
                    <TD label="Variance" align="right">
                      <Amount value={row.variance} currency={report.currency} tone="auto" />
                    </TD>
                  </TR>
                );
              })}
            </TBody>
            <TFoot>
              <TR>
                <TD>Total</TD>
                <TD label="Budgeted" align="right" hideBelow="sm">
                  <Amount
                    value={report.totalBudgeted}
                    currency={report.currency}
                    showSign={false}
                    tone="neutral"
                  />
                </TD>
                <TD label="Spent" align="right">
                  <Amount
                    value={report.totalSpent}
                    currency={report.currency}
                    showSign={false}
                    tone="neutral"
                  />
                </TD>
                <TD label="Usage" />
                <TD label="Variance" align="right">
                  <Amount value={remaining} currency={report.currency} tone="auto" />
                </TD>
              </TR>
            </TFoot>
          </Table>
        )}
        <CurrencyNotice currency={report.currency} otherCurrencies={report.otherCurrencies} />
      </ReportSection>

      <ReportSection
        title="Twelve-month adherence"
        description="Spend per budget per month. Darker is a heavier month."
        breakBefore
      >
        <MonthlyGridTable
          grid={grid}
          currency={report.currency}
          emptyMessage="No budgeted spending in this range."
          hrefFor={(row) => (row.id ? drillToTransactions(scope, { budget: row.id }) : null)}
        />
      </ReportSection>
    </div>
  );
}
