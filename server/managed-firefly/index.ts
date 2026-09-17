import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { managedFireflyUsers } from '@/server/db/schema';
import { open, seal } from '@/server/crypto';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Provisioning against the managed Firefly III instance.
 *
 * WHY THIS TALKS TO HTML FORMS AND NOT THE API
 * --------------------------------------------
 * Firefly's REST API can create a user (`POST /api/v1/users`) but its User
 * schema has no password field, and Passport scopes token creation to the
 * session of the user the token belongs to — an admin bearer token posting to
 * `/oauth/personal-access-tokens` is answered with "CSRF token mismatch". So
 * there is no API-only path from "admin credentials" to "a usable token for
 * someone else". Verified against 6.5.5, both by reading the vendored spec and
 * by watching two logins fail after setting a password through the API.
 *
 * What does work is Firefly's own registration form: registering a user logs
 * that browser session straight in, and the session can then mint a Personal
 * Access Token. That is the flow below.
 *
 * The cost of that decision, stated plainly: this code depends on Firefly's web
 * routes and their CSRF conventions rather than on its documented API, so a
 * Firefly upgrade can break it in a way a spec diff will not catch. Every step
 * therefore fails loudly with an operator-readable reason instead of returning
 * a half-built connection, and `preflightManagedFirefly` is meant to be run
 * after any upgrade.
 */

export interface ManagedConfig {
  baseUrl: string;
  label: string;
  adminEmail?: string;
  adminPassword?: string;
}

/** Null when this deployment has no managed instance configured. */
export function managedConfig(): ManagedConfig | null {
  const env = getEnv();
  if (!env.MANAGED_FIREFLY_URL) return null;
  return {
    baseUrl: env.MANAGED_FIREFLY_URL.replace(/\/+$/, ''),
    label: env.MANAGED_FIREFLY_LABEL,
    adminEmail: env.MANAGED_FIREFLY_ADMIN_EMAIL,
    adminPassword: env.MANAGED_FIREFLY_ADMIN_PASSWORD,
  };
}

export class ManagedProvisioningError extends Error {
  constructor(
    message: string,
    /** True when an operator can fix this by changing the instance's settings. */
    readonly operatorActionable = false,
  ) {
    super(message);
    this.name = 'ManagedProvisioningError';
  }
}

const context = (id: string) => `managed-firefly:${id}:password`;

// --- the cookie jar -------------------------------------------------------
// Firefly's web routes are session based, so these calls carry cookies by hand
// rather than going through the app's usual token-only Firefly client.

class Jar {
  private jar = new Map<string, string>();

  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  absorb(response: Response): void {
    // `getSetCookie` keeps the entries separate; a plain get() would join them
    // into one string and split wrongly on the commas inside Expires dates.
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const eq = pair?.indexOf('=') ?? -1;
      if (!pair || eq < 1) continue;
      this.jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }
}

async function fetchWithJar(url: string, jar: Jar, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookies = jar.header();
  if (cookies) headers.set('cookie', cookies);

  const response = await fetch(url, {
    ...init,
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(getEnv().FIREFLY_REQUEST_TIMEOUT_MS),
  });
  jar.absorb(response);
  return response;
}

/** Laravel puts the token in a hidden input on forms and a meta tag on pages. */
function extractCsrf(html: string): string | null {
  return (
    html.match(/name="_token"\s+value="([^"]+)"/)?.[1] ??
    html.match(/name="csrf-token"\s+content="([^"]+)"/)?.[1] ??
    null
  );
}

function form(fields: Record<string, string>): string {
  return new URLSearchParams(fields).toString();
}

const FORM_HEADERS = {
  'content-type': 'application/x-www-form-urlencoded',
  accept: 'text/html,application/xhtml+xml',
};

// --- steps ----------------------------------------------------------------

/**
 * Mint a Personal Access Token using an already-authenticated session.
 * Passport answers with the bare token exactly once; it is never retrievable
 * again, so the caller must persist what comes back.
 */
async function mintToken(baseUrl: string, jar: Jar, name: string): Promise<string> {
  const page = await fetchWithJar(`${baseUrl}/profile`, jar);
  if (page.status !== 200) {
    throw new ManagedProvisioningError(
      `Firefly returned ${page.status} for the profile page, so no token could be created.`,
    );
  }
  const csrf = extractCsrf(await page.text());
  if (!csrf) {
    throw new ManagedProvisioningError(
      'Could not find a CSRF token on the Firefly profile page. This usually means the managed instance was upgraded and its pages changed.',
      true,
    );
  }

  const response = await fetchWithJar(`${baseUrl}/oauth/personal-access-tokens`, jar, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-csrf-token': csrf,
      'x-requested-with': 'XMLHttpRequest',
    },
    body: JSON.stringify({ name, scopes: [] }),
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new ManagedProvisioningError(
      `Firefly refused to create an access token (HTTP ${response.status}).`,
    );
  }

  const payload = (await response.json().catch(() => null)) as { accessToken?: string } | null;
  if (!payload?.accessToken) {
    throw new ManagedProvisioningError('Firefly created a token but did not return it.');
  }
  return payload.accessToken;
}

async function login(baseUrl: string, email: string, password: string): Promise<Jar> {
  const jar = new Jar();
  const page = await fetchWithJar(`${baseUrl}/login`, jar);
  const csrf = extractCsrf(await page.text());
  if (!csrf) {
    throw new ManagedProvisioningError(
      'The managed Firefly instance did not serve a usable login form.',
      true,
    );
  }

  const response = await fetchWithJar(`${baseUrl}/login`, jar, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({ _token: csrf, email, password }),
  });

  // Laravel redirects to the intended page on success and back to /login on
  // failure, so the redirect target is the only signal of which happened.
  const location = response.headers.get('location') ?? '';
  if (response.status !== 302 || location.includes('/login')) {
    throw new ManagedProvisioningError(
      'The managed Firefly instance rejected the stored credentials for this account.',
    );
  }
  return jar;
}

async function register(baseUrl: string, email: string, password: string): Promise<Jar> {
  const jar = new Jar();
  const page = await fetchWithJar(`${baseUrl}/register`, jar);
  const csrf = extractCsrf(await page.text());
  if (!csrf) {
    // Firefly serves /register with a 200 and no form when single user mode is
    // on, so an absent token is the signal that registration is closed rather
    // than that something crashed.
    throw new ManagedProvisioningError(
      'The managed Firefly instance is not accepting new registrations. An administrator must turn off "single user mode" in Firefly III before accounts can be provisioned.',
      true,
    );
  }

  const response = await fetchWithJar(`${baseUrl}/register`, jar, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({
      _token: csrf,
      email,
      password,
      password_confirmation: password,
    }),
  });

  const location = response.headers.get('location') ?? '';
  if (response.status !== 302 || location.includes('/register')) {
    throw new ManagedProvisioningError(
      'The managed Firefly instance refused to create the account. The address may already be registered there.',
    );
  }
  // Registration signs the new account in, so this jar is already authenticated.
  return jar;
}

async function identify(baseUrl: string, token: string): Promise<{ id: string; email: string }> {
  const response = await fetch(`${baseUrl}/api/v1/about/user`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.api+json' },
    signal: AbortSignal.timeout(getEnv().FIREFLY_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new ManagedProvisioningError(
      `The new access token did not work against the managed instance (HTTP ${response.status}).`,
    );
  }
  const payload = (await response.json()) as {
    data: { id: string; attributes: { email: string } };
  };
  return { id: payload.data.id, email: payload.data.attributes.email };
}

// --- public API -----------------------------------------------------------

/**
 * Is the managed instance reachable and accepting registrations? Run this
 * after upgrading Firefly — it exercises the two pages provisioning depends on
 * without creating anything.
 */
export async function preflightManagedFirefly(): Promise<{ ok: boolean; reason?: string }> {
  const config = managedConfig();
  if (!config) return { ok: false, reason: 'No managed instance is configured.' };

  try {
    const jar = new Jar();
    const page = await fetchWithJar(`${config.baseUrl}/register`, jar);
    if (page.status !== 200) {
      return { ok: false, reason: `Firefly returned HTTP ${page.status} for /register.` };
    }
    if (!extractCsrf(await page.text())) {
      return {
        ok: false,
        reason:
          'Registration is closed on the managed instance. Turn off "single user mode" in Firefly III.',
      };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Unreachable.' };
  }
}

export async function getManagedMapping(userId: string) {
  const config = managedConfig();
  if (!config) return null;
  const [row] = await db
    .select()
    .from(managedFireflyUsers)
    .where(
      and(eq(managedFireflyUsers.userId, userId), eq(managedFireflyUsers.baseUrl, config.baseUrl)),
    )
    .limit(1);
  return row ?? null;
}

export interface ProvisionResult {
  baseUrl: string;
  label: string;
  token: string;
  remoteUserId: string;
  remoteEmail: string;
  /** False when an existing mapping was reused rather than an account created. */
  created: boolean;
}

/**
 * Produce a working token for this user on the managed instance.
 *
 * Called both on first use and on every switch back. When a mapping already
 * exists it is reused — logging in as that same Firefly account and minting a
 * fresh token — so a user who leaves and returns finds the ledger they left,
 * not an empty one.
 */
export async function provisionManagedConnection(
  userId: string,
  appEmail: string,
): Promise<ProvisionResult> {
  const config = managedConfig();
  if (!config) {
    throw new ManagedProvisioningError('No managed Firefly instance is configured.', true);
  }

  const existing = await getManagedMapping(userId);
  const tokenName = 'Firefly Studio';

  if (existing) {
    const password = open(
      {
        ciphertext: existing.passwordCiphertext,
        nonce: existing.passwordNonce,
        authTag: existing.passwordAuthTag,
        keyVersion: existing.keyVersion,
      },
      context(existing.id),
    );
    const jar = await login(config.baseUrl, existing.remoteEmail, password);
    const token = await mintToken(config.baseUrl, jar, tokenName);

    await db
      .update(managedFireflyUsers)
      .set({ lastProvisionedAt: new Date(), updatedAt: new Date() })
      .where(eq(managedFireflyUsers.id, existing.id));

    logger.info({ userId, remoteUserId: existing.remoteUserId }, 'Reused managed Firefly account');
    return {
      baseUrl: config.baseUrl,
      label: config.label,
      token,
      remoteUserId: existing.remoteUserId,
      remoteEmail: existing.remoteEmail,
      created: false,
    };
  }

  // 32 bytes of base64url. Nobody types this: it exists only so the app can log
  // back in as this account later, and it never leaves the server.
  const password = randomBytes(32).toString('base64url');
  const jar = await register(config.baseUrl, appEmail, password);
  const token = await mintToken(config.baseUrl, jar, tokenName);
  const identity = await identify(config.baseUrl, token);

  // Insert first so the row id can salt the key derivation, exactly as the
  // connection token does.
  const [created] = await db
    .insert(managedFireflyUsers)
    .values({
      userId,
      baseUrl: config.baseUrl,
      remoteUserId: identity.id,
      remoteEmail: identity.email,
      passwordCiphertext: '',
      passwordNonce: '',
      passwordAuthTag: '',
      lastProvisionedAt: new Date(),
    })
    .returning({ id: managedFireflyUsers.id });

  const id = created!.id;
  const sealed = seal(password, context(id));
  await db
    .update(managedFireflyUsers)
    .set({
      passwordCiphertext: sealed.ciphertext,
      passwordNonce: sealed.nonce,
      passwordAuthTag: sealed.authTag,
      keyVersion: sealed.keyVersion,
    })
    .where(eq(managedFireflyUsers.id, id));

  logger.info({ userId, remoteUserId: identity.id }, 'Provisioned managed Firefly account');
  return {
    baseUrl: config.baseUrl,
    label: config.label,
    token,
    remoteUserId: identity.id,
    remoteEmail: identity.email,
    created: true,
  };
}
