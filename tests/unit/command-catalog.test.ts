import { describe, expect, it } from 'vitest';
import { COMMANDS, highlight, matchText, mergeRanges, searchCommands } from '@/lib/command-catalog';

describe('matchText', () => {
  it('matches case-insensitively and reports what to highlight', () => {
    expect(matchText('BUDG', 'Budgets')).toEqual({ score: 100 - 0.07, ranges: [[0, 4]] });
  });

  it('needs every word, in any order', () => {
    expect(matchText('report net', 'Net worth report')?.ranges).toEqual([
      [0, 3],
      [10, 16],
    ]);
    expect(matchText('net budget', 'Net worth report')).toBeNull();
  });

  it('matches keywords without highlighting them', () => {
    const match = matchText('savings', 'Piggy banks', 'savings goals');
    expect(match?.ranges).toEqual([]);
    expect(match!.score).toBeGreaterThan(0);
  });

  it('matches everything, unhighlighted, for an empty query', () => {
    expect(matchText('   ', 'Anything')).toEqual({ score: 0, ranges: [] });
  });
});

describe('searchCommands', () => {
  it('returns the whole catalogue with no query', () => {
    expect(searchCommands('', true)).toHaveLength(COMMANDS.length);
  });

  it('hides admin-only entries from everyone else', () => {
    expect(searchCommands('', false).some((r) => r.entry.id === 'admin')).toBe(false);
    expect(searchCommands('admin', true)[0]!.entry.id).toBe('admin');
  });

  it('ranks a label that starts with the query above one that merely contains it', () => {
    const ids = searchCommands('tag', true).map((r) => r.entry.id);
    expect(ids.indexOf('tags')).toBeLessThan(ids.indexOf('new-tag'));
    expect(ids.indexOf('report-tags')).toBeLessThan(ids.indexOf('new-tag'));
  });

  it('finds a page by a word that is not in its name', () => {
    expect(searchCommands('bills', false).map((r) => r.entry.id)).toContain('bills');
  });

  it('every entry has a unique id and an absolute route', () => {
    expect(new Set(COMMANDS.map((c) => c.id)).size).toBe(COMMANDS.length);
    for (const entry of COMMANDS) expect(entry.href.startsWith('/')).toBe(true);
  });
});

describe('highlight', () => {
  it('splits a label into plain and hit segments', () => {
    expect(highlight('New budget', [[4, 7]])).toEqual([
      { text: 'New ', hit: false },
      { text: 'bud', hit: true },
      { text: 'get', hit: false },
    ]);
  });

  it('merges overlapping ranges', () => {
    expect(
      mergeRanges([
        [3, 6],
        [0, 2],
        [1, 4],
      ]),
    ).toEqual([[0, 6]]);
  });
});
