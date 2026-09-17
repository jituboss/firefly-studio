import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateTotpSecret,
  normaliseRecoveryCode,
  totp,
  totpUri,
  verifyTotp,
} from '@/lib/totp';

/**
 * RFC 6238 Appendix B publishes test vectors for the SHA-1 variant using the
 * ASCII secret "12345678901234567890". If these pass, the HMAC, the 64-bit
 * counter packing and the dynamic truncation are all correct — which is the
 * whole reason this is hand-written rather than a dependency.
 */
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890', 'ascii'));

describe('TOTP, against the RFC 6238 vectors', () => {
  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
  ])('at t=%i produces %s', (seconds, expected) => {
    expect(totp(RFC_SECRET, seconds * 1000)).toBe(expected);
  });
});

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = Buffer.from([0, 1, 127, 128, 255, 42, 17]);
    expect(base32Decode(base32Encode(bytes)).equals(bytes)).toBe(true);
  });

  it('tolerates the spaces and padding users paste', () => {
    expect(base32Decode('JBSW Y3DP ==').equals(base32Decode('JBSWY3DP'))).toBe(true);
  });
});

describe('verifyTotp', () => {
  const secret = generateTotpSecret();
  const now = 1_700_000_000_000;

  it('accepts the current code', () => {
    expect(verifyTotp(secret, totp(secret, now), now)).toBe(true);
  });

  it('accepts one step of clock drift either way', () => {
    expect(verifyTotp(secret, totp(secret, now - 30_000), now)).toBe(true);
    expect(verifyTotp(secret, totp(secret, now + 30_000), now)).toBe(true);
  });

  it('rejects two steps away, so an old code does not linger', () => {
    expect(verifyTotp(secret, totp(secret, now - 90_000), now)).toBe(false);
  });

  it('rejects anything that is not six digits', () => {
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 34 56 78']) {
      expect(verifyTotp(secret, bad, now)).toBe(false);
    }
  });
});

describe('otpauth URI', () => {
  it('carries the issuer in both places apps read it from', () => {
    const uri = totpUri('JBSWY3DP', 'a@b.com');
    expect(uri.startsWith('otpauth://totp/Firefly%20Studio:a%40b.com?')).toBe(true);
    expect(uri).toContain('issuer=Firefly+Studio');
    expect(uri).toContain('secret=JBSWY3DP');
  });
});

describe('recovery codes', () => {
  it('omits the characters people misread when writing them down', () => {
    const codes = generateRecoveryCodes(40).join('');
    expect(codes).not.toMatch(/[ILOU01]/);
  });

  it('normalises case and dashes so typing them back in is forgiving', () => {
    const [code] = generateRecoveryCodes(1);
    expect(normaliseRecoveryCode(code!.toLowerCase())).toBe(normaliseRecoveryCode(code!));
  });

  it('does not repeat itself', () => {
    const codes = generateRecoveryCodes(50);
    expect(new Set(codes).size).toBe(50);
  });
});
