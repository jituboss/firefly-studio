import * as React from 'react';

/**
 * E21-06 — the text alternative every chart in this app owes a screen reader.
 *
 * A Recharts SVG is a pile of unlabelled `<path>` elements. Read aloud it is
 * either silence or a stream of axis tick numbers in no meaningful order, which
 * is arguably worse.
 *
 * So each chart carries two things, following the pattern `balance-trend.tsx`
 * and `sankey-flow.tsx` already used: `role="img"` with a one-line spoken
 * summary on the drawing — which also makes it a leaf in the accessibility
 * tree, so none of those paths are announced — and this table beside it with
 * the figures. A screen-reader user hears what the chart says, then can read
 * what it is made of.
 *
 * The `sr-only` class goes on a wrapping div rather than on the table itself.
 * This was learned the hard way in `balance-trend.tsx`: a table's intrinsic
 * minimum width beats `width: 1px`, so its rows escape the clip and widen the
 * whole page on a 360px viewport. A block wrapper clips it properly.
 */
export function ChartTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly string[];
  /** Pre-formatted cells — the caller owns money and date formatting. */
  rows: readonly (readonly string[])[];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[0] ?? index}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
