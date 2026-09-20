import { describe, expect, it } from 'vitest';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  isSafeMethod,
  readCookie,
  timingSafeEqual,
} from '@/lib/csrf';

describe('isSafeMethod', () => {
  it('treats the read methods as safe, in any casing', () => {
    for (const method of ['GET', 'get', 'HEAD', 'options']) {
      expect(isSafeMethod(method)).toBe(true);
    }
  });

  it('treats everything that writes as unsafe', () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'post']) {
      expect(isSafeMethod(method)).toBe(false);
    }
  });
});

describe('timingSafeEqual', () => {
  it('matches identical tokens', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
  });

  it('rejects a different token of the same length', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
  });

  it('rejects different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('rejects empty against empty-ish', () => {
    expect(timingSafeEqual('', 'a')).toBe(false);
  });

  // The property that matters: no early return on the first differing
  // character. Comparing strings that differ at position 0 must do the same
  // work as ones that differ at the end.
  it('compares the whole string regardless of where it differs', () => {
    const a = 'x'.repeat(32);
    const early = `y${'x'.repeat(31)}`;
    const late = `${'x'.repeat(31)}y`;
    expect(timingSafeEqual(a, early)).toBe(false);
    expect(timingSafeEqual(a, late)).toBe(false);
  });
});

describe('readCookie', () => {
  it('finds a cookie among several', () => {
    const header = `fs_session=abc; ${CSRF_COOKIE_NAME}=tok123; theme=dark`;
    expect(readCookie(header, CSRF_COOKIE_NAME)).toBe('tok123');
  });

  it('returns null when the cookie is absent', () => {
    expect(readCookie('theme=dark', CSRF_COOKIE_NAME)).toBeNull();
  });

  it('returns null for an empty header', () => {
    expect(readCookie('', CSRF_COOKIE_NAME)).toBeNull();
  });

  // Base64 tokens contain '=' padding, which a naive split('=') would truncate
  // into a token that never matches.
  it('keeps base64 padding intact', () => {
    expect(readCookie(`${CSRF_COOKIE_NAME}=YWJjZGVm==`, CSRF_COOKIE_NAME)).toBe('YWJjZGVm==');
  });

  it('decodes a percent-encoded value', () => {
    expect(readCookie(`${CSRF_COOKIE_NAME}=a%2Bb`, CSRF_COOKIE_NAME)).toBe('a+b');
  });

  it('does not match a cookie whose name merely ends with the target', () => {
    expect(readCookie(`not_${CSRF_COOKIE_NAME}=nope`, CSRF_COOKIE_NAME)).toBeNull();
  });
});

describe('the shared constants', () => {
  // Both halves of a double-submit check read these. If they drift, every
  // write 403s and the cause is invisible from either side alone.
  it('are the names the server and the browser both use', () => {
    expect(CSRF_COOKIE_NAME).toBe('fs_csrf');
    expect(CSRF_HEADER_NAME).toBe('x-csrf-token');
  });
});
