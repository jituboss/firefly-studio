/**
 * Who may do what to whom, on the admin page.
 *
 * Pure and in `lib/` for two reasons. The row actions are a Client Component —
 * a button that offers to demote someone has to know it will be refused before
 * it is pressed, or the UI is inviting an error — and every rule here is a
 * guard whose failure is expensive enough to want tests: the last-admin rule is
 * the difference between an instance with an administrator and one that has to
 * be recovered from a shell.
 *
 * `server/auth/roles.ts` is the enforcement side. Both call these; the server
 * is the one that decides.
 */

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface AdminTarget {
  id: string;
  role: UserRole;
  status: UserStatus;
  /**
   * A demo account's credentials are published. Promoting one hands every
   * visitor every other account on the instance, so it is refused outright
   * rather than warned about.
   */
  isDemo: boolean;
}

export interface AdminContext {
  /** The id of the admin performing the action. */
  actorId: string;
  /** How many active admins the instance currently has, including the actor. */
  adminCount: number;
}

/** `null` when allowed; otherwise the reason, phrased for the person reading it. */
export type Refusal = string | null;

export function refuseRoleChange(
  target: AdminTarget,
  next: UserRole,
  context: AdminContext,
): Refusal {
  if (target.status === 'deleted') return 'That account has been deleted.';
  if (target.role === next) return null;

  if (next === 'admin' && target.isDemo) {
    return 'The demo account cannot be an administrator — its password is published.';
  }

  /*
   * The rule that matters. Demoting the last admin leaves an instance whose
   * admin page nobody can open, recoverable only by someone with shell access
   * to the database — which on a self-hosted box is usually the same person who
   * just locked themselves out, and on a hosted one is nobody.
   *
   * Counted rather than compared against the actor: an admin demoting a
   * DIFFERENT admin is equally capable of removing the last one, if the actor
   * has already been demoted in another tab.
   */
  if (next === 'user' && target.role === 'admin' && context.adminCount <= 1) {
    return 'This is the only administrator. Grant the role to someone else first.';
  }

  return null;
}

export function refuseStatusChange(
  target: AdminTarget,
  next: Exclude<UserStatus, 'deleted'>,
  context: AdminContext,
): Refusal {
  if (target.status === 'deleted') return 'That account has been deleted.';
  if (target.status === next) return null;

  // Suspending yourself ends your own session on the next request, which reads
  // as the app breaking rather than as the thing you just asked for.
  if (target.id === context.actorId) {
    return 'You cannot suspend your own account.';
  }

  if (next === 'suspended' && target.role === 'admin' && context.adminCount <= 1) {
    return 'This is the only administrator. Grant the role to someone else first.';
  }

  return null;
}

export function refuseDeletion(target: AdminTarget, context: AdminContext): Refusal {
  if (target.status === 'deleted') return 'That account has already been deleted.';

  /*
   * Self-deletion exists, and it is on the security page behind a password and
   * a typed confirmation. Routing it through here would be a second path to the
   * same irreversible thing with a weaker gate on it.
   */
  if (target.id === context.actorId) {
    return 'Delete your own account from Settings → Security.';
  }

  if (target.role === 'admin' && context.adminCount <= 1) {
    return 'This is the only administrator. Grant the role to someone else first.';
  }

  return null;
}

/**
 * Should this account be promoted on sign-up?
 *
 * The first person to register owns the instance they just stood up. The demo
 * account never qualifies, for the reason in `refuseRoleChange`.
 *
 * The database enforces this too — see `bootstrapFirstAdmin`, which does the
 * check and the write in one statement, because two people signing up at the
 * same moment would both read "no admins yet" here.
 */
export function shouldBootstrapAdmin(options: {
  existingAdmins: number;
  isDemo: boolean;
}): boolean {
  return options.existingAdmins === 0 && !options.isDemo;
}
