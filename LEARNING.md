# LEARNING.md — Handoff notes for continuing this project

> **Read this before `PROJECT_PLAN.md`.** This file is the "why" and the "gotchas."
> `PROJECT_PLAN.md` is the "what" — the full plan, API inventory, and checkbox backlog.
> Together they should let a different AI assistant (Gemini, ChatGPT, a different Claude
> session, a human) pick this project up with no other context.

**Last updated:** 2026-09-17, at the end of an extended M0–M4 polish pass. Written by an outgoing AI coding assistant for whoever continues this work.

**What changed since the previous handoff note was written:** the M4 branch was merged into `main`, then several follow-up fixes landed against a live Firefly III instance. The current `main` branch has **20+ commits** including:

- dashboard KPI tiles now render in the connection primary currency with compact notation,
- dashboard balance chart now uses `/v1/chart/account/overview` (earned/spent series) and requests `preselected=all`,
- balance chart colors are semantic: earned is green (`--income`), spent is red (`--expense`),
- `AreaTrend` tooltip labels swap based on value sign,
- accounts page now fetches each account type explicitly, computes real net-worth/assets/liabilities tiles,
- accounts landing groups show the first 15 accounts with a polished gradient header and a pill "View all N" button,
- available budgets page shipped with per-currency aggregation and positive spent display,
- bill calendar and object-group pages shipped during the M0–M4 sweep.

---

## 1. What this project is, in three sentences

Firefly Studio is a from-scratch Next.js web client for **Firefly III** (an open-source
personal-finance server: https://firefly-iii.org). Firefly III already has an API and a
web UI; this project does **not** modify Firefly III itself — it's a separate app with its
own login system, own Postgres database, and own UI, that talks to a user's Firefly III
instance over its REST API using a Personal Access Token (PAT) the user supplies during
onboarding. The full plan, architecture, security model, and a 224-item backlog live in
[`PROJECT_PLAN.md`](PROJECT_PLAN.md) — that file is the source of truth; this file explains
what actually happened building the first four milestones of it.

## 2. Current state — read this first

**Milestones M0–M4 are done. M5–M8 are not started.** See `PROJECT_PLAN.md` §6 for the
milestone table and §8 for the itemised backlog (every finished item is checked `[x]`
with a note on what was cut and why; nothing was silently dropped).

| Milestone | What it shipped                                                                                                                                | Status         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| M0        | Repo scaffold, Next.js 15 + TS strict, Tailwind v4 design tokens, Postgres + Drizzle, Docker, CI, vendored Firefly OpenAPI spec + codegen      | ✅ done        |
| M1        | App's own auth (sign-up/in/verify/reset, DB sessions), the Firefly connection onboarding wizard, encrypted PAT storage                         | ✅ done        |
| M2        | The Firefly proxy (`/api/ff/[...path]`) + Redis cache, dashboard with real KPIs/charts, accounts CRUD-read, transaction list/search            | ✅ done        |
| M3        | Full transaction write lifecycle: create/edit/delete, split editor, attachments (upload/download)                                              | ✅ done        |
| M4        | Budgets (+ per-period limits), Categories, Bills/subscriptions, Piggy banks — all CRUD, plus Available budgets and Object groups landing pages | ✅ done        |
| M5        | Reporting (net worth, income/expense, category/budget reports, custom builder)                                                                 | ❌ not started |
| M6        | Rules, recurring transactions, tags, currencies/exchange rates, webhooks, links, admin                                                         | ❌ not started |
| M7        | Accessibility audit, i18n, PWA, perf budget polish                                                                                             | ❌ not started |
| M8        | Security hardening pass, load testing, release docs                                                                                            | ❌ not started |

**Start M5 next** unless told otherwise — that's the next unstarted milestone and the plan's
own "recommended solo path" (§6.1) treats reporting as the differentiator over Firefly's
stock UI.

Working tree is clean; run `git log --oneline` to confirm the current state — the
branch now has **20+ commits beyond the original M0–M4 merge** from the recent polish
pass.

## 3. Before you write a single line — read these four files

1. **`PROJECT_PLAN.md`** — the whole plan. §7 is the authoritative Firefly API inventory
   (164 paths / 230 operations / 28 resource groups, generated from the real spec, not
   guessed). §8 is the backlog with every item's status. §12 is the definition-of-done
   checklist every item should pass. §13 and §14 are verification logs from M3 and M4 —
   read them, they document real bugs found by testing against a live Firefly instance.
2. **`docs/adr/`** — four short architecture decision records explaining _why_ things are
   built the way they are, especially the two that deviate from what a first plan would
   assume:
   - `0001-two-tier-identity.md` — our own auth is separate from the Firefly connection
   - `0002-proxy-all-firefly-traffic.md` — **why the PAT never reaches the browser**
   - `0003-vendored-openapi-spec.md` — why the Firefly spec is committed, not fetched live
   - `0004-hand-rolled-sessions-instead-of-authjs.md` — **the plan originally said "Auth.js
     v5," but Auth.js forces JWT sessions when using the Credentials provider, which
     defeats server-side revocation. Sessions are hand-rolled instead (~150 lines,
     `server/auth/session.ts`). If you're used to reaching for Auth.js/NextAuth
     reflexively, don't — it was deliberately rejected here.**
3. **`CONTRIBUTING.md`** — the four _enforced_ (lint-blocked, not just conventions) rules,
   summarised in §5 below because they matter enough to repeat.
4. **This file.**

## 4. Tech stack (as actually built, not as originally drafted)

| Layer           | What it is                                                                                                                                    | Notes                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework       | Next.js 15, App Router, React 19, TypeScript strict                                                                                           | Server Components for reads, Server Actions for writes                                                                                                                                                                                                                                                                                                                   |
| Styling         | Tailwind CSS v4 + hand-built primitives in `components/ui/` (no shadcn CLI was actually run — the components were hand-written in that style) | Design tokens in `app/globals.css` as CSS custom properties, light+dark                                                                                                                                                                                                                                                                                                  |
| DB              | PostgreSQL 16 via Drizzle ORM                                                                                                                 | Schema: `server/db/schema.ts`. Migrations: `drizzle/` (committed, applied on container boot)                                                                                                                                                                                                                                                                             |
| Auth            | **Hand-rolled**, not Auth.js                                                                                                                  | `server/auth/session.ts`, `server/auth/actions.ts`. Argon2id via `@node-rs/argon2`                                                                                                                                                                                                                                                                                       |
| Firefly client  | Hand-written fetch wrapper, NOT auto-generated from the OpenAPI spec despite the ADR-0003 intent                                              | `server/firefly/client.ts` (the HTTP layer), `server/firefly/api.ts` (caching + auth layer used by Server Components), `server/firefly/types.ts` (hand-written response shapes — **verified against a live instance repeatedly because the OpenAPI spec's types didn't always match reality**, see §7 below) — **see the dead-code warning immediately below the table** |
| Cache           | Redis via `ioredis`, with an in-memory Map fallback if `REDIS_URL` is unset                                                                   | `server/firefly/cache.ts`, tag-based invalidation                                                                                                                                                                                                                                                                                                                        |
| Charts          | Recharts                                                                                                                                      | `components/charts/`                                                                                                                                                                                                                                                                                                                                                     |
| Tables          | TanStack Virtual (only for the transaction grid)                                                                                              | `app/(app)/transactions/table.tsx`                                                                                                                                                                                                                                                                                                                                       |
| Forms           | Native React Server Actions + `useActionState`, no react-hook-form                                                                            | Every write path follows the same pattern — see §6                                                                                                                                                                                                                                                                                                                       |
| Testing         | Vitest (43 unit tests, all in `lib/`), Playwright installed but barely used                                                                   | **No tests were written for M2–M4.** See §8, this was a deliberate user instruction, not an oversight                                                                                                                                                                                                                                                                    |
| Package manager | pnpm                                                                                                                                          | `pnpm-workspace.yaml` has a build-approval allowlist because pnpm 9+ blocks postinstall scripts by default                                                                                                                                                                                                                                                               |

### ⚠️ Two files are named `types.ts` — they are not the same thing, and one is unused

- **`spec/generated/types.ts`** (27,000+ lines) is auto-generated by
  `pnpm spec:codegen` from `openapi-typescript`, straight off the vendored spec. **Nothing
  in the app imports it.** It was scaffolded in M0 as part of the original
  "generated client" intent (ADR-0003) but the actual resource work in M2–M4 used
  hand-written types instead, because the generated types are a mechanical, deeply-nested
  translation of the spec and were more friction than help for the ~10 fields any given
  page actually needs. It is regenerated correctly by `pnpm spec:codegen` (part of the
  M0 CI check) but is otherwise dead weight right now.
- **`server/firefly/types.ts`** is the one actually used everywhere (`Account`,
  `Transaction`, `Budget`, `Category`, `Bill`, `PiggyBank`, etc.) — hand-written, and
  **verified field-by-field against real API responses**, not derived from the spec file.
- **Decision to make, don't just inherit:** either (a) keep hand-writing types as new
  resources are added (matches everything done so far, keeps working around the
  spec-vs-reality mismatches in §7), or (b) actually wire up `spec/generated/types.ts` and
  delete the hand-written ones. (a) is the path of least resistance and what M0–M4 did in
  practice; (b) was the original plan and is still arguably the "right" long-term answer.
  This was never explicitly decided — it just happened this way under time pressure. Worth
  a deliberate call before M6 adds several more resources under either policy.

## 5. The four rules that are lint-enforced, not just documented

These exist because each has a specific, expensive failure mode already discovered once.
Read `eslint.config.mjs` if you want the actual rule definitions.

1. **Money is a string until rendered.** Firefly returns amounts as strings
   (`"-1234.56"`) on purpose, to avoid float precision loss. `Number()` and `parseFloat`
   are lint errors outside `lib/money.ts`. Use `lib/money.ts`'s `add`/`subtract`/`divide`/
   `toDecimal`/`formatMoney` (wraps `decimal.js`).
2. **Dates are parsed in the user's timezone, never the browser's.**
   `new Date('2026-03-15')` is UTC midnight, which is the _previous day_ west of
   Greenwich — this silently shifts transactions between months in date-range queries.
   `new Date(someString)` is a lint error outside `lib/date.ts`. Use `lib/date.ts`'s
   `parseFireflyDate` / `parseFireflyDateTime` / `formatDate` / `resolveRange`.
3. **The PAT never reaches the browser.** All Firefly reads happen in Server Components
   via `server/firefly/api.ts` → `fireflyGet`/`fireflyGetSafe`; all writes happen via
   Server Actions calling `fireflyWrite`, OR via the browser calling
   `/api/ff/[...path]` (the proxy route, `app/api/ff/[...path]/route.ts`), which injects
   the decrypted token server-side. Never construct a fetch to the user's Firefly
   `baseUrl` directly from a Client Component.
4. **The Firefly OpenAPI spec is vendored, not fetched live.** `spec/firefly-iii-v1.yaml`
   is committed. Run `pnpm spec:update` to check for a newer Firefly release (diffs it,
   won't silently overwrite). Run `pnpm spec:codegen` after updating to regenerate
   `spec/generated/operations.ts` (the path/operation registry used by the proxy's
   allowlist). **Caveat:** despite ADR-0003's intent, the actual TypeScript response
   types in `server/firefly/types.ts` are hand-written, not generated from this spec —
   see §7, this turned out to matter.

## 6. The pattern every CRUD resource follows — copy this, don't reinvent it

M3 and M4 each added a full CRUD resource (transactions, then budgets/categories/bills/
piggy-banks). They all follow **one pattern**. If you're adding M6's rules, recurring
transactions, or tags, replicate this exactly:

```
server/firefly/<resource>-actions.ts   — 'use server' Server Actions: create/update/delete
server/firefly/queries.ts              — add GET helpers here (fireflyGet/fireflyGetSafe wrappers)
server/firefly/types.ts                — hand-written response shape (VERIFY AGAINST LIVE API FIRST)
app/(app)/<resource>/page.tsx          — list page (Server Component, reads via queries.ts)
app/(app)/<resource>/<resource>-form.tsx — Client Component form, useActionState + useFormStatus
app/(app)/<resource>/new/page.tsx      — wraps the form for create
app/(app)/<resource>/[id]/page.tsx     — detail page, usually tabbed (?tab=... in the URL)
app/(app)/<resource>/[id]/delete-button.tsx — Client Component, confirm() + form action
```

Every write action:

- Reads `FormData`, builds a payload, drops empty/null fields (`compact()` helper,
  duplicated per-file — not shared, could be extracted to `lib/`)
- Calls `fireflyWrite(path, method, payload)` from `server/firefly/api.ts`, which
  auto-invalidates the right cache tags
- Calls `revalidatePath()` for the Next.js pages that show this data
- Returns `{ error }` on failure (shown via `FormMessage` from
  `components/auth/form-shell.tsx` — that file has generic form UI despite the
  "auth" name, it's shared across all forms in the app) or `redirect()`s on success

Nav links live in `components/app-shell.tsx` — new top-level sections need an entry there,
with a `milestone: 'M6'` (etc.) tag if not yet built (renders greyed out, links to
`/dashboard` instead — see the existing M5/M6 entries for the pattern).

## 7. The single biggest lesson: verify against a REAL Firefly instance, always

This is the most important operational lesson from M0–M4, worth repeating because it will
keep happening in M5–M8:

**Firefly III's actual API behavior differs from what you'd reasonably assume from field
names or the OpenAPI spec, repeatedly, in ways that only show up when you make a real
call.** Examples hit so far (full detail in `PROJECT_PLAN.md` §13 and §14):

- `GET /api/v1/about` — used for the very first onboarding probe — **requires
  authentication**. An unauthenticated call returns 401, not a friendly "here's the
  version" response. The onboarding flow had to be redesigned around this: a 401 with a
  JSON body is treated as "yes, this is a Firefly API," not as a failure.
- `DELETE` responses are `204 No Content` with an **empty body**. `JSON.parse('')` throws.
  This silently turned every successful delete into a reported failure until fixed.
- Account creation with `account_role: ccAsset` (credit card) **requires** two additional
  fields (`credit_card_type`, `monthly_payment_date`) that aren't required for other
  roles — Firefly 422s otherwise, with a somewhat helpful message.
- Piggy-bank creation requires `transaction_currency_code` (or `_id`) even though the
  OpenAPI spec doesn't mark it as strictly required at the type level — 422 without it.
- Piggy banks have **no deposit/withdraw endpoint**. The mechanism is `PUT` a new
  `current_amount` onto the `accounts[]` array entry; Firefly diffs it server-side and
  writes the corresponding event to `/piggy-banks/{id}/events` itself. This was
  discovered by testing directly, not by reading docs.
- `BudgetLimit.spent` and `Category.spent`/`earned` are **arrays** of
  `{sum, currency_code}` (one entry per currency in use), not a single string — matters
  a lot for anyone with a multi-currency ledger (see the dashboard currency bug below).
- `/chart/budget/overview` and `/chart/category/overview` return **one snapshot bar per
  resource for the whole date range**, not a time series — a different shape from
  `/chart/balance/balance` and `/chart/account/overview`. Don't assume all `/chart/*`
  endpoints share a shape.

**Practical instruction for whoever continues this:** before implementing a write action
or trusting a response shape for a new Firefly resource (rules, recurring transactions,
tags, currencies, webhooks — all of M6), make a real `curl` call against a running
instance first. See §9 for how to spin one up. Don't trust the OpenAPI spec's field
`required` list alone.

## 8. Testing approach — what exists and what deliberately doesn't

- **43 Vitest unit tests exist, all for `lib/money.ts`, `lib/date.ts`, `lib/env.ts`,
  `lib/logger.ts`, `lib/utils.ts`** (the pure, no-side-effect modules). Run `pnpm test`.
- **No unit/integration tests exist for M2, M3, or M4** — the proxy, the cache, the
  Server Actions, or any page. This was an explicit user instruction ("tests and other
  stuffs can be done later," "focus should be on completing the milestone"), not an
  oversight. **Do not assume anything in `server/firefly/*-actions.ts` is covered.**
- **The actual verification method used throughout M2–M4** was manual `curl` calls against
  a live Firefly III instance running in Docker (see §9), checking real HTTP status codes
  and response bodies, then checking the resulting Next.js pages render the data. This is
  documented per-milestone in `PROJECT_PLAN.md` §13 (M3) and §14 (M4) — read those before
  assuming something works.
- `scripts/check-responsive.mjs` is a Playwright script (not a Vitest test) that checks
  for horizontal viewport overflow at 360/390/768/1440px. Run with
  `FS_SESSION=<cookie> pnpm check:responsive` against a running dev server. This exists
  because responsive layout broke twice (grid items default to `min-width: auto`, so a
  wide child — a chart, a long currency-prefixed number — silently widens the whole page).
  **If you touch any grid or flex layout, run this before calling it done.**
- **If the next provider/session has time, the highest-value testing gaps to close are:**
  the proxy's allowlist logic (`server/firefly/api.ts` `isGuardedPath`/`isKnownPath`),
  the cache tag invalidation (`server/firefly/cache.ts`), and the transaction split-form
  payload parsing (`server/firefly/transaction-actions.ts` `readSplits` — parses
  `splits[N][field]`-shaped FormData keys, easy to get subtly wrong).

## 9. How to actually run this and test against a real Firefly instance

```bash
# Install
pnpm install

# Copy env and fill in secrets (there's a generator command in .env.example's comments)
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # x2, for APP_ENCRYPTION_KEY and AUTH_SECRET

# Start Postgres + Redis
docker compose up -d postgres redis

# Migrate + (optionally) seed feature flags
pnpm db:migrate
pnpm db:seed

# Run the app
pnpm dev   # http://localhost:3000
```

**To get a real Firefly III instance to test against** (this is how every write in M2–M4
was actually verified — do this, don't guess):

```bash
docker compose --profile firefly up -d   # http://localhost:8080
```

Register a user in Firefly's own UI at `localhost:8080/register`, then create a Personal
Access Token at **Options → Profile → OAuth → Personal Access Tokens**. Put the URL,
email, and token in `.env` as `DEV_FIREFLY_URL`, `DEV_FIREFLY_EMAIL`, `DEV_FIREFLY_PAT`
(these are dev-only conventions this project added, not read by the app itself — they're
just where the _human_ stashed real test credentials so future sessions could `curl`
against them without asking again). **`.env` is gitignored — check `git status` before
committing if you ever touch it, and never put these values in a commit message.**

`pnpm firefly:seed` populates that instance with a realistic multi-account, multi-category
dataset (idempotent, safe to re-run) — useful for eyeballing the dashboard/reports with
non-trivial data.

**To sign in to the app itself** without waiting on real email (no mail transport is
configured — verification links print to the server console log, see
`server/mail/index.ts`):

```bash
pnpm user:verify --list          # see all app users and their verification state
pnpm user:verify <email>         # mark an account's email confirmed without a real inbox
```

Full verification gate before considering any change done:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## 10. Known rough edges / things to be aware of, not yet fixed

- **Cross-currency arithmetic in list/aggregate views is naive.** E.g. the accounts list
  sums balances "per currency shown" but doesn't do FX conversion — if you build M5
  reports, decide deliberately whether to convert to a single display currency (Firefly's
  `/insight/*` endpoints may or may not help here — check before assuming).
- **The dashboard's currency-selection bug** (KPI tiles picking whichever currency
  Firefly listed first, rather than the connection's primary currency) was fixed in
  commit `9a5a159` — but the same class of bug (multiple `-in-<CODE>` suffixed keys in a
  summary object) could resurface anywhere `/summary/basic`-shaped data is consumed. Grep
  for `.find(` on Object.entries of a Firefly summary object if something looks off.
- **No pagination on some M4 list pages** (budgets, categories, bills, piggy banks) — they
  fetch up to 200 and render everything client-side. Fine for a personal ledger, will need
  real pagination for a large multi-user or business ledger. Transactions already has
  proper pagination (`app/(app)/transactions/page.tsx` + `pagination.tsx`) — copy that
  pattern if this becomes a problem.
- **No object-group support** (E9-05) — piggy banks and bills can have Firefly object
  groups but the UI doesn't expose creating/assigning them yet.
- **Cross-currency arithmetic in list/aggregate views is naive.** Sums are grouped by
  currency code but not converted, so the dashboard/account totals can look like many
  separate amounts rather than one consolidated figure.
- **Auth email is console-only** (§9 above) — needs a real transport (Resend/SES/SMTP)
  before this could go to real users. This is `PROJECT_PLAN.md` §11 Q4, still open.
- **Project-plan / learning-doc sync drift:** some items now exist in the UI that are
  still unchecked in `PROJECT_PLAN.md` (e.g. object-group landing page, bill calendar,
  available budgets). The plan should be reconciled when the next milestone starts.
- The `pnpm-workspace.yaml` build-approval list may need updating if you add a new
  dependency with a native postinstall step — pnpm will error with a clear message if so.

## 11. If you're a different AI system continuing this cold, do this first

1. `git log --oneline` and `cat PROJECT_PLAN.md` (skim §6, §8) to confirm this doc is
   still accurate — it may have drifted if work happened after 2026-09-17.
2. `pnpm install && pnpm typecheck && pnpm test` — confirm you're starting from a green
   baseline before changing anything.
3. Read `PROJECT_PLAN.md` §7 (API inventory) for whichever resource you're about to build
   next, to see which Firefly endpoints are involved and which milestone/epic owns it.
4. Spin up the real Firefly instance (§9) and make a raw `curl` call against the
   endpoint(s) you're about to build against, **before** writing the TypeScript types or
   the Server Action. This one habit prevented or caught every bug listed in §7.
5. Follow the CRUD pattern in §6 for consistency — a reviewer (human or AI) scanning the
   codebase should not be able to tell which resource was added by which assistant.
6. Update `PROJECT_PLAN.md`'s checkboxes and add a verification-log section (§13, §14 are
   the templates) when you finish a milestone — this file (`LEARNING.md`) is for
   cross-session/cross-provider handoff notes and lessons, not a changelog; don't let it
   grow unbounded. If it starts duplicating `PROJECT_PLAN.md`, trim it back to just what's
   surprising or hard-won.

## 12. Quick reference — where the actually-shipped UI pages live

Use this map before assuming a feature still needs to be built.

| UI feature                               | Path(s) in this repo                                                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard KPIs + balance chart           | `app/(app)/dashboard/page.tsx`, `components/charts/area-trend.tsx`, `components/dashboard/widgets.tsx`                                                                                                             |
| Accounts list + type filters + landing   | `app/(app)/accounts/page.tsx`, `app/(app)/accounts/filters.tsx`                                                                                                                                                    |
| Account create/edit/detail/delete        | `app/(app)/accounts/account-form.tsx`, `app/(app)/accounts/[id]/page.tsx`, `app/(app)/accounts/new/page.tsx`, `app/(app)/accounts/[id]/delete-button.tsx`                                                          |
| Transactions list + pagination + search  | `app/(app)/transactions/page.tsx`, `app/(app)/transactions/table.tsx`, `app/(app)/transactions/filters.tsx`, `app/(app)/transactions/pagination.tsx`, `app/(app)/transactions/saved-views.tsx`                     |
| Transaction create/edit/split/duplicate  | `app/(app)/transactions/transaction-form.tsx`, `app/(app)/transactions/[id]/edit/page.tsx`, `app/(app)/transactions/[id]/page.tsx`, `app/(app)/transactions/new/page.tsx`, `server/firefly/transaction-actions.ts` |
| Attachments (upload/download/delete)     | `components/transactions/attachments.tsx`, `app/api/attachments/route.ts`                                                                                                                                          |
| Budgets + limits + without-budget view   | `app/(app)/budgets/page.tsx`, `app/(app)/budgets/budget-form.tsx`, `app/(app)/budgets/[id]/page.tsx`, `app/(app)/budgets/[id]/limit-form.tsx`, `app/(app)/budgets/transactions-without-budget/page.tsx`            |
| Available budgets landing page           | `app/(app)/available-budgets/page.tsx`                                                                                                                                                                             |
| Categories + uncategorised inbox         | `app/(app)/categories/page.tsx`, `app/(app)/categories/category-form.tsx`, `app/(app)/categories/uncategorised/page.tsx`                                                                                           |
| Bills / subscriptions + calendar         | `app/(app)/bills/page.tsx`, `app/(app)/bills/bill-form.tsx`, `app/(app)/bills/calendar/page.tsx`                                                                                                                   |
| Piggy banks                              | `app/(app)/piggy-banks/page.tsx`, `app/(app)/piggy-banks/piggy-form.tsx`, `app/(app)/piggy-banks/[id]/page.tsx`, `app/(app)/piggy-banks/[id]/adjust-form.tsx`                                                      |
| Object groups                            | `app/(app)/object-groups/page.tsx`, `app/(app)/object-groups/new/page.tsx`                                                                                                                                         |
| Settings → connections manager           | `app/(app)/settings/connections/page.tsx`, `app/(app)/settings/connections/connection-card.tsx`                                                                                                                    |
| App shell / navigation / command palette | `components/app-shell.tsx`, `components/command-palette.tsx`                                                                                                                                                       |
