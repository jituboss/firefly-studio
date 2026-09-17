import 'server-only';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * E2-28 — mail transport.
 *
 * Three transports, chosen by `MAIL_TRANSPORT`:
 *
 *   console  the M1 behaviour — the message, including its action URL, is
 *            printed to the server log. This stays the DEFAULT on purpose:
 *            someone evaluating a self-hosted finance app should be able to
 *            complete sign-up without first owning a mail provider.
 *   smtp     any SMTP server, which is what self-hosters actually have.
 *   resend   Resend's HTTP API, over plain fetch — no SDK.
 *
 * `lib/env.ts` refuses a transport that is selected but not configured, so a
 * missing SMTP host fails at boot rather than silently swallowing every
 * verification email in production.
 *
 * Plan §11 Q4 asked "Resend vs SES vs BYO SMTP". The answer is: not our call to
 * make for a self-hosted app. SMTP covers SES too (it speaks SMTP), so these
 * two cover the field without picking a winner.
 */

export interface Mail {
  to: string;
  subject: string;
  body: string;
  actionUrl?: string;
  /** Label for the action button. Defaults to the subject. */
  actionLabel?: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  const env = getEnv();

  try {
    switch (env.MAIL_TRANSPORT) {
      case 'smtp':
        await sendViaSmtp(mail);
        break;
      case 'resend':
        await sendViaResend(mail);
        break;
      default:
        sendViaConsole(mail);
    }
  } catch (error) {
    // A failed send must not take down sign-up: the user has an account, they
    // just have no link yet, and "resend" is a button. Log loudly and move on.
    logger.error(
      { to: mail.to, subject: mail.subject, transport: env.MAIL_TRANSPORT, err: error },
      'Mail delivery failed',
    );
    throw error;
  }

  logger.info(
    { to: mail.to, subject: mail.subject, transport: env.MAIL_TRANSPORT },
    'Mail dispatched',
  );
}

// --- transports --------------------------------------------------------------

function sendViaConsole(mail: Mail): void {
  console.log(
    [
      '',
      '──────────────────────────────────────────────────────────────',
      ` MAIL → ${mail.to}`,
      ` Subject: ${mail.subject}`,
      '',
      mail.body,
      mail.actionUrl ? `\n ${mail.actionUrl}` : '',
      '──────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );
}

async function sendViaSmtp(mail: Mail): Promise<void> {
  const env = getEnv();
  // Imported lazily so the console and Resend transports never pull nodemailer
  // (and its transitive dependencies) into the server bundle.
  const { createTransport } = await import('nodemailer');

  const transport = env.SMTP_URL
    ? createTransport(env.SMTP_URL)
    : createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        // Port 465 is implicit TLS; 587 and 25 start plaintext and STARTTLS.
        // Defaulting off 465 rather than hardcoding true is what makes a
        // submission-port server work without extra configuration.
        secure: env.SMTP_SECURE ?? (env.SMTP_PORT ?? 587) === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? '' } : undefined,
      });

  await transport.sendMail({
    from: env.MAIL_FROM,
    replyTo: env.MAIL_REPLY_TO,
    to: mail.to,
    subject: mail.subject,
    text: textBody(mail),
    html: htmlBody(mail),
  });
}

async function sendViaResend(mail: Mail): Promise<void> {
  const env = getEnv();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      reply_to: env.MAIL_REPLY_TO,
      to: [mail.to],
      subject: mail.subject,
      text: textBody(mail),
      html: htmlBody(mail),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend rejected the message (${response.status}): ${detail.slice(0, 200)}`);
  }
}

// --- rendering ---------------------------------------------------------------

const textBody = (mail: Mail): string =>
  mail.actionUrl ? `${mail.body}\n\n${mail.actionUrl}\n` : `${mail.body}\n`;

/** Escape before interpolating into the HTML body — the address and the URL
 *  both originate from user input. */
const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function htmlBody(mail: Mail): string {
  const label = escapeHtml(mail.actionLabel ?? mail.subject);
  const url = mail.actionUrl ? escapeHtml(mail.actionUrl) : '';

  // Table-based and inline-styled on purpose: email clients have no useful CSS
  // support, and a <div> layout with a stylesheet renders as a wall of text in
  // Outlook.
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14161a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:12px;padding:32px" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:18px;font-weight:600;padding-bottom:16px">Firefly Studio</td></tr>
      <tr><td style="font-size:15px;line-height:1.55;padding-bottom:24px">${escapeHtml(mail.body)}</td></tr>
      ${
        url
          ? `<tr><td style="padding-bottom:24px">
              <a href="${url}" style="display:inline-block;background:#2f6feb;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:15px;font-weight:500">${label}</a>
            </td></tr>
            <tr><td style="font-size:12px;color:#6b7280;line-height:1.5">
              If the button does not work, paste this into your browser:<br>
              <span style="word-break:break-all">${url}</span>
            </td></tr>`
          : ''
      }
    </table>
  </td></tr></table>
</body></html>`;
}

// --- messages ----------------------------------------------------------------

export function verificationMail(to: string, url: string): Mail {
  return {
    to,
    subject: 'Confirm your Firefly Studio address',
    body: 'Confirm your email address to finish setting up your account. This link expires in 24 hours.',
    actionUrl: url,
    actionLabel: 'Confirm my address',
  };
}

export function passwordResetMail(to: string, url: string): Mail {
  return {
    to,
    subject: 'Reset your Firefly Studio password',
    body: 'Use this link to choose a new password. It expires in one hour and can be used once.',
    actionUrl: url,
    actionLabel: 'Choose a new password',
  };
}
