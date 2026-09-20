'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTable } from './chart-table';
import { formatMoney, toDecimal } from '@/lib/money';

export interface TrendPoint {
  date: string;
  [series: string]: string | number;
}

/**
 * E21-03 — shared chart theme. Colours come from the token layer so both
 * themes work, and the series palette is the colour-blind-safe one.
 */
export function AreaTrend({
  data,
  series,
  currency,
  height = 260,
}: {
  data: TrendPoint[];
  series: string[];
  currency: string;
  height?: number;
}) {
  // Axis gutters are sized for the viewport: a 64px Y gutter eats a fifth of a
  // 360px screen.
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
        No data for this period.
      </div>
    );
  }

  const seriesColor = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes('spent') || normalized.includes('expense')) return 'var(--expense)';
    if (normalized.includes('earned') || normalized.includes('income')) return 'var(--income)';
    if (normalized.includes('balance')) return 'var(--primary)';
    return `var(--chart-${(series.indexOf(name) + 1) % 8 || 8})`;
  };

  return (
    <>
      <div
        className="w-full min-w-0 overflow-hidden"
        role="img"
        aria-label={`${series.join(' and ')} by date, in ${currency}`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              {series.map((name) => {
                const color = seriesColor(name);
                const index = series.indexOf(name);
                return (
                  <linearGradient key={name} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={narrow ? 44 : 64}
              tickFormatter={(value: number) =>
                formatMoney(value, { currency, compact: true, hideSymbol: narrow })
              }
            />
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--popover-foreground)',
              }}
              // The series name is the label. An earlier version swapped in
              // "Earned"/"Spent" based on the sign, which mislabelled balance
              // series: a credit card sitting at -3M is a balance, not spending.
              formatter={(value, name) => [
                formatMoney(toDecimal(value as number).toNumber(), { currency }),
                String(name),
              ]}
            />
            {series.map((name) => {
              const color = seriesColor(name);
              const index = series.indexOf(name);
              return (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${index})`}
                  dot={false}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption={`${series.join(' and ')} by date, in ${currency}`}
        columns={['Date', ...series]}
        rows={data.map(
          (point) =>
            [
              String(point.date),
              ...series.map((name) => formatMoney(point[name] ?? 0, { currency })),
            ] as const,
        )}
      />
    </>
  );
}
