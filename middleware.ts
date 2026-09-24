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

  /*
   * `startsWith`, not equality: /verify-email/confirm has to run even for
   * someone who already has a session — confirming a second address, or
   * finishing a link opened after signing in elsewhere. Bouncing them to the
   * dashboard would leave the address unconfirmed with no visible reason.
   *
   * The `/sign-in` exclusion below is load-bearing — do not remove it.
   *
   * `hasSession` is the PRESENCE of a cookie, not a valid session — middleware
   * runs on the edge and cannot reach Postgres to check. So when a cookie
   * outlives the row it points to (an idle tab reopened after a deploy, an
   * expired or revoked session), the app and this file disagreed forever:
   *
   *     /dashboard -> /sign-in   the layout validates, and rejects it
   *     /sign-in   -> /          here: the cookie exists, so "already in"
   *     /          -> /dashboard app/page.tsx sends them to their landing page
   *
   * — which the browser ends with ERR_TOO_MANY_REDIRECTS and the user reads as
   * the app being down. Reproduced with a cookie holding a token that matches
   * no row: nineteen hops before Chrome gave up.
   *
   * The decision belongs where the session can actually be validated, so
   * /sign-in makes it itself: a real session redirects on, a dead one renders
   * the form. Middleware keeps the rule for the other public pages, where no
   * such cycle exists because nothing redirects INTO them.
   */
  if (
    hasSession &&
    isPublic &&
    !pathname.startsWith('/sign-in') &&
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
//
// The three PWA files (E22-07) are here for the same reason, and it is not
// hypothetical: the browser fetches the manifest and the service worker
// without credentials, and an install prompt that is answered with a redirect
// to /sign-in produces no error anywhere — the app simply never becomes
// installable, and /offline.html would be replaced by the sign-in page at
// exactly the moment there is no network to reach it with.
//
// `fonts/` holds the TTFs the PDF export embeds. They are public (OFL) and
// carry no user data, so they are served as plain static files rather than
// routed through a session check on every export.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|monitoring|favicon.ico|robots.txt|icon.png|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|offline.html|fonts/).*)',
  ],
};
