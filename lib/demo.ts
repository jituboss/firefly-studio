/**
 * E2-26 — demo accounts.
 *
 * A demo account is a session handed to a stranger. Everything it may not do
 * is listed here, in one place, so the answer to "can the demo do X?" is a
 * lookup rather than a search through the actions.
 *
 * The rule is narrow on purpose: a demo of an accounting app that cannot
 * record a transaction demonstrates nothing, so **every ledger write stays
 * allowed**. What is refused is the account itself and the connection behind
 * it — the things that would let one visitor break the demo for the next, or
 * point this server at somewhere it should not go.
 */

export const DEMO_CAPABILITIES = {
  /**
   * Refused. The connection's base URL decides where this server makes
   * outbound requests, and a demo visitor is not someone who gets to choose
   * that: the SSRF guard blocks private networks, but "fetch this arbitrary
   * public host, from your server, on my say-so" is still not a demo feature.
   */
  manageConnections: false,

  /**
   * Refused. `/data/destroy` and `/data/purge` would empty the demo ledger
   * for everyone else currently looking at it.
   */
  dangerZone: false,

  /**
   * Refused. The demo credentials are published; letting a visitor change the
   * password, the email, or enrol two-factor would lock everyone else out of
   * an account that is meant to be shared.
   */
  changeCredentials: false,

  /** Refused, for the same reason. */
  deleteAccount: false,

  /**
   * Refused. Elevation exists to gate destructive operations behind a fresh
   * password check; a published password makes that gate meaningless, so the
   * demo never gets past it at all.
   */
  elevateSession: false,

  /** ALLOWED. This is the demo: transactions, budgets, rules, tags, reports. */
  ledgerWrites: true,

  /** ALLOWED. Theme, density, landing page — per-account and harmless. */
  preferences: true,
} as const;

export type DemoCapability = keyof typeof DEMO_CAPABILITIES;

/** What the user is told when they hit one of the refusals above. */
export const DEMO_REFUSAL: Record<
  Exclude<DemoCapability, 'ledgerWrites' | 'preferences'>,
  string
> = {
  manageConnections:
    'The demo account is fixed to its own Firefly III instance. Create your own account to connect one.',
  dangerZone:
    'The demo cannot delete the ledger — other people are looking at it. It resets on its own schedule.',
  changeCredentials:
    'The demo password is published, so it cannot be changed. Create your own account to manage credentials.',
  deleteAccount:
    'The demo account cannot be deleted — everyone shares it. Create your own account if you want one you can remove.',
  elevateSession:
    'The demo cannot unlock destructive operations. Create your own account to use them.',
};

export function isDemoAllowed(capability: DemoCapability): boolean {
  return DEMO_CAPABILITIES[capability];
}

/**
 * The banner text shown in-app. Says the two things a visitor needs: that the
 * data is not real, and that anything they do here goes away.
 */
export const DEMO_BANNER =
  'You are in the demo. The figures are invented, everyone shares this account, and it resets periodically — so change anything you like.';
