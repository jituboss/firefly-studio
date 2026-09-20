import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * E23-01 — the SSRF guard's test suite.
 *
 * This is the highest-consequence code in the app: the user supplies a URL and
 * the server makes requests to it. Each case below is an address a hostile user
 * would actually try, and the DNS lookup is mocked so a name can be made to
 * resolve anywhere — which is exactly what an attacker does.
 */

const lookup = vi.hoisted(() => vi.fn());
const env = vi.hoisted(() => ({
  FIREFLY_ALLOW_PRIVATE_NETWORKS: false,
  FIREFLY_ALLOW_INSECURE_HTTP: false,
}));

vi.mock('node:dns/promises', () => ({ lookup }));
vi.mock('@/lib/env', () => ({ getEnv: () => env }));

const { normaliseBaseUrl, resolveAndCheck, UrlGuardError } =
  await import('@/server/firefly/url-guard');

/** Resolve every hostname to one address, the way a rebinding attacker would. */
function resolvesTo(address: string, family = 4) {
  lookup.mockResolvedValue({ address, family });
}

beforeEach(() => {
  env.FIREFLY_ALLOW_PRIVATE_NETWORKS = false;
  env.FIREFLY_ALLOW_INSECURE_HTTP = true;
  lookup.mockReset();
});

afterEach(() => vi.clearAllMocks());

describe('normaliseBaseUrl', () => {
  it('adds https when the scheme is missing', () => {
    expect(normaliseBaseUrl('firefly.example.com')).toBe('https://firefly.example.com');
  });

  it('strips a trailing slash and an /api/v1 suffix copied from the docs', () => {
    expect(normaliseBaseUrl('https://f.example.com/api/v1/')).toBe('https://f.example.com');
    expect(normaliseBaseUrl('https://f.example.com/firefly/')).toBe(
      'https://f.example.com/firefly',
    );
  });

  // https://user:pass@evil.test would send those credentials on every proxied
  // call, and some servers log them.
  it('refuses credentials embedded in the URL', () => {
    expect(() => normaliseBaseUrl('https://user:pass@f.example.com')).toThrow(UrlGuardError);
  });

  it('refuses a non-http scheme', () => {
    for (const url of ['file:///etc/passwd', 'gopher://x.test', 'ftp://x.test']) {
      expect(() => normaliseBaseUrl(url)).toThrow(UrlGuardError);
    }
  });

  it('refuses http when the deployment has not opted in', () => {
    env.FIREFLY_ALLOW_INSECURE_HTTP = false;
    expect(() => normaliseBaseUrl('http://f.example.com')).toThrow(/https/i);
  });

  it('refuses an empty address', () => {
    expect(() => normaliseBaseUrl('   ')).toThrow(UrlGuardError);
  });
});

describe('resolveAndCheck — addresses that must always be refused', () => {
  // The single most valuable SSRF target: AWS, GCP, Azure and DigitalOcean all
  // serve instance credentials from 169.254.169.254.
  it('refuses cloud instance metadata, even with private networks allowed', async () => {
    env.FIREFLY_ALLOW_PRIVATE_NETWORKS = true;
    resolvesTo('169.254.169.254');
    await expect(resolveAndCheck('https://metadata.example.com')).rejects.toThrow(/not permitted/i);
  });

  it('refuses the IPv6 metadata alias', async () => {
    env.FIREFLY_ALLOW_PRIVATE_NETWORKS = true;
    resolvesTo('fd00:ec2::254', 6);
    await expect(resolveAndCheck('https://metadata.example.com')).rejects.toThrow(/not permitted/i);
  });

  it('refuses 0.0.0.0 and multicast', async () => {
    env.FIREFLY_ALLOW_PRIVATE_NETWORKS = true;
    for (const address of ['0.0.0.0', '224.0.0.1', '255.255.255.255']) {
      resolvesTo(address);
      await expect(resolveAndCheck('https://x.example.com')).rejects.toThrow(/not permitted/i);
    }
  });

  it('refuses IPv6 link-local and unique-local', async () => {
    env.FIREFLY_ALLOW_PRIVATE_NETWORKS = true;
    for (const address of ['fe80::1', 'fc00::1', 'fd12:3456::1']) {
      resolvesTo(address, 6);
      await expect(resolveAndCheck('https://x.example.com')).rejects.toThrow(/not permitted/i);
    }
  });
});

describe('resolveAndCheck — private ranges', () => {
  const privateAddresses = ['10.0.0.5', '127.0.0.1', '172.16.0.1', '192.168.1.1', '100.64.0.1'];

  it('refuses every private range by default', async () => {
    for (const address of privateAddresses) {
      resolvesTo(address);
      await expect(resolveAndCheck('https://x.example.com')).rejects.toThrow(/private network/i);
    }
  });

  it('allows them only when the deployment opts in', async () => {
    env.FIREFLY_ALLOW_PRIVATE_NETWORKS = true;
    for (const address of privateAddresses) {
      resolvesTo(address);
      await expect(resolveAndCheck('https://x.example.com')).resolves.toMatchObject({ address });
    }
  });

  it('still refuses 172.32.x, which is public and outside the private block', async () => {
    resolvesTo('172.32.0.1');
    await expect(resolveAndCheck('https://x.example.com')).resolves.toMatchObject({
      address: '172.32.0.1',
    });
  });
});

describe('resolveAndCheck — how the answer is used', () => {
  // The rebinding defence: resolve once, hand the caller the address it
  // validated. A second lookup at connect time could return a different,
  // hostile answer — so there must not be one.
  it('returns the resolved address so the caller never re-resolves', async () => {
    resolvesTo('93.184.216.34');
    const target = await resolveAndCheck('https://firefly.example.com');
    expect(target).toEqual({
      baseUrl: 'https://firefly.example.com',
      host: 'firefly.example.com',
      address: '93.184.216.34',
      family: 4,
    });
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('checks an IP literal without any DNS lookup at all', async () => {
    await expect(resolveAndCheck('https://127.0.0.1')).rejects.toThrow(/private network/i);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('checks a bracketed IPv6 literal', async () => {
    await expect(resolveAndCheck('https://[::1]')).rejects.toThrow(/private network/i);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('reports a resolution failure as such, not as a blocked address', async () => {
    lookup.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(resolveAndCheck('https://nope.example.com')).rejects.toMatchObject({
      code: 'dns_failure',
    });
  });
});
