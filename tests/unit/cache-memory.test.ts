import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * E22-01 / E24-07 — the in-process cache and the per-endpoint TTLs.
 *
 * With no REDIS_URL the proxy caches in a bounded Map, which is what a
 * single-container self-host actually runs — the majority of deployments, and
 * the configuration least likely to be exercised by whoever has Redis set up
 * locally. Every case here runs that path, by leaving REDIS_URL unset.
 */

vi.mock('ioredis', () => ({ default: class {} }));
vi.mock('@/lib/env', () => ({ getEnv: () => ({ REDIS_URL: undefined }) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { cacheGet, cacheSet, invalidateTags, ttlForPath } = await import('@/server/firefly/cache');

const CONNECTION = 'conn-1';

beforeEach(async () => {
  // The Map lives on globalThis across module reloads.
  await invalidateTags(CONNECTION, [
    'accounts',
    'transactions',
    'budgets',
    'categories',
    'summary',
    'charts',
  ]);
});

describe('ttlForPath', () => {
  // Charts and insights are expensive to compute upstream; transaction lists
  // change every time the user adds anything.
  it('caches expensive aggregates for longer than volatile lists', () => {
    expect(ttlForPath('/v1/chart/account/overview')).toBe(300);
    expect(ttlForPath('/v1/insight/expense/total')).toBe(300);
    expect(ttlForPath('/v1/summary/basic')).toBe(120);
    expect(ttlForPath('/v1/transactions')).toBe(30);
  });

  it('caches near-static reference data for fifteen minutes', () => {
    expect(ttlForPath('/v1/currencies')).toBe(900);
    expect(ttlForPath('/v1/about')).toBe(900);
  });

  it('falls back to a minute for anything unlisted', () => {
    expect(ttlForPath('/v1/piggy-banks')).toBe(60);
  });
});

describe('the in-process cache', () => {
  it('returns what was stored', async () => {
    await cacheSet(CONNECTION, '/v1/accounts', { data: [1, 2, 3] }, 60);
    await expect(cacheGet(CONNECTION, '/v1/accounts')).resolves.toEqual({ data: [1, 2, 3] });
  });

  it('misses for a path that was never stored', async () => {
    await expect(cacheGet(CONNECTION, '/v1/never-fetched')).resolves.toBeNull();
  });

  // Keys are namespaced per connection. Without this, switching instances
  // would show one ledger's figures under the other's name.
  it('never serves one connection a different connection to its own', async () => {
    await cacheSet(CONNECTION, '/v1/accounts', { data: 'mine' }, 60);
    await expect(cacheGet('conn-2', '/v1/accounts')).resolves.toBeNull();
  });

  it('treats an expired entry as a miss', async () => {
    // Move the clock rather than writing a zero TTL: the expiry check is
    // `expires < now`, so a zero-second entry is still live for the
    // millisecond it was written in, and a test built on that would be
    // asserting a boundary nothing in the app ever reaches (the shortest real
    // TTL is 30s).
    vi.useFakeTimers();
    try {
      await cacheSet(CONNECTION, '/v1/accounts', { data: 'stale' }, 30);
      await expect(cacheGet(CONNECTION, '/v1/accounts')).resolves.toEqual({ data: 'stale' });

      vi.advanceTimersByTime(31_000);
      await expect(cacheGet(CONNECTION, '/v1/accounts')).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops every entry carrying an invalidated tag', async () => {
    await cacheSet(CONNECTION, '/v1/accounts', { data: 'a' }, 60);
    await cacheSet(CONNECTION, '/v1/budgets', { data: 'b' }, 60);

    await invalidateTags(CONNECTION, ['accounts']);

    await expect(cacheGet(CONNECTION, '/v1/accounts')).resolves.toBeNull();
    // Untouched families must survive, or every write empties the whole cache
    // and the cache stops being one.
    await expect(cacheGet(CONNECTION, '/v1/budgets')).resolves.toEqual({ data: 'b' });
  });

  it('drops an entry that belongs to several families when any one is invalidated', async () => {
    await cacheSet(CONNECTION, '/v1/accounts/1/transactions', { data: 'both' }, 60);
    await invalidateTags(CONNECTION, ['transactions']);
    await expect(cacheGet(CONNECTION, '/v1/accounts/1/transactions')).resolves.toBeNull();
  });

  it('does nothing when asked to invalidate nothing', async () => {
    await cacheSet(CONNECTION, '/v1/accounts', { data: 'a' }, 60);
    await invalidateTags(CONNECTION, []);
    await expect(cacheGet(CONNECTION, '/v1/accounts')).resolves.toEqual({ data: 'a' });
  });
});
