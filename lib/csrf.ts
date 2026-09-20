/**
 * E23-03 — CSRF double-submit.
 *
 * Pure, and imported by BOTH the browser and the route handlers, so the two
 * sides cannot drift on a cookie name or a header spelling — the failure mode
 * of that drift is every write 403ing with no clue why.
 *
 * Why double-submit at all, when the session cookie is already `SameSite=Lax`?
 * Lax stops a cross-site form POST, which is the classic attack, but it is one
 * control. It does not cover a same-site subdomain that an attacker controls,
 * and it is a property of a cookie someone can change in passing. A token the
 * attacker cannot read is a second, independent control.
 *
 * Server Actions are NOT covered here and do not need to be: Next.js validates
 * Origin against Host for every action POST itself. This exists for the route
 * handlers, which it does not.
 */

/** Readable by JavaScript on purpose — the browser has to echo it back. */
export const CSRF_COOKIE_NAME = 'fs_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** Methods that must not change state, and so need no token. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

/**
 * Compare in constant time. A short-circuiting `===` leaks how many leading
 * characters were right, which over enough requests recovers the token.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Pull one cookie out of a `document.cookie`-shaped string. */
export function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/**
 * Headers for a state-changing fetch from the browser. Returns an empty object
 * when the cookie is missing rather than throwing: the server decides what a
 * missing token means, and a client-side throw here would break the UI on a
 * request the server might well have accepted.
 */
export function csrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const token = readCookie(document.cookie, CSRF_COOKIE_NAME);
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}
