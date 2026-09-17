import Link from 'next/link';
import type { MonthlyGrid } from '@/lib/reports';
import { toDecimal } from '@/lib/money';
import { Amount } from '@/components/ui/amount';

/**
 * E14-04 / E14-05 — a resource × month heat grid.
 *
 * Intensity is carried by opacity over a single hue rather than a rainbow
 * scale, so it survives both themes and greyscale printing. Colour is never the
 * only signal: every cell also carries the formatted amount as its title and
 * screen-reader text, which is what makes this readable at all for anyone who
 * cannot compare shades.
 */
export function MonthlyGridTable({
  grid,
  currency,
  hrefFor,
  emptyMessage = 'Nothing to report for this period.',
}: {
  grid: MonthlyGrid;
  currency: string;
  hrefFor?: (row: MonthlyGrid['rows'][number]) => string | null;
  emptyMessage?: string;
}) {
  if (grid.rows.length === 0 || grid.months.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="relative min-w-0 overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-xs">
            <th scope="col" className="sticky left-0 bg-inherit py-1.5 pr-3 text-left font-medium">
              Name
            </th>
            {grid.months.map((month) => (
              <th
                key={month.key}
                scope="col"
                className="px-1.5 py-1.5 text-center font-medium whitespace-nowrap"
              >
                {month.label}
              </th>
            ))}
            <th scope="col" className="py-1.5 pl-3 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row) => {
            const href = hrefFor?.(row) ?? null;
            return (
              <tr key={row.id ?? row.name} className="border-border/60 border-b">
                <td className="max-w-[14rem] py-1.5 pr-3">
                  {href ? (
                    <Link href={href} className="hover:text-primary block truncate hover:underline">
                      {row.name}
                    </Link>
                  ) : (
                    <span className="block truncate">{row.name}</span>
                  )}
                </td>
                {row.cells.map((cell) => {
                  const empty = toDecimal(cell.amount).isZero();
                  return (
                    <td key={cell.monthKey} className="p-0.5">
                      <div
                        className="flex h-7 min-w-[3.5rem] items-center justify-center rounded text-[0.6875rem]"
                        style={{
                          // A floor of 0.06 keeps a non-zero month visible
                          // rather than fading into the page background.
                          background: empty
                            ? 'var(--muted)'
                            : `color-mix(in oklch, var(--chart-1) ${Math.max(6, cell.ratio ?? 0)}%, transparent)`,
                        }}
                      >
                        <span className="sr-only">
                          {row.name}, {cell.monthKey}:
                        </span>
                        {empty ? (
                          <span className="text-muted-foreground" aria-hidden="true">
                            ·
                          </span>
                        ) : (
                          <Amount
                            value={cell.amount}
                            currency={currency}
                            compact
                            showSign={false}
                            tone="neutral"
                            size="sm"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="py-1.5 pl-3 text-right font-medium">
                  <Amount value={row.total} currency={currency} showSign={false} tone="neutral" />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="text-xs font-medium">
            <td className="py-2 pr-3">Total</td>
            {grid.totals.map((total, index) => (
              <td key={grid.months[index]?.key ?? index} className="px-1.5 py-2 text-center">
                <Amount
                  value={total}
                  currency={currency}
                  compact
                  showSign={false}
                  tone="neutral"
                  size="sm"
                />
              </td>
            ))}
            <td className="py-2 pl-3 text-right">
              <Amount value={grid.grandTotal} currency={currency} showSign={false} tone="neutral" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
