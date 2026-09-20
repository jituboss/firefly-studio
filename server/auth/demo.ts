import 'server-only';
import { DEMO_REFUSAL, isDemoAllowed, type DemoCapability } from '@/lib/demo';
import { getSession } from '@/server/auth/session';

/**
 * E2-26 — the server-side half of the demo policy.
 *
 * `lib/demo.ts` says what is refused; this refuses it. Two shapes, because the
 * call sites have two: actions that return `{ error }` into a form, and
 * actions that return `void` and must simply stop.
 */

/** Is the current session a demo account? */
export async function isDemoSession(): Promise<boolean> {
  const session = await getSession();
  return session?.user.isDemo === true;
}

/**
 * Returns the refusal message when the demo may not do this, or null when it
 * may — including when the caller is not a demo account at all.
 */
export async function demoRefusal(
  capability: Exclude<DemoCapability, 'ledgerWrites' | 'preferences'>,
): Promise<string | null> {
  if (isDemoAllowed(capability)) return null;
  if (!(await isDemoSession())) return null;
  return DEMO_REFUSAL[capability];
}

/**
 * For actions with no error channel. Throwing lands in the route error
 * boundary, which is worse UX than a form message but better than silently
 * doing the thing — and these are the paths a demo visitor has no button for
 * anyway, so reaching one means the request was hand-made.
 */
export async function assertDemoAllowed(
  capability: Exclude<DemoCapability, 'ledgerWrites' | 'preferences'>,
): Promise<void> {
  const refusal = await demoRefusal(capability);
  if (refusal) throw new Error(refusal);
}

/**
 * The published demo credentials, when a demo is configured for this
 * deployment. Returning them to the landing page is not a leak: they are in
 * the README, and `lib/demo.ts` is what makes publishing them safe.
 */
export function demoCredentials(): { email: string; password: string } | null {
  const email = process.env.DEMO_EMAIL?.trim();
  const password = process.env.DEMO_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}
