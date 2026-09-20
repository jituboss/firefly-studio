import { describe, expect, it, vi } from 'vitest';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

/**
 * E23-03 / E24-07 — the server half of the double-submit check.
 *
 * `lib/csrf.ts` is covered elsewhere; this is the decision itself, which is
 * what actually stands between a cross-origin page and a write endpoint
 * carrying the user's Firefly token.
 */

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { csrfFailure } = await import('@/server/auth/csrf');

/** Only the four things `csrfFailure` reads. */
function request({
  method = 'POST',
  cookie,
  header,
  site,
}: {
  method?: string;
  cookie?: string;
  header?: string;
  site?: string;
}) {
  const headers = new Map<string, string>();
  if (header !== undefined) headers.set(CSRF_HEADER_NAME, header);
  if (site !== undefined) headers.set('sec-fetch-site', site);

  return {
    method,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    cookies: {
      get: (name: string) => (name === CSRF_COOKIE_NAME && cookie ? { value: cookie } : undefined),
    },
    nextUrl: { pathname: '/api/ff/v1/transactions' },
  } as unknown as Parameters<typeof csrfFailure>[0];
}

const TOKEN = 'a-token-that-is-long-enough';

describe('csrfFailure', () => {
  it('lets a matching token through', () => {
    expect(csrfFailure(request({ cookie: TOKEN, header: TOKEN }))).toBeNull();
  });

  it('refuses when the header is missing', async () => {
    const response = csrfFailure(request({ cookie: TOKEN }));
    expect(response?.status).toBe(403);
  });

  it('refuses when the cookie is missing', () => {
    expect(csrfFailure(request({ header: TOKEN }))?.status).toBe(403);
  });

  it('refuses when the two do not match', () => {
    expect(csrfFailure(request({ cookie: TOKEN, header: `${TOKEN}x` }))?.status).toBe(403);
  });

  it('refuses when both are absent', () => {
    expect(csrfFailure(request({}))?.status).toBe(403);
  });

  // Reads change nothing, and requiring a token on them would break every
  // ordinary navigation and prefetch.
  it('never challenges a safe method, even with no token at all', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(csrfFailure(request({ method }))).toBeNull();
    }
  });

  // Sec-Fetch-Site is the browser's own account of where the request came
  // from, so it survives a reverse proxy that rewrites Origin and Host.
  it('refuses a cross-site write outright, token or not', () => {
    expect(csrfFailure(request({ site: 'cross-site', cookie: TOKEN, header: TOKEN }))?.status).toBe(
      403,
    );
  });

  it('accepts same-origin and same-site, which is what our own pages send', () => {
    expect(csrfFailure(request({ site: 'same-origin', cookie: TOKEN, header: TOKEN }))).toBeNull();
    expect(csrfFailure(request({ site: 'same-site', cookie: TOKEN, header: TOKEN }))).toBeNull();
  });

  // An older browser or a non-browser client sends no Sec-Fetch-Site. That is
  // "no opinion", not "allowed" — the token still has to be right.
  it('falls back to the token when Sec-Fetch-Site is absent', () => {
    expect(csrfFailure(request({ cookie: TOKEN, header: TOKEN }))).toBeNull();
    expect(csrfFailure(request({ cookie: TOKEN, header: 'wrong' }))?.status).toBe(403);
  });

  it('says what to do, rather than just refusing', async () => {
    const response = csrfFailure(request({}));
    const body = (await response?.json()) as { error: string };
    expect(body.error).toMatch(/reload/i);
    expect(body.error).toMatch(/still valid/i);
  });
});
