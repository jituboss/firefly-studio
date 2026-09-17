/**
 * E14-10 — the vocabulary of the custom report builder.
 *
 * A custom report is three choices — a metric, a dimension and a chart — that
 * together name exactly one Firefly insight endpoint. Keeping that mapping in
 * one table (rather than branching in the page) means a saved report is just
 * those three strings, so it stays valid across releases and can be validated
 * on the way back out of the database without trusting what was stored.
 */

export const METRICS = [
  { value: 'expense', label: 'Money out' },
  { value: 'income', label: 'Money in' },
] as const;

export type Metric = (typeof METRICS)[number]['value'];

export const DIMENSIONS = [
  { value: 'category', label: 'Category', both: true },
  { value: 'budget', label: 'Budget', both: false },
  { value: 'tag', label: 'Tag', both: true },
  { value: 'asset', label: 'Account', both: true },
  { value: 'bill', label: 'Subscription', both: false },
  { value: 'counterparty', label: 'Payee / payer', both: true },
] as const;

export type Dimension = (typeof DIMENSIONS)[number]['value'];

export const CHART_TYPES = [
  { value: 'bar', label: 'Ranked bars' },
  { value: 'treemap', label: 'Treemap' },
  { value: 'table', label: 'Table only' },
] as const;

export type ChartType = (typeof CHART_TYPES)[number]['value'];

export interface CustomReportConfig {
  metric: Metric;
  dimension: Dimension;
  chart: ChartType;
  /** How many rows to rank before rolling the rest into "Other". */
  limit: number;
}

export const DEFAULT_CONFIG: CustomReportConfig = {
  metric: 'expense',
  dimension: 'category',
  chart: 'bar',
  limit: 10,
};

/**
 * `counterparty` is the one dimension whose endpoint name depends on the
 * metric: money out lands in an expense account, money in comes from a revenue
 * account, and Firefly names those paths after the ACCOUNT type rather than
 * after the role. Everything else uses the dimension name directly.
 */
export function insightPathFor(metric: Metric, dimension: Dimension): string | null {
  if (dimension === 'counterparty') {
    return metric === 'expense' ? 'expense/expense' : 'income/revenue';
  }

  const entry = DIMENSIONS.find((option) => option.value === dimension);
  if (!entry) return null;
  // A budget or a subscription only ever describes spending; there is no
  // `income/budget` endpoint, and offering one would 404 at report time.
  if (metric === 'income' && !entry.both) return null;

  return `${metric}/${dimension}`;
}

const METRIC_VALUES = new Set<string>(METRICS.map((entry) => entry.value));
const DIMENSION_VALUES = new Set<string>(DIMENSIONS.map((entry) => entry.value));
const CHART_VALUES = new Set<string>(CHART_TYPES.map((entry) => entry.value));

/**
 * Coerce anything — a URL query, a row out of `saved_reports` — into a valid
 * config. Never throws: a report saved under an older release, or a
 * hand-edited URL, degrades to the default rather than erroring the page.
 */
export function parseConfig(input: Record<string, unknown> | null | undefined): CustomReportConfig {
  const source = input ?? {};
  const read = (key: string) => {
    const value = source[key];
    return typeof value === 'string' ? value : undefined;
  };

  const metric = read('metric');
  const dimension = read('dimension');
  const chart = read('chart');
  const rawLimit = source.limit;
  const limit =
    typeof rawLimit === 'number' && Number.isFinite(rawLimit)
      ? Math.min(50, Math.max(3, Math.trunc(rawLimit)))
      : DEFAULT_CONFIG.limit;

  const config: CustomReportConfig = {
    metric: metric && METRIC_VALUES.has(metric) ? (metric as Metric) : DEFAULT_CONFIG.metric,
    dimension:
      dimension && DIMENSION_VALUES.has(dimension)
        ? (dimension as Dimension)
        : DEFAULT_CONFIG.dimension,
    chart: chart && CHART_VALUES.has(chart) ? (chart as ChartType) : DEFAULT_CONFIG.chart,
    limit,
  };

  // A metric/dimension pair with no endpoint (income by budget) would render an
  // empty report with no explanation, so fall back to the dimension that works.
  if (!insightPathFor(config.metric, config.dimension)) {
    config.dimension = 'category';
  }

  return config;
}

export function describeConfig(config: CustomReportConfig): string {
  const metric = METRICS.find((entry) => entry.value === config.metric)?.label ?? config.metric;
  const dimension =
    DIMENSIONS.find((entry) => entry.value === config.dimension)?.label ?? config.dimension;
  return `${metric} by ${dimension.toLowerCase()}`;
}
