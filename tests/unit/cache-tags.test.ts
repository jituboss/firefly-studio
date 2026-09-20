import { describe, expect, it, vi } from 'vitest';

/**
 * E24-07 — `tagsForPath` is the rule that decides what a write invalidates.
 *
 * It fails silently in the worst way: the write succeeds, the page revalidates,
 * and then re-reads a stale cache entry, so the UI shows the old value for a
 * full TTL and looks like a bug in whatever you just changed. Several of the
 * cases below are regressions that actually happened — the comments in
 * `cache.ts` name them.
 */

// ioredis is imported at module scope; nothing connects unless a cache call is
// made, but the constructor must not be reached during import in CI.
vi.mock('ioredis', () => ({ default: class {} }));

const { tagsForPath } = await import('@/server/firefly/cache');

describe('tagsForPath', () => {
  it('tags the obvious resource families', () => {
    expect(tagsForPath('/v1/accounts')).toContain('accounts');
    expect(tagsForPath('/v1/transactions/12')).toContain('transactions');
    expect(tagsForPath('/v1/budgets/3/limits')).toContain('budgets');
    expect(tagsForPath('/v1/categories')).toContain('categories');
    expect(tagsForPath('/v1/bills/9')).toContain('bills');
    expect(tagsForPath('/v1/piggy-banks/1')).toContain('piggy-banks');
  });

  // The attachment regression: a rename invalidated nothing, so the manager
  // kept rendering the old title until the entry expired.
  it('drops transactions alongside attachments, because a split carries has_attachments', () => {
    const tags = tagsForPath('/v1/attachments/4');
    expect(tags).toContain('attachments');
    expect(tags).toContain('transactions');
  });

  // Running a rule rewrites the transactions it matches. Without this the run
  // succeeds and every cached list shows pre-run values — "the rule did nothing".
  it('drops transactions when a rule is triggered, but not when one is merely edited', () => {
    expect(tagsForPath('/v1/rules/2/trigger')).toContain('transactions');
    expect(tagsForPath('/v1/rules/2')).toContain('rules');
    expect(tagsForPath('/v1/rules/2')).not.toContain('transactions');
  });

  it('keeps rules and rule-groups on one tag, because a group write re-parents its rules', () => {
    expect(tagsForPath('/v1/rule-groups/1')).toContain('rules');
    expect(tagsForPath('/v1/rules/1')).toContain('rules');
  });

  // POST /recurrences/{id}/trigger mints real transactions.
  it('drops transactions for any recurrence write', () => {
    expect(tagsForPath('/v1/recurrences/7')).toEqual(
      expect.arrayContaining(['recurrences', 'transactions']),
    );
  });

  it('drops transactions for link writes, which change what a transaction shows', () => {
    expect(tagsForPath('/v1/transaction-links/3')).toEqual(
      expect.arrayContaining(['links', 'transactions']),
    );
    expect(tagsForPath('/v1/link-types')).toContain('links');
  });

  it('groups currencies and exchange rates together', () => {
    expect(tagsForPath('/v1/currencies/EUR')).toContain('currencies');
    expect(tagsForPath('/v1/exchange-rates')).toContain('currencies');
  });

  it('groups the admin surfaces', () => {
    for (const path of ['/v1/users/1', '/v1/user-groups', '/v1/configuration']) {
      expect(tagsForPath(path)).toContain('admin');
    }
  });

  it('returns nothing for a path that touches no cached family', () => {
    expect(tagsForPath('/v1/about')).toEqual([]);
  });

  // `/budget-limits` and `/budgets/…` both have to hit the budgets family, and
  // the match is a substring test — `/budget` singular is deliberate.
  it('matches budget-limits as well as budgets', () => {
    expect(tagsForPath('/v1/budget-limits/4')).toContain('budgets');
  });

  // A path can belong to several families at once; the caller invalidates all
  // of them, so a partial answer here is a stale page somewhere.
  it('returns every family a compound path belongs to', () => {
    const tags = tagsForPath('/v1/accounts/1/transactions');
    expect(tags).toContain('accounts');
    expect(tags).toContain('transactions');
  });
});
