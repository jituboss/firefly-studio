import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getCashFlowChart,
  getExpenseByDestination,
  getExpenseTotal,
  getIncomeBySource,
  getIncomeTotal,
} from '@/server/firefly/report-queries';
import { drillToTransactions, resolveReportScope } from '@/lib/report-scope';
import { buildBreakdown, buildCashFlow, delta, insightTotal } from '@/lib/reports';
import { formatMonthLabel } from '@/lib/date';
import { subtract } from '@/lib/money';
import { Amount } from '@/components/ui/amount';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { IncomeExpenseBars } from '@/components/charts/income-expense-bars';
import {
  BreakdownTable,
  CurrencyNotice,
  ReportSection,
  ReportStat,
} from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Income vs expense' };

export default async function IncomeExpenseReportPage({
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
  const prior = { start: scope.previous.start, end: scope.previous.end, accounts: scope.accounts };

  const [chart, income, expense, sources, sinks, priorIncome, priorExpense] = await Promise.all([
    getCashFlowChart(current),
    getIncomeTotal(current),
    getExpenseTotal(current),
    getIncomeBySource(current),
    getExpenseByDestination(current),
    scope.compare ? getIncomeTotal(prior) : Promise.resolve([]),
    scope.compare ? getExpenseTotal(prior) : Promise.resolve([]),
  ]);

  const currency = scope.currency;
  const cashFlow = buildCashFlow(chart, currency);

  // Headline figures come from the insight `total` endpoints, not from summing the chart:
  // those are the numbers Firefly's own reports print, so this is what makes
  // the two agree to the cent.
  const earned = insightTotal(income, currency);
  const spent = insightTotal(expense, currency);
  const net = subtract(earned, spent).toString();

  const topSources = buildBreakdown(sources, currency, { limit: 10 });
  const topSinks = buildBreakdown(sinks, currency, { limit: 10 });

  const exportRows = cashFlow.points.map((point) => ({
    month: formatMonthLabel(point.date, session.user.timezone, session.user.locale),
    income: point.earned,
    expenses: point.spent,
    net: point.net,
    running_net: point.cumulative,
    currency: cashFlow.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Income"
          value={earned}
          currency={currency}
          tone="income"
          change={scope.compare ? delta(earned, insightTotal(priorIncome, currency)) : null}
          hint={scope.label}
        />
        <ReportStat
          label="Expenses"
          value={spent}
          currency={currency}
          tone="expense"
          change={scope.compare ? delta(spent, insightTotal(priorExpense, currency)) : null}
          hint={scope.label}
        />
        <ReportStat
          label="Net"
          value={net}
          currency={currency}
          tone="auto"
          hint="Income less expenses"
        />
        <ReportStat
          label="Savings rate"
          value={net}
          currency={currency}
          raw={cashFlow.savingsRate === null ? '—' : `${cashFlow.savingsRate.toFixed(1)}%`}
          hint="Share of income kept"
        />
      </div>

      <ReportSection
        title="Month by month"
        description={`${scope.label} · bars are monthly totals, the line is the running net`}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`income-expense-${scope.start}-to-${scope.end}`}
          />
        }
      >
        <IncomeExpenseBars
          data={cashFlow.points}
          currency={cashFlow.currency}
          timezone={session.user.timezone}
          locale={session.user.locale}
        />
        <CurrencyNotice currency={cashFlow.currency} otherCurrencies={cashFlow.otherCurrencies} />
      </ReportSection>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ReportSection
          title="Top income sources"
          description="Revenue accounts money arrived from."
        >
          <BreakdownTable
            rows={topSources.rows}
            currency={topSources.currency}
            total={topSources.total}
            nameLabel="Source"
            emptyMessage="No income recorded in this period."
            hrefFor={(row) => (row.id ? drillToTransactions(scope, { type: 'deposit' }) : null)}
          />
          <CurrencyNotice
            currency={topSources.currency}
            otherCurrencies={topSources.otherCurrencies}
          />
        </ReportSection>

        <ReportSection title="Top expenses" description="Expense accounts money went to.">
          <BreakdownTable
            rows={topSinks.rows}
            currency={topSinks.currency}
            total={topSinks.total}
            nameLabel="Destination"
            emptyMessage="Nothing spent in this period."
            hrefFor={(row) => (row.id ? drillToTransactions(scope, { type: 'withdrawal' }) : null)}
          />
          <CurrencyNotice currency={topSinks.currency} otherCurrencies={topSinks.otherCurrencies} />
        </ReportSection>
      </div>

      <ReportSection title="Monthly detail" description="The figures behind the chart." breakBefore>
        <Table label="Monthly detail">
          <THead>
            <TR head>
              <TH>Month</TH>
              <TH align="right">Income</TH>
              <TH align="right">Expenses</TH>
              <TH align="right">Net</TH>
              <TH align="right" hideBelow="sm">
                Running
              </TH>
            </TR>
          </THead>
          <TBody>
            {cashFlow.points.map((point) => (
              <TR key={point.date}>
                <TD className="whitespace-nowrap">
                  {formatMonthLabel(point.date, session.user.timezone, session.user.locale)}
                </TD>
                <TD align="right">
                  <Amount
                    value={point.earned}
                    currency={cashFlow.currency}
                    tone="income"
                    showSign={false}
                  />
                </TD>
                <TD align="right">
                  <Amount
                    value={point.spent}
                    currency={cashFlow.currency}
                    tone="expense"
                    showSign={false}
                  />
                </TD>
                <TD align="right">
                  <Amount value={point.net} currency={cashFlow.currency} tone="auto" />
                </TD>
                <TD align="right" hideBelow="sm">
                  <Amount
                    value={point.cumulative}
                    currency={cashFlow.currency}
                    tone="neutral"
                    showSign={false}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ReportSection>
    </div>
  );
}
