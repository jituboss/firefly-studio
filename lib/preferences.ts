/**
 * E18-02 — the app's own preferences: the option lists, and the parsing that
 * turns a form submission into something safe to store.
 *
 * Pure, so the form and the Server Action validate against one definition
 * rather than two that drift. Every option here drives something — a
 * preference that is stored but changes nothing is a control that lies about
 * what it does, so it does not belong in this list.
 */

export const THEMES = ['system', 'light', 'dark'] as const;
export const DENSITIES = ['comfortable', 'compact'] as const;

export type Theme = (typeof THEMES)[number];
export type Density = (typeof DENSITIES)[number];

/**
 * The locale stored on `users.locale`, labelled by the dates it produces
 * rather than by its code — nobody picks "de-DE", they pick the one that
 * writes the day before the month.
 *
 * Scope, stated exactly: this drives the `Intl` date formatting that the pages
 * and charts already pass a locale into. It does NOT yet reach `<Amount>`,
 * because none of its ~108 call sites pass a locale and it renders inside
 * Server Components, where a context provider cannot reach it. Threading it is
 * E21-08. The label below promises only what it delivers.
 */
export const REGIONAL_FORMATS = [
  { value: 'en-US', label: 'Mar 15, 2026 — month first (US)' },
  { value: 'en-GB', label: '15 Mar 2026 — day first (UK)' },
  { value: 'de-DE', label: '15.03.2026 — German' },
  { value: 'fr-FR', label: '15 mars 2026 — French' },
  { value: 'en-IN', label: '15 Mar 2026 — Indian English' },
] as const;

/** Where "Firefly Studio" in the header, and a fresh sign-in, should land. */
export const LANDING_PAGES = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/transactions', label: 'Transactions' },
  { value: '/accounts', label: 'Accounts' },
  { value: '/budgets', label: 'Budgets' },
  { value: '/reports', label: 'Reports' },
] as const;

export interface AppPreferences {
  theme: Theme;
  density: Density;
  /** Stored on `users.locale`, because that is what the pages already read. */
  locale: string;
  defaultLandingPage: string;
  hideBalances: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  density: 'comfortable',
  locale: 'en-US',
  defaultLandingPage: '/dashboard',
  hideBalances: false,
  reducedMotion: false,
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Parse a submitted form. Anything unrecognised falls back to the default
 * rather than erroring: these are display preferences, and refusing to save
 * five valid choices because a sixth arrived misspelled would be worse than
 * quietly keeping the default for that one.
 *
 * The landing page is the exception worth being strict about — it is a
 * redirect target, and accepting an arbitrary string here would turn a
 * preference into an open redirect.
 */
export function parsePreferences(form: {
  get(name: string): FormDataEntryValue | null;
}): AppPreferences {
  const landing = String(form.get('defaultLandingPage') ?? '');

  return {
    theme: oneOf(form.get('theme'), THEMES, DEFAULT_PREFERENCES.theme),
    density: oneOf(form.get('density'), DENSITIES, DEFAULT_PREFERENCES.density),
    locale: oneOf(
      form.get('locale'),
      REGIONAL_FORMATS.map((entry) => entry.value),
      DEFAULT_PREFERENCES.locale,
    ),
    defaultLandingPage: LANDING_PAGES.some((page) => page.value === landing)
      ? landing
      : DEFAULT_PREFERENCES.defaultLandingPage,
    hideBalances: form.get('hideBalances') === 'on',
    reducedMotion: form.get('reducedMotion') === 'on',
  };
}
