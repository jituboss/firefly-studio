import 'server-only';
import Redis from 'ioredis';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * E22-01 — proxy response cache.
 *
 * Redis when REDIS_URL is set, otherwise a bounded in-process map so a
 * single-container self-host still gets the benefit. Cache keys are namespaced
 * per connection, and every entry carries tags so a write can invalidate a
 * whole family at once (§9.6).
 */

const globalForCache = globalThis as unknown as {
  __fireflyRedis?: Redis | null;
  __fireflyMemo?: Map<string, { value: string; expires: number; tags: string[] }>;
};

function redis(): Redis | null {
  if (globalForCache.__fireflyRedis !== undefined) return globalForCache.__fireflyRedis;

  const url = getEnv().REDIS_URL;
  if (!url) {
    globalForCache.__fireflyRedis = null;
    return null;
  }

  const client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
  client.on('error', (error) =>
    logger.warn({ err: error }, 'Redis error — falling back to memory'),
  );
  globalForCache.__fireflyRedis = client;
  return client;
}

const memo = (globalForCache.__fireflyMemo ??= new Map());
const MEMO_MAX = 500;

/** Cache tags, so a transaction write can drop every derived read. */
export type CacheTag =
  | 'accounts'
  | 'transactions'
  | 'budgets'
  | 'categories'
  | 'bills'
  | 'piggy-banks'
  | 'summary'
  | 'insight'
  | 'charts'
  | 'currencies'
  | 'tags';

/** Which tags a given API path belongs to. */
export function tagsForPath(path: string): CacheTag[] {
  const tags: CacheTag[] = [];
  if (path.includes('/accounts')) tags.push('accounts');
  if (path.includes('/transactions')) tags.push('transactions');
  if (path.includes('/budget')) tags.push('budgets');
  if (path.includes('/categor')) tags.push('categories');
  if (path.includes('/bills')) tags.push('bills');
  if (path.includes('/piggy')) tags.push('piggy-banks');
  if (path.includes('/summary')) tags.push('summary');
  if (path.includes('/insight')) tags.push('insight');
  if (path.includes('/chart')) tags.push('charts');
  if (path.includes('/currencies') || path.includes('/exchange-rates')) tags.push('currencies');
  if (path.includes('/tags')) tags.push('tags');
  return tags;
}

const key = (connectionId: string, path: string) => `ff:${connectionId}:${path}`;
const tagKey = (connectionId: string, tag: string) => `fftag:${connectionId}:${tag}`;

export async function cacheGet<T>(connectionId: string, path: string): Promise<T | null> {
  const client = redis();
  const k = key(connectionId, path);

  try {
    if (client) {
      const hit = await client.get(k);
      return hit ? (JSON.parse(hit) as T) : null;
    }
  } catch {
    // fall through to memory
  }

  const entry = memo.get(k);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    memo.delete(k);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function cacheSet(
  connectionId: string,
  path: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const k = key(connectionId, path);
  const serialised = JSON.stringify(value);
  const tags = tagsForPath(path);

  const client = redis();
  try {
    if (client) {
      const pipeline = client.pipeline();
      pipeline.set(k, serialised, 'EX', ttlSeconds);
      // Track membership so invalidateTags can find every key for a tag.
      for (const tag of tags) {
        pipeline.sadd(tagKey(connectionId, tag), k);
        pipeline.expire(tagKey(connectionId, tag), 86_400);
      }
      await pipeline.exec();
      return;
    }
  } catch {
    // fall through to memory
  }

  if (memo.size >= MEMO_MAX) {
    const oldest = memo.keys().next().value;
    if (oldest) memo.delete(oldest);
  }
  memo.set(k, { value: serialised, expires: Date.now() + ttlSeconds * 1000, tags });
}

export async function invalidateTags(connectionId: string, tags: CacheTag[]): Promise<void> {
  if (tags.length === 0) return;

  const client = redis();
  try {
    if (client) {
      for (const tag of tags) {
        const members = await client.smembers(tagKey(connectionId, tag));
        if (members.length > 0) await client.del(...members);
        await client.del(tagKey(connectionId, tag));
      }
      return;
    }
  } catch {
    // fall through to memory
  }

  for (const [k, entry] of memo) {
    if (entry.tags.some((tag: string) => tags.includes(tag as CacheTag))) memo.delete(k);
  }
}

/** Per-endpoint TTLs. Charts and insights are expensive; lists change often. */
export function ttlForPath(path: string): number {
  if (path.includes('/chart/') || path.includes('/insight/')) return 300;
  if (path.includes('/summary/')) return 120;
  if (path.includes('/currencies') || path.includes('/about')) return 900;
  if (path.includes('/transactions')) return 30;
  return 60;
}
