'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_CONTENT_STYLE, seriesColor } from './theme';
import { formatAxisDate } from '@/lib/date';
import { formatMoney, toDecimal } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { BalanceTrend as BalanceTrendData } from '@/lib/balance-trend';

/**
 * The dashboard's balance-over-time chart.
 *
 * Replaces an earlier version that drew one filled area per account. With a
 * real ledger that meant a dozen translucent shapes stacked on one another,
 * every small account flattened against zero by one large one, no legend, and
 * no way to tell the lines apart — it looked like data without answering
 * anything. This version answers one question by default ("is the balance
 * going up or down, and by how much") and keeps the per-account detail behind
 * a toggle, where a legend and click-to-hide make it legible.
 */

type Mode = 'total' | 'accounts';

function useNarrowViewport() {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return narrow;
}

/**
 * Screen readers get the underlying numbers, not an unlabelled picture.
 *
 * The `sr-only` class goes on a wrapping div rather than the table itself: a
 * table's intrinsic minimum width beats `width: 1px`, so its rows escaped the
 * clip and widened the whole page on a 360px viewport. A block wrapper clips
 * it properly.
 */
function ChartTable({ data, seriesLabel }: { data: BalanceTrendData; seriesLabel: string }) {
  return (
    <div className="sr-only">
      <table>
        <caption>
          {seriesLabel} in {data.currency}
          {data.includedAccounts > 1 ? ` across ${data.includedAccounts} accounts` : ''}, by date
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{seriesLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{point.date}</th>
              <td>{formatMoney(point.total, { currency: data.currency })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BalanceTrend({
  data,
  height = 280,
  timezone,
  locale,
  /**
   * A single account's page plots one series, so the Total/By-account toggle,
   * the legend and the "N accounts" caption are all noise there. `single`
   * drops them and labels the line with the account's own name.
   */
  variant = 'multi',
  seriesLabel = 'Total balance',
}: {
  data: BalanceTrendData;
  height?: number;
  variant?: 'multi' | 'single';
  seriesLabel?: string;
  /**
   * Axis labels are formatted here rather than on the server: a formatter
   * function cannot cross the Server/Client Component boundary, so the timezone
   * travels instead and lib/date does the work on this side.
   */
  timezone?: string;
  locale?: string;
}) {
  const narrow = useNarrowViewport();
  const single = variant === 'single';
  const [rawMode, setMode] = React.useState<Mode>('total');
  const mode: Mode = single ? 'total' : rawMode;
  const [hidden, setHidden] = React.useState<Set<string>>(new Set());

  const formatDate = React.useCallback(
    (value: string) => formatAxisDate(value, timezone, locale),
    [timezone, locale],
  );

  if (data.points.length === 0) {
    return (
      <div
        style={{ height }}
        className="text-muted-foreground flex items-center justify-center text-sm"
      >
        No balance data for this period.
      </div>
    );
  }

  const rising = data.change >= 0;
  const trendColor = rising ? 'var(--income)' : 'var(--expense)';

  const visibleAccounts = data.accounts.filter((account) => !hidden.has(account.label));

  // Be explicit about anything left out of the total. A silently under-reported
  // net worth is worse than a slightly busier caption.
  const notes: string[] = single
    ? []
    : [
        `${data.includedAccounts} ${data.currency} account${data.includedAccounts === 1 ? '' : 's'}`,
      ];
  if (data.excludedAccounts > 0) {
    notes.push(`${data.excludedAccounts} in ${data.excludedCurrencies.join(', ')} not converted`);
  }
  if (data.excludedFromNetWorth > 0) {
    notes.push(`${data.excludedFromNetWorth} archived or excluded from net worth`);
  }

  const toggleAccount = (label: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      // Never let the user hide the last remaining series — an empty chart
      // reads as broken rather than as a deliberate filter.
      else if (visibleAccounts.length > 1) next.add(label);
      return next;
    });

  const sharedAxes = (
    <>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis
        dataKey="date"
        {...AXIS_PROPS}
        tickLine={false}
        axisLine={false}
        minTickGap={narrow ? 32 : 48}
        tickFormatter={formatDate}
      />
      <YAxis
        {...AXIS_PROPS}
        tickLine={false}
        axisLine={false}
        width={narrow ? 48 : 68}
        tickFormatter={(value: number) =>
          formatMoney(value, { currency: data.currency, compact: true, hideSymbol: narrow })
        }
      />
      {/* Anchors the eye when balances cross into negative territory. */}
      <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
    </>
  );

  return (
    <div className="min-w-0 space-y-3">
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          single ? 'justify-end' : 'justify-between',
          single && notes.length === 0 ? 'hidden' : '',
        )}
      >
        <div
          role="tablist"
          aria-label="Balance chart view"
          className={cn('bg-muted inline-flex gap-1 rounded-lg p-0.5', single && 'hidden')}
        >
          {(
            [
              ['total', 'Total'],
              ['accounts', 'By account'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                mode === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {notes.length > 0 ? (
          <p className="text-muted-foreground text-xs">{notes.join(' · ')}</p>
        ) : null}
      </div>

      <div
        className="w-full min-w-0 overflow-hidden"
        role="img"
        aria-label={`${seriesLabel} ${rising ? 'rose' : 'fell'} from ${formatMoney(data.opening, { currency: data.currency })} to ${formatMoney(data.closing, { currency: data.currency })} over this period.`}
      >
        <ResponsiveContainer width="100%" height={height}>
          {mode === 'total' ? (
            <AreaChart
              data={data.points}
              margin={{ top: 8, right: 8, bottom: 0, left: narrow ? 0 : 8 }}
            >
              <defs>
                <linearGradient id="balance-total-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {sharedAxes}
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelFormatter={(label) => formatDate(String(label))}
                formatter={(value) => [
                  formatMoney(value as number, { currency: data.currency }),
                  seriesLabel,
                ]}
              />
              <Area
                // Balances are sampled per day and move in steps, so a
                // monotone spline would draw curvature that never happened.
                type="linear"
                dataKey="total"
                name={seriesLabel}
                stroke={trendColor}
                strokeWidth={2}
                fill="url(#balance-total-fill)"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={data.points}
              margin={{ top: 8, right: 8, bottom: 0, left: narrow ? 0 : 8 }}
            >
              {sharedAxes}
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelFormatter={(label) => formatDate(String(label))}
                // Largest balance first, so the tooltip reads in the same order
                // the lines appear on screen.
                itemSorter={(item) =>
                  toDecimal(item.value as number)
                    .abs()
                    .negated()
                    .toNumber()
                }
                formatter={(value, name) => [
                  formatMoney(value as number, { currency: data.currency }),
                  String(name),
                ]}
              />
              {visibleAccounts.map((account) => (
                <Line
                  key={account.label}
                  type="linear"
                  dataKey={account.label}
                  name={account.label}
                  // Stroke only: a dozen translucent fills was the original
                  // problem, and lines stay readable when they overlap.
                  stroke={seriesColor(data.accounts.indexOf(account))}
                  strokeWidth={2}
                  strokeDasharray={account.aggregated ? '4 3' : undefined}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {mode === 'accounts' ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {data.accounts.map((account, index) => {
            const isHidden = hidden.has(account.label);
            return (
              <li key={account.label}>
                <button
                  type="button"
                  onClick={() => toggleAccount(account.label)}
                  aria-pressed={!isHidden}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-opacity',
                    isHidden ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: seriesColor(index) }}
                  />
                  <span className="max-w-[12rem] truncate">{account.label}</span>
                  <span className="text-muted-foreground" data-slot="amount">
                    {formatMoney(account.closing, {
                      currency: data.currency,
                      compact: true,
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {mode === 'accounts' ? (
        <p className="text-muted-foreground text-xs">
          Showing the {data.accounts.filter((a) => !a.aggregated).length} largest accounts by
          balance. Select a name to hide it and rescale the chart.
        </p>
      ) : null}

      <ChartTable data={data} seriesLabel={seriesLabel} />
    </div>
  );
}
