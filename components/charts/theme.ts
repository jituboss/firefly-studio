/**
 * E21-03 — the chart theme layer.
 *
 * Seven chart components had each written out the same grid, the same axis
 * ticks and the same tooltip card — eleven copies of `var(--border)`, seven of
 * `tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}`, seven tooltip
 * `contentStyle` objects. They had already drifted: some tooltips set a cursor
 * fill and some did not, and two used a different corner radius.
 *
 * Everything here resolves to a CSS custom property rather than a literal, so
 * both themes work without the charts knowing a theme exists — Recharts reads
 * these at render, and the tokens are redefined under the dark selector.
 */

/** Axis ticks: same size, same muted colour, no tick marks, no axis line. */
export const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' } as const;

export const AXIS_PROPS = {
  tick: AXIS_TICK,
  tickLine: false,
  axisLine: false,
} as const;

/** Horizontal rules only: vertical ones fight the bars they sit behind. */
export const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'var(--border)',
  vertical: false,
} as const;

/** The tooltip card. */
export const TOOLTIP_CONTENT_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--popover-foreground)',
} as const;

export const TOOLTIP_PROPS = {
  contentStyle: TOOLTIP_CONTENT_STYLE,
  labelStyle: { color: 'var(--muted-foreground)', fontSize: 11 },
} as const;

/** For bar charts, where the hover band reads better than a line. */
export const TOOLTIP_CURSOR_FILL = { fill: 'var(--muted)' } as const;

export const LEGEND_PROPS = {
  wrapperStyle: { fontSize: 12, color: 'var(--muted-foreground)' },
} as const;

/**
 * The categorical series palette, as token names.
 *
 * Eight, because that is how many `--chart-N` tokens the design system
 * defines; a ninth series wraps rather than inventing a colour. They are
 * ordered so adjacent entries differ in lightness as well as hue, which is
 * what keeps a series distinguishable in greyscale and to the ~8% of men with
 * a red-green deficiency — colour is never the only signal anyway (every chart
 * carries an `sr-only` table, E21-06), but a legend people can read is worth
 * more than one they have to decode.
 */
export const SERIES_COUNT = 8;

export function seriesColor(index: number): string {
  return `var(--chart-${(index % SERIES_COUNT) + 1})`;
}

/** The semantic three, for charts where a series MEANS income or spending. */
export const SEMANTIC_COLORS = {
  income: 'var(--income)',
  expense: 'var(--expense)',
  transfer: 'var(--transfer)',
  net: 'var(--primary)',
} as const;

/**
 * Y-axis width. A 64px gutter is a fifth of a 360px screen, so narrow
 * viewports get a tighter one and drop the currency symbol — the axis is a
 * scale, and the amounts are spelled out in the tooltip and the table.
 */
export function axisWidth(narrow: boolean): number {
  return narrow ? 44 : 64;
}
