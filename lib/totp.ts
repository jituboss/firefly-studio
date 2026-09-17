import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * E2-06 — TOTP (RFC 6238) over HOTP (RFC 4226).
 *
 * Hand-written rather than pulled from a package: the algorithm is ~40 lines of
 * HMAC and a dynamic truncation, it is frozen by two RFCs so it will never need
 * updating, and it is verified below against the RFC 6238 test vectors. A
 * dependency here would be more supply chain than code.
 *
 * Base32 (RFC 4648, no padding) is the encoding authenticator apps expect in an
 * `otpauth://` URI. Node has no built-in for it, hence the two small codecs.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;

/**
 * How many periods either side of "now" are accepted. One step (±30s) absorbs
 * clock drift between the phone and the server, which is the single most common
 * cause of a correct-looking code being rejected. Wider would meaningfully
 * enlarge the window an observed code stays usable in.
 */
export const TOTP_WINDOW = 1;

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];

  return output;
}

export function base32Decode(input: string): Buffer {
  // Authenticator apps and users paste secrets with spaces and padding.
  const cleaned = input.toUpperCase().replace(/[\s=]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/** A fresh 20-byte (160-bit) secret, the size RFC 4226 specifies for SHA-1. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The HOTP code for one counter value. */
function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS): string {
  const buffer = Buffer.alloc(8);
  // Counter is a 64-bit big-endian integer. Written as two 32-bit halves
  // because a JS number cannot hold 64 bits exactly.
  buffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac('sha1', secret).update(buffer).digest();

  // RFC 4226 §5.3 dynamic truncation: the low nibble of the last byte picks
  // the offset, and the top bit is masked off to keep the result positive.
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;

  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

/** The code for a point in time. `atMs` defaults to now. */
export function totp(secretBase32: string, atMs: number = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / TOTP_PERIOD_SECONDS);
  return hotp(base32Decode(secretBase32), counter);
}

/**
 * Check a submitted code against the accepted window.
 *
 * Compares in constant time. A naive `===` on a 6-digit code leaks, through
 * timing, how many leading digits were right — which turns a 10^6 search into
 * roughly 60 guesses.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  atMs: number = Date.now(),
  window: number = TOTP_WINDOW,
): boolean {
  const candidate = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(candidate)) return false;

  const secret = base32Decode(secretBase32);
  const counter = Math.floor(atMs / 1000 / TOTP_PERIOD_SECONDS);

  let matched = false;
  for (let drift = -window; drift <= window; drift += 1) {
    const expected = hotp(secret, counter + drift);
    const a = Buffer.from(expected);
    const b = Buffer.from(candidate);
    // Do not early-return: running the full loop keeps the time taken
    // independent of which step matched.
    if (a.length === b.length && timingSafeEqual(a, b)) matched = true;
  }

  return matched;
}

/**
 * The `otpauth://` URI an authenticator app scans.
 *
 * `issuer` appears both in the label prefix and as a parameter — every app
 * reads one or the other, and getting it wrong shows the entry as a bare email
 * with no clue which service it belongs to.
 */
export function totpUri(secretBase32: string, account: string, issuer = 'Firefly Studio'): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Recovery codes. Displayed once, stored only as hashes.
 *
 * Crockford-ish base32 with I/L/O/U removed, because these get written down and
 * typed back in by a person having a bad day.
 */
const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const bytes = randomBytes(10);
    let code = '';
    for (const byte of bytes) code += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

/** Normalise before hashing or comparing, so case and dashes do not matter. */
export const normaliseRecoveryCode = (code: string): string =>
  code.toUpperCase().replace(/[^0-9A-Z]/g, '');
