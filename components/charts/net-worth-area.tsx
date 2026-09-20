'use client';

import * as React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_CONTENT_STYLE, axisWidth } from './theme';
import { ChartTable } from './chart-table';
import { formatMoney } from '@/lib/money';
import { formatAxisDate } from '@/lib/date';
import type { NetWorthPoint } from '@/lib/reports';

/**
 * E14-02 — assets and liabilities as opposed areas with the net line on top.
 *
 * Liabilities are drawn as a NEGATIVE area so the gap between the two bands is
 * the net worth the line traces. `buildNetWorth` hands them over as positive
 * magnitudes (that is the honest number for a table), so the flip happens here,
 * at the drawing boundary, and the tooltip flips it back.
 */
export function NetWorthArea({
  data,
  currency,
  timezone,
  locale = 'en-US',
  height = 320,
}: {
  data: NetWorthPoint[];
  currency: string;
  timezone: string;
  locale?: string;
  height?: number;
}) {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="text-muted-foreground flex items-center justify-center text-sm"
      >
        No balance history for this period.
      </div>
    );
  }

  const rows = data.map((point) => ({
    ...point,
    drawnLiabilities: -point.liabilities,
    label: formatAxisDate(point.date, timezone, locale),
  }));

  return (
    <>
      <div
        className="w-full min-w-0 overflow-hidden"
        role="img"
        aria-label={`Net worth by date, in ${currency}`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="nw-assets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--income)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--income)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="nw-liabilities" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--expense)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={24} />
            <YAxis
              {...AXIS_PROPS}
              width={axisWidth(narrow)}
              tickFormatter={(value: number) =>
                formatMoney(value, { currency, compact: true, hideSymbol: narrow })
              }
            />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              formatter={(value, name) => [
                // Undo the drawing-only sign flip so the tooltip reports the debt
                // as the positive amount the user actually owes.
                formatMoney(name === 'Liabilities' ? -(value as number) : (value as number), {
                  currency,
                }),
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            <Area
              type="monotone"
              dataKey="assets"
              name="Assets"
              stroke="var(--income)"
              strokeWidth={1.5}
              fill="url(#nw-assets)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="drawnLiabilities"
              name="Liabilities"
              stroke="var(--expense)"
              strokeWidth={1.5}
              fill="url(#nw-liabilities)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Net worth"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption={`Net worth by date, in ${currency}`}
        columns={['Date', 'Assets', 'Liabilities', 'Net worth']}
        rows={data.map(
          (point) =>
            [
              formatAxisDate(point.date, timezone, locale),
              formatMoney(point.assets, { currency }),
              formatMoney(point.liabilities, { currency }),
              formatMoney(point.net, { currency }),
            ] as const,
        )}
      />
    </>
  );
}
