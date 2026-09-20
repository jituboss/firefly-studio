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
      include: ['lib/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        // server/db and server/observability are integration-level: they need a
        // live Postgres and a real Sentry transport respectively. They are
        // covered by the CI migrate step and by e2e in M1, not by unit tests.
        'server/db/**',
        'server/observability/**',
      ],
      // E24-07 — the gate. Rises to 80% as M1/M2 land the crypto and proxy
      // modules, which are pure logic and must be covered properly.
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
