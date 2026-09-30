import { describe, expect, it } from 'vitest';
import { DEFAULT_MOBILE_NAV, destination, isActiveHref, parseMobileNav } from '@/lib/mobile-nav';

describe('parseMobileNav', () => {
  it('defaults to Transactions and Budgets', () => {
    expect(parseMobileNav(null)).toEqual(DEFAULT_MOBILE_NAV);
    expect(parseMobileNav('nope')).toEqual(DEFAULT_MOBILE_NAV);
  });

  it('keeps valid choices and replaces unknown ones', () => {
    expect(parseMobileNav({ second: 'reports', fourth: 'accounts' })).toEqual({
      second: 'reports',
      fourth: 'accounts',
    });
    expect(parseMobileNav({ second: 'admin', fourth: 'bills' })).toEqual({
      second: 'transactions',
      fourth: 'bills',
    });
  });

  it('never puts the same tab in both slots', () => {
    const slots = parseMobileNav({ second: 'reports', fourth: 'reports' });
    expect(slots.second).toBe('reports');
    expect(slots.fourth).not.toBe('reports');
  });
});

describe('isActiveHref', () => {
  it('lights Home only on the dashboard itself', () => {
    expect(isActiveHref('/dashboard', '/dashboard')).toBe(true);
    expect(isActiveHref('/dashboard/x', '/dashboard')).toBe(false);
  });

  it('lights a section for its whole subtree, not for a lookalike prefix', () => {
    expect(isActiveHref('/transactions/12/edit', '/transactions')).toBe(true);
    expect(isActiveHref('/budgets', '/budgets')).toBe(true);
    expect(isActiveHref('/bills-archive', '/bills')).toBe(false);
  });
});

describe('destination', () => {
  it('resolves an id to its route', () => {
    expect(destination('bills')).toMatchObject({ label: 'Subscriptions', href: '/bills' });
  });
});
