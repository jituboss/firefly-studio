import 'server-only';
import { cache } from 'react';
import { requireSession } from '@/server/auth/session';
import { getConnectionToken, getDefaultConnection } from '@/server/connections';
import { callFirefly, FireflyRequestError } from './client';
import { cacheGet, cacheSet, invalidateTags, tagsForPath, ttlForPath } from './cache';
import { FIREFLY_OPERATIONS } from '@/spec/generated/operations';

/**
 * The read path used by Server Components (§9.2). Calls Firefly directly from
 * the server — no HTTP hop through our own proxy — and caches the result per
 * connection. Writes go through /api/ff/[...path] so the client can do
 * optimistic updates.
 */

export interface ActiveConnection {
  id: string;
  baseUrl: string;
  token: string;
  label: string;
  primaryCurrency: string;
  fireflyVersion: string | null;
}

/**
 * `cache()` dedupes this for the lifetime of one request, so twelve dashboard
 * widgets share a single session lookup and a single token decryption.
 */
export const getActiveConnection = cache(async (): Promise<ActiveConnection | null> => {
  const session = await requireSession();
  const connection = await getDefaultConnection(session.user.id);
  if (!connection) return null;

  const credentials = await getConnectionToken(session.user.id, connection.id);
  if (!credentials) return null;

  return {
    id: connection.id,
    baseUrl: credentials.baseUrl,
    token: credentials.token,
    label: connection.label,
    primaryCurrency: connection.primaryCurrency ?? 'EUR',
    fireflyVersion: connection.fireflyVersion,
  };
});

export async function requireActiveConnection(): Promise<ActiveConnection> {
  const connection = await getActiveConnection();
  if (!connection) throw new Error('NO_CONNECTION');
  return connection;
}

/** GET a Firefly path, cached. `path` starts with `/v1/…`. */
export async function fireflyGet<T>(path: string, options: { noCache?: boolean } = {}): Promise<T> {
  const connection = await requireActiveConnection();

  if (!options.noCache) {
    const hit = await cacheGet<T>(connection.id, path);
    if (hit) return hit;
  }

  const result = await callFirefly<T>({
    baseUrl: connection.baseUrl,
    token: connection.token,
    path,
  });

  if (!options.noCache) {
    await cacheSet(connection.id, path, result, ttlForPath(path));
  }

  return result;
}

/**
 * A read that must never break the page. Dashboard widgets use this so one
 * failing endpoint degrades to an empty widget instead of blanking the
 * dashboard (E3-13).
 */
export async function fireflyGetSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fireflyGet<T>(path);
  } catch {
    return fallback;
  }
}

export async function fireflyWrite<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const connection = await requireActiveConnection();

  const result = await callFirefly<T>({
    baseUrl: connection.baseUrl,
    token: connection.token,
    path,
    method,
    body,
  });

  // §9.6 — a write invalidates every tag family the path touches, plus the
  // derived aggregates that silently depend on it.
  const tags = tagsForPath(path);
  if (tags.includes('transactions') || tags.includes('accounts')) {
    tags.push('summary', 'insight', 'charts');
  }
  await invalidateTags(connection.id, tags);

  return result;
}

export { FireflyRequestError, invalidateTags };

/** E23-04 — the proxy allowlist, derived from the vendored spec. */
const GUARDED = new Set(
  FIREFLY_OPERATIONS.filter((operation) => operation.guarded).map(
    (operation) => `${operation.method.toUpperCase()} ${operation.pattern}`,
  ),
);

export function isGuardedPath(method: string, path: string): boolean {
  for (const entry of GUARDED) {
    const [guardedMethod, pattern] = entry.split(' ') as [string, string];
    if (guardedMethod === method.toUpperCase() && new RegExp(pattern).test(path)) return true;
  }
  return false;
}

/** Is this path in the spec at all? Anything unknown is refused. */
export function isKnownPath(method: string, path: string): boolean {
  return FIREFLY_OPERATIONS.some(
    (operation) =>
      operation.method.toUpperCase() === method.toUpperCase() &&
      new RegExp(operation.pattern).test(path),
  );
}
