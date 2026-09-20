// Stands in for the `server-only` package under Vitest. Importing the real one
// throws by design; the app still imports the real one, so the build-time
// guarantee is unchanged — this only exists so server modules can be unit-tested.
export {};
