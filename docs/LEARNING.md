# LEARNING.md — Handoff notes for continuing this project

> **Read this before `PROJECT_PLAN.md`.** This file is the "why" and the "gotchas."
> `PROJECT_PLAN.md` is the "what" — the full plan, API inventory, and checkbox backlog.
> Together they should let a different AI assistant (Gemini, ChatGPT, a different Claude
> session, a human) pick this project up with no other context.

**Last updated:** 2026-09-18, after M6. Written by an outgoing AI coding assistant for whoever continues this work.

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

**Milestones M0–M6 are done. M7–M8 are not started.** See `PROJECT_PLAN.md` §6 for the
milestone table and §8 for the itemised backlog (every finished item is checked `[x]`
with a note on what was cut and why; nothing was silently dropped).

| Milestone | What it shipped                                                                                                                                | Status         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| M0        | Repo scaffold, Next.js 15 + TS strict, Tailwind v4 design tokens, Postgres + Drizzle, Docker, CI, vendored Firefly OpenAPI spec + codegen      | ✅ done        |
| M1        | App's own auth (sign-up/in/verify/reset, DB sessions), the Firefly connection onboarding wizard, encrypted PAT storage                         | ✅ done        |
| M2        | The Firefly proxy (`/api/ff/[...path]`) + Redis cache, dashboard with real KPIs/charts, accounts CRUD-read, transaction list/search            | ✅ done        |
| M3        | Full transaction write lifecycle: create/edit/delete, split editor, attachments (upload/download)                                              | ✅ done        |
| M4        | Budgets (+ per-period limits), Categories, Bills/subscriptions, Piggy banks — all CRUD, plus Available budgets and Object groups landing pages | ✅ done        |
| M5        | Reporting: 8 standard reports + a custom builder, CSV/print export, drill-through                                                              | ✅ done        |
| M6        | Rules, recurring transactions, tags, currencies/exchange rates, links, admin, danger zone                                                      | ✅ done        |
| M7        | Accessibility audit, i18n, PWA, perf budget polish                                                                                             | ❌ not started |
| M8        | Security hardening pass, load testing, release docs                                                                                            | ❌ not started |

### Released: `v0.3.0`, the first stable version

`main` is tagged `v0.3.0` and pushed, and the Docker image publishes `latest` — this is
the first version where `docker pull jituboss/firefly-studio` with no tag gets a real
build. The `feat/m0-m5-backlog` branch that closed the leftover M0–M5 work is **merged**
(squashed) and can be deleted. There is no open branch; start from `main`.

**What that pass shipped** (`PROJECT_PLAN.md` §16 is the full verification log):

| Items        | What landed                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| —            | Reconciled the backlog: **9 items were already built and simply unchecked** |
| E2-28, E2-27 | SMTP + Resend mail transports; HIBP breach check                            |
| E2-08/09/10  | Settings → Security: sessions, audit trail, account deletion                |
| E2-06        | TOTP two-factor with recovery codes                                         |
| E2-23/24/25  | Instance switcher, health checks, broken-connection banner                  |
| E5-11/13/16  | Bulk edit, quick add, CSV export                                            |
| E15-02/03/04 | Search operators, typo warning, recent searches                             |
| E16-04/05/06 | Attachment lightbox, manager, camera capture                                |
| —            | Navigation progress bar; transactions list rebuilt; docs reorganised        |

**What is still open in M0–M5.** `PROJECT_PLAN.md` §8 is authoritative; this is the short
version:

- **P1:** E2-19 dashboard preset, E2-20 first-run tour, E3-12 draggable dashboard,
  E4-06 reconciliation helper, E4-07 liability amortisation, E5-12 inline edit,
  E7-05 merge categories, E9-05 object-group assignment, E14-15 reconciliation test,
  E1-14 Zod schemas at the proxy boundary.
- **P2:** E1-12 Storybook, E1-15 OpenTelemetry, E2-07 WebAuthn, E3-15 forecast widget,
  E4-09 account ordering/colours, E5-18 keyboard entry, E6-09 envelope reallocation,
  E7-06 suggested category, E9-06 savings projection, E14-14 year in review.
- **Blocked, and the plan says on what:** E2-11 and E2-12 (OAuth credentials), E2-26
  (demo instance access), E5-14 and E8-07 (both need M6 resources), E14-13 (needs a job
  runner). Do not "implement" these blind — the plan records what unblocks each.

**Webhooks were dropped from scope** (E17), not deferred. Firefly III already has a screen
for them and owns the delivery log and retry state, so a second UI could only be a worse
copy; the proxy refuses those paths now and the spec-registry test pins that.

**M7 is next** — accessibility audit, i18n, PWA, perf budget. M6 shipped rules (with a
visual builder and dry run), recurring transactions, tags, currencies and exchange rates,
transaction links, the Firefly instance settings page, owner-gated administration, and the
danger zone. Its verification log, including twelve API behaviours that only showed up by
making real calls, is `PROJECT_PLAN.md` §17 — **read §17.2 before touching any M6 code.**

Two things M6 left open on purpose: the export centre (E19-01/02) is blocked by an upstream
Firefly bug — all nine `/data/export/*` endpoints return HTTP 500 on 6.5.5 — and rule
reordering is read-only.

M5 shipped ten report routes under `/reports`, a shared scope bar, a hand-rolled Sankey,
a custom report builder backed by `saved_reports`, CSV/print export, and drill-through
from any breakdown row into the transaction list. Its verification log — including the
reconciliation proving report totals match Firefly to the cent — is `PROJECT_PLAN.md` §15.

## 3. Before you write a single line — read these four files

1. **`PROJECT_PLAN.md`** — the whole plan. §7 is the authoritative Firefly API inventory
   (164 paths / 230 operations / 28 resource groups, generated from the real spec, not
   guessed). §8 is the backlog with every item's status. §12 is the definition-of-done
   checklist every item should pass. §13 and §14 are verification logs from M3 and M4 —
   read them, they document real bugs found by testing against a live Firefly instance.
2. **`adr/`** — four short architecture decision records explaining _why_ things are
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
| Testing         | Vitest (216 unit tests over `lib/`), a 70 % coverage gate in CI, Playwright for the responsive check and for driving Server Actions           | `lib/` is at ~95 % statements. `server/` and the pages are still uncovered — see §8                                                                                                                                                                                                                                                                                      |
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
4. **Everything exported from a `'use server'` file becomes a public endpoint.** Not a
   lint rule, but it has the same weight. A helper cannot be exported from an actions
   file just to share it — that publishes it. `requestMeta` had to be moved to
   `server/auth/request-meta.ts` for exactly this reason.
5. **A `server-only` module must never be imported by a Client Component.** It throws at
   build time. Pure helpers a client needs (labels, formatters, parsers) belong in
   `lib/`, re-exported from the server module if server callers want one import — see
   `lib/audit-labels.ts` and `lib/password-strength.ts`.
6. **A new write path needs a cache tag in `tagsForPath`.** Attachment writes shipped
   with no tag, so a rename kept rendering the old title for a full TTL — the page
   revalidated correctly and then re-read stale cache. If you add a resource, add its
   tag, and add any tag it invalidates indirectly.
7. **Never use `overflow-x-hidden` on a wrapper — use `overflow-x-clip`.** CSS computes a
   `visible` axis to `auto` when the other axis is not `visible`, so `overflow-x: hidden`
   turns that element into a scroll container. On the app shell root this silently broke
   **every `position: sticky` in the app** — the header declared `sticky top-0` and
   scrolled off screen on every page, measured at top=-900px after a 900px scroll, and
   nobody noticed for five milestones. `clip` is the one value that clips horizontally
   without forcing the other axis. The same trap applies to any card wrapping a sticky
   child.
8. **The Firefly OpenAPI spec is vendored, not fetched live.** `spec/firefly-iii-v1.yaml`
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
`/dashboard` instead — see the existing M6 entries for the pattern).

**A greyed-out entry is a promise, so only make one you can keep.** It is right for
something coming in a named milestone; it is wrong for anything blocked on
infrastructure or credentials, because the tag then names a milestone that can ship
without it. Two entries have been removed for this reason rather than left to mislead:
"Webhooks" (dropped from scope entirely, E17) and "Scheduled" (E14-13, still planned but
blocked on a job runner — re-add it when that lands).

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
- **Every `/insight/*` endpoint returns one entry per (resource, currency) pair.** A
  category with both EUR and USD spending comes back twice, with the same `id`. Summing
  the array adds euros to dollars and invents a number. `lib/reports.ts` handles this
  once — reuse it rather than re-deriving it per resource in M6.
- **Insight endpoints report expenses as negative** and only ever return ONE total for
  whatever range you hand them. There is no `period` parameter: a month-by-month table
  means one call per month (see the grids in the category/budget/tag reports).
- `/chart/account/overview` identifies accounts by **name only, no id**, so the name is
  the only key back to the account's type and its `include_net_worth` flag.
- **An unrecognised search operator does not error.** `/search/transactions` treats
  `catagory_is:Food` as literal text, which matches nothing — a typo returns a confident
  EMPTY result set that looks exactly like "you have no food spending". A nonsense
  operator and a real one with no matches both return 0, so you cannot tell them apart
  from the count. Every operator in `lib/search-operators.ts` was verified by finding a
  query that returns non-zero; anything outside that set is warned about in the UI.
- **Search values containing a space must be quoted.** `budget_is:Everyday spending`
  returns 0; `budget_is:"Everyday spending"` returns 68. Unquoted, the space terminates
  the operator and the rest becomes free text.
- **Search operators are ANDed**, so injecting your own `date_after:` alongside a user's
  silently narrows to the later of the two and makes their operator look broken.
- `/attachments` accepts **no filter parameters at all** — no `attachable_type`, no
  search. Filter after fetching.
- An attachment's `attachable_id` is the **journal (split) id**, not the transaction group
  id, so there is no reliable link from an attachment back to its transaction page.

**M6 added twelve more of these.** They are listed in full in `PROJECT_PLAN.md` §17.2; the
ones most likely to bite again:

- **`GET /rules/{id}/test` returns 0 matches unless `accounts[]` is supplied.** The spec
  calls it an optional filter that "limits" the test; omitting it tests NOTHING and
  answers 200 with an empty array. A rule matching 22 transactions reported 0. This is the
  single most dangerous kind of Firefly behaviour — a successful response that is silently
  wrong rather than an error.
- **A recurrence needs exactly one of `nr_of_repetitions` or `repeat_until`** — neither and
  both give the same 422, so there is no "runs forever" option to offer.
- **`POST /recurrences/{id}/trigger` takes a single `date`**; a start/end pair 500s.
- **`POST /exchange-rates` wants `from`/`to`**, not the `from_currency_code`/
  `to_currency_code` the GET response uses.
- **`/configuration` returns a bare array** with no `data` envelope — the only endpoint
  that does — and its values include objects, not just scalars.
- **`PUT /transactions/{id}` REPLACES a split's `tags` array rather than merging**, so any
  "add a tag" has to read-modify-write or it silently drops every other tag.
- **The Firefly API cannot set a user's password.** The User schema has no password field
  and Passport scopes token creation to the token-owner's own session, so there is no API
  path from admin credentials to a token for someone else. `server/managed-firefly` drives
  Firefly's registration form for exactly this reason — read its module comment before
  changing it, and re-run `preflightManagedFirefly()` after any Firefly upgrade, because it
  depends on Firefly's web pages rather than its documented API.

**Practical instruction for whoever continues this:** before implementing a write action
or trusting a response shape for a new Firefly resource (rules, recurring transactions,
tags, currencies — all of M6), make a real `curl` call against a running
instance first. See §9 for how to spin one up. Don't trust the OpenAPI spec's field
`required` list alone.

## 8. Testing approach — what exists and what deliberately doesn't

- **230 Vitest unit tests**, all over pure `lib/` modules. Run `pnpm test`, or
  `pnpm test:cov` for the gate. The newest of them (`rule-vocabulary.test.ts`) pins the
  rule builder's 36 trigger and 21 action keywords against the vendored spec, so a Firefly
  update that adds one reddens CI instead of quietly producing a UI that cannot express it.
- **`lib/` coverage is a CI gate at 70 %** (`vitest.config.mts`), currently sitting at
  ~95 % statements / 85 % branches. The single `release.yml` pipeline runs `test:cov` on
  every trigger, so the gate that reddens a pull request is the same one a release has to
  clear. This was not always true: CI and Release were separate files running `test:cov`
  and plain `pnpm test` respectively, which let a coverage regression ship in a green
  release while main was red.
- Two modules are deliberately under-covered. `image-compress.ts` needs
  `createImageBitmap` and `OffscreenCanvas`, which Node does not have, so only its guards
  and its fallback are exercised — the fallback is the part that matters, since a failure
  there must still upload the original. `env.ts` and `logger.ts` keep process-level gaps.
- **Tests here pin documented Firefly behaviour, not lines.** Most cases correspond to a
  comment in the module recording something a live instance did that the spec did not
  predict. If you change one of those modules and a test fails, re-read the comment before
  changing the test.
- **Server Actions cannot be curled.** They post over the RSC protocol, so anything
  behind one — sign-up, MFA, deletion, bulk edit, quick add — has to be driven with
  Playwright against the running container. That is how everything in the backlog pass
  was verified; the throwaway script pattern is in `PROJECT_PLAN.md` §16.
- **The rate limiter is Postgres-backed** (`rate_limits` table), not Redis. Repeated
  sign-in attempts while testing will lock you out and the symptom is "Too many sign-in
  attempts", not a bug in whatever you just wrote. `delete from rate_limits` to clear.
- **The app shell's sign-out control is the first `button[type=submit]` on every
  authenticated page.** An unscoped `page.click('button[type=submit]')` in a Playwright
  script signs you out instead of submitting the form, and the next navigation bounces to
  `/sign-in` — which looks exactly like a broken session. Scope every click:
  `page.click('main button[type=submit]')`, or better, `getByRole('button', { name: /…/ })`.
- **Screenshot the page; do not only measure it.** The transactions list passed every
  numeric check — no overflow, checkboxes aligned to the pixel — while day labels sat 24px
  right of the descriptions they labelled and the mobile bulk bar stacked its Delete
  button on top of the category picker. One screenshot showed all of it. Playwright's
  `page.screenshot()` into the scratchpad, then actually look at the image.
- **The App Router gives you no navigation events.** `router.events` is gone, and
  `history.pushState` is NOT a usable substitute: it fires AFTER the navigation resolves
  (measured at 132ms after the click on a fast route, and not at all until completion on a
  slow one). The signal that works is the RSC request — `RSC: 1` without
  `Next-Router-Prefetch: 1`. See `components/navigation-progress.tsx`.
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

**To exercise the real mail path** (E2-28) without owning a mail provider, there is a
local SMTP sink that catches everything and lets nothing leave the machine:

```bash
docker compose --profile mail up -d mailpit         # UI at http://localhost:8025
MAIL_TRANSPORT=smtp SMTP_HOST=mailpit SMTP_PORT=1025 \
  docker compose --profile app up -d --build app
```

Other opt-in env vars worth knowing: `PASSWORD_BREACH_CHECK=true` turns on the HIBP
lookup (E2-27), and `CRON_SECRET=<16+ chars>` enables `GET /api/cron/health` (E2-24),
which 404s without it.

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

| UI feature                                           | Path(s) in this repo                                                                                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard KPIs + balance chart                       | `app/(app)/dashboard/page.tsx`, `components/charts/area-trend.tsx`, `components/dashboard/widgets.tsx`                                                                                                             |
| Accounts list + type filters + landing               | `app/(app)/accounts/page.tsx`, `app/(app)/accounts/filters.tsx`                                                                                                                                                    |
| Account create/edit/detail/delete                    | `app/(app)/accounts/account-form.tsx`, `app/(app)/accounts/[id]/page.tsx`, `app/(app)/accounts/new/page.tsx`, `app/(app)/accounts/[id]/delete-button.tsx`                                                          |
| Transactions list + pagination + search              | `app/(app)/transactions/page.tsx`, `app/(app)/transactions/table.tsx`, `app/(app)/transactions/filters.tsx`, `app/(app)/transactions/pagination.tsx`, `app/(app)/transactions/saved-views.tsx`                     |
| Transaction create/edit/split/duplicate              | `app/(app)/transactions/transaction-form.tsx`, `app/(app)/transactions/[id]/edit/page.tsx`, `app/(app)/transactions/[id]/page.tsx`, `app/(app)/transactions/new/page.tsx`, `server/firefly/transaction-actions.ts` |
| Attachments (upload/download/delete)                 | `components/transactions/attachments.tsx`, `app/api/attachments/route.ts`                                                                                                                                          |
| Budgets + limits + without-budget view               | `app/(app)/budgets/page.tsx`, `app/(app)/budgets/budget-form.tsx`, `app/(app)/budgets/[id]/page.tsx`, `app/(app)/budgets/[id]/limit-form.tsx`, `app/(app)/budgets/transactions-without-budget/page.tsx`            |
| Available budgets landing page                       | `app/(app)/available-budgets/page.tsx`                                                                                                                                                                             |
| Categories + uncategorised inbox                     | `app/(app)/categories/page.tsx`, `app/(app)/categories/category-form.tsx`, `app/(app)/categories/uncategorised/page.tsx`                                                                                           |
| Bills / subscriptions + calendar                     | `app/(app)/bills/page.tsx`, `app/(app)/bills/bill-form.tsx`, `app/(app)/bills/calendar/page.tsx`                                                                                                                   |
| Piggy banks                                          | `app/(app)/piggy-banks/page.tsx`, `app/(app)/piggy-banks/piggy-form.tsx`, `app/(app)/piggy-banks/[id]/page.tsx`, `app/(app)/piggy-banks/[id]/adjust-form.tsx`                                                      |
| Object groups                                        | `app/(app)/object-groups/page.tsx`, `app/(app)/object-groups/new/page.tsx`                                                                                                                                         |
| Reports shell (scope bar, tabs, print)               | `app/(app)/reports/layout.tsx`, `components/reports/report-scope-bar.tsx`, `components/reports/report-tabs.tsx`, the `@media print` block in `app/globals.css`                                                     |
| Reports: net worth / income vs expense               | `app/(app)/reports/net-worth/page.tsx`, `app/(app)/reports/income-expense/page.tsx`, `components/charts/net-worth-area.tsx`, `components/charts/income-expense-bars.tsx`                                           |
| Reports: category / budget / tag                     | `app/(app)/reports/categories/page.tsx`, `app/(app)/reports/budgets/page.tsx`, `app/(app)/reports/tags/page.tsx`, `components/reports/monthly-grid.tsx`                                                            |
| Reports: account / subscription                      | `app/(app)/reports/accounts/page.tsx`, `app/(app)/reports/bills/page.tsx`                                                                                                                                          |
| Cash-flow Sankey                                     | `app/(app)/reports/cash-flow/page.tsx`, `lib/sankey.ts`, `components/charts/sankey-flow.tsx`                                                                                                                       |
| Custom report builder + saved reports                | `app/(app)/reports/custom/page.tsx`, `app/(app)/reports/custom/builder-form.tsx`, `lib/custom-report.ts`, `server/reports.ts`, `server/reports-actions.ts`                                                         |
| Reporting arithmetic + scoped queries                | `lib/reports.ts`, `lib/report-scope.ts`, `server/firefly/report-queries.ts`                                                                                                                                        |
| Report export (CSV, print-to-PDF)                    | `components/reports/report-export.tsx`                                                                                                                                                                             |
| Settings → connections manager                       | `app/(settings)/settings/connections/page.tsx`, `app/(settings)/settings/connections/connection-card.tsx`                                                                                                          |
| Navigation progress bar                              | `components/navigation-progress.tsx`                                                                                                                                                                               |
| Checkbox primitive (indeterminate)                   | `components/ui/checkbox.tsx`                                                                                                                                                                                       |
| Transactions grid, quick add, search bar             | `app/(app)/transactions/grid.tsx`, `app/(app)/transactions/quick-add.tsx`, `app/(app)/transactions/search-bar.tsx`, `app/(app)/transactions/table.tsx`                                                             |
| Settings → security (MFA, sessions, audit, deletion) | `app/(settings)/settings/security/`, `server/auth/security.ts`, `server/auth/security-actions.ts`, `server/auth/mfa.ts`, `lib/totp.ts`                                                                             |
| Mail transports (console / SMTP / Resend)            | `server/mail/index.ts`                                                                                                                                                                                             |
| Password strength + breach check                     | `lib/password-strength.ts`, `server/auth/breach.ts`, `components/auth/strength-meter.tsx`                                                                                                                          |
| Connection switcher, health, banner                  | `components/connection-switcher.tsx`, `components/connection-banner.tsx`, `server/connections/health.ts`, `app/api/cron/health/route.ts`                                                                           |
| Transaction bulk edit / quick add / CSV              | `app/(app)/transactions/grid.tsx`, `app/(app)/transactions/quick-add.tsx`                                                                                                                                          |
| Search operators + recent searches                   | `lib/search-operators.ts`, `app/(app)/transactions/search-bar.tsx`                                                                                                                                                 |
| Attachment manager + preview + capture               | `app/(app)/attachments/`, `components/transactions/attachment-preview.tsx`, `lib/image-compress.ts`                                                                                                                |
| App shell / navigation / command palette             | `components/app-shell.tsx`, `components/command-palette.tsx`                                                                                                                                                       |
