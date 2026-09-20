import { describe, expect, it } from 'vitest';
import { classifyError, presentError, presentErrorKind } from '@/lib/error-taxonomy';

/**
 * E21-05 — each kind exists because it has a different next step. These pin
 * the mapping, and the two cases that were wrong in the container.
 */
describe('classifyError', () => {
  // The one that was wrong: the URL guard resolves and checks the host BEFORE
  // any HTTP call, so a stopped instance fails as `dns_failure` from the guard,
  // never as `unreachable` from the client. Mapping only the client's codes
  // reported a dead instance as "Something went wrong".
  it('classifies a stopped instance from the URL guard, not just the client', () => {
    expect(classifyError({ code: 'dns_failure' })).toBe('network');
    expect(classifyError({ code: 'unreachable' })).toBe('network');
    expect(classifyError({ code: 'timeout' })).toBe('network');
  });

  it('separates a revoked token from an unreachable server', () => {
    expect(classifyError({ code: 'unauthorised' })).toBe('auth');
    expect(classifyError({ code: 'unreachable' })).toBe('network');
  });

  it('treats an unusable address as configuration, not as a network fault', () => {
    for (const code of ['blocked_address', 'invalid_url', 'bad_scheme', 'insecure_http']) {
      expect(classifyError({ code })).toBe('config');
    }
  });

  it('falls back to the HTTP status when there is no code', () => {
    expect(classifyError({ status: 401 })).toBe('auth');
    expect(classifyError({ status: 403 })).toBe('forbidden');
    expect(classifyError({ status: 404 })).toBe('not-found');
    expect(classifyError({ status: 429 })).toBe('rate-limit');
    expect(classifyError({ status: 422 })).toBe('validation');
    expect(classifyError({ status: 503 })).toBe('firefly-down');
  });

  // An Error crossing the RSC boundary keeps its message and loses its custom
  // fields, so the message is sometimes the only evidence left.
  it('reads the message when the structured fields are gone', () => {
    expect(classifyError(new Error('fetch failed'))).toBe('network');
    expect(classifyError(new Error('ECONNREFUSED 127.0.0.1:8080'))).toBe('network');
    expect(classifyError(new Error('Unauthorized'))).toBe('auth');
    expect(classifyError(new Error('Too many requests'))).toBe('rate-limit');
  });

  it('does not guess when there is nothing to go on', () => {
    expect(classifyError(null)).toBe('unknown');
    expect(classifyError('a string')).toBe('unknown');
    expect(classifyError(new Error('something odd happened'))).toBe('unknown');
  });

  it('prefers the code over the status, which is the more specific signal', () => {
    expect(classifyError({ code: 'validation', status: 500 })).toBe('validation');
  });
});

describe('presentError', () => {
  it('never offers a retry for a failure that retrying cannot fix', () => {
    for (const kind of ['auth', 'forbidden', 'not-found', 'config'] as const) {
      const presentation = presentErrorKind(kind);
      expect(presentation.retryable, kind).toBe(false);
      expect(presentation.action.retry, kind).toBeUndefined();
      // …and offers somewhere to go instead.
      expect(presentation.action.href, kind).toBeTruthy();
    }
  });

  it('offers a retry for the failures that are worth retrying', () => {
    for (const kind of ['network', 'rate-limit', 'firefly-down'] as const) {
      expect(presentErrorKind(kind).action.retry, kind).toBe(true);
    }
  });

  it('carries the kind through, so the caller can pick an icon', () => {
    expect(presentError({ code: 'unauthorised' }).kind).toBe('auth');
  });

  it('describes every kind — a missing entry would render an empty card', () => {
    const kinds = [
      'network',
      'auth',
      'forbidden',
      'rate-limit',
      'validation',
      'not-found',
      'firefly-down',
      'config',
      'unknown',
    ] as const;
    for (const kind of kinds) {
      const p = presentErrorKind(kind);
      expect(p.title.length, kind).toBeGreaterThan(8);
      expect(p.description.length, kind).toBeGreaterThan(20);
      expect(p.action.label.length, kind).toBeGreaterThan(2);
    }
  });
});
