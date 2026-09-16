import { z } from 'zod';

/**
 * E1-07 — boot-time environment validation.
 *
 * Imported by every server entry point. A misconfigured deployment fails here,
 * loudly, with the offending variable named — rather than surfacing as a
 * decryption error three screens into onboarding.
 */

const base64Bytes = (expected: number) =>
  z
    .string()
    .min(1)
    .refine(
      (value) => {
        try {
          return Buffer.from(value, 'base64').length === expected;
        } catch {
          return false;
        }
      },
      { message: `must be ${expected} random bytes, base64-encoded` },
    );

const boolish = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const semver = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be a semver string like 6.1.0');

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().startsWith('postgres'),

  APP_ENCRYPTION_KEY: base64Bytes(32),
  AUTH_SECRET: base64Bytes(32),

  REDIS_URL: z.string().startsWith('redis').optional(),

  FIREFLY_ALLOW_PRIVATE_NETWORKS: boolish.default(false),
  FIREFLY_ALLOW_INSECURE_HTTP: boolish.default(false),
  MIN_FIREFLY_VERSION: semver.default('6.1.0'),
  RECOMMENDED_FIREFLY_VERSION: semver.default('6.2.0'),
  FIREFLY_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(10_000),
  FIREFLY_MAX_RESPONSE_BYTES: z.coerce.number().int().positive().default(26_214_400),

  SENTRY_DSN: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('firefly-studio'),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

let cached: ServerEnv | undefined;

/**
 * Parse and cache the server environment.
 *
 * Throws on the first invalid variable. Never call this from client code —
 * it would leak secret names into the browser bundle. `lib/env.ts` is server-only
 * by convention and guarded by the check below.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const message =
      `\nInvalid environment configuration:\n${formatIssues(parsed.error)}\n\n` +
      `Copy .env.example to .env and fill in the missing values.\n` +
      `Generate a key with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"\n`;
    throw new Error(message);
  }

  cached = parsed.data;
  return cached;
}

/** Test-only: drop the memoised value so a test can swap process.env. */
export function resetEnvCache(): void {
  cached = undefined;
}

export const isProduction = () => getEnv().NODE_ENV === 'production';
export const isDevelopment = () => getEnv().NODE_ENV === 'development';

/**
 * Public (client-visible) configuration. Everything here is inlined into the
 * browser bundle at build time, so it must contain nothing sensitive.
 */
export const publicEnv = {
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  appName: 'Firefly Studio',
} as const;
