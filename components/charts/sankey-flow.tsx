import { formatMoney } from '@/lib/money';
import { NODE_WIDTH, type SankeyDiagram } from '@/lib/sankey';
import { seriesColor } from './theme';

/**
 * E14-06 — the cash-flow Sankey, rendered as plain SVG on the server.
 *
 * No client JavaScript: hover text is a native `<title>`, which is also what a
 * screen reader reads and what survives printing. A `viewBox` with
 * `preserveAspectRatio` handles the responsive scaling that a JS chart library
 * would need a resize observer for.
 */
export function SankeyFlow({ diagram }: { diagram: SankeyDiagram }) {
  if (diagram.nodes.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Not enough income and spending in this period to draw a flow.
      </p>
    );
  }

  const money = (value: string) => formatMoney(value, { currency: diagram.currency });

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <svg
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        width="100%"
        height={diagram.height}
        role="img"
        aria-label={`Cash flow: ${money(diagram.total)} from income sources, through accounts, into spending.`}
        className="min-w-[36rem]"
      >
        <g>
          {diagram.links.map((link, index) => (
            <path
              key={`${link.source}-${link.target}-${index}`}
              d={link.path}
              fill="none"
              stroke={seriesColor(link.colorIndex)}
              strokeWidth={link.width}
              strokeOpacity={0.28}
            >
              <title>
                {link.source.slice(2)} → {link.target.slice(2)}: {money(link.value)}
              </title>
            </path>
          ))}
        </g>

        <g>
          {diagram.nodes.map((node) => {
            const onRight = node.layer === 2;
            const labelX = onRight ? node.x + NODE_WIDTH + 6 : node.x - 6;
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={node.height}
                  rx={2}
                  fill={
                    node.layer === 0
                      ? 'var(--income)'
                      : node.layer === 2
                        ? 'var(--expense)'
                        : 'var(--primary)'
                  }
                >
                  <title>
                    {node.label}: {money(node.value)}
                  </title>
                </rect>
                {/* Drop the label when the band is too thin to sit beside
                    without colliding with its neighbours. */}
                {node.height >= 10 ? (
                  <text
                    x={labelX}
                    y={node.y + node.height / 2}
                    dominantBaseline="middle"
                    textAnchor={onRight ? 'start' : 'end'}
                    fontSize={11}
                    fill="var(--foreground)"
                  >
                    {node.label.length > 16 ? `${node.label.slice(0, 15)}…` : node.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
