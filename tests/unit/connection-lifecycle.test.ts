import { describe, expect, it } from 'vitest';
import { deleteConfirmMessage, shouldBounceToDashboard } from '@/lib/connection-lifecycle';

describe('shouldBounceToDashboard', () => {
  it('bounces only when onboarding is done, a connection exists, and not adding', () => {
    expect(shouldBounceToDashboard(true, true, false)).toBe(true);
  });

  it('does not bounce a finished user who has zero connections', () => {
    // This is the redirect-loop case: the app layout sends a zero-connection
    // user to /onboarding regardless of the stored flag, so bouncing them
    // straight back to /dashboard here would loop forever.
    expect(shouldBounceToDashboard(true, false, false)).toBe(false);
  });

  it('does not bounce a user who has not completed onboarding', () => {
    expect(shouldBounceToDashboard(false, true, false)).toBe(false);
    expect(shouldBounceToDashboard(false, false, false)).toBe(false);
  });

  it('does not bounce while deliberately adding another instance', () => {
    expect(shouldBounceToDashboard(true, true, true)).toBe(false);
    expect(shouldBounceToDashboard(true, false, true)).toBe(false);
  });

  it('does not bounce when neither onboarding is done nor a connection exists, even if adding', () => {
    expect(shouldBounceToDashboard(false, false, true)).toBe(false);
    expect(shouldBounceToDashboard(false, true, true)).toBe(false);
  });
});

describe('deleteConfirmMessage', () => {
  it('includes the label for a non-only connection, without a reconnect notice', () => {
    const message = deleteConfirmMessage('My Firefly III', false);
    expect(message).toContain('My Firefly III');
    expect(message).not.toContain('reconnecting');
  });

  it('includes the label and a reconnect notice for the only connection', () => {
    const message = deleteConfirmMessage('My Firefly III', true);
    expect(message).toContain('My Firefly III');
    expect(message).toContain('reconnecting');
  });
});
