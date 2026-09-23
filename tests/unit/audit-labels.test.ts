import { describe, expect, it } from 'vitest';
import { AUDIT_LABELS, describeAuditAction } from '@/lib/audit-labels';

/**
 * Every action string `recordAudit` is called with, anywhere in the app.
 *
 * Kept by hand, and that is the point: adding an audit event means adding a
 * line here, and this file then fails until the label map has one too. The
 * alternative — scanning the source at test time — passes happily for an
 * action built from a ternary, which is how four of the admin events are
 * written.
 *
 * The map used to disagree with reality in both directions: it labelled three
 * events nothing emits, and left eleven that do to render as raw dotted keys.
 * That was invisible while the only surface was one user's own security page
 * and unmissable the moment an admin Activity tab showed the whole instance's.
 */
const EMITTED = [
  'auth.signup',
  'auth.signup.duplicate',
  'auth.login',
  'auth.signed_in',
  'auth.login.failed',
  'auth.login.rate_limited',
  'auth.email_verified',
  'auth.verification_resent',
  'auth.password_reset.requested',
  'auth.password_reset.completed',
  'auth.mfa.enabled',
  'auth.mfa.disabled',
  'auth.mfa.challenged',
  'auth.mfa.failed',
  'auth.mfa.rate_limited',
  'auth.session.revoked',
  'auth.session.elevated',
  'auth.sessions.revoked_others',
  'auth.account.deleted',
  'connection.created',
  'connection.deleted',
  'connection.switched',
  'connection.token_rotated',
  'firefly.destroy',
  'firefly.destroy_failed',
  'proxy.guarded_call',
  'admin.role.bootstrapped',
  'admin.role.granted',
  'admin.role.revoked',
  'admin.user.suspended',
  'admin.user.reactivated',
  'admin.user.email_verified',
  'admin.user.deleted',
] as const;

describe('AUDIT_LABELS', () => {
  it.each(EMITTED)('labels %s', (action) => {
    expect(AUDIT_LABELS[action], `no label for ${action}`).toBeTruthy();
    // A label that is just the key back again is the failure this catches.
    expect(describeAuditAction(action)).not.toBe(action);
  });

  it('labels nothing that is never emitted', () => {
    const emitted = new Set<string>(EMITTED);
    const orphans = Object.keys(AUDIT_LABELS).filter((key) => !emitted.has(key));
    expect(orphans, 'labels for actions nothing writes').toEqual([]);
  });

  it('falls back to the raw action for something genuinely unknown', () => {
    expect(describeAuditAction('something.new')).toBe('something.new');
  });
});
