# Changelog

Notable changes to Firefly Studio. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[semantic versioning](https://semver.org/), with `-alpha.N` / `-beta.N` /
`-rc.N` suffixes for prereleases.

Each released version is published to Docker Hub as
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## [Unreleased]

## [0.1.0-alpha.1] - 2026-09-17

First published build. Firefly Studio is usable end to end against a real
Firefly III instance, but this is an alpha: expect gaps, and do not point it at
a ledger you cannot afford to have written to by mistake.

### Added

- **Accounts, authentication and setup.** Email sign-up with hand-rolled
  sessions, and a connection wizard that probes a Firefly III instance,
  verifies its version and stores the personal access token encrypted with
  AES-256-GCM. The token never reaches the browser.
- **Dashboard.** Net worth, earned, spent and balance against the selected
  period with period-over-period deltas, a net-worth-over-time chart, top
  spending categories, recent transactions, upcoming bills, savings goals and
  budget progress.
- **Accounts.** Grouped by what the account actually is — your money, payees,
  income sources, Firefly's own internals — with search, archived toggle and
  net worth / assets / liabilities tiles. Per-account detail carries a balance
  chart, period change, money in and money out.
- **Transactions.** Virtualised grid grouped by day with per-day nets, filters
  and free-text search, saved views, and full create / edit / duplicate /
  delete with splits and attachments.
- **Budgets, categories, subscriptions and piggy banks.** List and detail views
  with limits, spending pace, annualised subscription cost, savings progress
  and on-track status, plus the writes for each.
- **Operations.** Multi-stage non-root production image, migrations applied on
  boot, `/api/health` and `/api/ready` endpoints, Redis-backed caching with tag
  invalidation, and a proxy whose allowlist is generated from the vendored
  Firefly III OpenAPI specification.

### Notes

- Money is carried as a decimal string end to end and only formatted at the
  point of render; no figure is summed across currencies without saying so.
- Dates are parsed and rendered in the user's timezone, never the server's.
- Reports (M5) and automation — rules, recurring transactions, webhooks — are
  not built yet; those pages are marked in the navigation.

[unreleased]: https://github.com/jituboss/firefly-studio/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.1.0-alpha.1
