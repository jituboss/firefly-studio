import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite resolves the `@/*` aliases from tsconfig.json natively.
  resolve: { tsconfigPaths: true },
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
