import { afterEach, describe, expect, it } from 'vitest';
import { getEnv, resetEnvCache } from '@/lib/env';

const VALID_KEY = Buffer.alloc(32, 7).toString('base64');

function withEnv(overrides: Record<string, string | undefined>) {
  const original = { ...process.env };
  for (const [key, value] of Object.entries(overrides)) {
    // Assigning undefined to process.env stores the literal string "undefined",
    // so an "unset" variable must actually be deleted.
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    process.env = original;
  };
}

afterEach(() => resetEnvCache());

describe('getEnv', () => {
  it('accepts a complete configuration and applies defaults', () => {
    const restore = withEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      APP_ENCRYPTION_KEY: VALID_KEY,
      AUTH_SECRET: VALID_KEY,
      FIREFLY_ALLOW_PRIVATE_NETWORKS: undefined,
      MIN_FIREFLY_VERSION: undefined,
    });
    try {
      const env = getEnv();
      expect(env.MIN_FIREFLY_VERSION).toBe('6.1.0');
      expect(env.FIREFLY_ALLOW_PRIVATE_NETWORKS).toBe(false);
      expect(env.FIREFLY_REQUEST_TIMEOUT_MS).toBe(10_000);
    } finally {
      restore();
    }
  });

  it('rejects an encryption key that is not exactly 32 bytes', () => {
    const restore = withEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      APP_ENCRYPTION_KEY: Buffer.alloc(16, 1).toString('base64'),
      AUTH_SECRET: VALID_KEY,
    });
    try {
      expect(() => getEnv()).toThrow(/APP_ENCRYPTION_KEY.*32 random bytes/s);
    } finally {
      restore();
    }
  });

  it('names every missing variable at once rather than failing one at a time', () => {
    const restore = withEnv({
      DATABASE_URL: undefined,
      APP_ENCRYPTION_KEY: undefined,
      AUTH_SECRET: undefined,
    });
    try {
      expect(() => getEnv()).toThrow(/DATABASE_URL[\s\S]*APP_ENCRYPTION_KEY[\s\S]*AUTH_SECRET/);
    } finally {
      restore();
    }
  });

  it('coerces boolean-ish flags from string environment values', () => {
    const restore = withEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      APP_ENCRYPTION_KEY: VALID_KEY,
      AUTH_SECRET: VALID_KEY,
      FIREFLY_ALLOW_PRIVATE_NETWORKS: 'true',
      FIREFLY_ALLOW_INSECURE_HTTP: '0',
    });
    try {
      const env = getEnv();
      expect(env.FIREFLY_ALLOW_PRIVATE_NETWORKS).toBe(true);
      expect(env.FIREFLY_ALLOW_INSECURE_HTTP).toBe(false);
    } finally {
      restore();
    }
  });
});
