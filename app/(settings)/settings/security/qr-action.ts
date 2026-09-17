'use server';

import QRCode from 'qrcode';
import { requireSession } from '@/server/auth/session';

/**
 * E2-06 — render an `otpauth://` URI as an SVG data URI.
 *
 * Server-side so the QR library never enters the client bundle, and so the
 * secret is not passed to third-party code in the browser. Session-gated
 * because this is a Server Action and therefore a public endpoint: without the
 * check, anyone could render arbitrary strings as QR codes through this app.
 */
export async function renderQrAction(uri: string): Promise<string> {
  await requireSession();

  if (!uri.startsWith('otpauth://totp/')) {
    throw new Error('Refusing to render a non-TOTP payload.');
  }

  const svg = await QRCode.toString(uri, {
    type: 'svg',
    margin: 1,
    width: 200,
    errorCorrectionLevel: 'M',
  });

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
