import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getExpenseByTag, getIncomeByTag } from '@/server/firefly/report-queries';
import { drillToTransactions, resolveReportScope } from '@/lib/report-scope';
import { buildBreakdown, buildMonthlyGrid, type InsightLike } from '@/lib/reports';
import { eachMonthInRange } from '@/lib/date';
import { toDecimal } from '@/lib/money';
import { CategoryBars } from '@/components/charts/category-bars';
import { MonthlyGridTable } from '@/components/reports/monthly-grid';
import {
  BreakdownTable,
  CurrencyNotice,
  ReportSection,
  ReportStat,
} from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Tag report' };

const MAX_GRID_MONTHS = 12;

export default async function TagReportPage({
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

  const [expense, income, ...monthly] = await Promise.all([
    getExpenseByTag(current),
    getIncomeByTag(current),
    ...months.map((month) => getExpenseByTag({ ...current, start: month.start, end: month.end })),
  ]);

  const currency = scope.currency;
  const spending = buildBreakdown(expense, currency);
  const earning = buildBreakdown(income, currency, { limit: 8 });
  const grid = buildMonthlyGrid(months, monthly as InsightLike[][], spending.currency, {
    limit: 12,
  });

  const bars = spending.rows
    .slice(0, 10)
    .map((row) => ({ name: row.name, value: toDecimal(row.amount).toNumber() }));

  const exportRows = spending.rows.map((row) => ({
    tag: row.name,
    spent: row.amount,
    share_percent: row.percent.toFixed(2),
    currency: spending.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Tagged spend"
          value={spending.total}
          currency={spending.currency}
          tone="expense"
          hint={scope.label}
        />
        <ReportStat
          label="Tags used"
          value="0"
          raw={String(spending.rows.length)}
          hint="With spending this period"
        />
        <ReportStat
          label="Tagged income"
          value={earning.total}
          currency={earning.currency}
          tone="income"
          hint={`${earning.rows.length} tag${earning.rows.length === 1 ? '' : 's'}`}
        />
        <ReportStat
          label="Largest tag"
          value={spending.rows[0]?.amount ?? '0'}
          currency={spending.currency}
          tone="expense"
          hint={spending.rows[0]?.name ?? 'No tagged spending'}
        />
      </div>

      <ReportSection
        title="Spend by tag"
        description={`${scope.label} · tags are how one-off projects and trips get tracked across categories`}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`tags-${scope.start}-to-${scope.end}`}
            pdf={{
              title: 'Tag report',
              subtitle: scope.label,
              description:
                'Spending and income grouped by tag. Tags cut across categories, so they are how one-off projects and trips get tracked.',
              period: { start: scope.start, end: scope.end },
              locale: session.user.locale,
              timezone: session.user.timezone,
              currency: spending.currency,
              accent: 'violet',
              stats: [
                {
                  label: 'Tagged spend',
                  value: spending.total,
                  currency: spending.currency,
                  tone: 'expense',
                  hint: scope.label,
                },
                {
                  label: 'Tags used',
                  value: spending.rows.length,
                  kind: 'count',
                  tone: 'accent',
                  hint: 'With spending this period',
                },
                {
                  label: 'Tagged income',
                  value: earning.total,
                  currency: earning.currency,
                  tone: 'income',
                  hint: `${earning.rows.length} tag${earning.rows.length === 1 ? '' : 's'}`,
                },
                {
                  label: 'Largest tag',
                  value: spending.rows[0]?.amount ?? '0',
                  currency: spending.currency,
                  tone: 'expense',
                  hint: spending.rows[0]?.name ?? 'No tagged spending',
                },
              ],
              tableTitle: 'Spend by tag',
              tableDescription: 'Ranked, largest first.',
              columns: [
                { key: 'tag', header: 'Tag', width: 2.4 },
                { key: 'spent', header: 'Spent', kind: 'money', tone: 'expense', total: true },
                { key: 'share_percent', header: 'Share', kind: 'percent', bar: true },
              ],
              tables: [
                {
                  title: 'Income by tag',
                  currency: earning.currency,
                  rows: earning.rows.map((row) => ({
                    tag: row.name,
                    earned: row.amount,
                    share: row.percent,
                  })),
                  columns: [
                    { key: 'tag', header: 'Tag', width: 2.4 },
                    { key: 'earned', header: 'Earned', kind: 'money', tone: 'income', total: true },
                    { key: 'share', header: 'Share', kind: 'percent', bar: true },
                  ],
                  emptyMessage: 'No tagged income in this period.',
                },
              ],
            }}
          />
        }
      >
        <CategoryBars
          data={bars}
          currency={spending.currency}
          height={Math.max(180, bars.length * 32)}
        />
        <CurrencyNotice currency={spending.currency} otherCurrencies={spending.otherCurrencies} />
      </ReportSection>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ReportSection title="All tags by spend" description="Ranked, largest first.">
          <BreakdownTable
            rows={spending.rows.slice(0, 20)}
            currency={spending.currency}
            total={spending.total}
            nameLabel="Tag"
            valueLabel="Spent"
            emptyMessage="No tagged spending in this period. Tag a transaction to see it here."
            hrefFor={(row) => drillToTransactions(scope, { tag: row.name })}
          />
        </ReportSection>

        <ReportSection title="Income by tag" description="Money in, grouped the same way.">
          <BreakdownTable
            rows={earning.rows}
            currency={earning.currency}
            total={earning.total}
            nameLabel="Tag"
            valueLabel="Earned"
            emptyMessage="No tagged income in this period."
            hrefFor={(row) => drillToTransactions(scope, { tag: row.name, type: 'deposit' })}
          />
        </ReportSection>
      </div>

      <ReportSection title="Tags over time" description="Spend per tag per month." breakBefore>
        <MonthlyGridTable
          grid={grid}
          currency={spending.currency}
          emptyMessage="No tagged spending in this range."
          hrefFor={(row) => drillToTransactions(scope, { tag: row.name })}
        />
      </ReportSection>
    </div>
  );
}
