/**
 * E1-16 — the pure half of the HTTP access log.
 *
 * Kept out of `server/` so every decision below can be unit-tested without a
 * running server, because two of them are security decisions rather than
 * formatting ones.
 */

/**
 * Query parameters whose VALUE must never be written to a log.
 *
 * This is the single control point, the same way `REDACT_PATHS` is for the
 * structured logger — adding a route that carries a secret in its query string
 * means adding its parameter name here.
 *
 * It is not hypothetical. `/verify-email/confirm?token=…` and
 * `/reset-password?token=…` both carry a single-use credential that is enough
 * to take over an account, and an access log is exactly the artefact people
 * forward to a log aggregator, paste into an issue, or leave readable by every
 * operator. nginx logs the full request line; this one cannot.
 *
 * Matched as a substring, case-insensitively, so `access_token`, `csrfToken`
 * and `apiKey` are all covered by the stems below.
 */
export const SENSITIVE_QUERY_KEYS = [
  'token',
  'secret',
  'password',
  'passwd',
  'code',
  'key',
  'sig',
  'auth',
  'session',
  'credential',
  'otp',
];

/*
 * No brackets: the value goes back through URLSearchParams, which
 * percent-encodes them, and `token=%5Bredacted%5D` is markedly harder to read
 * at a glance in a wall of log lines than `token=REDACTED`.
 */
const REDACTED = 'REDACTED';

const isSensitiveKey = (key: string) => {
  const lower = key.toLowerCase();
  return SENSITIVE_QUERY_KEYS.some((needle) => lower.includes(needle));
};

/**
 * The request target as it should appear in a log: path kept, sensitive query
 * values replaced.
 *
 * The parameter NAME is deliberately kept. Knowing that a request carried a
 * `token` is operationally useful — it is how you tell a verification callback
 * from a plain page view — and the name alone is not the secret.
 */
export function redactUrl(target: string): string {
  const split = target.indexOf('?');
  if (split === -1) return target;

  const path = target.slice(0, split);
  const query = target.slice(split + 1);
  if (!query) return path;

  /*
   * Parsed and re-serialised with URLSearchParams rather than by string
   * surgery, so a value that itself contains an encoded `&` or `=` cannot
   * split into something that escapes redaction.
   */
  const params = new URLSearchParams(query);
  const out = new URLSearchParams();
  for (const [key, value] of params) {
    out.append(key, isSensitiveKey(key) ? REDACTED : value);
  }
  const serialised = out.toString();
  return serialised ? `${path}?${serialised}` : path;
}

/**
 * The client's address.
 *
 * `x-forwarded-for` is set by whatever sits in front of the app, and it is also
 * trivially forged by the client when nothing does. The app cannot tell those
 * apart from inside, so the choice is explicit: `trustProxy` says a proxy is in
 * front and its header is the truth. That mirrors the existing rule in
 * `server/auth/request-meta.ts` — the forwarded address is an operational hint,
 * never an authorisation input.
 *
 * The FIRST entry is taken, which is the original client; the rest are the
 * proxies it passed through.
 */
export function clientIp(
  headers: Record<string, string | string[] | undefined>,
  remoteAddress: string | undefined,
  trustProxy: boolean,
): string {
  if (trustProxy) {
    const forwarded = first(headers['x-forwarded-for']);
    const hop = forwarded?.split(',')[0]?.trim();
    if (hop) return normaliseIp(hop);
    const real = first(headers['x-real-ip'])?.trim();
    if (real) return normaliseIp(real);
  }
  return remoteAddress ? normaliseIp(remoteAddress) : '-';
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Node reports an IPv4 client on a dual-stack socket as `::ffff:10.0.0.1`.
 * Printed verbatim that does not match anything an operator would grep for.
 */
const normaliseIp = (ip: string) => (ip.startsWith('::ffff:') ? ip.slice(7) : ip);

/**
 * Paths not worth a line.
 *
 * Build output and the service worker's fetches are the bulk of the traffic and
 * none of it answers a question anyone asks a log. They stay loggable through
 * `ACCESS_LOG_STATIC=true` for the case where the question IS "is the CDN path
 * working", which is the only time anyone wants them.
 */
export function isNoiseRequest(path: string): boolean {
  return (
    path.startsWith('/_next/static/') ||
    path.startsWith('/_next/image') ||
    path === '/favicon.ico' ||
    path === '/sw.js' ||
    path.startsWith('/icons/')
  );
}

/** Health probes, which a container runtime hits on a timer forever. */
export function isProbeRequest(path: string): boolean {
  return path === '/api/health' || path === '/api/ready';
}

/**
 * One nginx-combined-ish line, for humans reading `docker logs`.
 *
 * The structured fields go to pino as well; this is the string a person scans.
 * Duration is included where nginx puts bytes, because "which request was slow"
 * is the question this log gets asked most.
 */
export function formatAccessLine(entry: {
  ip: string;
  method: string;
  url: string;
  status: number;
  bytes: number | string;
  durationMs: number;
  userAgent: string;
}): string {
  return `${entry.ip} "${entry.method} ${entry.url}" ${entry.status} ${entry.bytes} ${entry.durationMs}ms "${entry.userAgent}"`;
}

/**
 * `content-length` as Node hands it back, without coercion.
 *
 * `Number()` and `parseInt` are lint errors outside `lib/money.ts` — the rule
 * exists because coercing a Firefly amount loses precision, and carving out an
 * exception here to save one line would weaken a guard that has already caught
 * real bugs. Nothing needs arithmetic on this value: it is printed, and a
 * streamed response has no length to print.
 */
export function responseBytes(header: number | string | string[] | undefined): number | string {
  if (typeof header === 'number') return header;
  if (typeof header === 'string') return header;
  // A streamed or chunked response sets no content-length. "-" is what nginx
  // writes, and it is honest in a way that a fabricated 0 is not.
  return '-';
}
