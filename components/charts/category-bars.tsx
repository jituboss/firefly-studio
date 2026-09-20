'use client';

import * as React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_PROPS, TOOLTIP_CONTENT_STYLE, TOOLTIP_CURSOR_FILL, seriesColor } from './theme';
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
            <YAxis type="category" dataKey="name" width={narrow ? 84 : 110} {...AXIS_PROPS} />
            <Tooltip
              cursor={TOOLTIP_CURSOR_FILL}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              formatter={(value) => formatMoney(value as number, { currency })}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={seriesColor(index)} />
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
