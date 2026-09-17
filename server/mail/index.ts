import 'server-only';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Mail transport.
 *
 * Q4 in the plan is still open (Resend vs SES vs BYO SMTP), so M1 ships the
 * console transport: the message is logged, including the action URL, which is
 * enough to complete sign-up and password reset in development and self-host
 * evaluation. Swapping in a real transport is one function.
 */

export interface Mail {
  to: string;
  subject: string;
  body: string;
  actionUrl?: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  const env = getEnv();

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

  logger.info({ to: mail.to, subject: mail.subject, appUrl: env.APP_URL }, 'Mail dispatched');
}

export function verificationMail(to: string, url: string): Mail {
  return {
    to,
    subject: 'Confirm your Firefly Studio address',
    body: 'Confirm your email address to finish setting up your account. This link expires in 24 hours.',
    actionUrl: url,
  };
}

export function passwordResetMail(to: string, url: string): Mail {
  return {
    to,
    subject: 'Reset your Firefly Studio password',
    body: 'Use this link to choose a new password. It expires in one hour and can be used once.',
    actionUrl: url,
  };
}
