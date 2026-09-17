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
│  │  ├─ currencies/  webhooks/  admin/
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
Tags · Currencies & rates · Webhooks
Settings ──► Profile · Security (MFA, sessions) · Firefly connections · Preferences · Data · About
Admin (if Firefly user is owner) ──► Users, user groups, configuration, cron
```

---

## 6. Delivery plan — milestones

| #      | Milestone                  | Scope                                                                      | Exit criteria                                                       | Est.  |
| ------ | -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----- |
| **M0** | Foundation                 | Repo, CI, Docker, design tokens, DB migrations, OpenAPI codegen            | `docker compose up` serves a themed shell; migrations run; CI green | 2 wks |
| **M1** | Auth & onboarding          | Sign-up/in, verify, reset, sessions, connection wizard, encrypted PAT      | A new user can sign up and attach a Firefly instance end-to-end     | 2 wks |
| **M2** | Read core                  | Proxy + cache, dashboard v1, accounts, transaction list, search            | Dashboard and transaction list render live Firefly data             | 3 wks |
| **M3** | Write core                 | Transaction create/edit/delete, splits, attachments, bulk ops              | Full transaction lifecycle without touching Firefly's own UI        | 2 wks |
| **M4** | Money management           | Budgets, limits, categories, bills, piggy banks, object groups             | All four resource families CRUD-complete                            | 3 wks |
| **M5** | Reporting                  | Insight + chart endpoints, 7 standard reports, builder, exports            | Reports match Firefly's own figures to the cent                     | 3 wks |
| **M6** | Automation & the long tail | Rules, recurring, tags, currencies, exchange rates, webhooks, links, admin | 28/28 API groups covered                                            | 3 wks |
| **M7** | Polish                     | A11y audit, i18n, PWA, perf budget, empty/error states, onboarding tour    | Lighthouse targets met; axe clean                                   | 2 wks |
| **M8** | Hardening & launch         | Pen-test fixes, load test, docs, release image, backup/restore             | v1.0 tagged and documented                                          | 2 wks |

### 6.1 Effort reconciliation

The backlog in §8 totals **345 ideal engineering days** across 224 items:

| Slice                              | Ideal days | 1 engineer @ 70 % focus | 2 engineers | 3 engineers |
| ---------------------------------- | ---------- | ----------------------- | ----------- | ----------- |
| **P0 only** (thin but complete v1) | 168 d      | ~48 wks                 | ~24 wks     | ~17 wks     |
| **P0 + P1** (the real v1.0)        | 302 d      | ~86 wks                 | ~43 wks     | ~30 wks     |
| Everything incl. P2                | 345 d      | ~99 wks                 | ~49 wks     | ~34 wks     |

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
| `webhooks`                | `/webhooks`, `/{id}`, `/{id}/messages`, `/messages/{messageId}`, `/attempts`, `/{id}/submit`, `/{id}/trigger-transaction/{txId}`                                                              | automation + delivery log      | E17              | M6        |
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
- [ ] **E1-16** `P1` `0.5d` Approve `@sentry/cli` builds in the release job only, and wire `SENTRY_AUTH_TOKEN` so source maps actually upload

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

- [x] **E2-01** `P0` `2d` `users`/`sessions` schema + database-backed sessions — **implemented directly, not via Auth.js v5**; Auth.js forces JWT sessions with the Credentials provider, which defeats server-side revocation. See [ADR-0004](docs/adr/0004-hand-rolled-sessions-instead-of-authjs.md).
- [x] **E2-02** `P0` `2d` Sign-up: email + password, Argon2id (m=19456, t=2, p=1), 12-char floor, inline strength meter — **zxcvbn and the HIBP breach check were cut** (see E2-27); non-enumerating duplicate-email response
- [x] **E2-03** `P0` `1d` Email verification (single-use SHA-256-hashed token, 24 h expiry, atomic consume) + resend with rate limit
- [x] **E2-04** `P0` `1d` Sign-in with rate limiting (5/15 min per email, 20/15 min per IP) and non-enumerating errors; constant-time dummy hash so response time does not reveal account existence
- [x] **E2-05** `P0` `1d` Password reset request + confirm; revokes every session for the user
- [ ] **E2-06** `P1` `2d` TOTP MFA: enrol, QR, verify, recovery codes (shown once) — _schema in place (`mfa_credentials`, `mfa_recovery_codes`), UI deferred_
- [ ] **E2-07** `P2` `2d` WebAuthn/passkey as a second factor and as a login method
- [ ] **E2-08** `P1` `1d` Active-sessions list with device/IP/last-seen and remote revoke — _`revokeAllSessions` exists; the UI does not_
- [ ] **E2-09** `P1` `1d` `audit_log` viewer in Settings → Security — _the writer ships and records 9 event types; the viewer does not_
- [ ] **E2-10** `P1` `1d` Account deletion: confirm, cascade, purge cache namespace, tombstone
- [ ] **E2-11** `P2` `1d` Optional OAuth sign-in (Google/GitHub) with account linking
- [ ] **E2-12** `P2` `3d` Firefly **OAuth2** connection option (authorization-code + refresh) as an alternative to PAT

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
- [ ] **E2-23** `P1` `2d` Multiple connections + an instance switcher in the app shell — _the data model and service layer already support N connections; only the switcher UI is missing_
- [ ] **E2-24** `P1` `1d` Background health check job (hourly): update `status`, notify on transition to failing — _manual "Test now" ships; the scheduled job does not_
- [ ] **E2-25** `P1` `1d` Global "connection broken" banner with a one-click re-authenticate flow — _the app shell shows a status dot; the banner does not exist_
- [ ] **E2-26** `P2` `1d` Demo mode — read-only connection to `demo.firefly-iii.org` for evaluation

**Cut from M1, deliberately:**

- [ ] **E2-27** `P1` `1d` Password strength via zxcvbn + HIBP k-anonymity breach check — dropped from E2-02 to avoid an ~800 kB client dependency and an outbound call per sign-up. The 12-character floor and a small common-password list ship instead.
- [ ] **E2-28** `P0` `1d` Real email transport. M1 ships a **console transport**: verification and reset links are printed to the server log, which is enough to complete both flows in development and self-host evaluation. Blocked on Q4 (Resend / SES / BYO SMTP).

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

- [ ] **E3-01** `P0` `2d` App shell: collapsible sidebar, top bar, breadcrumb, responsive drawer, skip-to-content
- [ ] **E3-02** `P0` `2d` Global date-range picker (this month / last / QTD / YTD / last 12 mo / custom) persisted per user and reflected in the URL
- [ ] **E3-03** `P0` `1d` `⌘K` command palette: navigate, create, search, toggle theme, switch connection
- [ ] **E3-04** `P0` `2d` KPI tiles from `/summary/basic`: net worth, spent, earned, balance — with period-over-period delta and sparkline
- [ ] **E3-05** `P0` `2d` Net-worth trend chart from `/chart/balance/balance`
- [ ] **E3-06** `P0` `2d` Account balance cards from `/accounts?type=asset` with mini balance charts
- [ ] **E3-07** `P0` `1d` Recent transactions widget with inline category edit
- [ ] **E3-08** `P1` `2d` Budget progress widget from `/budgets` + `/budget-limits` with burn-down pacing indicator
- [ ] **E3-09** `P1` `1d` Upcoming bills widget from `/bills` (next due, projected amount, paid/unpaid)
- [ ] **E3-10** `P1` `1d` Piggy-bank progress widget
- [ ] **E3-11** `P1` `1d` Top spending categories widget from `/insight/expense/category`
- [ ] **E3-12** `P1` `3d` **Draggable dashboard grid** — reorder/resize/hide widgets, persisted to `user_preferences.dashboard_layout`
- [ ] **E3-13** `P1` `1d` Per-widget skeletons + independent error boundaries (one failing widget never blanks the page)
- [ ] **E3-14** `P1` `0.5d` "Hide balances" privacy toggle (blurs all amounts, survives reload)
- [ ] **E3-15** `P2` `1d` Cash-flow forecast widget (recurring + bills projected 30 days out)

### E4 · Accounts — M2

- [ ] **E4-01** `P0` `2d` Account list grouped by type (asset / expense / revenue / liability / cash) with totals per group
- [ ] **E4-02** `P0` `1d` Filters: type, active/inactive, currency; sort by name/balance/last activity
- [ ] **E4-03** `P0` `3d` Account detail: header KPIs, balance-over-time chart (`/chart/account/overview`), tabbed transactions / piggy banks / attachments
- [ ] **E4-04** `P0` `2d` Create/edit account form — all fields: type, role, currency, opening balance + date, virtual balance, IBAN, BIC, account number, include-in-net-worth, notes, liability type/direction/interest + period
- [ ] **E4-05** `P0` `1d` Delete account with a warning showing the transaction count that will be affected
- [ ] **E4-06** `P1` `1d` Reconciliation helper: enter a statement balance, see the difference, jump to unreconciled items
- [ ] **E4-07** `P1` `1d` Liability detail: amortisation view, interest, remaining principal
- [ ] **E4-08** `P1` `0.5d` Archive/activate toggle and bulk archive
- [ ] **E4-09** `P2` `1d` Account ordering (drag) + custom colours/icons stored in our prefs

### E5 · Transactions — M2 (read) / M3 (write)

- [ ] **E5-01** `P0` `3d` Virtualised transaction grid — date, description, source→destination, category, budget, tags, amount; sticky header; density toggle
- [ ] **E5-02** `P0` `3d` Filter rail: date range, accounts, type, amount range, category, budget, bill, tags, currency, has-attachment, reconciled, free text
- [ ] **E5-03** `P0` `1d` URL-synced filter state (shareable, back-button safe) + infinite scroll over `meta.pagination`
- [ ] **E5-04** `P0` `1d` Saved views (`saved_views` table) with pinning to the sidebar
- [ ] **E5-05** `P0` `2d` Transaction detail drawer: all journal fields, attachments, links, piggy-bank events, audit metadata
- [ ] **E5-06** `P0` `4d` **Create/edit form** — withdrawal / deposit / transfer tabs; autocomplete-backed account pickers; category, budget, bill, tags; date + time; notes; internal/external reference; custom date fields (book/process/due/payment/invoice)
- [ ] **E5-07** `P0` `3d` **Split transaction editor** — add/remove splits, per-split account/category/budget/amount, live remainder validation
- [ ] **E5-08** `P0` `2d` **Foreign-currency support** — foreign amount + currency, rate display, hint from `/exchange-rates`
- [ ] **E5-09** `P0` `1d` Delete with undo toast (optimistic remove, restore on undo)
- [ ] **E5-10** `P0` `1d` Duplicate / "repeat this transaction" action
- [ ] **E5-11** `P1` `2d` Multi-select + bulk edit via `POST /data/bulk/transactions` (set category/budget/tags, clear fields)
- [ ] **E5-12** `P1` `1d` Inline edit of category/budget/tags directly in the grid
- [ ] **E5-13** `P1` `2d` **Quick-add bar** — natural-language-ish single line ("42.50 groceries at Tesco yesterday"), parsed client-side into a pre-filled form
- [ ] **E5-14** `P1` `2d` Transaction links: link types CRUD, link two transactions (refund / reimbursement / paid-by), show links both ways
- [ ] **E5-15** `P1` `1d` Reconciled flag toggle + reconciliation filter
- [ ] **E5-16** `P1` `1d` Export the current filtered view to CSV/XLSX
- [ ] **E5-17** `P1` `2d` All 17 `/autocomplete/*` endpoints behind one debounced, cached `useAutocomplete` hook
- [ ] **E5-18** `P2` `2d` Keyboard-only rapid entry mode (enter a transaction without touching the mouse)
- [ ] **E5-19** `P2` `1d` Attach-receipt-by-drop directly onto a grid row

### E6 · Budgets — M4

- [ ] **E6-01** `P0` `2d` Budget list with spent / limit / remaining bars and pacing (are we ahead or behind for the day of the month?)
- [ ] **E6-02** `P0` `2d` Budget CRUD: name, active, auto-budget type (none/reset/rollover), amount, period
- [ ] **E6-03** `P0` `2d` Budget-limit management per period: create, edit, delete, copy last period, bulk-set
- [ ] **E6-04** `P0` `2d` Budget detail: spend chart (`/chart/budget/overview`), limit history, transactions, attachments
- [ ] **E6-05** `P1` `1d` `/budgets/transactions-without-budget` view — "unbudgeted spending" with a bulk-assign action
- [ ] **E6-06** `P1` `1d` Available budgets (`/available-budgets`) — envelope total vs. allocated vs. unallocated
- [ ] **E6-07** `P1` `2d` Budget performance report: planned vs. actual by period, variance, 12-month trend
- [ ] **E6-08** `P1` `1d` Over-budget warnings surfaced in the notification inbox
- [ ] **E6-09** `P2` `2d` Envelope-style drag-to-reallocate between budgets

### E7 · Categories — M4

- [ ] **E7-01** `P0` `1d` Category list with period spend/earn and sparkline
- [ ] **E7-02** `P0` `1d` Category CRUD + notes
- [ ] **E7-03** `P0` `2d` Category detail: `/chart/category/overview`, transactions, attachments, month-over-month trend
- [ ] **E7-04** `P1` `1d` Uncategorised inbox (`/insight/expense/no-category`) with bulk categorise
- [ ] **E7-05** `P1` `1d` Merge categories (reassign transactions, then delete the source)
- [ ] **E7-06** `P2` `2d` Suggested category on transaction entry based on payee history

### E8 · Bills / Subscriptions — M4

- [ ] **E8-01** `P0` `2d` Bill list: name, amount range, repeat frequency, next expected, paid this period, active
- [ ] **E8-02** `P0` `2d` Bill CRUD: min/max amount, currency, date, end date, extension date, repeat freq, skip, active, object group, notes
- [ ] **E8-03** `P0` `2d` Bill detail: matched transactions, linked rules (`/bills/{id}/rules`), attachments, payment history
- [ ] **E8-04** `P1` `2d` **Subscription calendar** — month view of expected charges with paid/unpaid/overdue state
- [ ] **E8-05** `P1` `1d` Annualised subscription cost summary and "most expensive subscriptions" ranking
- [ ] **E8-06** `P1` `1d` Unpaid/overdue bill alerts in the notification inbox
- [ ] **E8-07** `P2` `1d` "Create a matching rule from this bill" shortcut

### E9 · Piggy banks & object groups — M4

- [ ] **E9-01** `P0` `2d` Piggy-bank list with progress rings, target date, and required-per-month figure
- [ ] **E9-02** `P0` `2d` Piggy CRUD: account, name, target amount, start/target date, current amount, order, object group, notes
- [ ] **E9-03** `P0` `1d` Add/remove money with the resulting `/piggy-banks/{id}/events` history timeline
- [ ] **E9-04** `P1` `1d` Attachments tab; auto-computed "on track / behind" status
- [ ] **E9-05** `P1` `2d` Object-group management: CRUD, reorder, and grouped rendering across piggy banks and bills
- [ ] **E9-06** `P2` `1d` Savings-goal projection chart (current pace vs. required pace)

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

- [ ] **E14-01** `P0` `2d` Report shell: period selector, account/currency scope, compare-to-previous toggle, print stylesheet
- [ ] **E14-02** `P0` `3d` **Net worth report** — assets vs. liabilities over time, stacked area + table, per-account contribution
- [ ] **E14-03** `P0` `3d` **Income vs. Expense** — monthly bars, running net, savings rate, top sources/sinks (`/insight/income/*`, `/insight/expense/*`)
- [ ] **E14-04** `P0` `3d` **Category report** — treemap + ranked bars + month-over-month table, drill to transactions
- [ ] **E14-05** `P0` `2d` **Budget report** — planned vs. actual, variance, rollover tracking, 12-month heatmap
- [ ] **E14-06** `P1` `3d` **Cash-flow Sankey** — income sources → accounts → expense categories (d3-sankey)
- [ ] **E14-07** `P1` `2d` **Tag report** — spend by tag over time, tag combinations
- [ ] **E14-08** `P1` `2d` **Account report** — per-account income/expense/transfer breakdown (`/insight/*/asset`)
- [ ] **E14-09** `P1` `2d` **Bill/subscription report** — recurring cost trend, annualised total, cancelled-vs-active
- [ ] **E14-10** `P1` `4d` **Custom report builder** — pick a metric, dimension, filter set, and chart type; save to `saved_reports`; pin to the dashboard
- [ ] **E14-11** `P1` `2d` Export any report to CSV, XLSX, and a print-quality PDF
- [ ] **E14-12** `P1` `1d` Every chart element drills through to the underlying filtered transaction list
- [ ] **E14-13** `P2` `2d` Scheduled reports — monthly email with a PDF attached (BullMQ + `report_runs`)
- [ ] **E14-14** `P2` `3d` **Year in review** — an annual narrative summary with highlights and shareable cards
- [ ] **E14-15** `P1` `1d` **Reconciliation test:** an automated check asserting our report totals equal Firefly's own figures to the cent

### E15 · Search — M2

- [ ] **E15-01** `P0` `2d` Global search over `/search/transactions` + `/search/accounts`, grouped results, keyboard navigation
- [ ] **E15-02** `P1` `1d` Firefly search-operator support (`amount_is:`, `category_is:`, `date_after:`, …) with an autocompleting operator hint bar
- [ ] **E15-03** `P1` `1d` Recent searches + saved searches
- [ ] **E15-04** `P2` `1d` Search-result → bulk action pipeline

### E16 · Attachments — M3

- [ ] **E16-01** `P0` `2d` Two-step upload (`POST /attachments` then `POST /attachments/{id}/upload`) with progress and retry
- [ ] **E16-02** `P0` `1d` Drag-and-drop zone, paste-from-clipboard, multi-file
- [ ] **E16-03** `P0` `1d` Streamed download through the proxy with correct `Content-Disposition`
- [ ] **E16-04** `P1` `1d` Inline preview for images and PDFs in a lightbox
- [ ] **E16-05** `P1` `1d` Attachment manager: list all, filter by attached model, rename, delete
- [ ] **E16-06** `P2` `2d` Mobile receipt capture via the camera, with client-side compression before upload

### E17 · Webhooks — M6

- [ ] **E17-01** `P1` `2d` Webhook CRUD: title, active, trigger, response, delivery, URL
- [ ] **E17-02** `P1` `2d` Delivery log: messages, attempts, status, payload/response inspector with pretty JSON
- [ ] **E17-03** `P1` `1d` Manual submit (`/webhooks/{id}/submit`) and trigger-for-transaction actions
- [ ] **E17-04** `P1` `1d` Delete individual messages and attempts
- [ ] **E17-05** `P2` `1d` Webhook health summary (success rate, last failure) on the list

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

- [ ] **E22-01** `P0` `2d` Proxy response cache (Redis, per-user namespace) with per-endpoint TTLs and tag-based invalidation on writes
- [ ] **E22-02** `P0` `1d` ETag / `If-None-Match` pass-through where Firefly supports it
- [ ] **E22-03** `P0` `1d` Per-user rate limiting and a request-concurrency cap to protect small self-hosted instances
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
- [ ] **E23-04** `P0` `1d` Proxy path allowlist + step-up re-auth on destructive operations
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
- [ ] **E24-07** `P1` `1d` Coverage gate at 80 % for `lib/` and `server/`

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
