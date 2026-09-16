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
 * deliberate review of PROJECT_PLAN.md §7 rather than a quiet merge.
 */
describe('vendored Firefly III spec', () => {
  it('matches the inventory recorded in PROJECT_PLAN.md §7', () => {
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

  it('guards every destructive and admin-only endpoint', () => {
    const guarded = FIREFLY_OPERATIONS.filter((operation) => operation.guarded).map((o) => o.path);
    expect(new Set(guarded)).toEqual(
      new Set([
        '/v1/data/destroy',
        '/v1/data/purge',
        '/v1/cron/{cliToken}',
        '/v1/users',
        '/v1/users/{id}',
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
