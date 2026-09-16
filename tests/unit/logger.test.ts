import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { REDACT_PATHS } from '@/lib/logger';
import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/request-id';

/**
 * The redaction list is a security control, not a formatting preference: it is
 * what keeps a Firefly Personal Access Token out of the log stream. These tests
 * assert on real serialised output rather than on the config object.
 */
function captureLog(write: (log: pino.Logger) => void): Record<string, unknown> {
  const lines: string[] = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });

  const logger = pino({ redact: { paths: REDACT_PATHS, censor: '[redacted]' } }, sink);
  write(logger);

  return JSON.parse(lines.join('')) as Record<string, unknown>;
}

describe('log redaction', () => {
  it('redacts an Authorization header carrying a Bearer PAT', () => {
    const output = captureLog((log) =>
      log.info({ req: { headers: { authorization: 'Bearer ff_pat_supersecret' } } }, 'proxied'),
    );

    const serialised = JSON.stringify(output);
    expect(serialised).not.toContain('ff_pat_supersecret');
    expect(serialised).toContain('[redacted]');
  });

  it('redacts token-shaped fields wherever they appear', () => {
    const output = captureLog((log) =>
      log.info(
        {
          token: 'raw-token-value',
          password: 'hunter2',
          secret: 'shh',
          tokenCiphertext: 'sealed-bytes',
          connection: { token: 'nested-token-value' },
        },
        'connection saved',
      ),
    );

    const serialised = JSON.stringify(output);
    for (const leak of [
      'raw-token-value',
      'hunter2',
      'shh',
      'sealed-bytes',
      'nested-token-value',
    ]) {
      expect(serialised).not.toContain(leak);
    }
  });

  it('redacts cookies in both directions', () => {
    const output = captureLog((log) =>
      log.info(
        {
          req: { headers: { cookie: 'session=abc123' } },
          res: { headers: { 'set-cookie': 'session=def456' } },
        },
        'request complete',
      ),
    );

    const serialised = JSON.stringify(output);
    expect(serialised).not.toContain('abc123');
    expect(serialised).not.toContain('def456');
  });

  it('leaves non-sensitive diagnostic fields intact', () => {
    const output = captureLog((log) =>
      log.info({ requestId: 'req-1', userId: 'user-1', status: 200 }, 'ok'),
    );

    expect(output.requestId).toBe('req-1');
    expect(output.userId).toBe('user-1');
    expect(output.status).toBe(200);
  });
});

describe('resolveRequestId', () => {
  it('reuses a well-formed upstream request id', () => {
    const headers = new Headers({ [REQUEST_ID_HEADER]: 'abc-123-def-456' });
    expect(resolveRequestId(headers)).toBe('abc-123-def-456');
  });

  it('mints a fresh id when none is supplied', () => {
    expect(resolveRequestId(new Headers())).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('rejects a malformed or oversized upstream id rather than propagating it', () => {
    for (const value of ['short', 'has spaces here', 'x'.repeat(200), '../../etc/passwd']) {
      const resolved = resolveRequestId(new Headers({ [REQUEST_ID_HEADER]: value }));
      expect(resolved).not.toBe(value);
    }
  });
});
