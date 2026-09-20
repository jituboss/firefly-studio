import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';
import { buildCsp, generateNonce } from '@/lib/csp';
import { CSRF_COOKIE_NAME } from '@/lib/csrf';

/**
 * E2-13 — coarse route guard.
 *
 * Middleware only checks for the PRESENCE of a session cookie; it cannot query
 * Postgres (edge runtime). The authoritative check is `requireSession()` in
 * each layout, which validates the token against the database. This exists to
 * avoid rendering an authenticated shell for an obviously-signed-out visitor.
 */

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // E23-02 — one nonce per response, handed to the render through a request
  // header. Next.js reads the nonce out of the request's Content-Security-Policy
  // header and stamps it onto its own bootstrap script; anything else that
  // needs it (next-themes' anti-FOUC script) reads `x-nonce` in the layout.
  const nonce = generateNonce();
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV === 'development' });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  // E23-03 — the double-submit token. Issued here because middleware runs on
  // page requests but is excluded from /api, so the token is always in place
  // before any fetch the page makes. Readable by JavaScript by design: the
  // browser has to echo it into a header, which is the half an attacker on
  // another origin cannot do.
  const existingCsrf = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfToken = existingCsrf ?? generateNonce();

  const withCsp = <T extends NextResponse>(response: T): T => {
    response.headers.set('Content-Security-Policy', csp);
    if (!existingCsrf) {
      response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    return response;
  };

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;
    return withCsp(NextResponse.redirect(url));
  }

  // `startsWith`, not equality: /verify-email/confirm has to run even for
  // someone who already has a session — confirming a second address, or
  // finishing a link opened after signing in elsewhere. Bouncing them to the
  // dashboard would leave the address unconfirmed with no visible reason.
  if (
    hasSession &&
    isPublic &&
    !pathname.startsWith('/verify-email') &&
    !pathname.startsWith('/reset-password')
  ) {
    const url = request.nextUrl.clone();
    // '/' rather than '/dashboard': middleware runs on the edge with no
    // database, so it cannot know this account's landing page. app/page.tsx
    // can, and redirects again — one extra hop to honour the preference
    // (E18-02) instead of hardcoding a destination here.
    url.pathname = '/';
    url.search = '';
    return withCsp(NextResponse.redirect(url));
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

// Excludes the App Router's generated icon routes (icon.png, icon.svg,
// apple-icon.png) alongside favicon.ico and robots.txt — browsers request
// these directly on sign-in/marketing pages before any session cookie
// exists, so redirecting them to /sign-in would just break the favicon.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|monitoring|favicon.ico|robots.txt|icon.png|icon.svg|apple-icon.png).*)',
  ],
};
