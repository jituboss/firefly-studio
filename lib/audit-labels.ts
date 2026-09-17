/**
 * E2-08 / E2-09 — presentation helpers for the security page.
 *
 * Pure, and in `lib/` rather than in `server/auth/security.ts`, because the
 * audit filter is a Client Component: importing them from a module marked
 * `server-only` fails the build the moment the client bundle touches it.
 */

/** Human labels for the audit actions this app writes. */
export const AUDIT_LABELS: Record<string, string> = {
  'auth.signed_up': 'Account created',
  'auth.signed_in': 'Signed in',
  'auth.sign_in.failed': 'Failed sign-in attempt',
  'auth.signed_out': 'Signed out',
  'auth.email_verified': 'Email address confirmed',
  'auth.password_reset.requested': 'Password reset requested',
  'auth.password_reset.completed': 'Password changed',
  'auth.session.revoked': 'Session revoked',
  'auth.sessions.revoked_others': 'All other sessions revoked',
  'auth.account.deleted': 'Account deleted',
  'connection.created': 'Firefly connection added',
  'connection.updated': 'Firefly connection updated',
  'connection.deleted': 'Firefly connection removed',
  'connection.tested': 'Firefly connection tested',
};

/** Falls back to the raw action, so a new event type is still readable. */
export const describeAuditAction = (action: string): string => AUDIT_LABELS[action] ?? action;

/**
 * Turn a user-agent into something someone can recognise their own device by.
 * Deliberately crude: this answers "is that laptop me?", not analytics, and a
 * UA-parsing dependency is a lot of weight for one line of a table.
 *
 * Order matters — Edge and Opera both claim Chrome, and Chrome claims Safari.
 */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\/|Opera/.test(userAgent)
      ? 'Opera'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : /Firefox\//.test(userAgent)
            ? 'Firefox'
            : 'Browser';

  const platform = /iPhone|iPad|iPod/.test(userAgent)
    ? 'iOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Mac OS X|Macintosh/.test(userAgent)
        ? 'macOS'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown OS';

  return `${browser} on ${platform}`;
}
