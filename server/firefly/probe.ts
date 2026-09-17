import 'server-only';
import { callFirefly, FireflyRequestError } from './client';

/** E2-14 / E2-15 — the two probes onboarding relies on. */

export interface AboutResponse {
  data: { version: string; api_version: string; php_version: string; os: string; driver: string };
}

export interface AboutUserResponse {
  data: {
    id: string;
    attributes: { email: string; role?: string | null; blocked?: boolean };
  };
}

export interface CurrencyResponse {
  data: { attributes: { code: string; name: string; symbol: string; decimal_places: number } };
}

export interface InstanceInfo {
  version: string;
  apiVersion: string;
  phpVersion: string;
  os: string;
  driver: string;
}

/**
 * Step 1: is there a Firefly III API at this address?
 *
 * IMPORTANT: `/api/v1/about` requires authentication — every Firefly III route
 * does. So an unauthenticated probe cannot read the version, and a 401 with a
 * JSON body is exactly the POSITIVE signal we want: something at this address
 * speaks the Firefly III API and is asking us to authenticate. A 404, an HTML
 * body, or a connection failure means it is not Firefly.
 *
 * Version detection therefore happens in step 2, once we hold a token.
 */
export async function probeReachable(baseUrl: string): Promise<void> {
  try {
    await callFirefly<AboutResponse>({ baseUrl, path: '/v1/about' });
    // A 200 without a token is unusual but harmless — still a Firefly API.
  } catch (error) {
    if (error instanceof FireflyRequestError && error.code === 'unauthorised') {
      return;
    }
    throw error;
  }
}

/** Step 2: read the instance details, which requires a working token. */
export async function probeInstance(baseUrl: string, token: string): Promise<InstanceInfo> {
  const about = await callFirefly<AboutResponse>({ baseUrl, token, path: '/v1/about' });

  if (!about?.data?.version) {
    throw new FireflyRequestError(
      'That address responded, but not with Firefly III instance details.',
      'not_firefly',
    );
  }

  return {
    version: about.data.version,
    apiVersion: about.data.api_version,
    phpVersion: about.data.php_version,
    os: about.data.os,
    driver: about.data.driver,
  };
}

export interface RemoteUser {
  id: string;
  email: string;
  role: string | null;
}

/** Step 2: does this token work, and whose account is it? */
export async function probeUser(baseUrl: string, token: string): Promise<RemoteUser> {
  const user = await callFirefly<AboutUserResponse>({
    baseUrl,
    token,
    path: '/v1/about/user',
  });

  return {
    id: user.data.id,
    email: user.data.attributes.email,
    role: user.data.attributes.role ?? null,
  };
}

/** Step 4: the instance's primary currency, used as the display default. */
export async function probePrimaryCurrency(baseUrl: string, token: string): Promise<string | null> {
  try {
    const currency = await callFirefly<CurrencyResponse>({
      baseUrl,
      token,
      path: '/v1/currencies/primary',
    });
    return currency.data.attributes.code;
  } catch {
    // Older instances expose this differently; not worth failing onboarding for.
    return null;
  }
}

export interface AssetAccount {
  id: string;
  name: string;
  type: string;
  currencyCode: string | null;
}

export async function listAssetAccounts(baseUrl: string, token: string): Promise<AssetAccount[]> {
  try {
    const accounts = await callFirefly<{
      data: Array<{
        id: string;
        attributes: { name: string; type: string; currency_code?: string | null };
      }>;
    }>({ baseUrl, token, path: '/v1/accounts?type=asset&limit=100' });

    return accounts.data.map((account) => ({
      id: account.id,
      name: account.attributes.name,
      type: account.attributes.type,
      currencyCode: account.attributes.currency_code ?? null,
    }));
  } catch {
    return [];
  }
}
