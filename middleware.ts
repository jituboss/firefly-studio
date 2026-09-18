import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

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

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
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
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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
