/**
 * E23-02 — the Content-Security-Policy.
 *
 * Pure so it can be unit-tested: the middleware supplies a nonce and the mode,
 * this returns the header value. Every relaxation below is here because
 * something in the app genuinely needs it, and is commented with what — a CSP
 * nobody can explain is one that gets widened on the first broken page and
 * never narrowed again.
 */

export interface CspOptions {
  /** Per-request nonce, base64. Generated in middleware, never reused. */
  nonce: string;
  /** Development needs eval for React Fast Refresh; production must not have it. */
  dev?: boolean;
}

export function buildCsp({ nonce, dev = false }: CspOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // 'strict-dynamic' means the nonce on Next's bootstrap script propagates to
    // the chunks it loads, and the host allowlist is ignored by CSP3 browsers.
    // That matters here specifically because /api/attachments/[id]/download
    // streams user-supplied bytes from our own origin: under a plain
    // `script-src 'self'` an uploaded file that a browser decided was
    // JavaScript would be same-origin and therefore allowed. 'self' is kept as
    // the CSP2 fallback for browsers that ignore strict-dynamic.
    'script-src': dev
      ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", "'unsafe-eval'"]
      : ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],

    // 'unsafe-inline' is load-bearing and cannot be removed by adding a nonce:
    // Recharts sets inline `style` attributes on every rendered element, and a
    // nonce does not apply to style attributes. Restricting this further means
    // replacing the chart library.
    'style-src': ["'self'", "'unsafe-inline'"],

    // blob: — attachment previews fetch through our API and render the result
    // from an object URL. data: — inlined SVG icons.
    'img-src': ["'self'", 'data:', 'blob:'],

    'font-src': ["'self'", 'data:'],

    // Same-origin only. Sentry, when configured, is tunnelled through
    // /monitoring precisely so this does not need a third-party host.
    'connect-src': ["'self'"],

    // The PDF lightbox renders an <iframe src={objectUrl}>.
    'frame-src': ["'self'", 'blob:'],

    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  };

  // Deliberately NOT set: upgrade-insecure-requests. Firefly Studio is
  // routinely self-hosted at http:// on a LAN, and that directive would upgrade
  // its own same-origin subresource requests to https, breaking every asset on
  // exactly the deployments least able to debug it. TLS termination is the
  // proxy's job; HSTS (set in next.config.ts) already handles the https case.

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * A nonce must be unpredictable and unique per response — a reused one lets an
 * injected script carry a nonce the attacker already saw. Web Crypto rather
 * than node:crypto because middleware runs on the edge runtime.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
