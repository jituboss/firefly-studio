# Changelog

Notable changes to Firefly Studio. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[semantic versioning](https://semver.org/), with `-alpha.N` / `-beta.N` /
`-rc.N` suffixes for prereleases.

Each released version is published to Docker Hub as
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## [Unreleased]

## [0.3.0] - 2026-09-18

**The first stable release.** Milestones M0–M5 are complete: you can sign up,
attach a Firefly III instance, and run the whole money-management and reporting
surface against it. Everything here was exercised against a live Firefly III
instance, not just typechecked.

Upgrading from `0.2.0-alpha.1` needs no migration steps beyond the usual — the
container applies its own migrations on boot. Nothing in your Firefly III ledger
is touched.

### Added

- **Two-factor authentication.** Enrol an authenticator app, confirm with a
  code, and get ten single-use recovery codes. Enrolment does not take effect
  until you have proved the code works, so a mis-scanned QR cannot lock you out.
- **Security settings.** See every device signed in to your account with its
  last-seen time, and sign any of them out immediately. Read the full activity
  trail, including failed sign-in attempts. Close your account, behind your
  password and a typed confirmation.
- **Real email.** Verification and reset links can now go out over SMTP (which
  covers SES) or Resend. The default is still the server log, so evaluating
  Firefly Studio needs no mail provider — but a transport that is configured
  incorrectly now fails at startup instead of silently dropping every message.
- **Optional breached-password checking** against Have I Been Pwned. Off by
  default; when on, only the first five characters of a hash leave the server,
  and an outage can never block sign-up.
- **Multiple Firefly instances.** Attach more than one and switch between them
  from the header. Connections are re-checked in the background, and a broken
  one now says so in a banner that distinguishes an expired token from an
  unreachable server, because those need different fixes.
- **Bulk editing.** Select transactions — individually, by day, or the whole
  page — and set a category, budget or tags on all of them, or delete them. A
  partial failure reports how many actually applied.
- **Quick add.** Record a simple transaction without leaving the list; the
  accounts stay filled in so a run of entries is fast.
- **Export** the current view, or just your selection, to CSV.
- **Search operators** with autocomplete — `category_is:`, `amount_more:`,
  `date_after:` and twenty more — plus recent searches. Firefly answers an
  unrecognised operator with an empty result rather than an error, so a typo
  looks exactly like "you have none of those"; the search box now warns before
  you run it.
- **Attachment manager.** Every receipt in one place, with previews for images
  and PDFs, renaming, and filtering. On a phone you can photograph a receipt
  directly, and it is compressed before upload.
- **A progress bar** across the top during page loads.

### Changed

- The transactions list scrolls with the page instead of inside its own box,
  keeps its column headers visible, and is far easier to use on a phone — the
  checkboxes are now finger-sized and the bulk-action bar fits the screen.
- Documentation moved into `docs/` behind an index, and the README now
  describes what the app actually does.

### Fixed

- **`position: sticky` never worked anywhere in the app.** The page shell made
  every sticky element measure against the wrong container, so the app header
  scrolled off the top of every page instead of staying put.
- Renaming an attachment kept showing the old name for up to a minute.
- Settings was unreachable until you had connected a Firefly instance, so
  anyone who abandoned setup could not reach it to delete their own account.
- The date range picker silently overrode a date operator typed into search.

### Removed

- **Webhooks are no longer planned.** Firefly III already has a screen for them
  and owns the delivery log, the retry attempts and the failure states, so a
  second interface over the same data could only be a worse copy of it.
  Configure webhooks in Firefly III directly — they keep working, because
  Firefly fires them, not this app. The proxy now refuses those endpoints
  rather than leaving them open for a feature that does not exist.

### Known gaps

- Automation — rules, recurring transactions, tags and currencies — is M6 and
  not built. Those pages are marked in the navigation.
- Scheduled report emails need a job runner and are not built.

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

[unreleased]: https://github.com/jituboss/firefly-studio/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.3.0
[0.2.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.2.0-alpha.1
[0.1.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.1.0-alpha.1
