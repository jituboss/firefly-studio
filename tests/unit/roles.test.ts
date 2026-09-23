import { describe, expect, it } from 'vitest';
import {
  refuseDeletion,
  refuseRoleChange,
  refuseStatusChange,
  shouldBootstrapAdmin,
  type AdminTarget,
} from '@/lib/roles';

const ACTOR = 'actor-1';

function target(overrides: Partial<AdminTarget> = {}): AdminTarget {
  return { id: 'user-2', role: 'user', status: 'active', isDemo: false, ...overrides };
}

describe('refuseRoleChange', () => {
  it('allows promoting an ordinary account', () => {
    expect(refuseRoleChange(target(), 'admin', { actorId: ACTOR, adminCount: 1 })).toBeNull();
  });

  it('is a no-op when the role already matches, even in cases it would otherwise refuse', () => {
    // The last admin "being set to admin" must not trip the last-admin rule:
    // the form posts the row's current state on a double submit.
    const onlyAdmin = target({ id: ACTOR, role: 'admin' });
    expect(refuseRoleChange(onlyAdmin, 'admin', { actorId: ACTOR, adminCount: 1 })).toBeNull();
  });

  it('refuses to promote the demo account', () => {
    const refusal = refuseRoleChange(target({ isDemo: true }), 'admin', {
      actorId: ACTOR,
      adminCount: 1,
    });
    expect(refusal).toMatch(/password is published/);
  });

  it('allows demoting the demo account, which should never have been one', () => {
    expect(
      refuseRoleChange(target({ isDemo: true, role: 'admin' }), 'user', {
        actorId: ACTOR,
        adminCount: 2,
      }),
    ).toBeNull();
  });

  it('refuses to demote the last administrator', () => {
    const refusal = refuseRoleChange(target({ role: 'admin' }), 'user', {
      actorId: ACTOR,
      adminCount: 1,
    });
    expect(refusal).toMatch(/only administrator/);
  });

  it('allows demoting an administrator while another remains', () => {
    expect(
      refuseRoleChange(target({ role: 'admin' }), 'user', { actorId: ACTOR, adminCount: 2 }),
    ).toBeNull();
  });

  it('allows an admin to demote themselves while another remains', () => {
    expect(
      refuseRoleChange(target({ id: ACTOR, role: 'admin' }), 'user', {
        actorId: ACTOR,
        adminCount: 2,
      }),
    ).toBeNull();
  });

  it('refuses anything on a deleted account', () => {
    expect(
      refuseRoleChange(target({ status: 'deleted' }), 'admin', { actorId: ACTOR, adminCount: 1 }),
    ).toMatch(/deleted/);
  });
});

describe('refuseStatusChange', () => {
  it('allows suspending an ordinary account', () => {
    expect(refuseStatusChange(target(), 'suspended', { actorId: ACTOR, adminCount: 1 })).toBeNull();
  });

  it('refuses suspending yourself', () => {
    expect(
      refuseStatusChange(target({ id: ACTOR }), 'suspended', { actorId: ACTOR, adminCount: 2 }),
    ).toMatch(/your own account/);
  });

  it('refuses suspending the last administrator', () => {
    expect(
      refuseStatusChange(target({ role: 'admin' }), 'suspended', { actorId: ACTOR, adminCount: 1 }),
    ).toMatch(/only administrator/);
  });

  it('allows reactivating a suspended account', () => {
    expect(
      refuseStatusChange(target({ status: 'suspended' }), 'active', {
        actorId: ACTOR,
        adminCount: 1,
      }),
    ).toBeNull();
  });

  it('does not refuse reactivating yourself — it is not a lockout', () => {
    expect(
      refuseStatusChange(target({ id: ACTOR, status: 'active' }), 'active', {
        actorId: ACTOR,
        adminCount: 1,
      }),
    ).toBeNull();
  });
});

describe('refuseDeletion', () => {
  it('allows deleting an ordinary account', () => {
    expect(refuseDeletion(target(), { actorId: ACTOR, adminCount: 1 })).toBeNull();
  });

  it('sends you to Settings to delete your own', () => {
    expect(refuseDeletion(target({ id: ACTOR }), { actorId: ACTOR, adminCount: 2 })).toMatch(
      /Settings/,
    );
  });

  it('refuses deleting the last administrator', () => {
    expect(refuseDeletion(target({ role: 'admin' }), { actorId: ACTOR, adminCount: 1 })).toMatch(
      /only administrator/,
    );
  });

  it('refuses an already-deleted account', () => {
    expect(
      refuseDeletion(target({ status: 'deleted' }), { actorId: ACTOR, adminCount: 2 }),
    ).toMatch(/already been deleted/);
  });
});

describe('shouldBootstrapAdmin', () => {
  it('promotes the first account registered', () => {
    expect(shouldBootstrapAdmin({ existingAdmins: 0, isDemo: false })).toBe(true);
  });

  it('does not promote once an admin exists', () => {
    expect(shouldBootstrapAdmin({ existingAdmins: 1, isDemo: false })).toBe(false);
  });

  it('never promotes the demo account, even on an instance with no admin', () => {
    expect(shouldBootstrapAdmin({ existingAdmins: 0, isDemo: true })).toBe(false);
  });
});
