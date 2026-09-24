import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getExpenseByCategoryScoped,
  getIncomeByCategoryScoped,
  getExpenseWithoutCategory,
} from '@/server/firefly/report-queries';
import { drillToTransactions, resolveReportScope } from '@/lib/report-scope';
import { buildBreakdown, buildMonthlyGrid, delta, type InsightLike } from '@/lib/reports';
import { eachMonthInRange } from '@/lib/date';
import { toDecimal } from '@/lib/money';
import { CategoryTreemap } from '@/components/charts/category-treemap';
import { MonthlyGridTable } from '@/components/reports/monthly-grid';
import {
  BreakdownTable,
  CurrencyNotice,
  ReportSection,
  ReportStat,
} from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Category report' };

/** The month grid is capped so a five-year range does not fire 60 requests. */
const MAX_GRID_MONTHS = 12;

export default async function CategoryReportPage({
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

  // The insight endpoints only ever report one total for the range they are
  // handed, so a month-by-month grid means one call per month. They run in
  // parallel and every one is failure-tolerant.
  const months = eachMonthInRange(scope.start, scope.end, session.user.timezone).slice(
    -MAX_GRID_MONTHS,
  );

  const [expense, income, uncategorised, priorExpense, ...monthly] = await Promise.all([
    getExpenseByCategoryScoped(current),
    getIncomeByCategoryScoped(current),
    getExpenseWithoutCategory(current),
    scope.compare ? getExpenseByCategoryScoped(prior) : Promise.resolve([] as InsightLike[]),
    ...months.map((month) =>
      getExpenseByCategoryScoped({ ...current, start: month.start, end: month.end }),
    ),
  ]);

  const currency = scope.currency;
  const spending = buildBreakdown(expense, currency);
  const earning = buildBreakdown(income, currency, { limit: 8 });
  const grid = buildMonthlyGrid(months, monthly, spending.currency, { limit: 12 });

  const uncategorisedTotal = buildBreakdown(uncategorised, currency).total;
  const priorSpending = scope.compare ? buildBreakdown(priorExpense, currency).total : '0';

  const treemap = spending.rows
    .filter((row) => toDecimal(row.amount).greaterThan(0))
    .slice(0, 16)
    .map((row) => ({ name: row.name, size: toDecimal(row.amount).toNumber() }));

  const exportRows = spending.rows.map((row) => ({
    category: row.name,
    spent: row.amount,
    share_percent: row.percent.toFixed(2),
    currency: spending.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Categorised spend"
          value={spending.total}
          currency={spending.currency}
          tone="expense"
          change={scope.compare ? delta(spending.total, priorSpending) : null}
          hint={scope.label}
        />
        <ReportStat
          label="Categories used"
          value="0"
          raw={String(spending.rows.length)}
          hint="With spending this period"
        />
        <ReportStat
          label="Uncategorised"
          value={uncategorisedTotal}
          currency={currency}
          tone="expense"
          hint="Spending with no category"
        />
        <ReportStat
          label="Category income"
          value={earning.total}
          currency={earning.currency}
          tone="income"
          hint={`${earning.rows.length} categor${earning.rows.length === 1 ? 'y' : 'ies'}`}
        />
      </div>

      <ReportSection
        title="Where the money went"
        description={`${scope.label} · tile area is share of total spending`}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`categories-${scope.start}-to-${scope.end}`}
            pdf={{
              title: 'Category report',
              subtitle: scope.label,
              description:
                'Where the money went, by category, with each category’s share of total spending, followed by income grouped the same way.',
              period: { start: scope.start, end: scope.end },
              locale: session.user.locale,
              timezone: session.user.timezone,
              currency: spending.currency,
              accent: 'rose',
              stats: [
                {
                  label: 'Categorised spend',
                  value: spending.total,
                  currency: spending.currency,
                  tone: 'expense',
                  hint: scope.label,
                },
                {
                  label: 'Categories used',
                  value: spending.rows.length,
                  kind: 'count',
                  tone: 'accent',
                  hint: 'With spending this period',
                },
                {
                  label: 'Uncategorised',
                  value: uncategorisedTotal,
                  currency,
                  tone: 'expense',
                  hint: 'Spending with no category',
                },
                {
                  label: 'Category income',
                  value: earning.total,
                  currency: earning.currency,
                  tone: 'income',
                  hint: `${earning.rows.length} categor${earning.rows.length === 1 ? 'y' : 'ies'}`,
                },
              ],
              tableTitle: 'Spending by category',
              tableDescription: 'Ranked, largest first.',
              columns: [
                { key: 'category', header: 'Category', width: 2.4 },
                { key: 'spent', header: 'Spent', kind: 'money', tone: 'expense', total: true },
                { key: 'share_percent', header: 'Share', kind: 'percent', bar: true },
              ],
              tables: [
                {
                  title: 'Income by category',
                  currency: earning.currency,
                  rows: earning.rows.map((row) => ({
                    category: row.name,
                    earned: row.amount,
                    share: row.percent,
                  })),
                  columns: [
                    { key: 'category', header: 'Category', width: 2.4 },
                    { key: 'earned', header: 'Earned', kind: 'money', tone: 'income', total: true },
                    { key: 'share', header: 'Share', kind: 'percent', bar: true },
                  ],
                  emptyMessage: 'No categorised income in this period.',
                },
              ],
            }}
          />
        }
      >
        <CategoryTreemap data={treemap} currency={spending.currency} />
        <CurrencyNotice currency={spending.currency} otherCurrencies={spending.otherCurrencies} />
      </ReportSection>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ReportSection title="Spending by category" description="Ranked, largest first.">
          <BreakdownTable
            rows={spending.rows.slice(0, 15)}
            currency={spending.currency}
            total={spending.total}
            nameLabel="Category"
            valueLabel="Spent"
            emptyMessage="Nothing spent in this period."
            hrefFor={(row) =>
              row.id ? drillToTransactions(scope, { category: row.id, type: 'withdrawal' }) : null
            }
          />
        </ReportSection>

        <ReportSection title="Income by category" description="Money in, grouped the same way.">
          <BreakdownTable
            rows={earning.rows}
            currency={earning.currency}
            total={earning.total}
            nameLabel="Category"
            valueLabel="Earned"
            emptyMessage="No categorised income in this period."
            hrefFor={(row) =>
              row.id ? drillToTransactions(scope, { category: row.id, type: 'deposit' }) : null
            }
          />
        </ReportSection>
      </div>

      <ReportSection
        title="Month over month"
        description="Top categories by month. Darker is a bigger month for that category."
        breakBefore
      >
        <MonthlyGridTable
          grid={grid}
          currency={spending.currency}
          emptyMessage="Not enough history in this range to compare months."
          hrefFor={(row) => (row.id ? drillToTransactions(scope, { category: row.id }) : null)}
        />
      </ReportSection>
    </div>
  );
}
