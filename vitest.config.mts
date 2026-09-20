import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite resolves the `@/*` aliases from tsconfig.json natively.
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws on import outside a React Server Component build,
      // which is the entire point of it — and which makes any server module
      // that imports it untestable. Stubbing it lets the pure logic inside
      // those modules (the SSRF guard, E23-01) be unit-tested without
      // weakening the guarantee in the app itself.
      'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      /*
       * E24-07 — `lib/` plus the server modules that are pure enough to unit
       * test and consequential enough to be worth it.
       *
       * Deliberately a list, not `server/**`. Most of `server/` is Server
       * Actions and query wrappers whose behaviour lives in the round trip to
       * Firefly or to Postgres; including them would add a few thousand
       * uncovered lines, force the threshold down to a number that gates
       * nothing, and call that progress. These four are the ones where a
       * silent mistake is expensive: the proxy allowlist decides where a
       * decrypted token may be pointed, the cache tags decide whether a write
       * is visible afterwards, the URL guard is the SSRF boundary, and the
       * CSRF check is the second control on every write endpoint.
       */
      include: [
        'lib/**/*.ts',
        'server/firefly/api.ts',
        'server/firefly/cache.ts',
        'server/firefly/url-guard.ts',
        'server/auth/csrf.ts',
      ],
      exclude: [
        '**/*.d.ts',
        // server/db and server/observability are integration-level: they need a
        // live Postgres and a real Sentry transport respectively. They are
        // covered by the CI migrate step and by e2e in M1, not by unit tests.
        'server/db/**',
        'server/observability/**',
      ],
      // E24-07 — the gate, raised from 70% now the modules above are covered.
      // It is a floor, not a target: `lib/` sits in the mid-90s, and the point
      // of the number is that a regression has to be deliberate.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
