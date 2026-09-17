import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  DIMENSIONS,
  describeConfig,
  insightPathFor,
  parseConfig,
} from '@/lib/custom-report';
import { drillToTransactions, resolveReportScope, scopeToQuery } from '@/lib/report-scope';

/**
 * The custom report builder's vocabulary, and the report scope that every
 * report shares. Both take untrusted input — a saved row from an older release,
 * a hand-edited URL — so the important property is that neither can throw or
 * produce something that reaches a Firefly path.
 */

describe('insightPathFor', () => {
  it('maps a metric and dimension onto the endpoint name', () => {
    expect(insightPathFor('expense', 'category')).toBe('expense/category');
    expect(insightPathFor('income', 'tag')).toBe('income/tag');
  });

  it('names the counterparty endpoint after the account type, as Firefly does', () => {
    // Money out lands in an expense account; money in comes from a revenue one.
    expect(insightPathFor('expense', 'counterparty')).toBe('expense/expense');
    expect(insightPathFor('income', 'counterparty')).toBe('income/revenue');
  });

  it('refuses combinations Firefly has no endpoint for', () => {
    // There is no income/budget; offering it would 404 at report time.
    expect(insightPathFor('income', 'budget')).toBeNull();
    expect(insightPathFor('income', 'bill')).toBeNull();
  });

  it('resolves every spending dimension the picker offers', () => {
    for (const dimension of DIMENSIONS) {
      expect(insightPathFor('expense', dimension.value)).not.toBeNull();
    }
  });
});

describe('parseConfig', () => {
  it('accepts a valid config unchanged', () => {
    expect(
      parseConfig({ metric: 'income', dimension: 'tag', chart: 'treemap', limit: 15 }),
    ).toEqual({
      metric: 'income',
      dimension: 'tag',
      chart: 'treemap',
      limit: 15,
    });
  });

  it('falls back to the default rather than throwing on rubbish', () => {
    // A row saved by an older release, or a hand-edited query string.
    expect(parseConfig({ metric: 'nonsense', dimension: 42, chart: null })).toEqual(DEFAULT_CONFIG);
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(parseConfig(undefined)).toEqual(DEFAULT_CONFIG);
    expect(parseConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it('repairs a pair that has no endpoint instead of returning an empty report', () => {
    expect(parseConfig({ metric: 'income', dimension: 'budget' })).toMatchObject({
      metric: 'income',
      dimension: 'category',
    });
  });

  it('clamps the row limit into a sane range', () => {
    expect(parseConfig({ limit: 9999 }).limit).toBe(50);
    expect(parseConfig({ limit: -5 }).limit).toBe(3);
    expect(parseConfig({ limit: 7.8 }).limit).toBe(7);
    expect(parseConfig({ limit: Number.NaN }).limit).toBe(DEFAULT_CONFIG.limit);
  });
});

describe('describeConfig', () => {
  it('reads as a sentence, not as endpoint names', () => {
    expect(
      describeConfig({ metric: 'expense', dimension: 'category', chart: 'bar', limit: 10 }),
    ).toBe('Money out by category');
    expect(
      describeConfig({ metric: 'income', dimension: 'counterparty', chart: 'bar', limit: 10 }),
    ).toBe('Money in by payee / payer');
  });
});

describe('resolveReportScope', () => {
  it('carries a preset range through with its previous period', () => {
    const scope = resolveReportScope({ range: 'this-year' }, 'EUR', 'UTC');
    expect(scope.preset).toBe('this-year');
    expect(scope.previous.end < scope.start).toBe(true);
  });

  it('accepts an explicit start and end as a custom range', () => {
    const scope = resolveReportScope({ start: '2026-03-01', end: '2026-03-31' }, 'EUR', 'UTC');
    expect(scope).toMatchObject({ preset: 'custom', start: '2026-03-01', end: '2026-03-31' });
  });

  it('only accepts numeric account ids, which is all Firefly issues', () => {
    const scope = resolveReportScope({ accounts: '3,7,not-an-id,../../etc' }, 'EUR', 'UTC');
    expect(scope.accounts).toEqual(['3', '7']);
  });

  it('falls back to the connection currency unless given a real code', () => {
    expect(resolveReportScope({}, 'EUR', 'UTC').currency).toBe('EUR');
    expect(resolveReportScope({ currency: 'usd' }, 'EUR', 'UTC').currency).toBe('USD');
    expect(resolveReportScope({ currency: 'nonsense' }, 'EUR', 'UTC').currency).toBe('EUR');
  });

  it('reads the compare toggle in both the forms the URL can carry', () => {
    expect(resolveReportScope({ compare: '1' }, 'EUR', 'UTC').compare).toBe(true);
    expect(resolveReportScope({ compare: 'true' }, 'EUR', 'UTC').compare).toBe(true);
    expect(resolveReportScope({}, 'EUR', 'UTC').compare).toBe(false);
  });
});

describe('scopeToQuery', () => {
  it('round-trips a scope so a report link reproduces the same report', () => {
    const scope = resolveReportScope(
      { range: 'last-month', accounts: '3,7', currency: 'USD', compare: '1' },
      'EUR',
      'UTC',
    );
    const round = resolveReportScope(
      Object.fromEntries(new URLSearchParams(scopeToQuery(scope))),
      'EUR',
      'UTC',
    );
    expect(round).toMatchObject({
      preset: 'last-month',
      accounts: ['3', '7'],
      currency: 'USD',
      compare: true,
    });
  });

  it('emits explicit dates for a custom range, not a preset name', () => {
    const scope = resolveReportScope({ start: '2026-01-01', end: '2026-01-31' }, 'EUR', 'UTC');
    const params = new URLSearchParams(scopeToQuery(scope));
    expect(params.get('start')).toBe('2026-01-01');
    expect(params.get('range')).toBeNull();
  });

  it('omits what is at its default, keeping links short', () => {
    const scope = resolveReportScope({ range: 'this-month' }, 'EUR', 'UTC');
    const params = new URLSearchParams(scopeToQuery(scope));
    expect(params.get('accounts')).toBeNull();
    expect(params.get('compare')).toBeNull();
  });

  it('lets a caller add or clear one parameter', () => {
    const scope = resolveReportScope({ range: 'this-month', compare: '1' }, 'EUR', 'UTC');
    expect(new URLSearchParams(scopeToQuery(scope, { metric: 'income' })).get('metric')).toBe(
      'income',
    );
    expect(
      new URLSearchParams(scopeToQuery(scope, { compare: undefined })).get('compare'),
    ).toBeNull();
  });
});

describe('drillToTransactions', () => {
  it('resolves the period to explicit dates the transaction list understands', () => {
    const scope = resolveReportScope({ start: '2026-02-01', end: '2026-02-28' }, 'EUR', 'UTC');
    const url = new URL(drillToTransactions(scope), 'https://example.test');
    expect(url.pathname).toBe('/transactions');
    expect(url.searchParams.get('start')).toBe('2026-02-01');
    expect(url.searchParams.get('end')).toBe('2026-02-28');
  });

  it('adds the filters it is given and drops empty ones', () => {
    const scope = resolveReportScope({ range: 'this-month' }, 'EUR', 'UTC');
    const url = new URL(
      drillToTransactions(scope, { category: '4', budget: undefined, tag: '' }),
      'https://example.test',
    );
    expect(url.searchParams.get('category')).toBe('4');
    expect(url.searchParams.has('budget')).toBe(false);
    expect(url.searchParams.has('tag')).toBe(false);
  });
});
