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
          <div className="relative min-w-0 overflow-x-auto">
            <table className="w-full min-w-0 text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs">
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    Budget
                  </th>
                  <th
                    scope="col"
                    className="hidden py-1.5 pr-3 text-right font-medium sm:table-cell"
                  >
                    Budgeted
                  </th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                    Spent
                  </th>
                  <th scope="col" className="w-32 py-1.5 pr-3 font-medium">
                    Usage
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => {
                  const over = row.usage > 100;
                  return (
                    <tr key={row.name} className="border-border/60 border-b">
                      <td className="max-w-[14rem] py-2 pr-3">
                        <span className="block truncate">{row.name}</span>
                      </td>
                      <td className="hidden py-2 pr-3 text-right sm:table-cell">
                        <Amount
                          value={row.budgeted}
                          currency={report.currency}
                          showSign={false}
                          tone="neutral"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <Amount
                          value={row.spent}
                          currency={report.currency}
                          showSign={false}
                          tone="neutral"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
                            role="progressbar"
                            aria-valuenow={Math.round(row.usage)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${row.name} budget usage`}
                          >
                            <div
                              className={cn(
                                'h-full rounded-full',
                                over ? 'bg-expense' : 'bg-primary',
                              )}
                              style={{ width: `${Math.min(100, row.usage)}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'tabular w-12 text-right text-xs',
                              over ? 'text-expense font-medium' : 'text-muted-foreground',
                            )}
                          >
                            {row.usage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <Amount value={row.variance} currency={report.currency} tone="auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2 pr-3">Total</td>
                  <td className="hidden py-2 pr-3 text-right sm:table-cell">
                    <Amount
                      value={report.totalBudgeted}
                      currency={report.currency}
                      showSign={false}
                      tone="neutral"
                    />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Amount
                      value={report.totalSpent}
                      currency={report.currency}
                      showSign={false}
                      tone="neutral"
                    />
                  </td>
                  <td />
                  <td className="py-2 text-right">
                    <Amount value={remaining} currency={report.currency} tone="auto" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
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
