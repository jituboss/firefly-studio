import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getEnv } from '@/lib/env';

/**
 * §4.2 — SSRF controls for the user-supplied Firefly base URL.
 *
 * This is the primary security risk in the whole design: the user tells us a
 * URL and we make server-side requests to it. A full hardening pass is E23-01;
 * this is the subset M1 cannot ship without.
 */

export class UrlGuardError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid_url'
      | 'bad_scheme'
      | 'insecure_http'
      | 'credentials_in_url'
      | 'dns_failure'
      | 'blocked_address',
  ) {
    super(message);
    this.name = 'UrlGuardError';
  }
}

/**
 * Normalise what a user pastes into a usable origin.
 * Accepts "firefly.example.com", "https://firefly.example.com/api/v1/",
 * "https://host/firefly/" and produces a base with no trailing slash and no
 * API suffix.
 */
export function normaliseBaseUrl(input: string): string {
  let raw = input.trim();
  if (!raw) throw new UrlGuardError('Enter your Firefly III address.', 'invalid_url');

  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UrlGuardError('That does not look like a valid URL.', 'invalid_url');
  }

  if (url.username || url.password) {
    throw new UrlGuardError('Remove the username and password from the URL.', 'credentials_in_url');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new UrlGuardError('Only http and https addresses are supported.', 'bad_scheme');
  }

  if (url.protocol === 'http:' && !getEnv().FIREFLY_ALLOW_INSECURE_HTTP) {
    throw new UrlGuardError(
      'This server only allows https connections. Set FIREFLY_ALLOW_INSECURE_HTTP=true to permit http.',
      'insecure_http',
    );
  }

  // Strip an API suffix the user may have copied from the docs.
  let path = url.pathname.replace(/\/+$/, '');
  path = path.replace(/\/api(\/v\d+)?$/, '');

  return `${url.protocol}//${url.host}${path}`;
}

/** Ranges that are blocked unconditionally, regardless of the private-network flag. */
function isAlwaysBlocked(address: string, family: number): boolean {
  if (family === 4) {
    const octets = address.split('.').map((part) => Number.parseInt(part, 10));
    const [a, b] = octets as [number, number, number, number];
    // Cloud instance metadata (AWS/GCP/Azure/DO all use 169.254.169.254).
    if (a === 169 && b === 254) return true;
    // "This network" and multicast/reserved.
    if (a === 0 || a >= 224) return true;
    return false;
  }
  const lower = address.toLowerCase();
  // IPv6 link-local and unique-local, plus the metadata alias.
  return (
    lower.startsWith('fe80:') ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower === 'fd00:ec2::254'
  );
}

function isPrivate(address: string, family: number): boolean {
  if (family === 4) {
    const octets = address.split('.').map((part) => Number.parseInt(part, 10));
    const [a, b] = octets as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  const lower = address.toLowerCase();
  return (
    lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')
  );
}

export interface ResolvedTarget {
  baseUrl: string;
  host: string;
  address: string;
  family: number;
}

/**
 * Resolve the host ONCE and validate the resulting address. The caller then
 * connects to `address` with the original `Host` header, which closes the
 * DNS-rebinding window: a second lookup cannot return a different answer.
 */
export async function resolveAndCheck(baseUrl: string): Promise<ResolvedTarget> {
  const url = new URL(baseUrl);
  const host = url.hostname;
  const env = getEnv();

  let address: string;
  let family: number;

  const literal = isIP(host);
  if (literal) {
    address = host;
    family = literal;
  } else {
    try {
      const result = await lookup(host);
      address = result.address;
      family = result.family;
    } catch {
      throw new UrlGuardError(`Could not resolve "${host}". Check the address.`, 'dns_failure');
    }
  }

  if (isAlwaysBlocked(address, family)) {
    throw new UrlGuardError('That address is not permitted.', 'blocked_address');
  }

  if (isPrivate(address, family) && !env.FIREFLY_ALLOW_PRIVATE_NETWORKS) {
    throw new UrlGuardError(
      'That address is on a private network, which this server does not allow.',
      'blocked_address',
    );
  }

  return { baseUrl, host, address, family };
}
