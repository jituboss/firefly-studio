'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@/lib/money';

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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          {series.map((name, index) => (
            <linearGradient key={name} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--chart-${(index % 8) + 1})`} stopOpacity={0.3} />
              <stop
                offset="100%"
                stopColor={`var(--chart-${(index % 8) + 1})`}
                stopOpacity={0.02}
              />
            </linearGradient>
          ))}
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
          width={64}
          tickFormatter={(value: number) => formatMoney(value, { currency, compact: true })}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--popover-foreground)',
          }}
          formatter={(value) => formatMoney(value as number, { currency })}
        />
        {series.map((name, index) => (
          <Area
            key={name}
            type="monotone"
            dataKey={name}
            stroke={`var(--chart-${(index % 8) + 1})`}
            strokeWidth={2}
            fill={`url(#grad-${index})`}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
