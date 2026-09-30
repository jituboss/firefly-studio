/**
 * The phone's bottom navigation: which destinations its two configurable
 * slots hold.
 *
 * The bar is five slots — Home, [slot], Add, [slot], More — and only the two
 * bracketed ones are the user's to choose. Home, Add and More are fixed: Home
 * because it is where the app opens, Add because recording a transaction is
 * the most frequent thing done on a phone, and More because it is the only way
 * to everything else.
 *
 * Stored as JSON on `user_preferences.mobile_nav`, so everything read back is
 * untrusted and goes through `parseMobileNav`. Pure, so the bar, the editor
 * and the Server Action agree on one list.
 */

export const NAV_DESTINATIONS = [
  { id: 'transactions', label: 'Transactions', href: '/transactions' },
  { id: 'budgets', label: 'Budgets', href: '/budgets' },
  { id: 'reports', label: 'Reports', href: '/reports' },
  { id: 'accounts', label: 'Accounts', href: '/accounts' },
  { id: 'categories', label: 'Categories', href: '/categories' },
  { id: 'bills', label: 'Subscriptions', href: '/bills' },
  { id: 'piggy-banks', label: 'Piggy banks', href: '/piggy-banks' },
] as const;

export type NavDestinationId = (typeof NAV_DESTINATIONS)[number]['id'];

export interface MobileNavSlots {
  second: NavDestinationId;
  fourth: NavDestinationId;
}

export const DEFAULT_MOBILE_NAV: MobileNavSlots = { second: 'transactions', fourth: 'budgets' };

export function isNavDestination(value: unknown): value is NavDestinationId {
  return NAV_DESTINATIONS.some((entry) => entry.id === value);
}

export function destination(id: NavDestinationId) {
  return NAV_DESTINATIONS.find((entry) => entry.id === id) ?? NAV_DESTINATIONS[0];
}

/**
 * Untrusted JSON → two valid, DIFFERENT slots. A slot that is missing or
 * unknown takes its default; if both end up the same, the fourth moves to the
 * first destination not already in the bar, so the bar never shows one tab
 * twice.
 */
export function parseMobileNav(raw: unknown): MobileNavSlots {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const second = isNavDestination(record.second) ? record.second : DEFAULT_MOBILE_NAV.second;
  let fourth = isNavDestination(record.fourth) ? record.fourth : DEFAULT_MOBILE_NAV.fourth;
  if (fourth === second) {
    fourth = NAV_DESTINATIONS.find((entry) => entry.id !== second)!.id;
  }
  return { second, fourth };
}

/**
 * Is `href` the current section? Home matches only itself; everything else
 * matches its own subtree, so /transactions/123 keeps Transactions lit.
 */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}
