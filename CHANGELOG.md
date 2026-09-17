# Changelog

Notable changes to Firefly Studio. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[semantic versioning](https://semver.org/), with `-alpha.N` / `-beta.N` /
`-rc.N` suffixes for prereleases.

Each released version is published to Docker Hub as
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## [Unreleased]

### Removed

- **Webhooks are no longer planned.** Firefly III already has a screen for them
  and owns the delivery log, the retry attempts and the failure states, so a
  second interface over the same data could only be a worse copy of it.
  Configure webhooks in Firefly III directly — they keep working, because
  Firefly fires them, not this app. The proxy now refuses those endpoints
  rather than leaving them open for a feature that does not exist.

## [0.2.0-alpha.1] - 2026-09-17

Reporting. This is the release that makes Firefly Studio worth opening instead
of Firefly III's own UI.

### Added

- **Ten reports** under a shared shell that keeps your period, account scope and
  display currency as you move between them, all encoded in the URL so any
  report is linkable and prints to what is on screen.
  - **Net worth** — assets against liabilities over time with the net line on
    top, and every account's opening balance, closing balance and contribution.
  - **Income vs expense** — monthly bars with a running net, savings rate, and
    your largest income sources and expense destinations.
  - **Categories** — a treemap by share, ranked spending and income, and a
    twelve-month grid.
  - **Budgets** — planned against actual with variance and usage bars, what you
    spent outside any budget, and a twelve-month adherence grid.
  - **Accounts** — money in, money out and transfers per asset account, with
    transfers keeping their direction.
  - **Tags** — spend by tag over the period and month by month.
  - **Subscriptions** — annualised recurring cost, what you actually paid, and
    everything spent outside a subscription.
  - **Cash flow** — a Sankey of income sources, through your accounts, into
    spending categories.
- **Custom report builder.** Pick a measure, a grouping and a chart; save it,
  name it, and pin it to your dashboard.
- **Export.** CSV from any report — generated from the rows on screen, so it
  cannot disagree with what you were looking at — and a print stylesheet that
  turns any report into a clean PDF via your browser.
- **Drill-through.** Every row of every breakdown links to the transactions
  behind it. The transaction list now understands category, budget and tag
  scoping, not just account, and names the active scope so a filtered list
  never looks mysteriously short.

### Fixed

- Three report pages could be scrolled sideways on a phone. Hidden
  screen-reader text inside right-aligned amounts was escaping its scroll
  container and dragging the page with it.
- The net-worth report could show an account's share of the total as more than
  100% when another account was overdrawn.

### Notes

- Report totals are taken from the same endpoints Firefly's own reports use,
  and were checked against them across several periods.
- Figures in different currencies are never added together. Where a report
  cannot include an amount, it says so rather than quietly under-reporting.

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

### Security

- `postcss` is pinned to `^8.5.28` for the whole tree. `next` 15.5.25 resolves
  it to 8.4.31, which carries two high advisories
  ([GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q),
  [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)) —
  `sourceMappingURL` handling that can read arbitrary files. Nothing here
  parses untrusted CSS, but the audit is a gate worth keeping green.

### Notes

- Money is carried as a decimal string end to end and only formatted at the
  point of render; no figure is summed across currencies without saying so.
- Dates are parsed and rendered in the user's timezone, never the server's.
- Reports (M5) and automation — rules, recurring transactions, webhooks — are
  not built yet; those pages are marked in the navigation.

[unreleased]: https://github.com/jituboss/firefly-studio/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.1.0-alpha.1
