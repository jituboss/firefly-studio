/**
 * E2-08 / E2-09 — presentation helpers for the security page.
 *
 * Pure, and in `lib/` rather than in `server/auth/security.ts`, because the
 * audit filter is a Client Component: importing them from a module marked
 * `server-only` fails the build the moment the client bundle touches it.
 */

/**
 * Human labels for the audit actions this app writes.
 *
 * **The keys must be the strings actually passed to `recordAudit`.** Four of
 * them were not: the map claimed `auth.signed_up`, `auth.sign_in.failed`,
 * `auth.signed_out`, `connection.updated` and `connection.tested`, none of
 * which anything emits, while the events that DO fire — `auth.login`,
 * `auth.signup`, `auth.login.failed` — fell through to the raw key. On the
 * security page that showed one user their own dotted identifiers; on the
 * admin Activity tab it is the whole table. `tests/unit/audit-labels.test.ts`
 * pins the two lists together so the next added action fails a test rather
 * than shipping as `firefly.destroy_failed`.
 */
export const AUDIT_LABELS: Record<string, string> = {
  'auth.signup': 'Account created',
  'auth.signup.duplicate': 'Sign-up attempted on an existing address',
  'auth.login': 'Signed in',
  'auth.signed_in': 'Signed in',
  'auth.login.failed': 'Failed sign-in attempt',
  'auth.login.rate_limited': 'Sign-in blocked — too many attempts',
  'auth.email_verified': 'Email address confirmed',
  'auth.verification_resent': 'Confirmation email resent',
  'auth.password_reset.requested': 'Password reset requested',
  'auth.password_reset.completed': 'Password changed',
  'auth.mfa.enabled': 'Two-factor turned on',
  'auth.mfa.disabled': 'Two-factor turned off',
  'auth.mfa.challenged': 'Two-factor code requested',
  'auth.mfa.failed': 'Two-factor code rejected',
  'auth.mfa.rate_limited': 'Two-factor blocked — too many attempts',
  'auth.session.revoked': 'Session revoked',
  'auth.session.elevated': 'Re-authenticated for a sensitive action',
  'auth.sessions.revoked_others': 'All other sessions revoked',
  'auth.account.deleted': 'Account deleted',
  'connection.created': 'Firefly connection added',
  'connection.deleted': 'Firefly connection removed',
  'connection.switched': 'Switched Firefly connection',
  'connection.token_rotated': 'Firefly token replaced',
  'firefly.destroy': 'Firefly data destroyed',
  'firefly.destroy_failed': 'Firefly data destruction failed',
  'proxy.guarded_call': 'Guarded Firefly endpoint called',
  // Administration. Every one of these is one account acting on another, which
  // is exactly the class of event an operator is scanning this table for.
  'admin.role.bootstrapped': 'Became the first administrator',
  'admin.role.granted': 'Granted the administrator role',
  'admin.role.revoked': 'Revoked the administrator role',
  'admin.user.suspended': 'Suspended an account',
  'admin.user.reactivated': 'Reactivated an account',
  'admin.user.email_verified': 'Confirmed an account\u2019s email address',
  'admin.user.deleted': 'Deleted an account',
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
