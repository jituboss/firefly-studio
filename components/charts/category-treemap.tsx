'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { TOOLTIP_CONTENT_STYLE, seriesColor } from './theme';
import { ChartTable } from './chart-table';
import { formatMoney } from '@/lib/money';

/**
 * E14-04 — spending as a treemap: area is share of total, which reads faster
 * than a ranked list when one or two categories dominate.
 *
 * The label is drawn only where the tile is big enough to hold it; a clipped
 * half-word is worse than no word, and the tooltip covers the rest.
 */

// Recharts' Treemap types require an index signature on each datum.
interface TreemapDatum {
  name: string;
  size: number;
  [key: string]: string | number;
}

interface TileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
}

function Tile({ x = 0, y = 0, width = 0, height = 0, index = 0, name = '' }: TileProps) {
  const roomForLabel = width > 64 && height > 28;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        style={{
          fill: seriesColor(index),
          stroke: 'var(--background)',
          strokeWidth: 2,
        }}
      />
      {roomForLabel ? (
        <text
          x={x + 8}
          y={y + 18}
          fill="var(--background)"
          fontSize={11}
          fontWeight={500}
          pointerEvents="none"
        >
          {name.length > Math.floor(width / 7) ? `${name.slice(0, Math.floor(width / 7))}…` : name}
        </text>
      ) : null}
    </g>
  );
}

export function CategoryTreemap({
  data,
  currency,
  height = 300,
}: {
  data: TreemapDatum[];
  currency: string;
  height?: number;
}) {
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
          <Treemap
            data={data}
            dataKey="size"
            nameKey="name"
            isAnimationActive={false}
            content={<Tile />}
          >
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              formatter={(value) => formatMoney(value as number, { currency })}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption={`Spending by category, in ${currency}`}
        columns={['Category', 'Amount']}
        rows={data.map((datum) => [datum.name, formatMoney(datum.size, { currency })] as const)}
      />
    </>
  );
}
