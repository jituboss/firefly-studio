# Changelog

Notable changes to Firefly Studio. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[semantic versioning](https://semver.org/), with `-alpha.N` / `-beta.N` /
`-rc.N` suffixes for prereleases.

Each released version is published to Docker Hub as
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio).

## [Unreleased]

## [0.10.1] - 2026-09-23

**Administrators, and a page for them.**

### Added

- **An administrator role, and an Admin section in the sidebar for whoever has
  it.** Three tabs: who is on this deployment, what the deployment is running,
  and the security trail for all of it.

  **Nobody's ledger is visible there.** Firefly III holds the financial
  records, and this app only ever reaches them with the account holder's own
  token — an administrator of Firefly Studio is not an administrator of anyone's
  Firefly instance, and nothing on the page can unseal another account's
  credentials.

- **The first account to register becomes the administrator.** On an instance
  that already had accounts, the upgrade promotes the oldest one, so nobody ends
  up with an admin page they cannot open. The shared demo account is never
  promoted — its password is published, and that would hand every visitor every
  other account on the instance.

- **Users tab.** Every account with its role, status, Firefly connections and
  last sign-in. Grant or revoke the administrator role, suspend and reactivate,
  confirm an email address without a mail provider, and delete an account.
  Suspending revokes the session immediately.

  Each of those refuses the cases that would lock the instance out of itself —
  removing the last administrator, suspending yourself — and says why on the
  disabled control rather than failing after you press it. Deleting your own
  account is still only possible from Settings → Security, behind your password.

- **Overview tab.** Account, session and connection counts, plus the version,
  Node version, cache mode, mail transport and the two SSRF policy flags — the
  things a support question starts with.

- **Activity tab.** The audit trail for the whole deployment, filterable by
  event. It includes the events no per-user view can show, such as a failed
  sign-in against an address that does not exist here.

- **`pnpm user:admin`, and `node dist/user-admin.cjs` inside a container.**
  Grant, revoke and list from a shell, for the instance whose only administrator
  deleted themselves, or a demo-only deployment that was deliberately left
  without one. It refuses to remove the last administrator unless forced, and
  will not promote the demo account at all.

### Fixed

- **The security trail was showing raw event identifiers.** The label map had
  drifted from the events actually recorded: it named three that nothing writes
  and was missing eleven that fire, so `auth.login` and `auth.signup` rendered
  as themselves on Settings → Security. Both lists are now pinned together by a
  test.

## [0.10.0] - 2026-09-23

**The transaction list, with the chrome cut back.**

The page spent five bands on controls before the first transaction, and on a
phone that was most of the screen. It spends two now — a search row and the
totals — and the grid starts where the toolbar used to end.

### Changed

- **The filter bar is one row at every width.** A full-width search box, a type
  dropdown, a saved-view chip, a "Save view" button, a "Load view…" picker and a
  "Delete view…" picker wrapped onto three rows on a phone. It is now a search
  box and three menus — Filters, Views and Export — that shrink to their glyphs
  on a narrow screen.

- **Saved views are one menu instead of four controls.** Views are applied from
  a list, deleted from the row they are on rather than from a second picker, and
  saved from the same menu. When the filters on screen match a saved view, the
  button names it.

- **The transaction type filter moved into the Filters menu**, which also shows
  how many filters are applied and offers to clear them. An account or a report
  drill-through that scoped the list is listed there too, with a way to remove
  it — landing on a pre-filtered list with no visible way out made a short list
  look like a bug.

- **Export is a menu, grouped with Filters and Views.** It names the format and
  says what it is about to export — the rows you ticked, or the page — instead
  of a button that silently changed meaning with the selection.

- **Pagination sits above the table as well as below it.** Fifty rows is about
  four phone screens, so page two is now reachable from either end of the list
  instead of only from the bottom. The page number left the subtitle, where it
  was being said twice.

- **The totals tiles name their currency in the label** ("OUT · EUR"), and the
  whole strip is a Server Component again.

### Removed

- **The caption under the totals** — "On this page, in BDT. Transfers excluded.
  USD not included." — which was two rows of qualifier sitting between the
  filters and the first row. The currency is on the tiles, the scoping is in the
  strip's accessible name, and a currency the figures leave out is named in the
  page subtitle.

- **The "Convert to <currency>" toggle** on the transaction list, and with it
  the exchange-rate fetch that every mixed-currency page was making to offer it.
  The arithmetic is still in `lib/fx.ts` if it earns a place somewhere the space
  is cheaper.

## [0.9.4] - 2026-09-22

**One account's transactions add up correctly now.**

### Fixed

- **Money in and out was wrong for a single account, and badly wrong for a
  credit card.** Filtering the transaction list to one account classified every
  row by Firefly's transaction type rather than by what it did to _that_
  account. Firefly records paying a credit card off from your current account as
  a withdrawal — the same type as buying something with the card — so the card's
  list held two rows moving money in opposite directions and both were counted
  as spending. A month that ran 168,000 in and 3,653 out reported "in 0, out
  171,653". The payment row itself also showed in red as though it were a
  purchase, and named the card you were already looking at as the other party.

  In, out, net, the daily subtotals, each row's sign and colour, and the
  account named on each row are now all read from the account you are viewing.
  Transfers count there too — a transfer out of an account is money out of it.

  Nothing changes for the unfiltered list, which still separates income from
  spending and leaves transfers out of both. The line under the figures says
  which of the two it is showing.

## [0.9.3] - 2026-09-22

**The subscription calendar on a phone.**

### Fixed

- **The subscription calendar was unreadable on a phone.** A seven-column month
  grid does not fit a phone screen, and squeezing it produced a page of "Am…",
  "Do…", "Sp…" with the amounts painting straight out of their cells and across
  the neighbouring day — a figure standing in a column is a claim about which
  day it falls on, so that was worse than showing nothing.

  On a narrow screen it is an agenda now: the days that actually have something
  due, in order, with the whole name and the whole amount. The month grid comes
  back on a wide screen, where the columns can hold both.

- **Unpaid subscriptions showed their amount in green** — the colour this app
  uses for money coming in — inside a red "due" chip.

- **"Today" was highlighted in UTC** rather than in your own timezone, so far
  enough east or west the wrong day was marked, changing partway through the
  evening.

## [0.9.2] - 2026-09-22

**The totals above the transaction list, rebuilt.**

### Fixed

- **The page totals were a line of text with a scrollbar under them.** In, Out
  and Net, the note about transfers and the whole multi-currency disclosure were
  held on one line at any width, so on anything narrower than a desktop the
  strip scrolled sideways and clipped at both ends — the label saying what the
  figures were totals _of_ was the first thing to disappear. A ledger in a
  currency with long amounts, like BDT, pushed it well past a laptop's width
  too.

  They are three tiles now, at every width, with the qualifiers as a sentence
  underneath. Nothing scrolls sideways and nothing is cut off, on a phone or
  anywhere else. The currency is stated once beneath the figures rather than
  repeated on each of them, which is most of the width that was being wasted.

- **"Show native" did not show anything native.** Converting a multi-currency
  page left the original figures where they were and added a fourth number
  beside them, while the button offered to switch back to a view you had never
  left. Converting now converts all three figures and marks them as estimated,
  with the rate date beside them.

## [0.9.1] - 2026-09-22

**Two things Firefly III can do that this app could not reach — and one way it
was losing data.**

### Fixed

- **Ticking "Reconciled" on one line of a split transaction deleted the other
  lines.** Firefly treats a transaction update that leaves a part out as an
  instruction to remove that part, and this app had been sending only the line
  you clicked. A two-part transaction of 10.00 and 20.00 came back holding one
  part, with no error and nothing to show what had gone. If you have used that
  toggle on a split transaction, check those transactions.

### Added

- **Reconcile an account against a bank statement.** A Reconcile button on any
  asset account opens a statement period, takes the closing balance printed on
  your statement, and lets you tick off the lines that appear on it while the
  difference counts down to zero. It tells you which situation you are in
  rather than only showing a number: still working through the list, or
  everything ticked and the statement has a line your ledger has never heard
  of. Shift-click ticks a run of rows; the whole row is the target, not the
  checkbox.

  Where the difference will not close, it offers to write Firefly's own
  reconciliation entry to bring the account into line, naming the amount, the
  direction and the account before you commit to it — and saying so out loud if
  you still have lines unticked, because a correction written over those covers
  money your books already have.

  Asset accounts only. That is Firefly's rule rather than a limitation here: it
  has no reconciliation for a liability, and the page says so instead of
  failing later.

- **Rule actions can build their value from the transaction.** Firefly III
  evaluates any rule action value starting with `=` against the transaction
  itself, so `='Bill for ' ~ substr(date, 0, 7)` writes "Bill for 2026-08".
  Nothing in this app said so. The rule builder now recognises it, lists the
  fields and functions you can use, checks what you have written before you
  save it, and **shows what it will produce**.

  It also explains the case that looks like a bug. Firefly stores some action
  values with a `\=` prefix meaning "write this out as text", and adds that
  prefix itself to existing rules when an instance is upgraded — so a rule that
  used to work starts writing out its own formula, equals sign and all, while
  still looking correct everywhere. The builder spots it, says what happened,
  and fixes it in one click.

- **Autocomplete on every rule value that names something.** Setting a
  category, budget, tag, account or subscription in a rule was a text box you
  had to spell correctly, and a near-miss produced a rule that quietly did
  nothing. All seventeen now suggest as you type, and the three "convert to"
  actions only offer the kind of account Firefly will accept.

### Changed

- Rule rows are readable by a screen reader. Every condition and action is
  named, where before the page was a column of unlabelled dropdowns and eight
  boxes all called "Value".

## [0.9.0] - 2026-09-21

**Two things the app was saying that were not true, and four it could not do
at all.**

### Fixed

- **A dashboard that could not reach your Firefly III showed zeros.** "Net
  worth €0", "Spent €0", "No transactions yet" — your money reported as gone,
  in the typography of a real figure. Every tile on that page comes from one
  connection, so a single failed read means none of them can be trusted. It
  says it cannot reach the instance now.

- **Bulk-editing a category did nothing to split transactions.** Firefly
  accepts the change for a transaction with one part and quietly ignores it for
  one with several, so a bulk edit over a mixed selection reported "Updated 12"
  and changed fewer, with nothing to show which. Every part of a split is sent
  now.

- **The Add panel could sit on "Adding…" for ever** over a transaction that had
  in fact been saved. It confirms in under half a second on both pages.

### Added

- **Merge one category into another.** Duplicate categories are the commonest
  mess in an imported ledger, and until now the app could not fix one: you
  could rename or delete, and deleting left every transaction uncategorised.
  Merging moves them across and then removes the empty category.

- **Change a category from the list.** The category cell is the editor, and it
  updates the moment you pick — reverting, with the reason, if Firefly refuses
  it. Filing a month of transactions used to mean four page visits per row.

- **One comparable total for a multi-currency page.** A page holding EUR and
  GBP printed the EUR figures and a footnote saying "GBP not included" —
  honest, and no use to anyone who wanted a total. It can convert them now,
  using the exchange rates your Firefly III already holds. Native figures stay
  the default and the converted view says it is an estimate, the date of the
  rates behind it, and anything it still could not include — a counted figure
  and an estimated one should never swap places without you asking.

- **Report tables read as cards on a phone.** The four widest — subscriptions,
  budgets, income vs expense and net worth — stack into labelled cards instead
  of truncating. The month-by-month grid keeps its side-scroll, because
  comparing across months is the entire point of it.

### Changed

- dotenv 18 and prettier 3.9.8, each tested against this repository before
  being taken rather than merged on a green tick.

## [0.8.0] - 2026-09-21

**The transaction list, rebuilt: nothing truncated, one way to add, and a
phone screen that starts with transactions instead of controls.**

### Changed

- **Account names no longer clip.** The account column was a fixed 176px, so
  two account names and an arrow never fitted and every row truncated both
  ends — "Everyday C… → Home Mort…" — on a wide screen with hundreds of spare
  pixels sitting unused in the description column beside it. The text columns
  share the available width now, and nothing truncates at 1400px.

- **The amount looks like the point of the row**, because it is. It was the
  smallest thing on a line whose description was larger and whose colour it
  was carrying. Categories became chips so they read as labels rather than as
  more of the same sentence, the space between columns grows with the window,
  and each row carries a small coloured dot for its type — previously the only
  way to tell a transfer from a spend was the colour of a figure at the far
  right of the row.

- **"Quick add" and "New" are one button: Add.** They were two doors to the
  same intent. It opens the same panel the dashboard uses, and the panel ends
  in a link to the full form for splits, foreign amounts and receipts — a
  control you can find rather than a sentence you have to finish reading.

- **A narrow row names the account you wanted.** A transfer showed its source,
  which is the account you are already looking at; it shows the destination.

- **The phone layout starts with data sooner.** The header stopped dumping its
  controls onto a line of their own beneath a two-line heading; the subtitle
  gets the page width instead of the ~190px the buttons left it, so it no
  longer wraps to report "page 1 of 1"; the type filter and Save view share a
  row; the page totals stay on one line; and Export is its icon. 328px of
  chrome before the first transaction, down from 388.

### Removed

- **The Comfortable/Compact row-density setting**, from the transaction list
  and from Settings → Preferences. It did work — 56px against 40px, measured —
  but the content inside the row did not change with it, so the difference was
  imperceptible, and a control nobody can perceive is chrome above a list
  people came to read. The stored column is left in place rather than taking a
  destructive migration for a cosmetic change.

### Fixed

- **An overlay no longer discards what you typed** if you dismiss it by
  accident: sheets keep their contents rather than rebuilding them each time
  they open.

### Known issues

- **The dashboard's Add button can stay on "Adding…".** Unchanged from 0.7.0,
  and now better understood: 0.7.0 recorded this as happening "only inside a
  Sheet", which was wrong. The same panel on the transactions page confirms and
  clears in under half a second, so the panel is not the cause — something
  about the dashboard page itself is. The transaction is written correctly
  either way.

## [0.7.0] - 2026-09-21

**The design system is complete, transactions can be retyped, and a stale
session no longer traps the browser in a redirect loop.**

### Added

- **The last five UI primitives** — Sheet, Popover, Tooltip, Tabs and Table —
  each because something had already hand-rolled it badly. The mobile nav
  drawer had a backdrop and an Escape key and nothing else, so Tab walked out
  of the open drawer onto the page behind and a keyboard user could focus links
  they could not see. The notification inbox could only be closed by clicking
  the bell again. The same tab markup had been copied into eight detail pages
  and drifted — one copy had lost its `aria-label`, another its `aria-current`,
  and none scrolled at 390px, so the later tabs on a rule page were simply
  unreachable. Seven hand-typed tables became one primitive that adds a
  focusable scroll region, without which a keyboard user could not reach the
  columns past the fold.

- **Change a transaction between expense, income and transfer.** Firefly's own
  UI has this; ours did not, so correcting a mistyped transaction meant
  deleting and re-entering it and losing its attachments, its tags and its id.

- **Subscriptions and rules are wired together, both ways.** A subscription now
  has a Rules tab listing what automates it and a button that opens the rule
  builder already filled in; a rule links back to the subscription it feeds,
  and the rules list names it. The rule builder picks a subscription from a
  list rather than asking you to type its exact name.

- **Record a transaction from the dashboard** — a header button on desktop, a
  floating button on mobile. See Known issues.

- **Any date range, not just the last two years.** The picker stopped at "last
  year", so a three-year-old ledger had most of itself unreachable from the
  interface. Earlier calendar years and an explicit custom range are now
  offered, and a range is named the way a person would say it: "2024", "March
  2024", or "1 Mar 2023 → 30 Jun 2023".

- **An HTTP access log on stdout**, nginx-style, so `docker logs` answers who
  hit what and whether it worked. Query values that could be credentials are
  redacted before anything is written — `/verify-email/confirm?token=…` and
  `/reset-password?token=…` carry single-use account-takeover tokens, and a log
  is the most-forwarded artefact a deployment produces. The referer gets the
  same treatment, because a browser sitting on a reset URL sends it whole on
  every request that follows. `ACCESS_LOG=false` silences it;
  `ACCESS_LOG_TRUST_PROXY=true` when a reverse proxy really is in front.

- **"Try again" on the broken-connection banner.** The app already re-probed
  in the background every hour, so a recovered connection did clear itself —
  eventually. An hour of a banner saying the ledger is unavailable, offering
  only a link to a page that repeats the same stale word, is not a recovery
  story.

### Fixed

- **A stale session cookie trapped the browser in an endless redirect.**
  Reported after deploying a new image; reproduced at nineteen hops before
  Chrome gave up. Deploying was never the cause — it is simply when many
  long-idle tabs reload at once. Middleware treated the presence of a session
  cookie as proof of a session, which it cannot verify because it runs on the
  edge with no database, and the app's own guard disagreed with it forever. The
  decision now sits where the session can actually be checked, and the sign-in
  page says your session ended rather than leaving you at an unexplained login
  form.

- **A revoked Firefly token was reported as an unreachable server**, sending
  people to check a server that was answering perfectly. The error carried the
  right code all along; nothing read it.

- **Opening any overlay stole focus back on every re-render.** Typing in a
  field, a pending flag flipping, a parent re-rendering — each silently moved
  focus to the close button.

- **The date-range button had no accessible name on a phone.** Its label is
  hidden below `sm` and both icons are decorative, so a screen reader announced
  "button" for the one control every figure on the page depends on.

### Known issues

- **The dashboard's quick-add button can stay on "Adding…".** The transaction
  is written correctly and appears on reload; the confirmation does not arrive.
  It happens only in that panel — the same form elsewhere in the app is
  unaffected. Six causes were investigated and ruled out; the findings are
  recorded in the source so the next attempt does not repeat them.

## [0.6.5] - 2026-09-20

**The demo seed works on instances that do not ship your currency.**

### Fixed

- **Seeding a demo in a currency the Firefly instance lacks built nothing.**
  Firefly ships a fixed currency list and it is not identical on every
  instance — BDT is present on some and absent on others. Where it is absent,
  `POST /v1/currencies/{code}/enable` answers `404`, because the route binder
  cannot resolve a code that has no row. The seed warned about that, printed
  `currency: BDT (enabled, primary)` regardless, and then failed hundreds of
  lines later with `The selected currency code is invalid` on the first
  account, so the reported cause and the real one were nowhere near each
  other. The seed now creates the currency when the instance does not have it,
  and a failure to enable or make it primary stops the run instead of being
  warned about — a demo seeded in the wrong currency renders a dashboard of
  zeroes, with every figure present and none of them found.

- **No demo had any piggy banks.** They were posted with
  `accounts: [{ id }]`, a spelling Firefly's schema accepts and its validator
  rejects with `accounts.0.account_id field is required`. All three failed on
  every run while the seed reported `piggy banks: 3`. The field is
  `account_id`, and the count is now counted rather than assumed.

  Verified against Firefly III 6.5.5 by removing BDT from
  `transaction_currencies` and seeding a freshly registered user: the currency
  is created, 682 transactions post, and three piggy banks read back in BDT.

## [0.6.4] - 2026-09-20

**The demo tools now work where you actually need them: inside the container.**

### Fixed

- **Setting up the demo on a deployed container was impossible.** The
  instructions said to run `pnpm demo:seed`, which cannot work in the shipped
  image: it has no `scripts/` directory, no TypeScript and no package manager,
  and it runs as a user that cannot write to `/app`, so even bootstrapping
  `pnpm` fails with a permission error. The demo tools now ship prebuilt
  alongside the migrator and run with plain `node`:

  ```sh
  node dist/demo-seed.cjs --reset
  node dist/demo-account.cjs
  ```

  Verified by running both inside the production image as its non-root user.
  The README and the TrueNAS deployment notes carry the corrected commands.

## [0.6.3] - 2026-09-20

**There is a demo now.** A shared account with three years of invented data, so
anyone can look around before installing anything.

Upgrading from `0.6.x` needs no action — the demo is off unless you configure
it.

### Added

- **A demo account.** Set `DEMO_EMAIL` and `DEMO_PASSWORD` and the sign-in page
  offers "Try the demo", signing in to a shared account with 682 transactions
  across 36 months: current, savings, credit-card and mortgage accounts,
  budgets with monthly limits, subscriptions, piggy banks and tagged holidays.
  Enough history for the reports, the net-worth chart and budget pacing to
  actually show something.
- **Two commands to build it.** `pnpm demo:seed` fills a throwaway Firefly III
  instance; `pnpm demo:account` creates the app-side account that reads it.
  `DEMO_CURRENCY` picks the currency, sets it as the instance's primary, and
  scales the amounts so the figures read as plausible in it.
- **The demo can do everything except break itself.** It can add and edit
  transactions, budgets and rules — that is the point of it — but it cannot
  change the Firefly connection, use the danger zone, alter its own
  credentials, delete itself or unlock destructive operations. Those are the
  five things a published password would otherwise put at risk. Visitors get a
  banner saying the figures are invented and the account is shared.

### Notes

- The demo ledger is rebuilt by running `pnpm demo:reset`; there is no
  scheduled reset yet.
- **`demo:seed --reset` destroys the target ledger.** Point it only at an
  instance you are happy to lose.

## [0.6.2] - 2026-09-20

**Every page got 56 kB lighter.** `0.6.1` was tagged but never published — its
build failed — so this supersedes it and carries everything that was in it.

Upgrading from `0.6.0` needs no action.

### Fixed

- **The error-reporting SDK was downloaded by every visitor, even with error
  reporting switched off.** It was imported unconditionally, so roughly 56 kB
  of compressed JavaScript shipped on every page of every install — and the
  default install has no Sentry DSN configured and never used a byte of it. It
  now loads only when reporting is actually turned on, and even then after the
  page is interactive rather than before.
- **The release build could not complete.** The size check compares each page
  against a recorded budget; that budget had been recorded from an incremental
  local build that happened to omit the SDK above, so a clean build measured
  every page as over budget. Recording it now requires a from-scratch build.

### Added

- Everything from the unpublished `0.6.1`: the sign-in page doubling as a
  landing page, and the container image moving back to a supported Node after
  an automated update had left it on one that could not build.

## [0.6.1] - 2026-09-20

**A front door, and a base image that builds.** Signing in is now the landing
page, and the production image is back on a supported Node.

Upgrading from `0.6.0` needs no action.

### Added

- **The sign-in page is now the landing page.** It explains what Firefly Studio
  is to someone arriving for the first time, without getting in the way of
  someone who just wants to sign in: on a phone the form is the first thing on
  screen and the explanation sits below it, and on a wide screen they are side
  by side. Static markup and CSS — no images, no extra JavaScript.

### Fixed

- **The container image would not build at all.** An automated dependency
  update moved the base image to Node 25, which no longer includes the tool the
  build uses to install dependencies. The image is on Node 24 LTS now, which is
  supported into 2028, and the build is verified by running the container
  rather than only building it. **This is the reason to take this release:
  `0.6.0`'s image was the last one that built.**
- **Two checks had stopped protecting anything.** A dependency update had
  silently disabled the linter — it was failing to start rather than failing on
  a rule — and another had put the TypeScript definitions a major version ahead
  of the Node that actually runs, which lets code typecheck and then fail in
  production. Both are pinned to the versions that match what ships, with the
  reasoning recorded so they are not "upgraded" again by accident.

### Changed

- Dependency updates for Sentry, TanStack Query, Lucide icons, Prettier and the
  GitHub Actions used by the build.

## [0.6.0] - 2026-09-20

**Installable, and considerably more honest.** Firefly Studio can now be
installed as an app, tells you when it cannot reach your ledger instead of
pretending there is nothing in it, and asks before it deletes anything in its
own voice rather than the browser's. Several figures that were quietly wrong
are now right.

Upgrading from `0.5.x` needs no action. The container applies its own
migrations on boot, and no configuration changed.

### Added

- **Install it like an app.** A web manifest and a service worker: Firefly
  Studio can be added to a phone's home screen or installed on a desktop, where
  it runs without browser chrome. Offline, it shows a proper offline page
  rather than a browser error.
- **Nothing of yours is cached.** The offline support deliberately stores only
  the app's own files — never your balances, transactions or any page that
  needed a login. A cached dashboard would outlive signing out and be readable
  by the next person to open the laptop. Signing out clears the cache anyway.
- **Pages tell you what went wrong, and what to do.** Nine kinds of failure,
  each with its own explanation and its own next step: an unreachable instance
  offers a retry, a revoked token offers to reconnect, a rate limit tells you
  to wait. "Something went wrong. Try again." is the right answer to none of
  those.
- **Empty lists explain themselves** and offer the one action that fills them,
  instead of a bare "No budgets yet."
- **Faster navigation.** Pages now show their layout immediately on click
  rather than waiting for the server, and the app prefetches where you are
  likely to go next — without touching your Firefly instance to do it.

### Fixed

- **The dashboard reported spending backwards.** A period where your spending
  had fallen showed "Spent ↑ 48.7%" in green: the arrow said one thing, the
  colour another, and your ledger a third. Every comparison tile now states the
  direction and the judgement correctly, and spending less is no longer
  reported as spending more.
- **"Transactions without budget" was unusable on a phone.** The description
  ran straight through the amount, and every date in the list was blurred by
  the hide-balances setting — dates are not balances. Both fixed.
- **Hide balances stopped hiding the wrong things.** It was blurring dates,
  percentages, row counts, the number of selected transactions, and the box you
  type a two-factor code into. It now blurs amounts, which is what it is for.
- **Confirmation dialogs are part of the app now.** The nineteen "are you
  sure?" prompts were the browser's own, which in an installed app look like
  something else entirely is asking. They are dialogs in the app's voice, and
  they can be dismissed with Escape.
- **The command palette could not be closed with a keyboard.** It showed an
  "ESC" hint that had never been connected to anything.
- **Contrast fixes** in the report heat grid, on coloured badges, and on the
  warning badge that appears when a connection is unhealthy — all of which
  failed the 4.5:1 minimum in one theme or the other.
- **Progress bars no longer paint outside their own track** when a budget is
  over 100% — one envelope in testing was at 824%.
- **A Firefly instance at an IPv6 address** reported "could not resolve"
  instead of the real reason.

### Changed

- Amount fields across the app now share one control: they refuse to be
  changed by a stray scroll wheel, keep their digits aligned, and never turn a
  typed comma into a silently empty value.
- Every chart draws from one shared theme, so tooltips, axes and series colours
  are identical everywhere and correct in both light and dark.
- Every dropdown is the same control, which on a phone means the native picker
  rather than a list pinned to the top of the screen.

### Security

- Dependency and secret scanning now run on every push, and the coverage gate
  rose from 70% to 80% and grew to cover the proxy allowlist, the cache
  invalidation, the SSRF guard and the CSRF check.

## [0.5.1] - 2026-09-20

### Added

- Transactions without budget: select withdrawals and assign a budget to
  all of them in one action, with the same sticky bulk toolbar as the
  uncategorised inbox. The toolbar is now a shared component both pages
  use.

## [0.5.0] - 2026-09-20

**A licence, a hardening pass, and the app's own preferences.** Firefly Studio
is now AGPL-3.0-or-later — until this release there was no `LICENSE` file at
all, which legally meant all rights reserved for an image anyone could pull.
Alongside it: a Content-Security-Policy, CSRF protection on the write
endpoints, a test suite for the SSRF guard, a preferences page, and an
accessibility gate the whole app now passes.

Upgrading from `0.4.x` needs no action. The container applies its own
migrations on boot, and no configuration changed.

### Added

- **A licence.** [AGPL-3.0-or-later](LICENSE), matching Firefly III. The
  practical consequence: run a modified copy for other people and you owe them
  its source. Run it unmodified, for yourself or inside your organisation, and
  you owe nothing. The sidebar now links to the source, which is what §13 of
  that licence expects a networked app to do.
- **Preferences** (Settings → Preferences). Theme, regional format, row
  density, which page signing in opens, whether balances start hidden, and a
  reduce-motion switch for devices whose system has no such setting. These
  follow your account rather than the browser, so they apply wherever you sign
  in.
- **A Content-Security-Policy** with a per-request nonce, alongside the HSTS,
  `frame-ancestors 'none'`, COOP/CORP and `nosniff` headers already in place.
- **CSRF protection** on the endpoints that write, as a second control beside
  the `SameSite=Lax` session cookie.
- **[docs/SECURITY.md](docs/SECURITY.md)** — how to report a vulnerability
  privately, what is in scope, and the hardening that has **not** been done
  yet, named item by item. Worth reading before you expose this to a network
  you do not control.
- **An accessibility gate.** `pnpm check:a11y` runs axe-core over 19 routes in
  both light and dark, and fails on any WCAG 2.1 A/AA violation. The app
  currently has none.
- **Text alternatives for every chart.** Each one now announces a one-line
  summary and carries the figures it draws as a table for screen readers,
  instead of being an unlabelled picture.

### Fixed

- **The number format you chose during setup had never done anything.** The
  wizard stored it in one place and every page that formats a date or a figure
  read another, which nothing ever wrote. Both are now the same value, and it
  is editable in Preferences.
- **The command palette could not be closed with a keyboard.** It showed an
  "ESC" hint that was connected to nothing, so the only way out was clicking
  the backdrop — no way out at all if you were not using a mouse. Escape now
  closes it and returns focus where it was.
- **A Firefly instance at an IPv6 address reported the wrong error.** The
  address guard did not recognise a bracketed IPv6 literal, so it fell through
  to a DNS lookup and told you the host could not be resolved, for an address
  it had actually decided to refuse.
- **Colour contrast in two places.** Amounts printed on the busiest cell of a
  report heat grid, and the coloured badges throughout the app, both fell below
  the 4.5:1 minimum in one theme or the other.
- **Balances no longer flash before being hidden.** The hide-balances
  preference is applied while the page is rendered rather than by the browser a
  frame later.

### Changed

- **The README** is a project front page rather than a status note. It had
  described the project as `v0.2.0-alpha.1` with automation "not started",
  which stopped being true six releases ago.
- Signing in takes you to your chosen landing page instead of always the
  dashboard.

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

[unreleased]: https://github.com/jituboss/firefly-studio/compare/v0.10.1...HEAD
[0.10.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.10.1
[0.10.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.10.0
[0.9.4]: https://github.com/jituboss/firefly-studio/releases/tag/v0.9.4
[0.9.3]: https://github.com/jituboss/firefly-studio/releases/tag/v0.9.3
[0.9.2]: https://github.com/jituboss/firefly-studio/releases/tag/v0.9.2
[0.9.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.9.1
[0.9.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.9.0
[0.8.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.8.0
[0.7.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.7.0
[0.6.5]: https://github.com/jituboss/firefly-studio/releases/tag/v0.6.5
[0.6.4]: https://github.com/jituboss/firefly-studio/releases/tag/v0.6.4
[0.6.3]: https://github.com/jituboss/firefly-studio/releases/tag/v0.6.3
[0.6.2]: https://github.com/jituboss/firefly-studio/releases/tag/v0.6.2
[0.6.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.6.1
[0.6.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.6.0
[0.5.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.5.1
[0.5.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.5.0
[0.4.5]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.5
[0.4.4]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.4
[0.4.3]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.3
[0.4.2]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.2
[0.4.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.1
[0.4.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.4.0
[0.3.0]: https://github.com/jituboss/firefly-studio/releases/tag/v0.3.0
[0.2.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.2.0-alpha.1
[0.1.0-alpha.1]: https://github.com/jituboss/firefly-studio/releases/tag/v0.1.0-alpha.1
