# Changelog

Notable changes to Firefly Studio. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[semantic versioning](https://semver.org/), with `-alpha.N` / `-beta.N` /
`-rc.N` suffixes for prereleases.

Each released version is published to Docker Hub as
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## [Unreleased]

## [0.4.5] - 2026-09-19

### Fixed

- Uncategorised inbox: the bulk "Set category" action submitted the form
  without the selected transaction ids, so applying a category always
  failed with "Select at least one transaction." Also removed two dead
  document events dispatched by the page.

## [0.4.4] - 2026-09-18

### Added

- **The app finally has icons.** The browser tab, bookmark, and home-screen
  icon are the brand mark the app already uses — the flame, white on brand
  blue — as a multi-size `favicon.ico` (16/32/48), a scalable SVG, a 512px
  PNG, and a 180×180 Apple touch icon. No favorites or bookmarks show a
  blank tile anymore.

### Fixed

- **Icons work signed out, too.** The session middleware treats the
  generated icon routes like pages, so a logged-out visitor's browser was
  being redirected to sign-in instead of receiving the favicon — exactly
  on the screens where a tab icon matters most. The icon routes are now
  exempt from the auth gate, same as `favicon.ico` always was.

## [0.4.3] - 2026-09-18

### Fixed

- **Removing your last Firefly connection no longer leaves the app broken.**
  The "setup finished" flag stays set forever once onboarding completes, so
  after deleting a connection every page tried to read a ledger that no
  longer existed. Zero connections now means the onboarding state: the app
  takes you back to the connection wizard — the managed instance and the
  connect-your-own path both there — instead of erroring on every click.
  Your account, preferences and any other connections are untouched.
- **There is always a way to add an instance.** "Add another instance" only
  existed inside the instance switcher, which appears once you have two —
  so after removing a connection there was no way back in. Settings →
  Connections now has an "Add a Firefly instance" button, always.
- **Deleting the default connection promotes the next survivor** (the one
  you touched most recently) instead of leaving the choice to accident.
- **Reconnecting a managed instance from Settings drops you straight into
  the app.** It used to report "Connected." and leave you on the settings
  page with everything still broken until the next navigation. Your
  preferences are kept — the wizard no longer resets number formats, date
  formats or featured accounts when it runs again.
- **Removing your only connection now says so** before you confirm, instead
  of a promise that everything is fine.

## [0.4.2] - 2026-09-18

### Fixed

- **Confirming your email address no longer shows an error.** The link worked —
  the address really was confirmed — but the page it landed on reported
  something had gone wrong, because signing you in at that moment is not
  something the page was allowed to do. Confirmation now happens on its own
  route, signs you in properly, and takes you straight to setting up your
  Firefly III connection. Links already in your inbox still work.

### Added

- **The version you are running is shown** at the bottom of the navigation, so
  "which build is this" has an answer without opening a terminal.

## [0.4.1] - 2026-09-18

Three fixes, no new features.

### Fixed

- **The light theme is usable.** It had no surface hierarchy: the page and the
  cards on it were within one percent of the same white, so cards, the sidebar
  and the background collapsed into a single sheet with hairline borders doing
  all the work. The page is now a soft grey that white cards sit on top of,
  borders and input edges are strong enough to see, and every colour that
  carries meaning — income, expense, transfer, warning — is dark enough to read
  as text on white. Warning text was the worst of them at 2.54:1, below the
  accessible minimum; it is now 5.40:1. Every token pair was measured, and the
  light palette now passes the same twenty checks the dark one already did. The
  dark theme is unchanged.
- **Browser controls follow the theme.** Select menus, date pickers, scrollbars
  and autofill were rendered by the browser in whatever scheme the operating
  system was set to, so a light page could hand you a dark date picker.
- **Amounts no longer disagree about the currency.** The primary currency was
  read once when you connected your Firefly instance and never again. If you
  changed it afterwards, some screens kept showing the old one while others
  showed the new one. It now follows the instance, and corrects itself within
  five minutes of a change made in Firefly III directly — immediately, if the
  change is made here.

### Changed

- Only a version tag publishes a container image. Pushing a branch and its tag
  together started two runs for one commit and both of them published; the
  branch's run is now a check, not a release.

## [0.4.0] - 2026-09-18

**Automation.** Milestone M6 is complete: rules, recurring transactions, tags,
currencies and exchange rates, transaction links, and administration of the
Firefly instance you are connected to. Everything here was exercised against a
live Firefly III 6.5.5, not just typechecked.

Upgrading from `0.3.0` needs no action for the app itself — the container
applies its own migrations on boot. If you run the bundled development stack,
see **Upgrade notes** below, because the compose file changed.

### Added

- **Rules, with a visual builder.** Compose a rule out of conditions and
  actions: all 36 of Firefly's trigger keywords and all 21 composable actions,
  not a convenient subset. Invert any condition, require all or any of them,
  stop processing after a match. Rules live in groups, which run in order.
- **A dry run before you commit.** Every rule shows exactly which transactions
  it would touch, over any date range, changing nothing. Run a rule or a whole
  group over your history when you are satisfied.
- **Recurring transactions.** Describe rent, salary or a standing order once
  and Firefly creates it on schedule — daily through yearly, with skips,
  weekend handling and nth-weekday-of-month. A forecast lists what is coming,
  and you can create one by hand without waiting for the date.
- **Tags.** A list and a cloud weighted by what each tag actually cost, spend
  and income per tag, optional dates and locations, and tagging or untagging
  many transactions at once.
- **Currencies and exchange rates.** Enable, disable or change the primary
  currency; add your own; record what one currency was worth in another on a
  date.
- **Transaction links.** Connect a refund to its purchase, or a reimbursement
  to what it repays.
- **A managed Firefly III instance (optional).** Point `MANAGED_FIREFLY_URL` at
  an instance this deployment operates and onboarding gains a one-click choice:
  an account is created for each user and their access token minted, so nobody
  has to find a Personal Access Token by hand. Users can still connect their own
  instance, and can move between the two whenever they like — the link between
  an account here and its ledger there is permanent, so switching back always
  returns you to the same data. See `.env.example`; the instance must accept
  registrations, so keep it off the public internet.
- **A settings section for the connected instance.** Its version, the account
  you are signed in as, its preferences, and — for instance owners — its users,
  financial administrations and configuration.
- **A danger zone.** Delete a whole class of records from the connected
  instance, behind a password re-confirmation, a typed phrase naming exactly
  what goes, and an audit entry written whether it succeeds or fails.
- **A way out of onboarding.** Signing in to the wrong account no longer means
  clearing cookies: every step of the wizard now offers a sign out.

### Changed

- Settings moved out of the sidebar into a tabbed section behind a gear in the
  header. It is somewhere you visit and leave, not one of the ledger views.
- CI and Release are one pipeline. A release used to take about forty minutes,
  most of it emulating `linux/arm64` through QEMU; each architecture now builds
  on a runner of its own and the gate runs beside the image build rather than
  before it.

### Fixed

- **The development stack could not start without mail configured.** Docker
  Compose cannot express "leave this unset", so an absent `SMTP_PORT` arrived as
  an empty string and failed validation. An empty value now means absent.
- **Destructive operations were unreachable.** The step-up re-authentication
  they require existed as a check with nothing able to grant it, so every
  guarded operation was refused unconditionally.

### Known limitations

- **Exporting data does not work on Firefly III 6.5.5.** All nine of its CSV
  export endpoints return a server error (`Cannot instantiate abstract class
League\Csv\AbstractCsv`) — a broken dependency inside Firefly that this app
  cannot work around. Export from Firefly III's own interface meanwhile.
- Rules and rule groups render in the order Firefly runs them, but cannot yet be
  reordered from here.

### Upgrade notes

The bundled development stack no longer runs a second PostgreSQL for Firefly
III; it shares the app's, in a database of its own. Existing data is not read
from the old volume, so move it across before switching:

```bash
docker compose exec -T firefly-db pg_dump -U firefly -d firefly \
  --no-owner --no-acl > firefly.sql
docker compose exec -T postgres psql -U firefly_studio -d firefly_studio \
  -f /docker-entrypoint-initdb.d/00-init.sql
docker compose exec -T postgres psql -U firefly -d firefly < firefly.sql
```

Then `docker volume rm firefly-studio_firefly-db-data` once you are satisfied.
This affects the development stack only, not deployed containers.

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

[unreleased]: https://github.com/jituboss/firefly-studio/compare/v0.4.2...HEAD
[0.4.2]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.2
[0.4.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.1
[0.4.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.0
[0.3.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.3.0
[0.2.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.2.0-alpha.1
[0.1.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.1.0-alpha.1
