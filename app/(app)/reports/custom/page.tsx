import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { getInsightByPath } from '@/server/firefly/report-queries';
import { listSavedReports } from '@/server/reports';
import { drillToTransactions, resolveReportScope, scopeToQuery } from '@/lib/report-scope';
import { buildBreakdown } from '@/lib/reports';
import {
  describeConfig,
  insightPathFor,
  parseConfig,
  type CustomReportConfig,
} from '@/lib/custom-report';
import { toDecimal } from '@/lib/money';
import { CategoryBars } from '@/components/charts/category-bars';
import { CategoryTreemap } from '@/components/charts/category-treemap';
import {
  BreakdownTable,
  CurrencyNotice,
  ReportSection,
  ReportStat,
} from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';
import {
  BuilderForm,
  SavedReportList,
  SaveReportForm,
  type SavedReportSummary,
} from './builder-form';

export const metadata: Metadata = { title: 'Custom report' };

/**
 * E14-10 — the custom report builder.
 *
 * Three choices resolve to exactly one Firefly insight endpoint (see
 * lib/custom-report.ts). Everything downstream — ranking, currency handling,
 * drill-through — is the same machinery the standard reports use, so a custom
 * report is not a second-class citizen with its own arithmetic.
 */
export default async function CustomReportPage({
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
  const config = parseConfig({
    metric: params.metric,
    dimension: params.dimension,
    chart: params.chart,
    limit: typeof params.limit === 'string' ? Number.parseInt(params.limit, 10) : undefined,
  });

  const path = insightPathFor(config.metric, config.dimension);

  const [entries, saved] = await Promise.all([
    path
      ? getInsightByPath(path, { start: scope.start, end: scope.end, accounts: scope.accounts })
      : Promise.resolve([]),
    listSavedReports(session.user.id),
  ]);

  const breakdown = buildBreakdown(entries, scope.currency, { limit: config.limit });
  const title = describeConfig(config);
  const isExpense = config.metric === 'expense';

  const chartData = breakdown.rows.map((row) => ({
    name: row.name,
    value: toDecimal(row.amount).toNumber(),
    size: toDecimal(row.amount).toNumber(),
  }));

  const exportRows = breakdown.rows.map((row) => ({
    [config.dimension]: row.name,
    amount: row.amount,
    share_percent: row.percent.toFixed(2),
    currency: breakdown.currency,
  }));

  const savedSummaries: SavedReportSummary[] = saved.map((report) => {
    const reportConfig: CustomReportConfig = parseConfig(report.config);
    return {
      id: report.id,
      name: report.name,
      description: describeConfig(reportConfig),
      href: `/reports/custom?${scopeToQuery(scope, {
        metric: reportConfig.metric,
        dimension: reportConfig.dimension,
        chart: reportConfig.chart,
        limit: String(reportConfig.limit),
      })}`,
      isPinned: report.isPinned,
    };
  });

  return (
    <div className="min-w-0 space-y-5">
      <ReportSection
        title="Build a report"
        description="Pick what to measure and how to group it. The period comes from the bar above."
      >
        <BuilderForm config={config} />
      </ReportSection>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Total"
          value={breakdown.total}
          currency={breakdown.currency}
          tone={isExpense ? 'expense' : 'income'}
          hint={scope.label}
        />
        <ReportStat
          label="Groups"
          value="0"
          raw={String(breakdown.rows.length)}
          hint={describeConfig(config)}
        />
        <ReportStat
          label="Largest"
          value={breakdown.rows[0]?.amount ?? '0'}
          currency={breakdown.currency}
          tone={isExpense ? 'expense' : 'income'}
          hint={breakdown.rows[0]?.name ?? 'Nothing in this period'}
        />
        <ReportStat
          label="Top share"
          value="0"
          raw={breakdown.rows[0] ? `${breakdown.rows[0].percent.toFixed(0)}%` : '—'}
          hint="Of the total below"
        />
      </div>

      <ReportSection
        title={title}
        description={scope.label}
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`${config.metric}-by-${config.dimension}-${scope.start}-to-${scope.end}`}
            pdf={{
              title,
              subtitle: scope.label,
              description: `A custom report: ${title.toLowerCase()}, ranked largest first, with each group’s share of the total.`,
              period: { start: scope.start, end: scope.end },
              locale: session.user.locale,
              timezone: session.user.timezone,
              currency: breakdown.currency,
              accent: isExpense ? 'rose' : 'green',
              stats: [
                {
                  label: 'Total',
                  value: breakdown.total,
                  currency: breakdown.currency,
                  tone: isExpense ? 'expense' : 'income',
                  hint: scope.label,
                },
                {
                  label: 'Groups',
                  value: breakdown.rows.length,
                  kind: 'count',
                  tone: 'accent',
                  hint: title,
                },
                {
                  label: 'Largest',
                  value: breakdown.rows[0]?.amount ?? '0',
                  currency: breakdown.currency,
                  tone: isExpense ? 'expense' : 'income',
                  hint: breakdown.rows[0]?.name ?? 'Nothing in this period',
                },
                {
                  label: 'Top share',
                  value: breakdown.rows[0]?.percent ?? null,
                  kind: 'percent',
                  tone: 'accent',
                  hint: 'Of the total',
                },
              ],
              tableTitle: title,
              columns: [
                {
                  key: config.dimension,
                  header: config.dimension.charAt(0).toUpperCase() + config.dimension.slice(1),
                  width: 2.4,
                },
                {
                  key: 'amount',
                  header: isExpense ? 'Spent' : 'Earned',
                  kind: 'money',
                  tone: isExpense ? 'expense' : 'income',
                  total: true,
                },
                { key: 'share_percent', header: 'Share', kind: 'percent', bar: true },
              ],
            }}
          />
        }
      >
        {config.chart === 'bar' ? (
          <CategoryBars
            data={chartData}
            currency={breakdown.currency}
            height={Math.max(180, chartData.length * 30)}
          />
        ) : null}
        {config.chart === 'treemap' ? (
          <CategoryTreemap data={chartData} currency={breakdown.currency} />
        ) : null}

        <BreakdownTable
          rows={breakdown.rows}
          currency={breakdown.currency}
          total={breakdown.total}
          nameLabel={title.split(' by ')[1] ?? 'Group'}
          valueLabel={isExpense ? 'Spent' : 'Earned'}
          emptyMessage="Nothing matched this combination in the selected period."
          hrefFor={(row) => {
            // Only dimensions Firefly's transaction list can filter on get a
            // drill-through; a dead link that silently ignores the filter is
            // worse than no link.
            if (config.dimension === 'category' && row.id) {
              return drillToTransactions(scope, { category: row.id });
            }
            if (config.dimension === 'budget' && row.id) {
              return drillToTransactions(scope, { budget: row.id });
            }
            if (config.dimension === 'tag') {
              return drillToTransactions(scope, { tag: row.name });
            }
            return null;
          }}
        />
        <CurrencyNotice currency={breakdown.currency} otherCurrencies={breakdown.otherCurrencies} />
      </ReportSection>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2" data-print="hide">
        <ReportSection
          title="Save this report"
          description="Saved reports keep the measure, grouping and chart. The period stays live."
        >
          <SaveReportForm config={config} />
        </ReportSection>

        <ReportSection title="Saved reports" description="Pinned reports appear first.">
          <SavedReportList reports={savedSummaries} />
        </ReportSection>
      </div>
    </div>
  );
}
