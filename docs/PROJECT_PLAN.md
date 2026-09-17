# Firefly III Front-End Client — Project Plan & Backlog

> **Working title:** Firefly Studio
> **Document status:** v1.0 — living document, use as the backlog of record
> **Last updated:** 2026-09-16
> **API target:** Firefly III **v6.5.5** API v1 (164 paths / 230 operations, 28 resource groups) — spec generated 2026-03-15
> **Minimum supported Firefly III:** 6.2.0 (degrade gracefully to 6.1.x)

---

## 1. Overview

### 1.1 What we are building

A modern, self-hostable web client for [Firefly III](https://firefly-iii.org) that replaces its stock UI with a
professional personal-accounting experience: a real dashboard, first-class reporting, fast transaction entry, and
complete coverage of the Firefly III REST API.

The client is **not** a fork of Firefly III. Firefly remains the system of record. Our app is a presentation and
workflow layer that owns its own identity system, so a household can sign in to _our_ app and attach _their_ Firefly
instance.

### 1.2 Two-tier identity — the core architectural idea

```
┌─────────────┐   our session cookie   ┌──────────────────────┐   Bearer PAT    ┌──────────────┐
│   Browser   │ ─────────────────────► │  Our Next.js server  │ ──────────────► │ Firefly III  │
│  (no PAT)   │ ◄───────────────────── │  + Postgres          │ ◄────────────── │  instance    │
└─────────────┘      JSON / RSC        └──────────────────────┘   api/v1/*      └──────────────┘
                                          PAT encrypted at rest
```

1. **App identity** — email + password (Argon2id) against our own Postgres. Sessions, MFA, password reset, audit log.
2. **Firefly identity** — after sign-up the user is onboarded to supply their Firefly **base URL** and **Personal
   Access Token**. The PAT is encrypted (AES-256-GCM envelope) and stored in Postgres.
3. **All Firefly traffic is proxied server-side.** The PAT never reaches the browser. This gives us caching, rate
   limiting, audit logging, SSRF protection, and support for Firefly instances that are not publicly reachable or do
   not send CORS headers.

### 1.3 Goals

- **Complete API coverage** — every Firefly III v1 resource group is reachable from the UI (see §7 inventory).
- **Best-in-class UX** — sub-second perceived navigation, keyboard-first transaction entry, command palette,
  responsive down to 375px, light/dark, WCAG 2.2 AA.
- **Reporting that Firefly doesn't have** — net worth trend, cash-flow Sankey, budget burn-down, savings rate,
  subscription forecast, custom report builder, scheduled exports.
- **Safe by default** — encrypted secrets, strict SSRF controls, no PAT in the client bundle or logs.
- **Self-hostable** — single `docker compose up` for the whole stack.

### 1.4 Non-goals (v1)

- Bank aggregation / Open Banking imports (Firefly has the Data Importer for this — we link to it).
- Being a Firefly III replacement or writing directly to Firefly's database.
- Multi-tenant SaaS billing, org/team hierarchies beyond Firefly's own `user_groups`.
- Native mobile apps (PWA only in v1).

### 1.5 Success criteria

| Metric                                             | Target             |
| -------------------------------------------------- | ------------------ |
| Time from sign-up to first populated dashboard     | < 3 minutes        |
| Dashboard TTI on a 1,000-transaction account (p75) | < 1.5 s            |
| Transaction list p95 server response (cached)      | < 200 ms           |
| API resource groups with UI coverage               | 28 / 28            |
| Lighthouse: Perf / A11y / Best practices           | ≥ 90 / ≥ 95 / ≥ 95 |
| Automated test coverage on `lib/` and `server/`    | ≥ 80 %             |

---

## 2. Tech stack (decided)

| Layer           | Choice                                                                                    | Rationale                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 15**, App Router, React 19, TypeScript `strict`                                 | One repo, one deploy; Server Components let us keep the PAT server-side with no separate API tier |
| Styling         | **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)                                    | Accessible primitives, fully ownable components, fast theming                                     |
| Server state    | **TanStack Query v5**                                                                     | Cache, background refetch, optimistic updates, infinite lists                                     |
| Tables          | **TanStack Table v8** + virtualiser                                                       | 10k-row transaction grids                                                                         |
| Charts          | **Recharts** for standard charts, **D3 (`d3-sankey`, `d3-hierarchy`)** for Sankey/treemap | Recharts covers 90 %; D3 for the two shapes it can't do                                           |
| Forms           | **react-hook-form** + **Zod**                                                             | Shared schemas between client and route handlers                                                  |
| DB              | **PostgreSQL 16**                                                                         | Required by brief                                                                                 |
| ORM             | **Drizzle ORM** + `drizzle-kit` migrations                                                | SQL-first, typed, no codegen daemon                                                               |
| Auth            | **Direct DB sessions** (Argon2id + `sessions` table)                                      | Auth.js forces JWT with Credentials, defeating revocation — see ADR-0004                          |
| Hashing         | **Argon2id** (`@node-rs/argon2`)                                                          | OWASP recommendation                                                                              |
| Cache / queue   | **Redis 7** (optional; Postgres fallback)                                                 | Response cache, rate limits, BullMQ jobs                                                          |
| Background jobs | **BullMQ**                                                                                | Scheduled exports, connection health checks                                                       |
| Validation      | **Zod** schemas generated from the Firefly OpenAPI spec                                   | Single source of truth                                                                            |
| Testing         | **Vitest** (unit), **Playwright** (e2e), **MSW** (API mocks)                              | —                                                                                                 |
| Observability   | **Pino** logs, **OpenTelemetry** traces, **Sentry** errors                                | —                                                                                                 |
| Packaging       | **Docker Compose** (app + postgres + redis), multi-stage build                            | Self-host story                                                                                   |

### 2.1 Repository layout

```
firefly-studio/
├─ app/
│  ├─ (marketing)/                 # public landing, docs
│  ├─ (auth)/                      # sign-in, sign-up, verify, reset
│  ├─ (onboarding)/                # connection wizard
│  ├─ (app)/                       # authenticated shell
│  │  ├─ dashboard/
│  │  ├─ accounts/
│  │  ├─ transactions/
│  │  ├─ budgets/  categories/  bills/  piggy-banks/
│  │  ├─ recurring/  rules/  tags/
│  │  ├─ reports/
│  │  ├─ currencies/  admin/
│  │  └─ settings/
│  └─ api/
│     ├─ auth/[...nextauth]/
│     ├─ ff/[...path]/             # the Firefly proxy
│     └─ health/
├─ server/
│  ├─ db/            # drizzle schema, migrations, queries
│  ├─ auth/          # session, mfa, password policy
│  ├─ crypto/        # envelope encryption, key rotation
│  ├─ firefly/       # typed client, SSRF guard, cache, rate limit
│  └─ jobs/          # BullMQ workers
├─ lib/              # shared pure code: money, dates, formatters, zod schemas
├─ components/       # design system + feature components
├─ spec/             # vendored Firefly OpenAPI yaml + codegen output
├─ tests/            # vitest + playwright
└─ docker/
```

---

## 3. Data model — our Postgres

Firefly owns all financial data. Our database owns **identity, connections, preferences, and derived artefacts only**.

| Table                 | Purpose                            | Key columns                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`               | App identity                       | `id`, `email` (citext, unique), `password_hash`, `email_verified_at`, `display_name`, `locale`, `timezone`, `status`, `created_at`, `deleted_at`                                                                                                                                                                                        |
| `sessions`            | Revocable server sessions          | `id`, `user_id`, `token_hash`, `expires_at`, `ip`, `user_agent`, `last_seen_at`                                                                                                                                                                                                                                                         |
| `oauth_accounts`      | Optional social login              | `provider`, `provider_account_id`, `user_id`                                                                                                                                                                                                                                                                                            |
| `email_tokens`        | Verify + reset, single-use         | `user_id`, `purpose`, `token_hash`, `expires_at`, `consumed_at`                                                                                                                                                                                                                                                                         |
| `mfa_credentials`     | TOTP + WebAuthn                    | `user_id`, `type`, `secret_ciphertext`, `confirmed_at`                                                                                                                                                                                                                                                                                  |
| `mfa_recovery_codes`  | One-time codes                     | `user_id`, `code_hash`, `used_at`                                                                                                                                                                                                                                                                                                       |
| `firefly_connections` | **The heart of onboarding**        | `id`, `user_id`, `label`, `base_url`, `token_ciphertext`, `token_nonce`, `token_auth_tag`, `key_version`, `token_hint` (last 4), `firefly_version`, `api_version`, `primary_currency`, `remote_user_email`, `status` (`pending`/`ok`/`unauthorised`/`unreachable`/`version_unsupported`), `last_checked_at`, `last_error`, `is_default` |
| `user_preferences`    | UI state                           | `user_id`, `theme`, `number_format`, `date_format`, `week_start`, `default_account_ids[]`, `dashboard_layout` (jsonb), `hide_balances`                                                                                                                                                                                                  |
| `saved_views`         | Transaction filter presets         | `user_id`, `name`, `entity`, `query` (jsonb), `is_pinned`, `sort_order`                                                                                                                                                                                                                                                                 |
| `saved_reports`       | Report definitions                 | `user_id`, `name`, `type`, `config` (jsonb), `schedule_cron`, `deliver_to`                                                                                                                                                                                                                                                              |
| `report_runs`         | Generated exports                  | `saved_report_id`, `status`, `file_path`, `generated_at`, `expires_at`                                                                                                                                                                                                                                                                  |
| `notifications`       | In-app inbox                       | `user_id`, `kind`, `payload` (jsonb), `read_at`                                                                                                                                                                                                                                                                                         |
| `audit_log`           | Security trail                     | `user_id`, `action`, `entity`, `entity_id`, `ip`, `user_agent`, `metadata` (jsonb), `created_at`                                                                                                                                                                                                                                        |
| `api_cache`           | Proxy response cache (if no Redis) | `cache_key`, `user_id`, `payload` (jsonb), `etag`, `expires_at`                                                                                                                                                                                                                                                                         |
| `rate_limits`         | Sliding window counters            | `bucket`, `window_start`, `count`                                                                                                                                                                                                                                                                                                       |
| `jobs` / BullMQ       | Background work                    | —                                                                                                                                                                                                                                                                                                                                       |
| `feature_flags`       | Progressive rollout                | `key`, `enabled`, `rules` (jsonb)                                                                                                                                                                                                                                                                                                       |

**Invariants**

- No table stores account balances, transaction amounts, or any Firefly financial record. Cached payloads in
  `api_cache` are short-TTL, per-user, and encrypted at rest at the volume level.
- `firefly_connections.token_ciphertext` is never selected into a Server Component render path — only the proxy
  reads it, and only through `server/crypto`.
- Deleting a user cascades to every table and purges their cache namespace.

---

## 4. Security model

### 4.1 Secret handling

- **Envelope encryption.** A 32-byte master key (`APP_ENCRYPTION_KEY`, base64) derives a per-connection DEK via
  HKDF-SHA256 keyed on `connection.id`. PAT is sealed with **AES-256-GCM**; `nonce` and `auth_tag` stored alongside.
- `key_version` column supports rotation: a background job re-wraps all rows when a new master key is introduced.
- The PAT is **write-only from the UI's perspective** — the API returns `token_hint` (`••••4f2a`) and never the value.
- Custom `redact()` Pino serialiser drops `authorization`, `token`, `password`, `cookie` from every log line.

### 4.2 SSRF protection (critical — users supply the base URL)

Self-hosted Firefly instances often live on a LAN, so we cannot simply block private ranges. Instead:

- `FIREFLY_ALLOW_PRIVATE_NETWORKS` env flag (default `false` for hosted, `true` for self-host image).
- Scheme must be `https` unless `FIREFLY_ALLOW_INSECURE_HTTP=true`.
- Resolve DNS once, validate the resolved IP against the policy, then **connect to that pinned IP** with the original
  `Host` header — closes the DNS-rebinding window.
- Redirects are **not** followed. Blocked: `file:`, `gopher:`, credentials in URL, non-standard ports unless
  allowlisted, `169.254.169.254` and cloud metadata ranges (always, regardless of flag).
- Per-connection request timeout (10 s), response size cap (25 MB), max concurrent requests per user.

### 4.3 Proxy policy

- Route: `POST|GET|PUT|DELETE /api/ff/[...path]` → `${base_url}/api/v1/${path}`.
- Injects `Authorization: Bearer <pat>`, `Accept: application/vnd.api+json`, `Content-Type: application/json`.
- Captures Firefly's `X-Trace-Id` into our trace span for cross-system debugging.
- **Path allowlist** derived from the OpenAPI spec. Denied unless explicitly enabled in settings:
  `/v1/data/destroy`, `/v1/data/purge`, `/v1/cron/{cliToken}`, `/v1/users*` (admin-only toggle).
- Destructive operations (`DELETE`, `/data/*`) require a re-auth step-up and write an `audit_log` row.

### 4.4 Application security

- Argon2id (m=19456, t=2, p=1), password min 12 chars, zxcvbn strength meter, HIBP k-anonymity breach check.
- Login rate limit: 5 / 15 min per email + IP, exponential backoff, generic error messages (no user enumeration).
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, rotating on privilege change; absolute + idle expiry.
- CSRF: double-submit token on all non-GET route handlers.
- Strict CSP with nonces, `frame-ancestors 'none'`, HSTS, `Referrer-Policy: same-origin`, COOP/CORP.
- Optional TOTP + WebAuthn MFA; recovery codes shown once.

---

## 5. UX & design direction

### 5.1 Principles

1. **Numbers first.** Typography is tabular-lining; amounts right-aligned, colour-coded but never colour-only
   (a `+`/`−` glyph and an accessible label always accompany the hue).
2. **Every screen answers one question.** Dashboard = "how am I doing?"; Transactions = "what happened?";
   Reports = "why?".
3. **Keyboard-first.** `⌘K` command palette, `N` new transaction, `/` search, `G then A/T/B` navigation.
4. **Progressive disclosure.** Splits, foreign amounts, and metadata are collapsed until needed.
5. **Never a blank screen.** Skeletons, empty states with a primary action, and optimistic writes.

### 5.2 Design system

- **Colour:** neutral slate base; semantic tokens `income`, `expense`, `transfer`, `warning`, `over-budget`.
  Full light + dark palettes defined as CSS custom properties on `:root`, re-declared under
  `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` so a manual toggle wins in both directions.
- **Type:** Inter (UI) + a tabular-numeral face for money. Scale 12/14/16/20/24/32/40.
- **Spacing:** 4px base, 8-point rhythm. Density toggle (comfortable / compact) for the transaction grid.
- **Charts:** one categorical palette validated for deuteranopia/protanopia; sequential ramp for heatmaps;
  diverging ramp for over/under-budget.
- **Motion:** 150 ms ease-out for state, 250 ms for layout; all respect `prefers-reduced-motion`.

### 5.3 Information architecture

```
Dashboard
Accounts ──► Account detail (balance chart, transactions, piggy banks, attachments)
Transactions ──► Detail / Split editor / Bulk edit
Budgets ──► Budget detail (limits, spend, transactions)
Categories · Bills (Subscriptions) · Piggy banks · Recurring
Reports ──► Net worth · Income vs Expense · Categories · Budget performance · Cash flow · Tags · Custom
Rules ──► Rule groups, rule builder, test/trigger
Tags · Currencies & rates
Settings ──► Profile · Security (MFA, sessions) · Firefly connections · Preferences · Data · About
Admin (if Firefly user is owner) ──► Users, user groups, configuration, cron
```

---

## 6. Delivery plan — milestones

| #      | Milestone                  | Scope                                                                   | Exit criteria                                                       | Est.  |
| ------ | -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ----- |
| **M0** | Foundation ✅              | Repo, CI, Docker, design tokens, DB migrations, OpenAPI codegen         | `docker compose up` serves a themed shell; migrations run; CI green | 2 wks |
| **M1** | Auth & onboarding ✅       | Sign-up/in, verify, reset, sessions, connection wizard, encrypted PAT   | A new user can sign up and attach a Firefly instance end-to-end     | 2 wks |
| **M2** | Read core ✅               | Proxy + cache, dashboard v1, accounts, transaction list, search         | Dashboard and transaction list render live Firefly data             | 3 wks |
| **M3** | Write core ✅              | Transaction create/edit/delete, splits, attachments, bulk ops           | Full transaction lifecycle without touching Firefly's own UI        | 2 wks |
| **M4** | Money management ✅        | Budgets, limits, categories, bills, piggy banks, object groups          | All four resource families CRUD-complete                            | 3 wks |
| **M5** | Reporting ✅               | Insight + chart endpoints, 8 standard reports, builder, exports         | Reports match Firefly's own figures to the cent — verified, §15     | 3 wks |
| **M6** | Automation & the long tail | Rules, recurring, tags, currencies, exchange rates, links, admin        | 27/28 API groups covered (webhooks dropped, E17)                    | 3 wks |
| **M7** | Polish                     | A11y audit, i18n, PWA, perf budget, empty/error states, onboarding tour | Lighthouse targets met; axe clean                                   | 2 wks |
| **M8** | Hardening & launch         | Pen-test fixes, load test, docs, release image, backup/restore          | v1.0 tagged and documented                                          | 2 wks |

### 6.1 Effort reconciliation

The backlog in §8 totals **338 ideal engineering days** across 219 items
(was 345 across 224; E17 Webhooks was dropped — 5 items, 7 days):

| Slice                              | Ideal days | 1 engineer @ 70 % focus | 2 engineers | 3 engineers |
| ---------------------------------- | ---------- | ----------------------- | ----------- | ----------- |
| **P0 only** (thin but complete v1) | 168 d      | ~48 wks                 | ~24 wks     | ~17 wks     |
| **P0 + P1** (the real v1.0)        | 296 d      | ~85 wks                 | ~42 wks     | ~30 wks     |
| Everything incl. P2                | 338 d      | ~97 wks                 | ~48 wks     | ~33 wks     |

The milestone week-counts above are **calendar durations for a three-engineer team** (one on platform/auth, one on
transactions/accounts, one on reporting/design system), which is the shape this plan assumes. If you are building
this solo, ship **P0 only** and treat P1 as v1.1 — that is roughly 11 months at 70 % focus, or about 5 months if you
cut E10, E11, E17, E19 and E20 entirely and link out to Firefly's own UI for those.

**Recommended solo path:** M0 → M1 → M2 → M3 → M5 (reports are the reason to use this over stock Firefly) → M4 → M7,
deferring M6 wholesale.

---

## 7. Firefly III API coverage inventory

Authoritative list from the v6.5.5 OpenAPI spec. Every row must have a UI home before v1.0 ships.

| Group                     | Paths                                                                                                                                                                                         | Key operations                 | Owning epic      | Milestone |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------- | --------- |
| `about`                   | `/about`, `/about/user`                                                                                                                                                                       | version + user probe           | E2 Onboarding    | M1        |
| `accounts`                | `/accounts`, `/accounts/{id}`, `/{id}/transactions`, `/{id}/attachments`, `/{id}/piggy-banks`                                                                                                 | CRUD + relations               | E4               | M2/M4     |
| `transactions`            | `/transactions`, `/{id}`, `/{id}/attachments`, `/{id}/piggy-bank-events`, `/transaction-journals/{id}`, `/transaction-journals/{id}/links`                                                    | CRUD, splits, journals         | E5               | M2/M3     |
| `budgets`                 | `/budgets`, `/{id}`, `/{id}/limits`, `/{id}/limits/{limitId}`, `/budget-limits`, `/{id}/transactions`, `/{id}/attachments`, `/budgets/transactions-without-budget`                            | CRUD + limits                  | E6               | M4        |
| `available_budgets`       | `/available-budgets`, `/{id}`                                                                                                                                                                 | read-only envelope totals      | E6               | M4        |
| `categories`              | `/categories`, `/{id}`, `/{id}/transactions`, `/{id}/attachments`                                                                                                                             | CRUD                           | E7               | M4        |
| `bills`                   | `/bills`, `/{id}`, `/{id}/transactions`, `/{id}/rules`, `/{id}/attachments`                                                                                                                   | CRUD + forecast                | E8               | M4        |
| `piggy_banks`             | `/piggy-banks`, `/{id}`, `/{id}/events`, `/{id}/attachments`                                                                                                                                  | CRUD + savings events          | E9               | M4        |
| `object_groups`           | `/object-groups`, `/{id}`, `/{id}/piggy-banks`, `/{id}/bills`                                                                                                                                 | grouping                       | E9               | M4        |
| `recurrences`             | `/recurrences`, `/{id}`, `/{id}/transactions`, `/{id}/trigger`                                                                                                                                | CRUD + manual fire             | E10              | M6        |
| `rules`                   | `/rules`, `/{id}`, `/{id}/test`, `/{id}/trigger`                                                                                                                                              | CRUD + dry-run                 | E11              | M6        |
| `rule_groups`             | `/rule-groups`, `/{id}`, `/{id}/rules`, `/{id}/test`, `/{id}/trigger`                                                                                                                         | CRUD + batch run               | E11              | M6        |
| `tags`                    | `/tags`, `/{tag}`, `/{tag}/transactions`, `/{tag}/attachments`                                                                                                                                | CRUD + cloud                   | E12              | M6        |
| `currencies`              | `/currencies`, `/{code}`, `/enable`, `/disable`, `/primary`, `/currencies/primary`, 7 × `/{code}/{relation}`                                                                                  | CRUD + activation              | E13              | M6        |
| `currency_exchange_rates` | `/exchange-rates` (+ `/{id}`, `/{from}/{to}`, `/{from}/{to}/{date}`, `/by-date/{date}`, `/by-currencies/{from}/{to}`)                                                                         | multi-currency rates           | E13              | M6        |
| `insight`                 | 24 endpoints: `expense                                                                                                                                                                        | income                         | transfer`×`asset | expense   | revenue | category | budget | bill | tag | total`+`no-*` variants | the reporting engine | E14 | M5  |
| `charts`                  | `/chart/account/overview`, `/chart/balance/balance`, `/chart/budget/overview`, `/chart/category/overview`                                                                                     | pre-computed series            | E14              | M5        |
| `summary`                 | `/summary/basic`                                                                                                                                                                              | dashboard KPI tiles            | E3               | M2        |
| `search`                  | `/search/accounts`, `/search/transactions`                                                                                                                                                    | global search                  | E15              | M2        |
| `autocomplete`            | 17 endpoints (accounts, bills, budgets, categories, currencies, object-groups, piggy-banks ±balance, recurring, rule-groups, rules, subscriptions, tags, transaction-types, transactions ±id) | every typeahead in the app     | E5/E21           | M3        |
| `attachments`             | `/attachments`, `/{id}`, `/{id}/download`, `/{id}/upload`                                                                                                                                     | receipts                       | E16              | M3        |
| `links`                   | `/link-types`, `/{id}`, `/{id}/transactions`, `/transaction-links`, `/transaction-links/{id}`                                                                                                 | refunds, reimbursements        | E5               | M6        |
| `data`                    | `/data/export/{9 resources}`, `/data/bulk/transactions`, `/data/destroy`, `/data/purge`                                                                                                       | export + bulk + danger zone    | E19              | M6        |
| `webhooks`                | `/webhooks`, `/{id}`, `/{id}/messages`, `/messages/{messageId}`, `/attempts`, `/{id}/submit`, `/{id}/trigger-transaction/{txId}`                                                              | **out of scope** — see E17     | —                | —         |
| `preferences`             | `/preferences`, `/preferences/{name}`                                                                                                                                                         | Firefly-side prefs             | E18              | M6        |
| `configuration`           | `/configuration`, `/configuration/{name}`                                                                                                                                                     | instance config (admin)        | E20              | M6        |
| `users`                   | `/users`, `/users/{id}`                                                                                                                                                                       | admin only, gated              | E20              | M6        |
| `user_groups`             | `/user-groups`, `/{id}`                                                                                                                                                                       | financial administrations      | E20              | M6        |
| _(misc)_                  | `/batch/finish`, `/cron/{cliToken}`                                                                                                                                                           | batch completion, cron trigger | E18              | M6        |

**API behaviours we must handle globally**

- Auth: `Authorization: Bearer <PAT>` (spec's `local_bearer_auth`). OAuth2 authorization-code flow also exists —
  out of scope for v1, noted as E2-12.
- Content type: `application/vnd.api+json` on `Accept`.
- Pagination: `?page=` with `meta.pagination.{total,count,per_page,current_page,total_pages}` — a shared
  `usePaginatedQuery` hook wraps this once.
- `X-Trace-Id` request header is accepted on most endpoints; we generate one per request and log it.
- Dates are `YYYY-MM-DD`; datetimes are ISO-8601 with offset. **Never** parse in local time — see E21-09.
- Amounts are **strings** to preserve precision. All arithmetic uses `decimal.js`; `Number` is banned in money paths
  by an ESLint rule.

---

## 8. Backlog

Legend — **P0** blocks the milestone · **P1** should ship in the milestone · **P2** nice to have / fast-follow.
Estimates are ideal engineering days.

### E1 · Foundation & tooling — M0

**Status: complete** (2026-09-16). Three items were carried out of the milestone rather than cut — they are listed below with new IDs so nothing is lost.

- [x] **E1-01** `P0` `2d` Scaffold Next.js 15 + TS strict + ESLint/Prettier + path aliases
- [x] **E1-02** `P0` `1d` Tailwind v4 setup, design tokens (colour/space/type) as CSS custom properties
- [x] **E1-03** `P0` `1d` shadcn/ui install, theme provider, light/dark/system toggle with no FOUC
- [x] **E1-04** `P0` `2d` Docker Compose: app, postgres:16, redis:7, healthchecks, seed script
- [x] **E1-05** `P0` `1d` Drizzle setup, first migration, `db:generate`/`db:migrate`/`db:studio` scripts
- [x] **E1-06** `P0` `2d` Vendor Firefly OpenAPI yaml into `spec/`; codegen TS types + `spec:update` script with diff report — **Zod schema generation deferred to M2** (see E1-14); the generated `operations.ts` registry covers what the proxy needs now
- [x] **E1-07** `P0` `1d` Env validation with Zod at boot — fail fast on missing `APP_ENCRYPTION_KEY`, `DATABASE_URL`
- [x] **E1-08** `P0` `1d` GitHub Actions: typecheck, lint, unit, build, Docker image on tag
- [x] **E1-09** `P1` `1d` Pino structured logging + redaction serialiser + request-id module
- [x] **E1-10** `P1` `1d` Sentry wiring (opt-in, PII off, headers/cookies/body stripped) + source-map config — **OTLP tracing exporter deferred** (see E1-15)
- [x] **E1-11** `P1` `1d` Error boundary, `not-found`, `error.tsx`, `global-error.tsx`, global toast system
- [ ] **E1-12** `P2` `1d` Storybook for the design system — _deferred; revisit when the primitive set stabilises in M2_
- [x] **E1-13** `P1` `0.5d` `CONTRIBUTING.md`, ADR folder (3 records), PR template

**Carried out of M0:**

- [ ] **E1-14** `P1` `2d` Generate Zod request/response schemas from the vendored spec, for runtime validation at the proxy boundary — needed by M2, not by M0
- [ ] **E1-15** `P2` `1d` OpenTelemetry Node SDK + OTLP exporter registered in `instrumentation.ts`
- [x] **E1-16** `P1` `0.5d` Approve `@sentry/cli` builds in the release job only, and wire `SENTRY_AUTH_TOKEN` so source maps actually upload — **already shipped**, reconciled 2026-09-17: the release workflow owns the upload and sets `SENTRY_AUTH_TOKEN` (commit 7d5da9b)

**What M0 delivered**

| Exit criterion                            | Evidence                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `docker compose up` serves a themed shell | Verified end to end: app + postgres + redis all healthy, migrations applied on boot, non-root uid 1001, `/dashboard` returns 200 |
| Migrations run                            | Applied on container boot under a Postgres advisory lock; 16 tables; `citext` + `pgcrypto` enabled                               |
| CI green                                  | format, lint, typecheck, 43 unit tests (78.6% coverage on `lib/`), migrate-on-clean-db, build, image, spec-drift                 |
| Generated API surface                     | 164 paths / 230 operations / 28 tags from Firefly III v6.5.5, 8 operations auto-guarded                                          |
| Bundle baseline                           | 103 kB shared first-load JS; 340 MB production image                                                                             |

### E2 · Authentication & onboarding — M1

**Status: complete** (2026-09-17). P0 scope delivered and verified against a live Firefly III v6.5.5
instance. P1/P2 items are carried forward with their original IDs — none were silently dropped.

**Our own auth**

- [x] **E2-01** `P0` `2d` `users`/`sessions` schema + database-backed sessions — **implemented directly, not via Auth.js v5**; Auth.js forces JWT sessions with the Credentials provider, which defeats server-side revocation. See [ADR-0004](adr/0004-hand-rolled-sessions-instead-of-authjs.md).
- [x] **E2-02** `P0` `2d` Sign-up: email + password, Argon2id (m=19456, t=2, p=1), 12-char floor, inline strength meter — **zxcvbn and the HIBP breach check were cut** (see E2-27); non-enumerating duplicate-email response
- [x] **E2-03** `P0` `1d` Email verification (single-use SHA-256-hashed token, 24 h expiry, atomic consume) + resend with rate limit
- [x] **E2-04** `P0` `1d` Sign-in with rate limiting (5/15 min per email, 20/15 min per IP) and non-enumerating errors; constant-time dummy hash so response time does not reveal account existence
- [x] **E2-05** `P0` `1d` Password reset request + confirm; revokes every session for the user
- [x] **E2-06** `P1` `2d` TOTP MFA: enrol, QR, verify, recovery codes (shown once) — _schema in place (`mfa_credentials`, `mfa_recovery_codes`), UI deferred_ — TOTP hand-written against the RFC 6238 vectors (`lib/totp.ts`, 20 tests); enrol/QR/confirm on Settings → Security, challenge at `/sign-in/verify`, single-use recovery codes
- [ ] **E2-07** `P2` `2d` WebAuthn/passkey as a second factor and as a login method
- [x] **E2-08** `P1` `1d` Active-sessions list with device/IP/last-seen and remote revoke — _`revokeAllSessions` exists; the UI does not_ — `app/(settings)/settings/security/` — device list, per-session and revoke-all-others, backed by `server/auth/security.ts`
- [x] **E2-09** `P1` `1d` `audit_log` viewer in Settings → Security — _the writer ships and records 9 event types; the viewer does not_ — same page — the audit trail with failed sign-ins called out and a type filter
- [x] **E2-10** `P1` `1d` Account deletion: confirm, cascade, purge cache namespace, tombstone — soft delete behind password re-auth plus a typed DELETE; purges the connection cache namespace first, keeps the tombstone so audit rows stay meaningful
- [ ] **E2-11** `P2` `1d` Optional OAuth sign-in (Google/GitHub) with account linking — **Blocked on external setup:** needs Google/GitHub OAuth client credentials and a registered redirect URI. Nothing to verify against without them.
- [ ] **E2-12** `P2` `3d` Firefly **OAuth2** connection option (authorization-code + refresh) as an alternative to PAT — **Blocked on external setup:** needs an OAuth2 client registered on a Firefly III instance. PAT onboarding covers the same ground today.

**Onboarding journey**

- [x] **E2-13** `P0` `1d` Route guard forces onboarding until a connection is `ok` — edge middleware checks cookie presence, each authenticated layout re-validates against Postgres
- [x] **E2-14** `P0` `2d` **Step 1 — Base URL.** Normalisation (adds scheme, strips trailing `/` and `/api/v1`), SSRF guard, then a reachability probe. **Redefined: `/api/v1/about` requires authentication**, so an unauthenticated 401 with a JSON body is the positive signal that a Firefly III API is present. Named errors for DNS failure, redirect, HTML body, 404 and timeout.
- [x] **E2-15** `P0` `2d` **Step 2 — Personal Access Token.** Inline written instructions plus a deep link to the instance's profile page; validated with `GET /api/v1/about/user`, which also confirms the remote account's email and role
- [x] **E2-16** `P0` `2d` Envelope-encrypt and persist the PAT — AES-256-GCM under an HKDF-SHA256 key derived per connection id, so ciphertext moved between rows will not decrypt; stores `token_hint`, `key_version`, status
- [x] **E2-17** `P0` `1d` **Step 3 — Version gate.** Runs in step 2, not step 1, because reading the version needs a token. Blocks below `MIN_FIREFLY_VERSION`, warns below `RECOMMENDED_FIREFLY_VERSION`
- [x] **E2-18** `P0` `2d` **Step 4 — Personalise.** Number/date format, week start, and featured accounts from `/accounts?type=asset`; handles an instance with zero accounts
- [ ] **E2-19** `P1` `1d` **Step 5 — Dashboard preset.** "Everyday spender" / "Saver" / "Investor" / "Blank" layouts
- [ ] **E2-20** `P1` `1d` **Step 6 — Done.** First-run product tour (dismissible, resumable from Help)
- [x] **E2-21** `P0` `1d` Wizard is resumable — progress derived from database state (`onboarding_state` jsonb plus connection status), so a reload or a different device resumes at the right step
- [x] **E2-22** `P0` `2d` **Connections manager** in Settings: list, rename, rotate token, set default, test now, delete
- [x] **E2-23** `P1` `2d` Multiple connections + an instance switcher in the app shell — _the data model and service layer already support N connections; only the switcher UI is missing_ — `components/connection-switcher.tsx` in the app shell; `/onboarding?add=1` attaches a second instance
- [x] **E2-24** `P1` `1d` Background health check job (hourly): update `status`, notify on transition to failing — _manual "Test now" ships; the scheduled job does not_ — opportunistic checks from the app shell (fire-and-forget) plus `GET /api/cron/health` behind `CRON_SECRET`. **Cut: BullMQ.** A queue and a worker for one periodic probe is too many moving parts for a single-container self-host; the endpoint is there for real cron.
- [x] **E2-25** `P1` `1d` Global "connection broken" banner with a one-click re-authenticate flow — _the app shell shows a status dot; the banner does not exist_ — `components/connection-banner.tsx` — distinguishes unauthorised from unreachable and links to the matching fix
- [ ] **E2-26** `P2` `1d` Demo mode — read-only connection to `demo.firefly-iii.org` for evaluation — **Blocked on external access:** needs `demo.firefly-iii.org` to be reachable and accept a token.

**Cut from M1, deliberately:**

- [x] **E2-27** `P1` `1d` Password strength via zxcvbn + HIBP k-anonymity breach check — dropped from E2-02 to avoid an ~800 kB client dependency and an outbound call per sign-up. The 12-character floor and a small common-password list ship instead. — HIBP k-anonymity in `server/auth/breach.ts`, opt-in via `PASSWORD_BREACH_CHECK`, fails open. **Cut: zxcvbn** — ~800 kB of client bundle for a better-calibrated nudge; the shared scorer in `lib/password-strength.ts` covers the floor and now backs both the meter and the server check.
- [x] **E2-28** `P0` `1d` Real email transport. M1 ships a **console transport**: verification and reset links are printed to the server log, which is enough to complete both flows in development and self-host evaluation. Blocked on Q4 (Resend / SES / BYO SMTP). — SMTP (covers SES) and Resend over plain fetch, in `server/mail/index.ts`; console stays the default so evaluation needs no mail provider, and a selected-but-unconfigured transport fails at boot

**What M1 delivered**

| Exit criterion                                                  | Evidence                                                                                                                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new user can sign up and attach a Firefly instance end-to-end | Verified against live Firefly III v6.5.5: URL normalised from `…/api/v1/`, step-1 probe, token accepted as `a@a.com` (role `owner`), version gate passed, currency `EUR` detected |
| PAT never reaches the browser                                   | `0` occurrences of the token in the rendered onboarding, dashboard and connections HTML; `connectionPublicColumns` omits every sealed field                                       |
| Encryption is real                                              | Ciphertext contains no plaintext; decrypt round-trips; decrypting with another connection's id is **rejected**                                                                    |
| Guards hold                                                     | Signed out → `/sign-in?next=…`; signed in without onboarding → `/onboarding`; completed → `/dashboard`, and `/onboarding` bounces back                                            |
| Bad input is refused                                            | Wrong token rejected; `http://` refused unless `FIREFLY_ALLOW_INSECURE_HTTP`; redirects not followed; wrong password rejected                                                     |
| Runs in the container                                           | `docker compose --profile app up`: all 5 services healthy, authenticated pages 200                                                                                                |

### E3 · App shell & dashboard — M2

**Status: complete** (2026-09-17). Verified against a live Firefly III v6.5.5 holding 166 seeded transactions.

- [x] **E3-01** `P0` `2d` App shell: sidebar, top bar, responsive drawer, skip-to-content, active-route state on detail pages
- [x] **E3-02** `P0` `2d` Global date-range picker (7 presets) persisted in the URL and read by every page
- [x] **E3-03** `P0` `1d` `⌘K` command palette: live transaction search, navigation, theme; `/` also opens it
- [x] **E3-04** `P0` `2d` KPI tiles from `/summary/basic` — net worth, earned, spent, balance, each with a period-over-period delta
- [x] **E3-05** `P0` `2d` Balance trend chart from `/chart/balance/balance`
- [x] **E3-06** `P0` `2d` Account balance list from `/accounts?type=asset`
- [x] **E3-07** `P0` `1d` Recent transactions widget — _inline category edit deferred to M3 with the rest of the write path_
- [x] **E3-08** `P1` `2d` Budget progress widget with burn-down pacing — **already shipped**, reconciled 2026-09-17: `BudgetProgressWidget` in `app/(app)/dashboard/page.tsx`
- [x] **E3-09** `P1` `1d` Upcoming bills widget from `/bills`, with paid/unpaid state
- [x] **E3-10** `P1` `1d` Piggy-bank progress widget
- [x] **E3-11** `P1` `1d` Top spending categories from `/insight/expense/category`
- [ ] **E3-12** `P1` `3d` Draggable dashboard grid persisted to `user_preferences.dashboard_layout`
- [x] **E3-13** `P1` `1d` Every widget reads through `fireflyGetSafe`, so one failing endpoint degrades that widget alone
- [x] **E3-14** `P1` `0.5d` "Hide balances" privacy toggle, persisted to `localStorage`
- [ ] **E3-15** `P2` `1d` Cash-flow forecast widget

### E4 · Accounts — M2

**Status: complete** (2026-09-17).

- [x] **E4-01** `P0` `2d` Account list grouped by type with per-currency totals
- [x] **E4-02** `P0` `1d` Filters: type, archived; sort by name/balance/last activity — all URL-synced
- [x] **E4-03** `P0` `3d` Account detail: KPIs, balance chart, transactions tab — _piggy-bank and attachment tabs deferred to M4/M3_
- [x] **E4-04** `P0` `2d` Create/edit form, including the liability and credit-card field sets Firefly requires
- [x] **E4-05** `P0` `1d` Delete with a typed confirmation
- [ ] **E4-06** `P1` `1d` Reconciliation helper
- [ ] **E4-07** `P1` `1d` Liability amortisation view
- [x] **E4-08** `P1` `0.5d` Archive/activate via the `active` flag on the edit form
- [ ] **E4-09** `P2` `1d` Account ordering and custom colours

### E5 · Transactions — M2 (read) / M3 (write)

**M2 read scope and M3 write scope complete** (2026-09-17). The full transaction lifecycle — create, split, edit, duplicate, delete, attach — works without touching Firefly's own UI.

- [x] **E5-01** `P0` `3d` Virtualised transaction grid — one row per split, sticky header, density toggle, server-rendered first screen
- [x] **E5-02** `P0` `3d` Filter rail — _date range, type and free-text search ship; amount/category/budget/tag/attachment facets land with M3's filter rail_
- [x] **E5-03** `P0` `1d` URL-synced filter state + pagination over `meta.pagination`
- [x] **E5-04** `P0` `1d` Saved views (`saved_views` table) with sidebar pinning — **already shipped**, reconciled 2026-09-17: `server/saved-views.ts` + `app/(app)/transactions/saved-views.tsx`
- [x] **E5-05** `P0` `2d` Transaction detail — all journal fields, every split, foreign amounts, tags, notes
- [x] **E5-06** `P0` `4d` **Create/edit form** — withdrawal/deposit/transfer tabs, autocomplete account pickers typed by transaction kind, category/budget/bill/tags, date + time, notes, reconciled flag
- [x] **E5-07** `P0` `3d` **Split transaction editor** — add/remove splits, per-split accounts/category/budget/amount, running total, group title
- [x] **E5-08** `P0` `2d` **Foreign-currency support** — foreign amount + currency per split, shown on the detail view
- [x] **E5-09** `P0` `1d` Delete with a typed confirmation — _undo toast deferred; Firefly has no restore endpoint, so undo needs a client-side re-create_
- [x] **E5-10** `P0` `1d` Duplicate — clones every split into a new-transaction form dated today
- [x] **E5-11** `P1` `2d` Multi-select + bulk edit — M3 — selection + bulk set category/budget/tags + bulk delete, in `app/(app)/transactions/grid.tsx`; writes use allSettled and report partial success
- [ ] **E5-12** `P1` `1d` Inline edit in the grid — M3
- [x] **E5-13** `P1` `2d` Quick-add bar — M3 — `app/(app)/transactions/quick-add.tsx` — stays open with the accounts retained for entering a run
- [ ] **E5-14** `P1` `2d` Transaction links — M6 — **Blocked on M6:** transaction links are an M6 resource (`/link-types`, `/transaction-links`); this item is listed under E5 but tagged M6 in its own text.
- [x] **E5-15** `P1` `1d` Reconciled flag on the edit form and as a per-split action
- [x] **E5-16** `P1` `1d` Export the filtered view to CSV/XLSX — CSV from the rendered rows, one line per split, in the same grid. **Cut: XLSX**, same reasoning as E14-11.
- [x] **E5-17** `P1` `2d` One debounced, cached `Combobox` over the `/autocomplete/*` endpoints — accounts (typed by transaction kind), categories, budgets, bills
- [ ] **E5-18** `P2` `2d` Keyboard-only rapid entry — M3
- [x] **E5-19** `P2` `1d` Attach receipt by drop — M3 — **already shipped** — the drop zone and paste handler in `components/transactions/attachments.tsx`

**What M2 delivered**

| Exit criterion                      | Evidence                                                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard renders live Firefly data | Net worth €6,255.34, earned €3,850.00, spent €5,473.88 from `/summary/basic`; balance chart, category bars, bills and savings widgets all populated |
| Transaction list renders live data  | 25 rows server-rendered for the period, split group shows both legs with a `split 2` badge, 25 screen-reader money labels                           |
| Proxy enforces the allowlist        | known 200 · unknown 404 · `/data/destroy` 403 · `/users` 403 · unauthenticated 401                                                                  |
| Cache works                         | Redis, namespaced per connection, 16 tag sets; dashboard 150 ms cold → 22 ms warm                                                                   |
| Accounts CRUD                       | List grouped by type with per-currency totals; detail with balance chart; create/edit/delete against the live instance                              |

### E6 · Budgets — M4

**Status: core complete** (2026-09-17). CRUD and per-period limit management verified against a live
Firefly III instance.

- [x] **E6-01** `P0` `2d` Budget list with spent / limit / remaining bars and pacing (% of period elapsed vs. % spent)
- [x] **E6-02** `P0` `2d` Budget CRUD: name, active, auto-budget type (none/reset/rollover), amount, period
- [x] **E6-03** `P0` `2d` Budget-limit management per period: create, edit, delete — _"copy last period" and bulk-set deferred_
- [x] **E6-04** `P0` `2d` Budget detail: limit history, transactions — **`/chart/budget/overview` skipped**: it returns one snapshot bar per budget for the whole range, not a date series, so it does not fit the `AreaTrend` component used everywhere else. Attachments deferred.
- [x] **E6-05** `P1` `1d` `/budgets/transactions-without-budget` view — list page with pagination
- [x] **E6-06** `P1` `1d` Available budgets (`/available-budgets`) — **already shipped**, reconciled 2026-09-17: `app/(app)/available-budgets/page.tsx`, per-currency aggregation
- [x] **E6-07** `P1` `2d` Budget performance report — folded into M5 reporting — **already shipped**, reconciled 2026-09-17: shipped as the M5 budget report, `app/(app)/reports/budgets/page.tsx`
- [x] **E6-08** `P1` `1d` Over-budget warnings in the notification inbox — **already shipped**, reconciled 2026-09-17: `app/(app)/budgets/page.tsx` writes `over_budget` notifications
- [ ] **E6-09** `P2` `2d` Envelope-style drag-to-reallocate

### E7 · Categories — M4

**Status: core complete** (2026-09-17).

- [x] **E7-01** `P0` `1d` Category list with period spend/earn — _sparkline deferred_
- [x] **E7-02** `P0` `1d` Category CRUD + notes
- [x] **E7-03** `P0` `2d` Category detail: transactions, period spend/earn totals — **chart and month-over-month trend skipped**, same `/chart/category/overview` shape mismatch as E6-04. Attachments deferred.
- [x] **E7-04** `P1` `1d` Uncategorised inbox with bulk categorise — **already shipped**, reconciled 2026-09-17: `app/(app)/categories/uncategorised/` incl. `bulk-toolbar.tsx`
- [ ] **E7-05** `P1` `1d` Merge categories
- [ ] **E7-06** `P2` `2d` Suggested category from payee history

### E8 · Bills / Subscriptions — M4

**Status: core complete** (2026-09-17).

- [x] **E8-01** `P0` `2d` Bill list grouped by active/inactive: amount range, repeat frequency, next expected, paid state
- [x] **E8-02** `P0` `2d` Bill CRUD: min/max amount, currency, date, end date, repeat freq, skip, active, notes
- [x] **E8-03** `P0` `2d` Bill detail: matched transactions, payment history — _linked rules deferred to M6 (rules don't exist yet)_
- [x] **E8-04** `P1` `2d` Subscription calendar — **already shipped**, reconciled 2026-09-17: `app/(app)/bills/calendar/page.tsx`
- [x] **E8-05** `P1` `1d` Annualised cost summary / most-expensive ranking — added to subscriptions list
- [x] **E8-06** `P1` `1d` Unpaid/overdue alerts in the notification inbox — **already shipped**, reconciled 2026-09-17: `app/(app)/bills/page.tsx` writes `unpaid_bill` notifications
- [ ] **E8-07** `P2` `1d` "Create a matching rule from this bill" — **Blocked on M6:** creating a rule needs the rules engine, which is E11/M6.

### E9 · Piggy banks & object groups — M4

**Status: core complete** (2026-09-17). Add/remove money mechanism confirmed against a live instance
before implementing — see §13.

- [x] **E9-01** `P0` `2d` Piggy-bank list with progress bars, target date, and per-month savings pace
- [x] **E9-02** `P0` `2d` Piggy CRUD: account, name, target amount, start/target date, notes — _object group assignment deferred (E9-05)_
- [x] **E9-03** `P0` `1d` Add/remove money with the resulting `/piggy-banks/{id}/events` history timeline
- [x] **E9-04** `P1` `1d` Attachments tab; "on track / behind" status — on-track / behind / target-reached badges on list and detail; attachments tab deferred to M3 attachment manager
- [ ] **E9-05** `P1` `2d` Object-group management — _partially shipped: `app/(app)/object-groups/` lists and creates groups. **Missing:** assigning a bill or piggy bank to a group from its own form._
- [ ] **E9-06** `P2` `1d` Savings-goal projection chart

### E10 · Recurring transactions — M6

- [ ] **E10-01** `P0` `2d` Recurrence list: title, type, next occurrence, repetitions left, active
- [ ] **E10-02** `P0` `3d` Recurrence CRUD — the most complex form in the app: type, title, first date, repeat_until / nr_of_repetitions, apply_rules, active, repetition config (daily/weekly/monthly/ndom/yearly + skip + weekend handling), and the nested transaction template (splits, accounts, category, budget, tags, piggy bank)
- [ ] **E10-03** `P0` `1d` Generated-transactions tab (`/recurrences/{id}/transactions`)
- [ ] **E10-04** `P1` `1d` Manual trigger (`POST /recurrences/{id}/trigger`) with confirmation and result summary
- [ ] **E10-05** `P1` `2d` Forecast timeline — next 12 occurrences across all recurrences, with a projected cash-flow impact line
- [ ] **E10-06** `P2` `1d` "Convert this transaction into a recurrence" shortcut

### E11 · Rules & rule groups — M6

- [ ] **E11-01** `P0` `2d` Rule-group list, CRUD, reorder, active toggle
- [ ] **E11-02** `P0` `4d` **Visual rule builder** — triggers and actions as composable rows, all Firefly trigger/action types, strict/any matching, stop-processing flag
- [ ] **E11-03** `P0` `2d` Rule CRUD + reorder within a group
- [ ] **E11-04** `P0` `2d` **Test/dry-run** (`GET /rules/{id}/test`) showing the transactions that would match before you commit
- [ ] **E11-05** `P1` `1d` Trigger a rule or whole group over a date range (`POST /rules/{id}/trigger`, `/rule-groups/{id}/trigger`) with a progress/result panel
- [ ] **E11-06** `P1` `1d` Group-level test (`/rule-groups/{id}/test`)
- [ ] **E11-07** `P2` `2d` Rule templates library (common recipes: auto-categorise by payee, tag subscriptions, flag large expenses)
- [ ] **E11-08** `P2` `1d` Duplicate/export/import a rule as JSON

### E12 · Tags — M6

- [ ] **E12-01** `P0` `1d` Tag list + tag cloud weighted by usage and spend
- [ ] **E12-02** `P0` `1d` Tag CRUD with date, description, and lat/long/zoom-level fields
- [ ] **E12-03** `P0` `1d` Tag detail: transactions, attachments, income/expense/transfer totals from the `insight` endpoints
- [ ] **E12-04** `P1` `1d` Bulk tag / untag from the transaction grid
- [ ] **E12-05** `P2` `1d` Map view for geotagged tags

### E13 · Currencies & exchange rates — M6

- [ ] **E13-01** `P0` `1d` Currency list with enable/disable and set-primary actions
- [ ] **E13-02** `P0` `1d` Currency CRUD: code, name, symbol, decimal places
- [ ] **E13-03** `P1` `2d` Exchange-rate manager: list, add, edit, delete rates by pair and date; rate-history chart
- [ ] **E13-04** `P1` `1d` Bulk rate entry (`/exchange-rates/by-date/{date}`, `/by-currencies/{from}/{to}`)
- [ ] **E13-05** `P1` `1d` Multi-currency display toggle — show native amounts, converted amounts, or both
- [ ] **E13-06** `P2` `1d` Currency-drill-down from a currency to its accounts / bills / transactions / budget limits / recurrences / rules

### E14 · Reports & insights — M5 (the differentiator)

- [x] **E14-01** `P0` `2d` Report shell: period selector, account/currency scope, compare-to-previous toggle, print stylesheet — Report shell, period/account/currency scope + compare toggle, all URL-encoded; print stylesheet in `app/globals.css`
- [x] **E14-02** `P0` `3d` **Net worth report** — assets vs. liabilities over time, stacked area + table, per-account contribution — `/chart/account/overview` joined to the account list by NAME (the chart carries no id) for type and the include-in-net-worth flag
- [x] **E14-03** `P0` `3d` **Income vs. Expense** — monthly bars, running net, savings rate, top sources/sinks (`/insight/income/*`, `/insight/expense/*`) — `/chart/balance/balance?period=1M` for the series, insight `total` endpoints for the headline figures so they match Firefly to the cent
- [x] **E14-04** `P0` `3d` **Category report** — treemap + ranked bars + month-over-month table, drill to transactions — Treemap + ranked spend/income tables + a twelve-month grid built from one insight call per month
- [x] **E14-05** `P0` `2d` **Budget report** — planned vs. actual, variance, rollover tracking, 12-month heatmap — `/chart/budget/overview` for planned-vs-actual; `left` taken from Firefly, not recomputed
- [x] **E14-06** `P1` `3d` **Cash-flow Sankey** — income sources → accounts → expense categories (d3-sankey) — Hand-rolled three-layer Sankey (`lib/sankey.ts`), server-rendered SVG, no new dependency; reads raw transactions because no insight endpoint exposes the source→destination pairing
- [x] **E14-07** `P1` `2d` **Tag report** — spend by tag over time, tag combinations — Spend/income by tag, ranked bars + twelve-month grid
- [x] **E14-08** `P1` `2d` **Account report** — per-account income/expense/transfer breakdown (`/insight/*/asset`) — Per-asset-account in/out/transfers; transfers keep their sign
- [x] **E14-09** `P1` `2d` **Bill/subscription report** — recurring cost trend, annualised total, cancelled-vs-active — Annualised from the midpoint of Firefly’s min/max band, divided by skip + 1
- [x] **E14-10** `P1` `4d` **Custom report builder** — pick a metric, dimension, filter set, and chart type; save to `saved_reports`; pin to the dashboard — metric × dimension × chart, saved and pinned (pinned reports render on the dashboard). **Cut:** an arbitrary filter set beyond the shared period/account/currency scope — the six dimensions map onto insight endpoints, which accept no further filters.
- [x] **E14-11** `P1` `2d` Export any report to CSV, XLSX, and a print-quality PDF — CSV (RFC 4180 quoted, UTF-8 BOM so Excel reads it correctly) and print-to-PDF via the print stylesheet. **Cut: a native XLSX writer.** It needs a zip encoder and a new dependency for a format Excel already opens from the CSV; deferred rather than half-built.
- [x] **E14-12** `P1` `1d` Every chart element drills through to the underlying filtered transaction list — Every breakdown row links through; required adding category/budget/tag scoping to the transaction list, which previously understood only `account`
- [ ] **E14-13** `P2` `2d` Scheduled reports — monthly email with a PDF attached (BullMQ + `report_runs`) — **Blocked on infrastructure:** needs a job runner (BullMQ + worker) and a mail transport. E2-28 now supplies the mail half; the scheduler half is still absent, and the same reasoning as E2-24 applies — a queue and a worker process for one periodic job is a lot for a single-container self-host. **Still planned — not out of scope.** Its greyed-out "Scheduled" nav entry was removed on 2026-09-17: a greyed-out link is a promise, and pointing one at a route that does not exist (`/reports-scheduled`) while the item is blocked on infrastructure advertises something nobody can use. Re-add the entry when the job runner lands, not before.
- [ ] **E14-14** `P2` `3d` **Year in review** — an annual narrative summary with highlights and shareable cards
- [ ] **E14-15** `P1` `1d` **Reconciliation test:** an automated check asserting our report totals equal Firefly's own figures to the cent

### E15 · Search — M2

- [x] **E15-01** `P0` `2d` Global search over `/search/transactions` — in the ⌘K palette with keyboard navigation, and as free-text on the transactions page
- [x] **E15-02** `P1` `1d` Firefly search-operator support (`amount_is:`, `category_is:`, `date_after:`, …) with an autocompleting operator hint bar — operator catalogue in `lib/search-operators.ts`, every entry verified against a live instance; autocomplete, keyboard completion and an unknown-operator warning in `app/(app)/transactions/search-bar.tsx`
- [x] **E15-03** `P1` `1d` Recent searches + saved searches — recent searches in localStorage (per-viewer, never synced); named/saved searches are the existing saved views (E5-04)
- [x] **E15-04** `P2` `1d` Search-result → bulk action pipeline — falls out of E5-11 — the bulk toolbar renders on search results, since search and list share one grid

### E16 · Attachments — M3

**Status: core complete** (2026-09-17).

- [x] **E16-01** `P0` `2d` Two-step upload (`POST /attachments` then `/upload`) through a dedicated binary route, with a 25 MB cap
- [x] **E16-02** `P0` `1d` Drag-and-drop zone, paste-from-clipboard, multi-file, delete
- [x] **E16-03** `P0` `1d` Streamed download with the upstream `Content-Disposition` preserved
- [x] **E16-04** `P1` `1d` Inline preview for images and PDFs in a lightbox — lightbox in `components/transactions/attachment-preview.tsx`, images and PDFs only
- [x] **E16-05** `P1` `1d` Attachment manager: list all, filter by attached model, rename, delete — `app/(app)/attachments/` — list, filter by model and name, rename, preview, download, delete
- [x] **E16-06** `P2` `2d` Mobile receipt capture via the camera, with client-side compression before upload — `capture="environment"` on mobile plus canvas downscaling in `lib/image-compress.ts`

### E17 · Webhooks — **dropped from scope** (2026-09-17)

Firefly III's webhook endpoints are not given a UI in this project. All five
items (E17-01 … E17-05, 7 ideal days) are withdrawn, not deferred — there is no
milestone they are waiting for.

**Why:** a webhook is configuration that makes the user's own Firefly instance
POST to an arbitrary URL when something changes. Firefly already has a screen
for that, and it is the right place for it: the delivery log, the retry
attempts and the failure states all live server-side, so a second UI over the
same data would mostly be re-rendering Firefly's own state and could only ever
be a worse copy of it. The proxy also refuses these paths now (§4.3), so the
surface is closed rather than merely unused.

Anyone who wants webhooks configures them in Firefly III directly; they keep
working, because Firefly fires them, not us.

### E18 · Preferences, configuration & misc — M6

- [ ] **E18-01** `P1` `1d` Firefly preferences editor (`/preferences`, `/preferences/{name}`) with typed handling of known keys
- [ ] **E18-02** `P1` `1d` App preferences page: theme, density, number/date format, week start, default landing page, default date range
- [ ] **E18-03** `P1` `1d` About page: our version, Firefly version/OS/PHP/db from `/about`, connection diagnostics, `X-Trace-Id` copy button
- [ ] **E18-04** `P2` `0.5d` `POST /batch/finish` support for batch-aware workflows
- [ ] **E18-05** `P2` `0.5d` Cron trigger (`/cron/{cliToken}`) behind an explicit admin toggle

### E19 · Data, export & danger zone — M6

- [ ] **E19-01** `P1` `2d` Export centre covering all nine `/data/export/*` resources with date-range scoping and progress
- [ ] **E19-02** `P1` `1d` "Export everything" bundle (zip of all nine CSVs) as a background job
- [ ] **E19-03** `P1` `2d` **Danger zone** — `/data/destroy` and `/data/purge` behind step-up re-auth, a typed confirmation phrase, and an audit-log entry
- [ ] **E19-04** `P2` `1d` Link out to the Firefly III Data Importer with a short setup guide
- [ ] **E19-05** `P2` `2d` CSV import mapper that posts through `/data/bulk/transactions`

### E20 · Admin (instance owners) — M6

- [ ] **E20-01** `P1` `1d` Detect admin/owner role from `/about/user`; hide the whole section otherwise
- [ ] **E20-02** `P1` `2d` User management (`/users`): list, create, edit role, delete — with hard confirmations
- [ ] **E20-03** `P1` `2d` User groups / financial administrations (`/user-groups`): list, view, rename
- [ ] **E20-04** `P1` `1d` Instance configuration editor (`/configuration`, `/configuration/{name}`)

### E21 · Design system, a11y & i18n — continuous, audited in M7

- [ ] **E21-01** `P0` `3d` Core primitives: Button, Input, Select, Combobox, Dialog, Sheet, Popover, Tooltip, Tabs, Table, Badge, Card, Toast, Skeleton
- [ ] **E21-02** `P0` `2d` Money primitives: `<Amount>`, `<Delta>`, `<CurrencyInput>`, `<ProgressBar>`, `<Sparkline>` — tabular numerals, sign glyphs, colour never carries meaning alone
- [ ] **E21-03** `P0` `2d` Chart theme layer: shared axis/grid/tooltip/legend components, colour-blind-safe categorical palette, dark-mode variants
- [ ] **E21-04** `P0` `1d` Empty states with an illustration and a primary action for every list
- [ ] **E21-05** `P0` `1d` Error states: typed error taxonomy (network / auth / rate-limit / validation / Firefly-down) each with its own recovery affordance
- [ ] **E21-06** `P1` `3d` **Accessibility pass** — axe-core in CI, keyboard traps, focus rings, ARIA on charts (table fallback), colour contrast, screen-reader labels for every amount
- [ ] **E21-07** `P1` `2d` i18n scaffold (`next-intl`), extract all strings, English + one additional locale to prove it
- [ ] **E21-08** `P1` `1d` Locale-aware number and currency formatting driven by `Intl` + user preference override
- [ ] **E21-09** `P0` `1d` **Date discipline** — all Firefly dates parsed and rendered in the user's chosen timezone, never the browser's implicit local time; one shared `lib/date.ts`; lint rule banning raw `new Date(string)`
- [ ] **E21-10** `P1` `1d` `decimal.js` money layer + ESLint rule banning `Number()`/`parseFloat` in money paths
- [ ] **E21-11** `P1` `2d` Responsive pass: every screen usable at 375px; grid → card transformation for tables
- [ ] **E21-12** `P2` `1d` `prefers-reduced-motion` and high-contrast theme support

### E22 · Performance, caching & offline — M7

- [x] **E22-01** `P0` `2d` Proxy response cache (Redis, per-connection namespace) with per-endpoint TTLs and tag-based invalidation on writes — **landed in M2**, the proxy needed it
- [ ] **E22-02** `P0` `1d` ETag / `If-None-Match` pass-through where Firefly supports it
- [x] **E22-03** `P0` `1d` Per-user rate limiting on the proxy (600/min) — **landed in M2**; the concurrency cap is still outstanding
- [ ] **E22-04** `P1` `2d` Request coalescing + prefetch on hover/intent for lists and detail pages
- [ ] **E22-05** `P1` `1d` Bundle budget in CI (fail the build on regression); route-level code splitting; dynamic-import the chart libraries
- [ ] **E22-06** `P1` `2d` Optimistic updates with rollback for every mutation
- [ ] **E22-07** `P1` `2d` PWA: manifest, service worker, installable, offline shell with a cached last-known dashboard
- [ ] **E22-08** `P2` `3d` Offline transaction queue that replays when the connection returns
- [ ] **E22-09** `P1` `1d` `k6` load test against a seeded 50k-transaction instance

### E23 · Security hardening — M8

- [ ] **E23-01** `P0` `2d` SSRF guard implementation + test suite (DNS rebinding, redirect, metadata endpoints, IPv6 literals)
- [ ] **E23-02** `P0` `1d` Strict CSP with nonces, HSTS, COOP/CORP, `frame-ancestors 'none'`
- [ ] **E23-03** `P0` `1d` CSRF double-submit on all non-GET route handlers
- [x] **E23-04** `P0` `1d` Proxy path allowlist (generated from the vendored spec) + step-up gate on destructive operations — **landed in M2**
- [ ] **E23-05** `P0` `1d` Key-rotation job for `APP_ENCRYPTION_KEY` with a zero-downtime re-wrap
- [ ] **E23-06** `P1` `1d` Dependency scanning (`npm audit`, Dependabot, Trivy on the image) wired into CI
- [ ] **E23-07** `P1` `2d` Internal pen-test pass against the OWASP ASVS L2 checklist
- [ ] **E23-08** `P1` `1d` Secret-scanning pre-commit hook (gitleaks)
- [ ] **E23-09** `P1` `1d` `SECURITY.md`, threat model document, responsible-disclosure contact

### E24 · Testing & quality — continuous

- [ ] **E24-01** `P0` `2d` MSW mock server generated from the vendored OpenAPI spec, with realistic fixtures
- [ ] **E24-02** `P0` `3d` Unit tests for `server/crypto`, `server/firefly`, money maths, date handling, pagination
- [ ] **E24-03** `P0` `3d` Playwright e2e: sign-up → verify → onboard → dashboard; create/split/delete a transaction; budget lifecycle
- [ ] **E24-04** `P1` `2d` Contract test that replays the vendored spec against a real Firefly container in CI
- [ ] **E24-05** `P1` `1d` Visual regression on the design system (Playwright snapshots)
- [ ] **E24-06** `P1` `1d` Seed script that provisions a Firefly container with a realistic multi-year dataset
- [ ] **E24-07** `P1` `1d` Coverage gate at 80 % for `lib/` and `server/` — _partially done: the gate exists in `vitest.config.mts` and runs in `release.yml`, but it is set to **70 %** and `include` covers **`lib/` only**. `lib/` currently sits at ~95 % statements / ~85 % branches, so raising the threshold to 80 % is free today. The real remaining work is bringing `server/` in — the proxy allowlist, the cache tag logic and the split-form parser are the pure parts worth covering first (see LEARNING.md §8)._

### E25 · DevOps, docs & release — M8

- [ ] **E25-01** `P0` `2d` Production Dockerfile (multi-stage, non-root, distroless-ish) + published compose file
- [ ] **E25-02** `P0` `1d` Migration-on-boot strategy with an advisory lock; rollback runbook
- [ ] **E25-03** `P0` `1d` `/api/health` (liveness) and `/api/ready` (DB + Redis + connection probe)
- [ ] **E25-04** `P1` `1d` Backup/restore documentation for Postgres, including the encryption-key caveat
- [ ] **E25-05** `P1` `2d` User documentation: install, configure, onboarding walkthrough with screenshots, troubleshooting
- [ ] **E25-06** `P1` `1d` Release automation: changesets, semantic version, GHCR image, signed tags
- [ ] **E25-07** `P2` `1d` One-click deploy templates (Vercel + Neon, Railway, Coolify)
- [ ] **E25-08** `P1` `0.5d` `LICENSE` (AGPL-compatible — note Firefly III is AGPLv3) and attribution

---

## 9. Cross-cutting engineering decisions

1. **The typed Firefly client is generated, never hand-written.** `spec/` holds the vendored yaml; `pnpm spec:update`
   regenerates types and Zod schemas and prints a diff so API drift shows up in a PR, not in production.
2. **Server Components for reads, Route Handlers for writes.** Lists render on the server (fast first paint, no PAT
   in the bundle); mutations go through `/api/ff/*` so TanStack Query can do optimistic updates.
3. **One pagination contract.** `usePaginatedQuery` wraps `meta.pagination` everywhere; no component parses it.
4. **Money is a string until it is rendered.** `decimal.js` for arithmetic, `Intl.NumberFormat` for display.
5. **Feature detection over version checks** where possible: probe `/about` once per session, cache the Firefly
   version, and hide features the connected instance is too old to support rather than erroring.
6. **Every write invalidates by tag.** A transaction write invalidates `transactions`, `accounts`, `summary`,
   `budgets`, and `insight` cache tags — defined once in a table, not scattered through components.

---

## 10. Risks & mitigations

| Risk                                                  | Impact   | Mitigation                                                                                     |
| ----------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| **SSRF via user-supplied base URL**                   | Critical | §4.2 — DNS pinning, IP policy, no redirects, metadata ranges always blocked. Owned by E23-01.  |
| **PAT compromise**                                    | Critical | Envelope encryption, never sent to the client, redacted logs, rotation job, audit trail        |
| Firefly API drift between minor versions              | High     | Vendored spec + `spec:update` diff in CI + contract tests against a real container (E24-04)    |
| Slow or fragile self-hosted instances                 | High     | Aggressive caching, concurrency caps, per-widget error boundaries, graceful degradation        |
| Floating-point money bugs                             | High     | `decimal.js` + lint rule (E21-10) + reconciliation test against Firefly's own figures (E14-15) |
| Timezone/date off-by-one in reports                   | High     | Single date module, explicit user timezone, E21-09 + dedicated test suite                      |
| Scope creep from 230 operations                       | Medium   | Milestone gates; the §7 inventory is the definition of done for coverage                       |
| Multi-currency edge cases                             | Medium   | Test dataset with 3 currencies and historical rates in the seed script (E24-06)                |
| Users lose the encryption key and cannot decrypt PATs | Medium   | Documented in E25-04; graceful "re-enter your token" flow rather than a hard failure           |

---

## 11. Open questions

- [ ] **Q1** Hosted SaaS as well as self-host, or self-host only? Affects E2-11, multi-tenancy, and the SSRF default.
- [ ] **Q2** Do we support multiple Firefly connections per user in v1 (E2-23), or defer to v1.1?
- [ ] **Q3** Is Firefly OAuth2 (E2-12) needed for v1, or is PAT sufficient? PAT is simpler and covers self-hosters.
- [ ] **Q4** Email delivery provider for verification and scheduled reports — Resend, SES, or bring-your-own SMTP?
- [ ] **Q5** Do we ship a hosted demo instance for evaluation (E2-26)?
- [ ] **Q6** Licence — AGPLv3 to match Firefly III, or something more permissive? (We only consume its API, so we are
      not obliged to match, but it is a community signal.)

---

## 12. Definition of done (per backlog item)

An item is done when all of the following hold:

- [ ] Works against a real Firefly III instance, not just mocks
- [ ] Loading, empty, and error states implemented
- [ ] Keyboard accessible; axe reports no violations
- [ ] Responsive at 375px and 1440px, correct in both light and dark themes
- [ ] Unit tests for logic; e2e test if it is a primary user flow
- [ ] No PAT, token, or password reachable in the client bundle or in logs
- [ ] Money and dates go through the shared modules
- [ ] Copy reviewed; no placeholder text

---

## 13. M3 verification log

Run against a live Firefly III v6.5.5 on 2026-09-17.

| Step                                          | Result                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Create a 2-leg split with tags and categories | id 170, group title and both legs persisted with the right categories           |
| Edit amount, description, reconciled          | `99.99`, renamed, `reconciled: true`                                            |
| Attachment upload (two-step)                  | id 1, `receipt.txt`                                                             |
| Download                                      | 200, `content-disposition: attachment; filename="receipt.txt"`, bytes identical |
| Delete                                        | 204, subsequent read 404, detail page 404                                       |
| Cache invalidation on write                   | 15 keys → 10; summary, chart and insight entries dropped                        |
| Autocomplete via the proxy                    | accounts, categories, budgets, bills all return live rows                       |

**Three defects this run exposed, all now fixed:**

1. **A successful DELETE reported failure.** Firefly answers `204 No Content`; `callFirefly` ran
   `JSON.parse('')`, threw, and the proxy returned 502 — while the record really had been deleted.
   Empty bodies now resolve to `undefined`, and the proxy answers 204.
2. **`NextResponse.json(undefined)` throws**, so even after the parse fix the proxy still 502'd.
   It now returns a bodyless 204.
3. **A 404 from Firefly surfaced as 502.** The `not_firefly` code conflated "this address is not a
   Firefly API" (an onboarding concern) with "this record does not exist". Split into `not_found`,
   which the proxy passes through as 404 and onboarding still reports as "no Firefly III API here".

---

## 14. M4 verification log

Run against a live Firefly III v6.5.5 on 2026-09-17.

| Step                                                                  | Result                                                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Category: create → list → detail → rename → delete                    | id 7, all steps 200/204, confirmed 404 after delete                                |
| Budget: create → add a limit → list → detail (limits tab) → delete    | id 2, limit id 2 (€500.00), confirmed 404 after delete                             |
| Bill: create → list → detail → delete                                 | id 2, confirmed 404 after delete                                                   |
| Piggy bank: create → list → add money → events → history tab → delete | id 2, `current_amount` 0.00 → 250.00, 1 event recorded, confirmed 404 after delete |
| Cache invalidation on write                                           | 20 keys → 19 after a category write                                                |
| Responsive check (11 pages incl. all new M4 routes)                   | no horizontal overflow at 360/390/768/1440px, drawer included                      |
| Regression check on M1–M3 pages                                       | all still 200; signed-out guards still redirect correctly                          |

**Two things this run exposed, both now fixed:**

1. **`server/firefly/types.ts` had three wrong resource shapes.** `BudgetLimit.spent` was typed as
   `string | null`; Firefly returns an array of `{sum, currency_code}` per currency, same as `Budget.spent`.
   `PiggyBankAttributes` had a single `account_name` field; Firefly returns an `accounts` array (a piggy
   bank can span multiple accounts). Both were fixed by querying the live instance before writing the
   types, not after hitting a runtime error.
2. **Piggy-bank creation 422'd**: Firefly requires `transaction_currency_code` (or `_id`) on creation,
   the same requirement discovered and worked around in the M2 seed script — but I had forgotten to carry
   it into `createPiggyBankAction`. Found by exercising the live create call before considering the
   feature done, not by reading the OpenAPI spec (which lists the field as optional at the type level).

**One design note:** `/chart/budget/overview` and `/chart/category/overview` return one snapshot bar per
resource for the whole selected range, not a date series — a different shape from `/chart/balance/balance`
and `/chart/account/overview`, which power `AreaTrend` elsewhere in the app. Rather than force a mismatched
endpoint into that component, both detail pages ship without a chart; spend/earn totals for the period are
shown as plain figures instead. Flagged as deferred in E6-04 / E7-03 rather than silently dropped.

**Add/remove money mechanism (E9-03):** Firefly has no dedicated deposit/withdraw endpoint for a piggy
bank. The mechanism — confirmed against a live instance before writing `adjustPiggyBankAction`, not
assumed from the spec — is `PUT /piggy-banks/{id}` with a new `current_amount` on the relevant entry in
`accounts[]`. Firefly diffs the old and new values server-side and writes the corresponding `+`/`-` row to
`/piggy-banks/{id}/events` itself.

---

## 15. M5 verification log

Run against a live Firefly III v6.5.5 on 2026-09-17, through the Docker Compose
app container (not `pnpm dev`), so what was checked is what ships.

### Reconciliation — the milestone exit criterion

Report totals were compared against the raw `/insight/*` figures the API returns,
across two different periods:

| Period                | Firefly income | Firefly expense | Income vs expense | Accounts | Cash flow |
| --------------------- | -------------- | --------------- | ----------------- | -------- | --------- |
| This year (2026)      | €15,400.00     | €41,090.69      | match             | match    | match     |
| Last month (Aug 2026) | €3,850.00      | €12,028.98      | match             | match    | match     |

The category report reconciles by construction too: €41,085.69 categorised plus
€5.00 uncategorised is exactly the €41,090.69 expense total. The budget report's
€36,195.20 matches `/chart/budget/overview` to the cent, and the subscription
report's €173.88 annualised is exactly (12.99 + 15.99) / 2 × 12.

**This is why the headline figures come from the `insight` `total` endpoints
rather than from summing the chart series.** The charts bucket by period and are
the right source for a series; the insight totals are the numbers Firefly's own
reports print. Using the charts for both would have produced a report that is
internally consistent and quietly disagrees with Firefly.

### Functional checks

| Step                                                            | Result                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| All ten report routes render with live data                     | 200, real figures on every one                                            |
| Scope bar: period, account, currency, compare — all URL-encoded | survives navigation between reports; links reproduce the same report      |
| Drill-through: category, budget, tag                            | 46 matches for Groceries, 68 for Everyday spending; scope named in header |
| Custom builder: expense × counterparty × treemap                | €41,090.69 over 7 groups, Rent BV 81%                                     |
| Custom builder: an impossible pair (income × budget)            | falls back to category; budget/subscription marked "(spending only)"      |
| Saved report: list, pin, dashboard widget                       | appears in both places with its description                               |
| Responsive check, 21 routes × 4 widths                          | no horizontal overflow (after the fix below)                              |
| Regression sweep, 17 M1–M4 routes                               | all 200; signed-out guards still redirect                                 |
| Unit tests                                                      | 84 passed, unchanged                                                      |

### Three things this run exposed, all now fixed

1. **A per-account share of 264%.** The net-worth report divided each account's
   closing balance by the side's NET total. An overdrawn current account drags
   the asset total toward — or past — zero, at which point the ratio stops
   meaning anything. It now divides by the sum of magnitudes on that side.
   Only visible because the test ledger happened to be overdrawn; a tidier
   ledger would have shipped this.

2. **Screen-reader text dragging three pages 60px sideways on mobile.**
   `.sr-only` is `position: absolute`, and the `overflow-x-auto` wrapper around
   each report table was not a positioned ancestor — so the hidden label inside
   a right-aligned `<Amount>` resolved against the initial containing block,
   escaped the scroll container and extended the document past the viewport.
   Invisible to the eye (the text is clipped) and invisible to an
   element-by-element overflow scan (nothing is drawn out there); found only by
   scripting an actual `scrollTo(9999, 0)` and reading back `window.scrollX`.
   Making each scroll container `relative` contains them.
   **Worth remembering: any `overflow-x-auto` that can contain an `<Amount>`
   needs `relative`.**

3. **Two `*/` sequences inside block comments** (`` `/insight/*/total` ``)
   silently terminated the comment and produced a cascade of parse errors far
   from the cause. Harmless once spotted, but it cost two debugging cycles.

### Notes on shape, for whoever builds M6

- `/insight/*` returns **one entry per (resource, currency) pair**. A category
  with both EUR and USD spending appears twice with the same `id`. Summing the
  array adds euros to dollars. Every aggregate in `lib/reports.ts` works within
  one currency and reports the excluded ones back so the UI can disclose them.
- Expenses arrive **negative**; reports show magnitudes. Normalised once, in
  `lib/reports.ts`, not at each call site.
- `/insight/transfer/asset` additionally carries `in`/`out` fields alongside
  `difference`, which the other insight endpoints do not.
- `/chart/balance/balance?period=1M` is the only endpoint that yields a monthly
  income/expense series. Without `period` it returns a single bucket.
- The **month grids call one insight endpoint per month** — those endpoints
  only ever report a single total for the range given, so there is no other way
  to get a series from them. Capped at twelve buckets.

---

## 16. M0–M5 backlog pass — verification log

Run against a live Firefly III v6.5.5 on 2026-09-17, through the Docker Compose
app container. **In progress** — branch `feat/m0-m5-backlog`, not merged.

Started from an audit of every open item in the M0–M5 epics. **Nine were already
built and simply unchecked** (the drift LEARNING.md §10 warned about): the budget
progress widget, saved views, available budgets, the uncategorised inbox, the
subscription calendar, both notification producers, the Sentry source-map upload,
and the budget report M5 absorbed. E5-19 turned out to be shipped too. Those are
now checked with the file that proves each, so nobody rebuilds them.

### Shipped in this pass

| Items                  | What landed                                                   |
| ---------------------- | ------------------------------------------------------------- |
| E2-28, E2-27           | SMTP + Resend transports; HIBP breach check                   |
| E2-08, E2-09, E2-10    | Settings → Security: sessions, audit trail, account deletion  |
| E2-06                  | TOTP two-factor with recovery codes                           |
| E2-23, E2-24, E2-25    | Instance switcher, health checks, broken-connection banner    |
| E5-11, E5-13, E5-16    | Bulk edit, quick add, CSV export                              |
| E15-02, E15-03, E15-04 | Search operators, typo warning, recent searches               |
| E16-04, E16-05, E16-06 | Attachment lightbox, manager, camera capture                  |
| —                      | Navigation progress bar; transactions list rebuild; docs move |
| E17                    | **Dropped from scope** — see the epic for why                 |

### What the live instance taught us this time

1. **An unrecognised search operator does not error.** Firefly treats
   `catagory_is:Food` as literal search text, which matches nothing — so a typo
   returns a confident empty result set indistinguishable from "you have no food
   spending". A nonsense operator and a real operator with no matches both
   return 0, so the count cannot tell them apart. Every operator in
   `lib/search-operators.ts` was verified by finding a query that returns
   non-zero; the hint bar warns on anything outside that set.

2. **A search value containing a space must be quoted.**
   `budget_is:Everyday spending` → 0 hits. `budget_is:"Everyday spending"` → 68.
   Unquoted, the space ends the operator and the remainder becomes free text.

3. **HIBP's range API works exactly as documented** — "Password1234" came back
   with 321,223 breaches, a random 20-character string with 0 — and `Add-Padding`
   inflates the response to ~2,190 lines so its size reveals nothing.

4. **Attachment writes invalidated no cache.** There was no `attachments` tag in
   `tagsForPath`, so a rename kept rendering the old title for a full TTL.
   Found by renaming and watching Firefly agree while the page did not.

### Bugs found and fixed while verifying

- **Settings was unreachable before onboarding.** The `(app)` layout redirects to
  `/onboarding` until a connection exists, which is right for every ledger view
  but meant someone who abandoned the wizard could never reach Settings →
  Security to delete their own account. Settings moved to its own route group.
- **The bulk-action confirmation vanished.** The result message lived inside the
  selection toolbar, which unmounts when a successful action clears the
  selection. Hoisted out.
- **`requestMeta` was being shared out of a `'use server'` file**, where every
  export becomes a publicly callable endpoint. Moved to its own module.
- **A `server-only` module was imported by a Client Component** (the audit
  filter). The pure label helpers moved to `lib/audit-labels.ts`.
- **The range picker collided with typed date operators.** `date_after:` from the
  picker was appended to every search, and Firefly ANDs terms, so a user's own
  `date_after:` was silently narrowed and appeared to do nothing.

### Verification method

Every item was exercised against the running stack, not just typechecked:
Playwright drove the real forms for anything behind a Server Action (sign-up,
MFA enrolment and challenge, account deletion, bulk edit, quick add, search,
attachment rename/delete), and the result was confirmed in Firefly's own API or
in Postgres afterwards. Test rows created along the way were deleted.

`pnpm check:responsive` now covers 23 routes; the suite is green at
360/390/768/1440 px.

### After the checkpoint

Three more pieces landed before the release:

- **A navigation progress bar.** How to drive it took two wrong attempts, both
  settled by measurement: `history.pushState` fires _after_ an App Router
  navigation resolves, so a bar driven by it never appeared for programmatic
  `router.push` at all. The RSC request — `RSC: 1` without
  `Next-Router-Prefetch` — is the signal that works.
- **The transactions list was rebuilt twice**, the second time only after
  screenshotting it. Every numeric check had passed while day labels sat 24px
  right of the descriptions they labelled and the mobile bulk bar stacked its
  Delete button on top of the category picker. Measurement is not inspection.
- **`position: sticky` had never worked anywhere in the app.**
  `overflow-x-hidden` on the shell root makes the other axis compute to `auto`,
  turning it into a scroll container, so every sticky element was measured
  against a scrollport that never moves. The app header had been declaring
  `sticky top-0` and scrolling off screen since M0.

### Coverage

The pass shipped seven `lib/` modules with no tests at all, and CI caught it:
40 % statements against the 70 % gate. 106 tests were added afterwards, taking
`lib/` to ~95 % statements and ~85 % branches. Unit tests: **216 passing**.

That divergence is closed: the one `release.yml` pipeline runs `test:cov` on
every trigger, so a coverage regression now blocks a release as well as a merge.
