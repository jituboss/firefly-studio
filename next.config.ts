import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

/**
 * Security headers applied to every response. The CSP here is the baseline;
 * E23-02 tightens it with per-request nonces once we have auth pages that need
 * inline bootstrapping.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // `pg` and `pino` must stay on the Node runtime, never bundled for the edge.
  serverExternalPackages: ['pg', 'pino', 'pino-pretty'],
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

/**
 * Sentry wraps the build to generate and (optionally) upload source maps.
 * With no SENTRY_AUTH_TOKEN the upload step is skipped, so the wrapper is inert
 * for anyone self-hosting without Sentry.
 */
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // Source maps are generated for the server but hidden from the client bundle,
  // so stack traces stay readable in Sentry without shipping them to browsers.
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // Proxies Sentry's ingest through our own origin so ad blockers do not
  // silently swallow error reports.
  tunnelRoute: '/monitoring',
});
