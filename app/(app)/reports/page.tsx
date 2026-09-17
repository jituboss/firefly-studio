import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Banknote,
  ChartPie,
  Layers,
  Receipt,
  Scale,
  Sparkles,
  Tags,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getCashFlowChart,
  getExpenseTotal,
  getIncomeTotal,
  getTransferTotal,
} from '@/server/firefly/report-queries';
import { resolveReportScope, scopeToQuery } from '@/lib/report-scope';
import { buildCashFlow, delta, insightTotal } from '@/lib/reports';
import { subtract } from '@/lib/money';
import { Card, CardContent } from '@/components/ui/card';
import { IncomeExpenseBars } from '@/components/charts/income-expense-bars';
import { CurrencyNotice, ReportSection, ReportStat } from '@/components/reports/report-ui';

export const metadata: Metadata = { title: 'Reports' };

const REPORTS = [
  {
    href: '/reports/net-worth',
    label: 'Net worth',
    icon: Scale,
    blurb: 'Assets against liabilities over time, and which accounts moved the total.',
  },
  {
    href: '/reports/income-expense',
    label: 'Income vs expense',
    icon: TrendingUp,
    blurb: 'Monthly bars, running net, savings rate, and your biggest sources and sinks.',
  },
  {
    href: '/reports/categories',
    label: 'Categories',
    icon: ChartPie,
    blurb: 'Where the money goes, ranked and month by month.',
  },
  {
    href: '/reports/budgets',
    label: 'Budgets',
    icon: Banknote,
    blurb: 'Planned against actual, variance, and a twelve-month adherence heatmap.',
  },
  {
    href: '/reports/accounts',
    label: 'Accounts',
    icon: Wallet,
    blurb: 'Income, expense and transfers broken down per asset account.',
  },
  {
    href: '/reports/tags',
    label: 'Tags',
    icon: Tags,
    blurb: 'Spend by tag across the period, for projects and one-off trips.',
  },
  {
    href: '/reports/bills',
    label: 'Subscriptions',
    icon: Receipt,
    blurb: 'Recurring cost, annualised total, and what is actually being paid.',
  },
  {
    href: '/reports/cash-flow',
    label: 'Cash flow',
    icon: Layers,
    blurb: 'A Sankey of income sources through your accounts into spending categories.',
  },
  {
    href: '/reports/custom',
    label: 'Custom report',
    icon: Sparkles,
    blurb: 'Pick a metric, a dimension and a chart type. Save it and pin it.',
  },
];

export default async function ReportsOverviewPage({
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

  const [income, expense, transfers, cashFlowChart, priorIncome, priorExpense] = await Promise.all([
    getIncomeTotal(current),
    getExpenseTotal(current),
    getTransferTotal(current),
    getCashFlowChart(current),
    scope.compare ? getIncomeTotal(prior) : Promise.resolve([]),
    scope.compare ? getExpenseTotal(prior) : Promise.resolve([]),
  ]);

  const currency = scope.currency;
  const earned = insightTotal(income, currency);
  const spent = insightTotal(expense, currency);
  const moved = insightTotal(transfers, currency);
  const net = subtract(earned, spent).toString();

  const cashFlow = buildCashFlow(cashFlowChart, currency);
  const query = scopeToQuery(scope);

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Income"
          value={earned}
          currency={currency}
          tone="income"
          change={scope.compare ? delta(earned, insightTotal(priorIncome, currency)) : null}
          hint={scope.compare ? undefined : scope.label}
        />
        <ReportStat
          label="Expenses"
          value={spent}
          currency={currency}
          tone="expense"
          change={scope.compare ? delta(spent, insightTotal(priorExpense, currency)) : null}
          hint={scope.compare ? undefined : scope.label}
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
          hint={`${moved === '0' ? 'No' : ''} transfers ${moved === '0' ? 'this period' : 'excluded'}`}
        />
      </div>

      <ReportSection
        title="Income and expenses by month"
        description={scope.label}
        actions={
          <Link
            href={`/reports/income-expense?${query}`}
            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            data-print="hide"
          >
            Full report <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
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

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-print="hide">
        {REPORTS.map((report) => (
          <Link key={report.href} href={`${report.href}?${query}`} className="group min-w-0">
            <Card className="hover:border-primary/40 h-full min-w-0 transition-colors">
              <CardContent className="min-w-0 space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <report.icon className="text-primary size-4 shrink-0" aria-hidden="true" />
                  <h3 className="truncate text-sm font-medium">{report.label}</h3>
                  <ArrowRight
                    className="text-muted-foreground ml-auto size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-muted-foreground text-xs">{report.blurb}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
