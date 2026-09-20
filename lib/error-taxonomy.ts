/**
 * E21-05 — the error taxonomy.
 *
 * Every failure in this app is one of a handful of kinds, and each kind has
 * exactly one useful next step. "Something went wrong. Try again." is the
 * answer to none of them: retrying a revoked token fails identically forever,
 * and retrying a rate limit makes it worse.
 *
 * Pure, so the mapping is unit-tested and the same on the server, in a route
 * error boundary, and in a client component.
 */

export type ErrorKind =
  | 'network'
  | 'auth'
  | 'forbidden'
  | 'rate-limit'
  | 'validation'
  | 'not-found'
  | 'firefly-down'
  | 'config'
  | 'unknown';

export interface ErrorPresentation {
  kind: ErrorKind;
  title: string;
  /** What happened, in the user's terms — never a status code alone. */
  description: string;
  /** The one thing worth doing next. */
  action: { label: string; href?: string; retry?: boolean };
  /** Whether retrying the same request could plausibly succeed. */
  retryable: boolean;
}

const PRESENTATIONS: Record<ErrorKind, Omit<ErrorPresentation, 'kind'>> = {
  network: {
    title: 'Cannot reach your Firefly III',
    description:
      'The instance did not answer. It may be offline, still starting up, or on a network this server cannot see.',
    action: { label: 'Try again', retry: true },
    retryable: true,
  },
  auth: {
    title: 'Your access token is no longer valid',
    description:
      'Firefly III rejected the token for this connection. Tokens can be revoked from Firefly, and they expire. Reconnecting takes a moment and changes nothing in your ledger.',
    action: { label: 'Reconnect', href: '/settings/connections' },
    retryable: false,
  },
  forbidden: {
    title: 'That is not allowed on this instance',
    description:
      'Your Firefly III account does not have permission for this. An instance owner can grant it.',
    action: { label: 'Back to settings', href: '/settings/connections' },
    retryable: false,
  },
  'rate-limit': {
    title: 'Too many requests',
    description:
      'This connection is being asked for more than it will serve right now. Waiting a minute clears it; retrying immediately extends it.',
    action: { label: 'Try again in a minute', retry: true },
    retryable: true,
  },
  validation: {
    title: 'Firefly III refused that change',
    description:
      'The data was rejected as invalid. The details are on the form; correcting them and submitting again is safe.',
    action: { label: 'Go back', retry: true },
    retryable: true,
  },
  'not-found': {
    title: 'That is not here',
    description:
      'The record no longer exists, or it belongs to a different Firefly III instance than the one you are connected to.',
    action: { label: 'Back to dashboard', href: '/' },
    retryable: false,
  },
  'firefly-down': {
    title: 'Firefly III returned an error',
    description:
      'The instance answered, but with a failure of its own. This is a problem on the Firefly III side rather than here; its own logs will say more.',
    action: { label: 'Try again', retry: true },
    retryable: true,
  },
  config: {
    title: 'This instance address cannot be used',
    description:
      'The address saved for this connection is not one this server will call — it may be malformed, on a network that is blocked, or plain http where https is required.',
    action: { label: 'Check the connection', href: '/settings/connections' },
    retryable: false,
  },
  unknown: {
    title: 'Something went wrong',
    description: 'The page could not be displayed. The failure has been logged.',
    action: { label: 'Try again', retry: true },
    retryable: true,
  },
};

/**
 * The codes `FireflyRequestError` and `UrlGuardError` carry.
 *
 * The guard's codes are here because they are what a stopped instance actually
 * produces: the host is resolved and checked BEFORE any HTTP call, so with the
 * container down the failure is `dns_failure` from the guard, not `unreachable`
 * from the client. Mapping only the client's codes classified a dead instance
 * as "Something went wrong", which is how this was found.
 */
const FROM_FIREFLY_CODE: Record<string, ErrorKind> = {
  // server/firefly/url-guard.ts
  dns_failure: 'network',
  blocked_address: 'config',
  invalid_url: 'config',
  bad_scheme: 'config',
  insecure_http: 'config',
  credentials_in_url: 'config',
  // server/firefly/client.ts
  unreachable: 'network',
  timeout: 'network',
  unauthorised: 'auth',
  forbidden: 'forbidden',
  not_firefly: 'network',
  not_found: 'not-found',
  server_error: 'firefly-down',
  validation: 'validation',
  too_large: 'validation',
};

function kindFromStatus(status: number): ErrorKind | null {
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'firefly-down';
  return null;
}

/**
 * Classify anything throwable. Deliberately tolerant: an error boundary is the
 * last place that should throw, and by the time something reaches one, the
 * shape it arrived in is not to be trusted.
 */
export function classifyError(error: unknown): ErrorKind {
  if (!error || typeof error !== 'object') return 'unknown';

  const candidate = error as { code?: unknown; status?: unknown; message?: unknown };

  if (typeof candidate.code === 'string' && candidate.code in FROM_FIREFLY_CODE) {
    return FROM_FIREFLY_CODE[candidate.code]!;
  }

  if (typeof candidate.status === 'number') {
    const kind = kindFromStatus(candidate.status);
    if (kind) return kind;
  }

  // Next.js digests strip everything but the message from a server error that
  // crossed into the browser, so the message is sometimes all there is.
  if (typeof candidate.message === 'string') {
    const message = candidate.message.toLowerCase();
    if (/fetch failed|econnrefused|enotfound|network|timed? out/.test(message)) return 'network';
    if (/unauthori[sz]ed|invalid token|401/.test(message)) return 'auth';
    if (/rate limit|too many requests|429/.test(message)) return 'rate-limit';
  }

  return 'unknown';
}

export function presentError(error: unknown): ErrorPresentation {
  const kind = classifyError(error);
  return { kind, ...PRESENTATIONS[kind] };
}

/** For a known kind, without an error object to classify. */
export function presentErrorKind(kind: ErrorKind): ErrorPresentation {
  return { kind, ...PRESENTATIONS[kind] };
}
