import { describe, expect, it } from 'vitest';
import {
  clientIp,
  formatAccessLine,
  isNoiseRequest,
  isProbeRequest,
  redactUrl,
  responseBytes,
} from '@/lib/access-log';

describe('redactUrl', () => {
  it('leaves a plain path alone', () => {
    expect(redactUrl('/dashboard')).toBe('/dashboard');
  });

  it('keeps ordinary query values readable', () => {
    expect(redactUrl('/bills/34?tab=rules')).toBe('/bills/34?tab=rules');
  });

  it('does not percent-encode the marker, which would be unreadable in a log', () => {
    expect(redactUrl('/x?token=a')).not.toContain('%5B');
  });

  it('redacts the email verification token', () => {
    // This is the case the whole module exists for: the value is a single-use
    // credential that is enough to take over an account.
    expect(redactUrl('/verify-email/confirm?token=abc123')).toBe(
      '/verify-email/confirm?token=REDACTED',
    );
  });

  it('redacts the password reset token', () => {
    expect(redactUrl('/reset-password?token=s3cret')).toContain('REDACTED');
    expect(redactUrl('/reset-password?token=s3cret')).not.toContain('s3cret');
  });

  it('keeps the parameter NAME, which is not the secret', () => {
    // Knowing a request carried a token is how you tell a verification
    // callback from a page view.
    expect(redactUrl('/x?token=abc')).toMatch(/^\/x\?token=/);
  });

  it('matches sensitive names as stems, not exact words', () => {
    const out = redactUrl('/x?access_token=a&csrfToken=b&apiKey=c&otp=d');
    expect(out).not.toContain('=a');
    expect(out).not.toContain('=b');
    expect(out).not.toContain('=c');
    expect(out).not.toContain('=d');
  });

  it('redacts only the sensitive parameter, keeping its neighbours', () => {
    const out = redactUrl('/x?tab=rules&token=abc&range=last30');
    expect(out).toContain('tab=rules');
    expect(out).toContain('range=last30');
    expect(out).not.toContain('abc');
  });

  it('cannot be escaped by an encoded separator inside a value', () => {
    // String surgery on "?" and "&" would let a crafted value split out of
    // its own parameter; parsing properly is what closes that.
    const out = redactUrl('/x?token=a%26b%3Dc&tab=safe');
    expect(out).not.toContain('a%26b');
    expect(out).toContain('tab=safe');
  });

  it('handles a trailing question mark with no query', () => {
    expect(redactUrl('/dashboard?')).toBe('/dashboard');
  });
});

describe('clientIp', () => {
  it('uses the socket address when no proxy is trusted', () => {
    // x-forwarded-for is client-settable; trusting it unconditionally lets
    // anyone write whatever they like into the operator's logs.
    expect(clientIp({ 'x-forwarded-for': '9.9.9.9' }, '10.0.0.5', false)).toBe('10.0.0.5');
  });

  it('uses the first forwarded hop when a proxy is trusted', () => {
    expect(clientIp({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }, '10.0.0.1', true)).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to x-real-ip, then to the socket', () => {
    expect(clientIp({ 'x-real-ip': '203.0.113.9' }, '10.0.0.1', true)).toBe('203.0.113.9');
    expect(clientIp({}, '10.0.0.1', true)).toBe('10.0.0.1');
  });

  it('strips the IPv4-mapped IPv6 prefix Node reports on a dual-stack socket', () => {
    // '::ffff:10.0.0.5' matches nothing an operator would grep for.
    expect(clientIp({}, '::ffff:10.0.0.5', false)).toBe('10.0.0.5');
  });

  it('never returns an empty string', () => {
    expect(clientIp({}, undefined, true)).toBe('-');
  });

  it('reads a repeated header as an array', () => {
    expect(clientIp({ 'x-forwarded-for': ['203.0.113.7', '198.51.100.1'] }, '10.0.0.1', true)).toBe(
      '203.0.113.7',
    );
  });
});

describe('noise filters', () => {
  it('skips build output and the service worker', () => {
    expect(isNoiseRequest('/_next/static/chunks/main.js')).toBe(true);
    expect(isNoiseRequest('/sw.js')).toBe(true);
    expect(isNoiseRequest('/favicon.ico')).toBe(true);
  });

  it('does not skip real pages or API routes', () => {
    expect(isNoiseRequest('/dashboard')).toBe(false);
    expect(isNoiseRequest('/api/ff/accounts')).toBe(false);
    // /_next/data and RSC payloads ARE real navigations and stay logged.
    expect(isNoiseRequest('/bills/34')).toBe(false);
  });

  it('identifies the container runtime probes', () => {
    expect(isProbeRequest('/api/health')).toBe(true);
    expect(isProbeRequest('/api/ready')).toBe(true);
    expect(isProbeRequest('/api/cron/health')).toBe(false);
  });
});

describe('formatAccessLine', () => {
  it('reads like a combined log line', () => {
    expect(
      formatAccessLine({
        ip: '203.0.113.7',
        method: 'GET',
        url: '/dashboard',
        status: 200,
        bytes: 4096,
        durationMs: 37,
        userAgent: 'Mozilla/5.0',
      }),
    ).toBe('203.0.113.7 "GET /dashboard" 200 4096 37ms "Mozilla/5.0"');
  });
});

describe('responseBytes', () => {
  it('passes a numeric content-length through', () => {
    expect(responseBytes(4096)).toBe(4096);
    expect(responseBytes('4096')).toBe('4096');
  });

  it('writes "-" for a streamed response with no length', () => {
    // A fabricated 0 would read as "we sent nothing", which is wrong: an RSC
    // payload is chunked and has no content-length at all.
    expect(responseBytes(undefined)).toBe('-');
  });
});

describe('redactUrl on an absolute URL', () => {
  it('redacts a token in a full referer URL', () => {
    // The browser sends the whole current URL as the referer, so a page opened
    // at /reset-password?token=… leaks it on every subresource request.
    const out = redactUrl('https://fs.example.com/reset-password?token=abc123');
    expect(out).not.toContain('abc123');
    expect(out).toContain('https://fs.example.com/reset-password');
  });
});
