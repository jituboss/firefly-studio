import { describe, expect, it } from 'vitest';
import { MIN_PASSWORD_LENGTH, STRENGTH_LABELS, scorePassword } from '@/lib/password-strength';
import { AUDIT_LABELS, describeAuditAction, describeDevice } from '@/lib/audit-labels';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';
import { compressImage, JPEG_QUALITY, MAX_EDGE } from '@/lib/image-compress';

describe('scorePassword', () => {
  it('blocks anything under the minimum length', () => {
    const { problems, score } = scorePassword('short');
    expect(problems[0]).toContain(String(MIN_PASSWORD_LENGTH));
    expect(score).toBeLessThanOrEqual(1);
  });

  it('blocks a commonly used password however long it is', () => {
    expect(scorePassword('fireflystudio').problems).toContain('That is a commonly used password.');
  });

  it('blocks a single repeated character', () => {
    // Long enough to pass the length floor, worthless as a password.
    expect(scorePassword('aaaaaaaaaaaaaaaa').problems).toContain(
      'Avoid repeating a single character.',
    );
  });

  it('never lets a password with a blocking problem present as strong', () => {
    // The meter and the server share this function, so a high score here would
    // show three green bars for something the action then rejects.
    expect(scorePassword('aaaaaaaaaaaaaaaa').score).toBeLessThanOrEqual(1);
  });

  it('rewards length, mixed case and symbols', () => {
    expect(scorePassword('abcdefghijkl').score).toBeLessThan(scorePassword('Abcdefghijkl1!').score);
    expect(scorePassword('zk7Qe!v2Lm9x4TbW#pQ1').score).toBe(4);
  });

  it('accepts a long clean password with no problems', () => {
    expect(scorePassword('correct horse battery staple').problems).toEqual([]);
  });

  it('has a label for every score it can produce', () => {
    for (const candidate of [
      '',
      'short',
      'abcdefghijkl',
      'Abcdefghijkl1!',
      'zk7Qe!v2Lm9x4TbW#pQ1',
    ]) {
      expect(STRENGTH_LABELS[scorePassword(candidate).score]).toBeTypeOf('string');
    }
  });
});

describe('describeAuditAction', () => {
  it('turns a recorded action into something a person reads', () => {
    expect(describeAuditAction('auth.sign_in.failed')).toBe('Failed sign-in attempt');
  });

  it('falls back to the raw action, so a new event type is still legible', () => {
    expect(describeAuditAction('auth.something.brand_new')).toBe('auth.something.brand_new');
  });

  it('labels every action it claims to know', () => {
    for (const [action, label] of Object.entries(AUDIT_LABELS)) {
      expect(label).not.toBe(action);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('describeDevice', () => {
  // Order matters here: Edge and Opera both claim Chrome, and Chrome claims
  // Safari, so a naive check reports every browser as Chrome or Safari.
  it.each([
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 Edg/120',
      'Edge on Windows',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 OPR/106',
      'Opera on macOS',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Chrome on macOS',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/604.1',
      'Safari on iOS',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0', 'Firefox on Linux'],
    [
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
      'Chrome on Android',
    ],
  ])('reads %s as the right browser and platform', (agent, expected) => {
    expect(describeDevice(agent)).toBe(expected);
  });

  it('says so plainly when there is no user agent to read', () => {
    expect(describeDevice(null)).toBe('Unknown device');
  });

  it('degrades gracefully on something it does not recognise', () => {
    expect(describeDevice('curl/8.4.0')).toBe('Browser on Unknown OS');
  });
});

describe('SESSION_COOKIE_NAME', () => {
  it('is the name middleware and the session layer both rely on', () => {
    // It lives in its own module so the edge middleware does not pull node:crypto.
    expect(SESSION_COOKIE_NAME).toBe('fs_session');
  });
});

describe('compressImage', () => {
  const file = (name: string, type: string, bytes: number) =>
    new File([new Uint8Array(bytes)], name, { type });

  it('leaves a non-photographic file alone', async () => {
    // Re-encoding a PDF or a GIF as JPEG would corrupt or de-animate it.
    const pdf = file('receipt.pdf', 'application/pdf', 900_000);
    await expect(compressImage(pdf)).resolves.toMatchObject({ file: pdf, compressed: false });
  });

  it('leaves a small image alone — there is nothing worth saving', async () => {
    const small = file('thumb.jpg', 'image/jpeg', 1_000);
    await expect(compressImage(small)).resolves.toMatchObject({ compressed: false });
  });

  it('falls back to the original when the browser APIs are missing', async () => {
    // Node has no createImageBitmap/OffscreenCanvas; uploading the original is
    // always better than failing the upload.
    const big = file('photo.jpg', 'image/jpeg', 4_000_000);
    const result = await compressImage(big);
    expect(result).toMatchObject({ file: big, compressed: false, originalBytes: 4_000_000 });
  });

  it('exposes the settings it compresses to', () => {
    expect(MAX_EDGE).toBe(1600);
    expect(JPEG_QUALITY).toBeGreaterThan(0);
    expect(JPEG_QUALITY).toBeLessThanOrEqual(1);
  });
});
