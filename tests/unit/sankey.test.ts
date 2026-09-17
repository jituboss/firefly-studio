import { describe, expect, it } from 'vitest';
import { buildSankey, NODE_WIDTH, type FlowTransaction } from '@/lib/sankey';

/**
 * The cash-flow diagram. It is hand-rolled rather than d3-sankey because the
 * graph is always three fixed layers, so these cover the two things that
 * assumption buys — and the two it could silently get wrong.
 */

const flow = (
  over: Partial<FlowTransaction> & { type: string; amount: string },
): FlowTransaction => ({
  currency_code: 'EUR',
  source_name: null,
  destination_name: null,
  category_name: null,
  ...over,
});

const salary = flow({
  type: 'deposit',
  amount: '3000',
  source_name: 'Employer',
  destination_name: 'Checking',
});
const rent = flow({
  type: 'withdrawal',
  amount: '1000',
  source_name: 'Checking',
  destination_name: 'Landlord',
  category_name: 'Housing',
});

describe('buildSankey', () => {
  it('lays income, accounts and spending out as three columns', () => {
    const diagram = buildSankey([salary, rent], 'EUR');
    const layers = diagram.nodes.reduce<Record<number, string[]>>((acc, node) => {
      (acc[node.layer] ??= []).push(node.label);
      return acc;
    }, {});

    expect(layers[0]).toEqual(['Employer']);
    expect(layers[1]).toEqual(['Checking']);
    expect(layers[2]).toEqual(['Housing']);
  });

  it('prefers the category over the expense account, which says more', () => {
    const diagram = buildSankey([salary, rent], 'EUR');
    expect(diagram.nodes.map((n) => n.label)).toContain('Housing');
    expect(diagram.nodes.map((n) => n.label)).not.toContain('Landlord');
  });

  it('falls back to the expense account when there is no category', () => {
    const uncategorised = flow({
      type: 'withdrawal',
      amount: '50',
      source_name: 'Checking',
      destination_name: 'Corner Shop',
    });
    const labels = buildSankey([salary, uncategorised], 'EUR').nodes.map((n) => n.label);
    expect(labels).toContain('Corner Shop');
  });

  it('leaves transfers out, because they are not a flow through the diagram', () => {
    // An asset-to-asset move would draw an edge inside the middle column and
    // stop the columns adding up.
    const transfer = flow({
      type: 'transfer',
      amount: '500',
      source_name: 'Checking',
      destination_name: 'Savings',
    });
    const diagram = buildSankey([salary, rent, transfer], 'EUR');
    expect(diagram.nodes.map((n) => n.label)).not.toContain('Savings');
    expect(diagram.total).toBe('3000');
  });

  it('ignores anything in another currency', () => {
    const usd = flow({
      type: 'deposit',
      amount: '999',
      source_name: 'US Client',
      destination_name: 'Checking',
      currency_code: 'USD',
    });
    expect(buildSankey([salary, usd], 'EUR').nodes.map((n) => n.label)).not.toContain('US Client');
  });

  it('groups everything past the cap into one "Other" node', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      flow({
        type: 'deposit',
        amount: String(100 - index),
        source_name: `Source ${index}`,
        destination_name: 'Checking',
      }),
    );
    const diagram = buildSankey(many, 'EUR', { maxPerLayer: 3 });
    const sources = diagram.nodes.filter((n) => n.layer === 0).map((n) => n.label);
    expect(sources).toContain('Other');
    expect(sources.length).toBeLessThanOrEqual(4);
    expect(diagram.omitted).toBeGreaterThan(0);
  });

  it('merges repeated pairs into one ribbon rather than stacking duplicates', () => {
    const diagram = buildSankey([salary, salary, rent], 'EUR');
    const incoming = diagram.links.filter((l) => l.source.startsWith('0:'));
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.value).toBe('6000');
  });

  it('keeps every node and ribbon inside the canvas', () => {
    const diagram = buildSankey([salary, rent], 'EUR', { width: 600, height: 300 });
    for (const node of diagram.nodes) {
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y + node.height).toBeLessThanOrEqual(300);
      expect(node.x + NODE_WIDTH).toBeLessThanOrEqual(600);
    }
    for (const link of diagram.links) {
      expect(link.path.startsWith('M')).toBe(true);
      expect(link.width).toBeGreaterThan(0);
    }
  });

  it('gives a bigger flow a thicker ribbon', () => {
    const small = flow({
      type: 'withdrawal',
      amount: '10',
      source_name: 'Checking',
      category_name: 'Coffee',
    });
    const diagram = buildSankey([salary, rent, small], 'EUR');
    const housing = diagram.links.find((l) => l.target.endsWith('Housing'));
    const coffee = diagram.links.find((l) => l.target.endsWith('Coffee'));
    expect(housing!.width).toBeGreaterThan(coffee!.width);
  });

  it('returns an empty diagram rather than throwing on no usable data', () => {
    expect(buildSankey([], 'EUR').nodes).toEqual([]);
    expect(buildSankey([flow({ type: 'transfer', amount: '10' })], 'EUR').nodes).toEqual([]);
    expect(buildSankey([flow({ type: 'deposit', amount: '0' })], 'EUR').nodes).toEqual([]);
  });

  it('names a missing counterparty instead of drawing a blank node', () => {
    const anonymous = flow({ type: 'deposit', amount: '100', destination_name: 'Checking' });
    expect(buildSankey([anonymous], 'EUR').nodes.map((n) => n.label)).toContain('Other income');
  });
});
