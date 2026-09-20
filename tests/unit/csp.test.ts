import { describe, expect, it } from 'vitest';
import { buildCsp, generateNonce } from '@/lib/csp';

/**
 * These pin the relaxations that are load-bearing, and the ones that must never
 * appear. A CSP regression does not throw — it either breaks a page in a way
 * only a browser console shows, or it silently stops protecting anything.
 */

function directive(csp: string, name: string): string[] {
  const found = csp.split('; ').find((part) => part.startsWith(`${name} `));
  if (!found) throw new Error(`no ${name} directive in: ${csp}`);
  return found.slice(name.length + 1).split(' ');
}

describe('buildCsp', () => {
  const nonce = 'dGVzdC1ub25jZQ==';

  it('carries the nonce into script-src', () => {
    expect(directive(buildCsp({ nonce }), 'script-src')).toContain(`'nonce-${nonce}'`);
  });

  it('never allows eval in production', () => {
    expect(buildCsp({ nonce })).not.toContain("'unsafe-eval'");
  });

  it('allows eval in development, because Fast Refresh needs it', () => {
    expect(directive(buildCsp({ nonce, dev: true }), 'script-src')).toContain("'unsafe-eval'");
  });

  it('never allows inline script, in either mode', () => {
    expect(directive(buildCsp({ nonce }), 'script-src')).not.toContain("'unsafe-inline'");
    expect(directive(buildCsp({ nonce, dev: true }), 'script-src')).not.toContain(
      "'unsafe-inline'",
    );
  });

  // Recharts writes inline style attributes, which a nonce cannot cover. If
  // this ever becomes removable, the charts have changed.
  it('allows inline style, which the chart library requires', () => {
    expect(directive(buildCsp({ nonce }), 'style-src')).toContain("'unsafe-inline'");
  });

  it('allows blob: for the attachment preview iframe and image previews', () => {
    const csp = buildCsp({ nonce });
    expect(directive(csp, 'frame-src')).toContain('blob:');
    expect(directive(csp, 'img-src')).toContain('blob:');
  });

  it('refuses to be framed, and forbids plugins and base tag injection', () => {
    const csp = buildCsp({ nonce });
    expect(directive(csp, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(csp, 'object-src')).toEqual(["'none'"]);
    expect(directive(csp, 'base-uri')).toEqual(["'self'"]);
    expect(directive(csp, 'form-action')).toEqual(["'self'"]);
  });

  // A LAN self-host serves this over http. upgrade-insecure-requests would
  // rewrite its own asset requests to https and break every one of them.
  it('does not set upgrade-insecure-requests', () => {
    expect(buildCsp({ nonce })).not.toContain('upgrade-insecure-requests');
  });

  it('keeps connect-src same-origin, so Sentry stays tunnelled', () => {
    expect(directive(buildCsp({ nonce }), 'connect-src')).toEqual(["'self'"]);
  });
});

describe('generateNonce', () => {
  it('is base64 and long enough to be unguessable', () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(atob(nonce)).toHaveLength(16);
  });

  it('never repeats — a reused nonce is a reusable bypass', () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateNonce()));
    expect(seen.size).toBe(200);
  });
});
