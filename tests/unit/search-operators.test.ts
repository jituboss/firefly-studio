import { describe, expect, it } from 'vitest';
import { parseQuery, quoteIfNeeded, suggestAt, unknownOperators } from '@/lib/search-operators';

describe('quoteIfNeeded', () => {
  it('quotes a value with a space, which Firefly requires', () => {
    // Verified live: budget_is:Everyday spending -> 0 hits; quoted -> 68.
    expect(quoteIfNeeded('Everyday spending')).toBe('"Everyday spending"');
  });

  it('leaves a single word and an already-quoted value alone', () => {
    expect(quoteIfNeeded('Groceries')).toBe('Groceries');
    expect(quoteIfNeeded('"Everyday spending"')).toBe('"Everyday spending"');
  });
});

describe('parseQuery', () => {
  it('splits operators from free text', () => {
    const terms = parseQuery('rent category_is:Groceries');
    expect(terms.map((t) => [t.operator, t.value])).toEqual([
      [null, 'rent'],
      ['category_is', 'Groceries'],
    ]);
  });

  it('keeps a quoted value together', () => {
    const [term] = parseQuery('budget_is:"Everyday spending"');
    expect(term).toMatchObject({ operator: 'budget_is', value: 'Everyday spending' });
  });

  it('flags an operator Firefly does not know', () => {
    // This is the failure this whole module exists for: Firefly answers a typo
    // with zero results rather than an error.
    const [term] = parseQuery('catagory_is:Food');
    expect(term?.unknown).toBe(true);
    expect(unknownOperators('catagory_is:Food amount_is:5')).toEqual(['catagory_is']);
  });

  it('treats a known operator as known', () => {
    expect(unknownOperators('category_is:Food date_after:2026-01-01')).toEqual([]);
  });
});

describe('suggestAt', () => {
  it('suggests by operator name', () => {
    const { matches } = suggestAt('amou', 4);
    expect(matches.map((m) => m.name)).toContain('amount_is');
  });

  it('suggests by what the operator means, not just its name', () => {
    const { matches } = suggestAt('tagged', 6);
    expect(matches.map((m) => m.name)).toContain('tag_is');
  });

  it('stops suggesting once a value is being typed', () => {
    expect(suggestAt('category_is:Gro', 15).matches).toEqual([]);
  });

  it('reports the span to replace for the token under the caret', () => {
    const { start, end } = suggestAt('rent amou', 9);
    expect([start, end]).toEqual([5, 9]);
  });
});
