import 'server-only';
import { randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { FIREFLY_TRACE_HEADER } from '@/lib/request-id';
import { resolveAndCheck, UrlGuardError } from './url-guard';

/**
 * Minimal server-side Firefly III caller used by onboarding.
 *
 * The full proxy with caching, tag invalidation and rate limiting is M2
 * (E22-01/03); this is the request primitive it will be built on.
 */

export class FireflyRequestError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'unreachable'
      | 'timeout'
      | 'unauthorised'
      | 'forbidden'
      | 'not_firefly'
      | 'not_found'
      | 'server_error'
      | 'too_large',
    readonly status?: number,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'FireflyRequestError';
  }
}

export interface FireflyCallOptions {
  baseUrl: string;
  token?: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function callFirefly<T>(options: FireflyCallOptions): Promise<T> {
  const env = getEnv();
  const { baseUrl, token, path, method = 'GET', body } = options;

  await resolveAndCheck(baseUrl);

  const traceId = randomUUID();
  const url = `${baseUrl}/api${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.FIREFLY_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      // Never follow redirects: a 302 is a second destination we did not vet.
      redirect: 'manual',
      cache: 'no-store',
      headers: {
        accept: 'application/vnd.api+json',
        'content-type': 'application/json',
        [FIREFLY_TRACE_HEADER]: traceId,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FireflyRequestError(
        `No response within ${env.FIREFLY_REQUEST_TIMEOUT_MS / 1000} seconds.`,
        'timeout',
      );
    }
    if (error instanceof UrlGuardError) throw error;
    throw new FireflyRequestError(
      'Could not reach that address. Check the URL and that the server is running.',
      'unreachable',
    );
  } finally {
    clearTimeout(timer);
  }

  const upstreamTrace = response.headers.get(FIREFLY_TRACE_HEADER) ?? traceId;

  if (response.status >= 300 && response.status < 400) {
    throw new FireflyRequestError(
      'That address redirects elsewhere. Enter the final Firefly III URL.',
      'unreachable',
      response.status,
      upstreamTrace,
    );
  }

  if (response.status === 401) {
    throw new FireflyRequestError(
      'Firefly III rejected that token.',
      'unauthorised',
      401,
      upstreamTrace,
    );
  }

  if (response.status === 403) {
    throw new FireflyRequestError(
      'That token does not have permission for this instance.',
      'forbidden',
      403,
      upstreamTrace,
    );
  }

  if (response.status === 404) {
    // Ambiguous by itself: either the address is not a Firefly III API, or the
    // resource simply does not exist. Callers disambiguate — onboarding treats
    // it as the former, the proxy passes it through as a plain 404.
    throw new FireflyRequestError('Not found at that address.', 'not_found', 404, upstreamTrace);
  }

  if (!response.ok) {
    throw new FireflyRequestError(
      `Firefly III returned ${response.status}.`,
      'server_error',
      response.status,
      upstreamTrace,
    );
  }

  const length = Number.parseInt(response.headers.get('content-length') ?? '0', 10);
  if (length > env.FIREFLY_MAX_RESPONSE_BYTES) {
    throw new FireflyRequestError(
      'Response too large.',
      'too_large',
      response.status,
      upstreamTrace,
    );
  }

  const text = await response.text();

  if (response.status === 204 || text.trim() === '') {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // An HTML login page is the classic symptom of a reverse proxy in front of
    // Firefly, or of the URL pointing at the web UI rather than the API.
    logger.warn({ url, traceId: upstreamTrace }, 'Firefly returned a non-JSON body');
    throw new FireflyRequestError(
      'That address returned a web page, not the Firefly III API.',
      'not_firefly',
      response.status,
      upstreamTrace,
    );
  }
}
