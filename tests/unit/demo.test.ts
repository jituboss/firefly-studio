import { describe, expect, it } from 'vitest';
import { DEMO_BANNER, DEMO_CAPABILITIES, DEMO_REFUSAL, isDemoAllowed } from '@/lib/demo';

/**
 * E2-26 — the demo policy.
 *
 * These matter more than most: the demo password is published, so every entry
 * in this table is the only thing standing between a stranger and the account.
 * A capability flipped to `true` by a careless edit would not fail anything
 * else in the suite.
 */
describe('demo capabilities', () => {
  it('refuses everything that a published password would put at risk', () => {
    expect(isDemoAllowed('manageConnections')).toBe(false);
    expect(isDemoAllowed('dangerZone')).toBe(false);
    expect(isDemoAllowed('changeCredentials')).toBe(false);
    expect(isDemoAllowed('deleteAccount')).toBe(false);
    expect(isDemoAllowed('elevateSession')).toBe(false);
  });

  // The whole point of the demo. A finance app that cannot record a
  // transaction demonstrates nothing, and the ledger behind it is disposable.
  it('allows the ledger writes that make it a demo at all', () => {
    expect(isDemoAllowed('ledgerWrites')).toBe(true);
    expect(isDemoAllowed('preferences')).toBe(true);
  });

  it('has a refusal message for every capability it refuses', () => {
    for (const [capability, allowed] of Object.entries(DEMO_CAPABILITIES)) {
      if (allowed) continue;
      const message = DEMO_REFUSAL[capability as keyof typeof DEMO_REFUSAL];
      expect(message, capability).toBeTruthy();
      // Long enough to say why, not just "not allowed".
      expect(message.length, capability).toBeGreaterThan(30);
    }
  });

  it('points somewhere useful rather than just saying no', () => {
    // Four of the five suggest making a real account; the danger-zone one
    // explains the reset instead, which is the useful thing there.
    const suggestions = Object.values(DEMO_REFUSAL).filter((m) => /own account|resets/.test(m));
    expect(suggestions).toHaveLength(Object.keys(DEMO_REFUSAL).length);
  });

  it('warns that the data is invented and shared', () => {
    expect(DEMO_BANNER).toMatch(/invented/i);
    expect(DEMO_BANNER).toMatch(/shares|shared/i);
    expect(DEMO_BANNER).toMatch(/resets/i);
  });
});
