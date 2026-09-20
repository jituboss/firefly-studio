import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  LANDING_PAGES,
  REGIONAL_FORMATS,
  parsePreferences,
} from '@/lib/preferences';

/** FormData is not available in every Node version this runs under. */
function form(values: Record<string, string>) {
  return { get: (name: string) => values[name] ?? null };
}

describe('parsePreferences', () => {
  it('reads a complete, valid submission', () => {
    expect(
      parsePreferences(
        form({
          theme: 'dark',
          density: 'compact',
          locale: 'de-DE',
          defaultLandingPage: '/transactions',
          hideBalances: 'on',
          reducedMotion: 'on',
        }),
      ),
    ).toEqual({
      theme: 'dark',
      density: 'compact',
      locale: 'de-DE',
      defaultLandingPage: '/transactions',
      hideBalances: true,
      reducedMotion: true,
    });
  });

  it('treats an absent checkbox as off, which is how browsers post them', () => {
    const parsed = parsePreferences(form({ theme: 'light' }));
    expect(parsed.hideBalances).toBe(false);
    expect(parsed.reducedMotion).toBe(false);
  });

  it('falls back to the default for an unrecognised value rather than failing', () => {
    const parsed = parsePreferences(form({ theme: 'neon', density: 'roomy', locale: 'xx-XX' }));
    expect(parsed.theme).toBe(DEFAULT_PREFERENCES.theme);
    expect(parsed.density).toBe(DEFAULT_PREFERENCES.density);
    expect(parsed.locale).toBe(DEFAULT_PREFERENCES.locale);
  });

  it('accepts every locale the form offers', () => {
    for (const entry of REGIONAL_FORMATS) {
      expect(parsePreferences(form({ locale: entry.value })).locale).toBe(entry.value);
    }
  });

  it('accepts every landing page the form offers', () => {
    for (const page of LANDING_PAGES) {
      expect(parsePreferences(form({ defaultLandingPage: page.value })).defaultLandingPage).toBe(
        page.value,
      );
    }
  });

  // The landing page is a redirect target, so an arbitrary string here would
  // turn a display preference into an open redirect.
  it('refuses a landing page that is not on the list', () => {
    for (const hostile of [
      'https://evil.test',
      '//evil.test',
      '/dashboard/../../etc',
      'javascript:alert(1)',
      '/settings/danger',
    ]) {
      expect(parsePreferences(form({ defaultLandingPage: hostile })).defaultLandingPage).toBe(
        '/dashboard',
      );
    }
  });

  it('returns the defaults for an entirely empty submission', () => {
    expect(parsePreferences(form({}))).toEqual(DEFAULT_PREFERENCES);
  });
});
