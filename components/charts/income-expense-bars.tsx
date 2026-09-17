'use client';

import * as React from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@/lib/money';
import { formatMonthLabel } from '@/lib/date';
import type { CashFlowPoint } from '@/lib/reports';

/**
 * E14-03 — income against expense per month, with the running net as a line on
 * its own axis.
 *
 * Both bars measure upwards: `buildCashFlow` has already flipped the sign
 * Firefly puts on spending, so "bigger bar = more money moved" reads the same
 * way on both sides. Colour is semantic (income green, expense red) and is
 * never the only signal — the legend and the tooltip name each series.
 */
export function IncomeExpenseBars({
  data,
  currency,
  timezone,
  locale = 'en-US',
  height = 300,
  showCumulative = true,
}: {
  data: CashFlowPoint[];
  currency: string;
  timezone: string;
  locale?: string;
  height?: number;
  showCumulative?: boolean;
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
        No income or expenses in this period.
      </div>
    );
  }

  const rows = data.map((point) => ({
    ...point,
    label: formatMonthLabel(point.date, timezone, locale),
  }));

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={narrow ? 44 : 64}
            tickFormatter={(value: number) =>
              formatMoney(value, { currency, compact: true, hideSymbol: narrow })
            }
          />
          {showCumulative ? (
            // A second axis, because a running total over twelve months is an
            // order of magnitude larger than any single month's bar; sharing
            // one axis flattens the bars into the baseline.
            <YAxis yAxisId="right" orientation="right" hide />
          ) : null}
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--popover-foreground)',
            }}
            formatter={(value, name) => [formatMoney(value as number, { currency }), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar
            yAxisId="left"
            dataKey="earned"
            name="Income"
            fill="var(--income)"
            radius={[3, 3, 0, 0]}
            maxBarSize={38}
          />
          <Bar
            yAxisId="left"
            dataKey="spent"
            name="Expenses"
            fill="var(--expense)"
            radius={[3, 3, 0, 0]}
            maxBarSize={38}
          />
          {showCumulative ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="Running net"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
