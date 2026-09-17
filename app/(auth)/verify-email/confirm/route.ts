import { NextResponse, type NextRequest } from 'next/server';
import { verifyEmailAction } from '@/server/auth/actions';
import { getEnv } from '@/lib/env';

/**
 * Confirm an email address from the link in the verification mail.
 *
 * This is a Route Handler rather than a page because confirming signs the
 * person in, and signing in writes the session cookie. Next.js only allows
 * cookies to be written from a Server Action or a Route Handler — a Server
 * Component that tries it throws during render.
 *
 * That is not theoretical: this used to live in the page, which called
 * `verifyEmailAction` while rendering. The database write marking the address
 * confirmed came first and succeeded, then the cookie write threw, so the
 * account really was verified and the visitor was still shown an error. It went
 * unnoticed because every account in development was confirmed with
 * `pnpm user:verify`, which never touches this path.
 *
 * A redirect on both outcomes also makes the link safe to open twice: the token
 * is single use, so a refresh lands on the expired branch rather than
 * re-running a half-completed confirmation.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');

  /**
   * Built from APP_URL, not from the incoming request.
   *
   * `request.nextUrl` carries the address the SERVER was reached on, which
   * inside a container is its own bind address — 0.0.0.0, or a service name on
   * a compose network. Redirecting there sends the browser to a different
   * origin from the one it came from, and the session cookie just written does
   * not travel with it, so a confirmation that worked lands on the sign-in page
   * anyway. APP_URL is the address people actually browse to, and it is already
   * what the link in the mail was built from.
   */
  const to = (pathname: string, search = ''): NextResponse => {
    const target = new URL(`${pathname}${search}`, getEnv().APP_URL);
    return NextResponse.redirect(target);
  };

  if (!token) return to('/verify-email');

  const result = await verifyEmailAction(token);
  if (!result.ok) return to('/verify-email', '?expired=1');

  // Confirming signs them in, so send them where a signed-in new account
  // belongs rather than to a page whose only content is a link.
  return to('/onboarding');
}
