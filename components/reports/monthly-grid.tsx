import Link from 'next/link';
import type { MonthlyGrid } from '@/lib/reports';
import { toDecimal } from '@/lib/money';
import { Amount } from '@/components/ui/amount';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';

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
    <Table label="Monthly breakdown" className="min-w-max">
      <THead>
        <TR head>
          <TH className="sticky left-0 bg-inherit">Name</TH>
          {grid.months.map((month) => (
            <TH key={month.key} align="center" className="whitespace-nowrap">
              {month.label}
            </TH>
          ))}
          <TH align="right" className="pl-3">
            Total
          </TH>
        </TR>
      </THead>
      <TBody>
        {grid.rows.map((row) => {
          const href = hrefFor?.(row) ?? null;
          return (
            <TR key={row.id ?? row.name}>
              <TD className="max-w-[14rem]">
                {href ? (
                  <Link href={href} className="hover:text-primary block truncate hover:underline">
                    {row.name}
                  </Link>
                ) : (
                  <span className="block truncate">{row.name}</span>
                )}
              </TD>
              {row.cells.map((cell) => {
                const empty = toDecimal(cell.amount).isZero();
                return (
                  <TD key={cell.monthKey} align="center" className="p-0.5">
                    <div
                      className="flex h-7 min-w-[3.5rem] items-center justify-center rounded text-[0.6875rem]"
                      style={{
                        // A floor of 6% keeps a non-zero month visible rather
                        // than fading into the page background. The ceiling is
                        // the accessibility half of the same problem: at full
                        // strength the cell is saturated --chart-1, and the
                        // amount printed on it drops below the 4.5:1 contrast
                        // minimum — axe caught exactly one node in the whole
                        // app, and it was the busiest month in this grid. The
                        // ramp still reads at 62%; the top of it was spent on
                        // making text unreadable.
                        background: empty
                          ? 'var(--muted)'
                          : `color-mix(in oklch, var(--chart-1) ${Math.min(62, Math.max(6, cell.ratio ?? 0))}%, transparent)`,
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
                  </TD>
                );
              })}
              <TD align="right" className="pl-3 font-medium">
                <Amount value={row.total} currency={currency} showSign={false} tone="neutral" />
              </TD>
            </TR>
          );
        })}
      </TBody>
      <TFoot className="text-xs">
        <TR>
          <TD>Total</TD>
          {grid.totals.map((total, index) => (
            <TD key={grid.months[index]?.key ?? index} align="center">
              <Amount
                value={total}
                currency={currency}
                compact
                showSign={false}
                tone="neutral"
                size="sm"
              />
            </TD>
          ))}
          <TD align="right" className="pl-3">
            <Amount value={grid.grandTotal} currency={currency} showSign={false} tone="neutral" />
          </TD>
        </TR>
      </TFoot>
    </Table>
  );
}
