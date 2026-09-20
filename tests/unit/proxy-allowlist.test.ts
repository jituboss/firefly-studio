import { describe, expect, it, vi } from 'vitest';

/**
 * E23-04 / E24-07 — the proxy allowlist.
 *
 * `/api/ff/[...path]` forwards whatever the browser asks for, with the user's
 * decrypted token attached. These two predicates are the whole of what decides
 * where that token may be pointed, so they are worth pinning: `isKnownPath`
 * refuses anything the vendored spec does not describe, and `isGuardedPath`
 * marks the operations that need step-up re-authentication first.
 */

// `api.ts` pulls in the session, the connection store and the Firefly client at
// module scope. None of it runs for these two pure predicates, but the imports
// must resolve, and the DB modules must not open a pool during a unit test.
vi.mock('ioredis', () => ({ default: class {} }));
vi.mock('@/server/db', () => ({ db: {} }));
vi.mock('@/server/auth/session', () => ({ requireSession: vi.fn() }));
vi.mock('@/server/connections', () => ({
  getConnectionToken: vi.fn(),
  getDefaultConnection: vi.fn(),
  updateConnectionPrimaryCurrency: vi.fn(),
}));

const { isKnownPath, isGuardedPath } = await import('@/server/firefly/api');

describe('isKnownPath', () => {
  it('accepts ordinary reads and writes that the spec describes', () => {
    expect(isKnownPath('GET', '/v1/accounts')).toBe(true);
    expect(isKnownPath('GET', '/v1/transactions/42')).toBe(true);
    expect(isKnownPath('POST', '/v1/transactions')).toBe(true);
    expect(isKnownPath('PUT', '/v1/budgets/3')).toBe(true);
    expect(isKnownPath('DELETE', '/v1/categories/9')).toBe(true);
  });

  it('refuses a path that is not in the spec', () => {
    expect(isKnownPath('GET', '/v1/not-a-resource')).toBe(false);
    expect(isKnownPath('GET', '/v1/../../etc/passwd')).toBe(false);
    expect(isKnownPath('GET', '/')).toBe(false);
  });

  // Webhooks stay in the registry because the vendored spec is a faithful copy
  // of Firefly's API. Being known is not being allowed — the refusal is
  // `guarded`, asserted below.
  it('still knows the webhook paths, which the spec describes', () => {
    expect(isKnownPath('GET', '/v1/webhooks')).toBe(true);
  });

  it('is method-sensitive — a readable path is not automatically writable', () => {
    expect(isKnownPath('GET', '/v1/about')).toBe(true);
    expect(isKnownPath('DELETE', '/v1/about')).toBe(false);
  });

  it('treats the method case-insensitively, as HTTP does', () => {
    expect(isKnownPath('get', '/v1/accounts')).toBe(true);
    expect(isKnownPath('GeT', '/v1/accounts')).toBe(true);
  });
});

describe('isGuardedPath', () => {
  // The danger zone: these wipe or purge real ledger data, and must sit behind
  // step-up re-auth rather than a session cookie alone.
  it('guards the destructive data operations', () => {
    expect(isGuardedPath('DELETE', '/v1/data/destroy')).toBe(true);
    expect(isGuardedPath('DELETE', '/v1/data/purge')).toBe(true);
  });

  it('does not guard an ordinary read', () => {
    expect(isGuardedPath('GET', '/v1/accounts')).toBe(false);
    expect(isGuardedPath('GET', '/v1/transactions')).toBe(false);
  });

  it('does not guard an ordinary write, which the session already covers', () => {
    expect(isGuardedPath('POST', '/v1/transactions')).toBe(false);
  });

  it('is method-sensitive', () => {
    expect(isGuardedPath('GET', '/v1/data/destroy')).toBe(false);
  });

  // E17 — dropped from scope. "Guarded" is this codebase's word for refused by
  // default, so this is where that decision is enforced rather than merely
  // written down. An endpoint that makes the user's own instance POST to an
  // arbitrary URL is not surface to leave open for a feature that does not
  // exist.
  it('refuses every webhook endpoint, for a feature that was dropped', () => {
    for (const [method, path] of [
      ['GET', '/v1/webhooks'],
      ['POST', '/v1/webhooks'],
      ['GET', '/v1/webhooks/1'],
      ['DELETE', '/v1/webhooks/1'],
      ['GET', '/v1/webhooks/1/messages'],
      ['POST', '/v1/webhooks/1/submit'],
    ] as const) {
      expect(isGuardedPath(method, path), `${method} ${path}`).toBe(true);
    }
  });

  it('refuses the cross-user admin surfaces', () => {
    expect(isGuardedPath('GET', '/v1/users')).toBe(true);
    expect(isGuardedPath('DELETE', '/v1/users/2')).toBe(true);
  });
});
