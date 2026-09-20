import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, isSafeMethod, timingSafeEqual } from '@/lib/csrf';
import { logger } from '@/lib/logger';

/**
 * E23-03 — the server half of the double-submit check, for route handlers.
 *
 * Returns a 403 response to return immediately, or null when the request may
 * proceed.
 */
export function csrfFailure(request: NextRequest): NextResponse | null {
  if (isSafeMethod(request.method)) return null;

  // Sec-Fetch-Site is computed by the browser, not by us, so it survives any
  // reverse-proxy arrangement. That matters: the obvious check here — compare
  // the Origin header to our own origin — breaks behind a proxy that
  // terminates TLS, because the origin the app sees is not the one the browser
  // used. Absent (a non-browser client, or an older browser) means "no
  // opinion", and the token below is the real control either way.
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site') {
    logger.warn({ path: request.nextUrl.pathname, site }, 'Rejected cross-site write');
    return NextResponse.json({ error: 'Cross-site request refused' }, { status: 403 });
  }

  const cookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const header = request.headers.get(CSRF_HEADER_NAME);

  if (!cookie || !header || !timingSafeEqual(cookie, header)) {
    logger.warn(
      {
        path: request.nextUrl.pathname,
        hasCookie: Boolean(cookie),
        hasHeader: Boolean(header),
      },
      'Rejected write with a missing or mismatched CSRF token',
    );
    return NextResponse.json(
      {
        error:
          'This request could not be verified. Reload the page and try again — your session is still valid.',
      },
      { status: 403 },
    );
  }

  return null;
}
