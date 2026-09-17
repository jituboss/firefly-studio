import { add, divide, toDecimal } from '@/lib/money';

/**
 * E14-06 — the cash-flow Sankey.
 *
 * Built by hand rather than with d3-sankey. The general algorithm solves a
 * problem this diagram does not have: it iteratively relaxes node positions
 * across an arbitrary DAG. Here the graph is always exactly three layers —
 * income source → asset account → spending category — because that is the
 * shape of a personal ledger, and in a fixed-layer graph the layout reduces to
 * stacking each column proportionally. That is a few dozen lines against a new
 * dependency and a build-approval entry.
 *
 * The flows come from raw transactions rather than an aggregate endpoint,
 * because the source→destination PAIRING is the whole point of the diagram and
 * no `/insight/*` endpoint exposes it: those report one side or the other.
 */

export interface FlowTransaction {
  type: string;
  amount: string;
  currency_code: string;
  source_name: string | null;
  destination_name: string | null;
  category_name: string | null;
}

export interface SankeyNode {
  id: string;
  label: string;
  layer: 0 | 1 | 2;
  value: string;
  x: number;
  y: number;
  height: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: string;
  /** SVG cubic path, already positioned. */
  path: string;
  /** Stroke width in px, proportional to value. */
  width: number;
  colorIndex: number;
}

export interface SankeyDiagram {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width: number;
  height: number;
  currency: string;
  total: string;
  /** Flows dropped because they fell below the visibility threshold. */
  omitted: number;
}

const NODE_WIDTH = 12;
const NODE_GAP = 8;
const LABEL_GUTTER = 108;

export interface SankeyOptions {
  width?: number;
  height?: number;
  /** Cap per column; the rest roll into an "Other" node. */
  maxPerLayer?: number;
}

/**
 * Aggregate transactions into three columns of flows and lay them out.
 *
 * Transfers are skipped on purpose: an asset→asset move would draw an edge
 * inside the middle column, which is not a flow through the diagram and makes
 * the column totals stop adding up.
 */
export function buildSankey(
  transactions: FlowTransaction[],
  currency: string,
  options: SankeyOptions = {},
): SankeyDiagram {
  const { width = 720, height = 420, maxPerLayer = 8 } = options;
  const wanted = currency.toUpperCase();

  // layer0 → layer1 (income), layer1 → layer2 (spending)
  const inbound = new Map<string, Map<string, ReturnType<typeof toDecimal>>>();
  const outbound = new Map<string, Map<string, ReturnType<typeof toDecimal>>>();

  const bump = (
    table: Map<string, Map<string, ReturnType<typeof toDecimal>>>,
    from: string,
    to: string,
    amount: string,
  ) => {
    let row = table.get(from);
    if (!row) {
      row = new Map();
      table.set(from, row);
    }
    row.set(to, add(row.get(to) ?? 0, toDecimal(amount).abs()));
  };

  for (const entry of transactions) {
    if ((entry.currency_code ?? '').toUpperCase() !== wanted) continue;
    if (toDecimal(entry.amount).isZero()) continue;

    if (entry.type === 'deposit') {
      const source = entry.source_name?.trim() || 'Other income';
      const account = entry.destination_name?.trim() || 'Unknown account';
      bump(inbound, source, account, entry.amount);
    } else if (entry.type === 'withdrawal') {
      const account = entry.source_name?.trim() || 'Unknown account';
      // Prefer the category — "Groceries" says more than "Tesco" — and fall
      // back to the expense account when a transaction has none.
      const sink = entry.category_name?.trim() || entry.destination_name?.trim() || 'Uncategorised';
      bump(outbound, account, sink, entry.amount);
    }
  }

  // --- collapse each column to its top N, rolling the rest into "Other" ---

  const columnTotals = (
    table: Map<string, Map<string, ReturnType<typeof toDecimal>>>,
    side: 'from' | 'to',
  ) => {
    const totals = new Map<string, ReturnType<typeof toDecimal>>();
    for (const [from, row] of table) {
      for (const [to, value] of row) {
        const key = side === 'from' ? from : to;
        totals.set(key, add(totals.get(key) ?? 0, value));
      }
    }
    return totals;
  };

  const keepTop = (totals: Map<string, ReturnType<typeof toDecimal>>) => {
    const ranked = [...totals.entries()].sort((a, b) => b[1].comparedTo(a[1]));
    return new Set(ranked.slice(0, maxPerLayer).map(([name]) => name));
  };

  const sources = keepTop(columnTotals(inbound, 'from'));
  const sinks = keepTop(columnTotals(outbound, 'to'));
  // The middle column is every account touched on either side.
  const accounts = keepTop(
    new Map([...columnTotals(inbound, 'to'), ...columnTotals(outbound, 'from')]),
  );

  let omitted = 0;
  const foldName = (name: string, keep: Set<string>) => {
    if (keep.has(name)) return name;
    omitted += 1;
    return 'Other';
  };

  const edges: Array<{
    from: string;
    to: string;
    layer: 0 | 1;
    value: ReturnType<typeof toDecimal>;
  }> = [];
  const push = (from: string, to: string, layer: 0 | 1, value: ReturnType<typeof toDecimal>) => {
    const existing = edges.find(
      (edge) => edge.from === from && edge.to === to && edge.layer === layer,
    );
    if (existing) existing.value = add(existing.value, value);
    else edges.push({ from, to, layer, value });
  };

  for (const [from, row] of inbound) {
    for (const [to, value] of row) {
      push(`0:${foldName(from, sources)}`, `1:${foldName(to, accounts)}`, 0, value);
    }
  }
  for (const [from, row] of outbound) {
    for (const [to, value] of row) {
      push(`1:${foldName(from, accounts)}`, `2:${foldName(to, sinks)}`, 1, value);
    }
  }

  const empty: SankeyDiagram = {
    nodes: [],
    links: [],
    width,
    height,
    currency: wanted,
    total: '0',
    omitted: 0,
  };
  if (edges.length === 0) return empty;

  // --- node values -----------------------------------------------------------

  const nodeValues = new Map<string, ReturnType<typeof toDecimal>>();
  for (const edge of edges) {
    // A node's size is the larger of what flows in and what flows out, so a
    // current account that receives 1000 and spends 1200 is drawn at 1200 and
    // its outgoing ribbons still fit inside it.
    nodeValues.set(edge.from, add(nodeValues.get(edge.from) ?? 0, edge.value));
  }
  const incomingValues = new Map<string, ReturnType<typeof toDecimal>>();
  for (const edge of edges) {
    incomingValues.set(edge.to, add(incomingValues.get(edge.to) ?? 0, edge.value));
  }
  for (const [id, value] of incomingValues) {
    const current = nodeValues.get(id) ?? toDecimal(0);
    nodeValues.set(id, value.greaterThan(current) ? value : current);
  }

  // --- layout ----------------------------------------------------------------

  const byLayer: Array<Array<{ id: string; value: ReturnType<typeof toDecimal> }>> = [[], [], []];
  for (const [id, value] of nodeValues) {
    const layer = Number.parseInt(id.slice(0, 1), 10) as 0 | 1 | 2;
    byLayer[layer]!.push({ id, value });
  }
  for (const column of byLayer) column.sort((a, b) => b.value.comparedTo(a.value));

  // Scale so the tallest column exactly fills the canvas height.
  const plotHeight = height - 8;
  let scale = 0;
  for (const column of byLayer) {
    if (column.length === 0) continue;
    let sum = toDecimal(0);
    for (const node of column) sum = add(sum, node.value);
    const available = plotHeight - NODE_GAP * (column.length - 1);
    if (sum.isZero() || available <= 0) continue;
    const columnScale = divide(available, sum).toNumber();
    if (scale === 0 || columnScale < scale) scale = columnScale;
  }
  if (scale === 0) return empty;

  const columnX = [LABEL_GUTTER, width / 2 - NODE_WIDTH / 2, width - LABEL_GUTTER - NODE_WIDTH];

  const nodes: SankeyNode[] = [];
  const nodeById = new Map<string, SankeyNode>();

  byLayer.forEach((column, layer) => {
    let cursor = 4;
    for (const entry of column) {
      // A node worth a hair of a pixel is still a node someone can hover.
      const nodeHeight = Math.max(2, entry.value.toNumber() * scale);
      const node: SankeyNode = {
        id: entry.id,
        label: entry.id.slice(2),
        layer: layer as 0 | 1 | 2,
        value: entry.value.toString(),
        x: columnX[layer]!,
        y: cursor,
        height: nodeHeight,
      };
      nodes.push(node);
      nodeById.set(node.id, node);
      cursor += nodeHeight + NODE_GAP;
    }
  });

  // --- ribbons ---------------------------------------------------------------

  const outCursor = new Map<string, number>();
  const inCursor = new Map<string, number>();

  const links: SankeyLink[] = edges
    .sort((a, b) => b.value.comparedTo(a.value))
    .map((edge, index) => {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) return null;

      const thickness = Math.max(1, edge.value.toNumber() * scale);
      const sourceOffset = outCursor.get(from.id) ?? 0;
      const targetOffset = inCursor.get(to.id) ?? 0;
      outCursor.set(from.id, sourceOffset + thickness);
      inCursor.set(to.id, targetOffset + thickness);

      const y1 = from.y + sourceOffset + thickness / 2;
      const y2 = to.y + targetOffset + thickness / 2;
      const x1 = from.x + NODE_WIDTH;
      const x2 = to.x;
      const midpoint = (x1 + x2) / 2;

      return {
        source: from.id,
        target: to.id,
        value: edge.value.toString(),
        path: `M${x1},${y1} C${midpoint},${y1} ${midpoint},${y2} ${x2},${y2}`,
        width: thickness,
        colorIndex: index % 8,
      } satisfies SankeyLink;
    })
    .filter((link): link is SankeyLink => link !== null);

  let total = toDecimal(0);
  for (const edge of edges) {
    if (edge.layer === 0) total = add(total, edge.value);
  }

  return { nodes, links, width, height, currency: wanted, total: total.toString(), omitted };
}

export { NODE_WIDTH, LABEL_GUTTER };
