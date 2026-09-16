import pino, { type Logger } from 'pino';

/**
 * E1-09 — structured logging with hard redaction.
 *
 * Every field that could carry a Firefly Personal Access Token, a session
 * cookie, or a password is stripped before serialisation. This list is the
 * single control point: adding a new secret-bearing field means adding it here.
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-csrf-token"]',
  'res.headers["set-cookie"]',
  'headers.authorization',
  'headers.cookie',
  'authorization',
  'token',
  'accessToken',
  'access_token',
  'personalAccessToken',
  'pat',
  'password',
  'passwordHash',
  'password_hash',
  'secret',
  'tokenCiphertext',
  'token_ciphertext',
  'APP_ENCRYPTION_KEY',
  'AUTH_SECRET',
  'DATABASE_URL',
  '*.authorization',
  '*.token',
  '*.password',
  '*.secret',
];

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const isDev = process.env.NODE_ENV !== 'production';

export const logger: Logger = pino({
  level,
  redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  base: { service: process.env.OTEL_SERVICE_NAME ?? 'firefly-studio' },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,service' },
        },
      }
    : {}),
});

/**
 * A child logger bound to one request. `requestId` is ours; `fireflyTraceId` is
 * Firefly's `X-Trace-Id`, captured by the proxy so a failure can be correlated
 * across both systems (E18-03).
 */
export function requestLogger(bindings: {
  requestId: string;
  userId?: string;
  connectionId?: string;
  fireflyTraceId?: string;
}): Logger {
  return logger.child(bindings);
}

export type { Logger };
