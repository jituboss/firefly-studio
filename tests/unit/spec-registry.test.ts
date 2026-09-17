import { describe, expect, it } from 'vitest';
import {
  FIREFLY_OPERATION_COUNT,
  FIREFLY_OPERATIONS,
  FIREFLY_PATH_COUNT,
  FIREFLY_SPEC_VERSION,
  FIREFLY_TAGS,
} from '@/spec/generated/operations';

/**
 * Guards the generated registry against silent drift. If `pnpm spec:update`
 * pulls a new Firefly release, these numbers change and this test forces a
 * deliberate review of docs/PROJECT_PLAN.md §7 rather than a quiet merge.
 */
describe('vendored Firefly III spec', () => {
  it('matches the inventory recorded in docs/PROJECT_PLAN.md §7', () => {
    expect(FIREFLY_SPEC_VERSION).toBe('v6.5.5');
    expect(FIREFLY_PATH_COUNT).toBe(164);
    expect(FIREFLY_OPERATION_COUNT).toBe(230);
    expect(FIREFLY_TAGS).toHaveLength(28);
  });

  it('registers every operation with a usable pattern', () => {
    expect(FIREFLY_OPERATIONS).toHaveLength(FIREFLY_OPERATION_COUNT);
    for (const operation of FIREFLY_OPERATIONS) {
      expect(operation.pattern.startsWith('^')).toBe(true);
      expect(operation.pattern.endsWith('$')).toBe(true);
      expect(() => new RegExp(operation.pattern)).not.toThrow();
    }
  });

  it('matches a concrete path against its templated pattern', () => {
    const operation = FIREFLY_OPERATIONS.find(
      (candidate) => candidate.path === '/v1/accounts/{id}/transactions',
    );
    expect(operation).toBeDefined();
    expect(new RegExp(operation!.pattern).test('/v1/accounts/42/transactions')).toBe(true);
    expect(new RegExp(operation!.pattern).test('/v1/accounts/42/attachments')).toBe(false);
  });

  /**
   * The guard list is pinned exactly, so widening it is a deliberate edit with
   * a reason rather than a side effect of regenerating the spec. Two kinds of
   * path are on it: ones that destroy data or reach past the signed-in user,
   * and ones belonging to a feature this project decided not to build.
   */
  it('guards destructive, admin-only and out-of-scope endpoints', () => {
    const guarded = FIREFLY_OPERATIONS.filter((operation) => operation.guarded).map((o) => o.path);
    expect(new Set(guarded)).toEqual(
      new Set([
        // Destructive or cross-user.
        '/v1/data/destroy',
        '/v1/data/purge',
        '/v1/cron/{cliToken}',
        '/v1/users',
        '/v1/users/{id}',
        // Webhooks: dropped from scope (E17). Nothing here calls them, and an
        // endpoint that makes the user's instance POST to an arbitrary URL is
        // not surface worth leaving open for a feature that does not exist.
        '/v1/webhooks',
        '/v1/webhooks/{id}',
        '/v1/webhooks/{id}/messages',
        '/v1/webhooks/{id}/messages/{messageId}',
        '/v1/webhooks/{id}/messages/{messageId}/attempts',
        '/v1/webhooks/{id}/messages/{messageId}/attempts/{attemptId}',
        '/v1/webhooks/{id}/submit',
        '/v1/webhooks/{id}/trigger-transaction/{transactionId}',
      ]),
    );
  });

  it('leaves ordinary read endpoints unguarded', () => {
    const transactions = FIREFLY_OPERATIONS.find(
      (operation) => operation.path === '/v1/transactions' && operation.method === 'get',
    );
    expect(transactions?.guarded).toBe(false);
  });
});
