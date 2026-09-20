'use client';

import * as React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTable } from './chart-table';
import { formatMoney } from '@/lib/money';

export function CategoryBars({
  data,
  currency,
  height = 260,
}: {
  data: Array<{ name: string; value: number }>;
  currency: string;
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
        Nothing spent in this period.
      </div>
    );
  }

  return (
    <>
      <div
        className="w-full min-w-0 overflow-hidden"
        role="img"
        aria-label={`Spending by category, in ${currency}`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={narrow ? 84 : 110}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--popover-foreground)',
              }}
              formatter={(value) => formatMoney(value as number, { currency })}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={`var(--chart-${(index % 8) + 1})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption={`Spending by category, in ${currency}`}
        columns={['Category', 'Amount']}
        rows={data.map((row) => [row.name, formatMoney(row.value, { currency })] as const)}
      />
    </>
  );
}
