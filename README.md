# Firefly Studio

A modern web client for [Firefly III](https://firefly-iii.org) — a real
dashboard, first-class reporting, fast transaction entry, and steadily
expanding coverage of the Firefly III REST API.

Firefly Studio is **not** a fork. Firefly III remains the system of record;
this is a presentation and workflow layer with its own identity system, so you
sign in here and attach your own Firefly instance.

> **Status: alpha (`v0.2.0-alpha.1`).** Milestones M0–M5 are complete: you can
> sign up, attach a Firefly III instance, and run the whole money-management
> and reporting surface against it. Automation (rules, recurring transactions,
> tags, currencies) is M6 and not started.

## What works today

| Area                                                                                                                                                                                       |     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| **Accounts & auth** — sign-up, email verification, password reset, database-backed sessions, TOTP two-factor with recovery codes, active-session management, audit trail, account deletion | ✅  |
| **Onboarding** — guided wizard that probes your instance, checks its version, and stores the token encrypted                                                                               | ✅  |
| **Dashboard** — net worth, income, spending and balance with period-over-period deltas, net-worth chart, top categories, upcoming bills, savings goals, budget pacing                      | ✅  |
| **Accounts** — grouped list, per-account detail with balance history and money in/out                                                                                                      | ✅  |
| **Transactions** — virtualised grid, filters, operator-aware search, saved views, full create/edit/split/duplicate/delete, bulk edit, quick add, CSV export, attachments                   | ✅  |
| **Budgets, categories, subscriptions, piggy banks** — full CRUD, limits, spending pace, annualised cost, savings progress                                                                  | ✅  |
| **Reports** — net worth, income vs expense, categories, budgets, accounts, tags, subscriptions, a cash-flow Sankey, and a custom report builder; CSV and print-to-PDF                      | ✅  |
| **Attachments** — upload, drag/drop/paste, camera capture, lightbox preview, and a manager for everything stored                                                                           | ✅  |
| **Operations** — multi-stage non-root image, migrations on boot, health/readiness endpoints, Redis-backed caching, connection health checks                                                | ✅  |
| **Automation** — rules, recurring transactions, tags, currencies, admin                                                                                                                    | M6  |

117 of 229 backlog items are complete. The plan and the full backlog are in
[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

## Quick start

```bash
corepack enable pnpm
pnpm install
cp .env.example .env

# The two required secrets
node -e "console.log('APP_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))" >> .env
node -e "console.log('AUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))" >> .env

docker compose up -d postgres redis
pnpm db:migrate
pnpm dev                       # http://localhost:3000
```

Or run the whole stack in Docker:

```bash
docker compose --profile app up --build
```

You will need a Firefly III instance and a Personal Access Token from
**Options → Profile → OAuth** in it. To develop against a throwaway one:

```bash
docker compose --profile firefly up -d    # http://localhost:8080
pnpm firefly:seed                         # realistic multi-account data
```

**No mail provider is configured by default.** Verification and reset links are
printed to the server log, which is enough to finish sign-up while evaluating.
See [Mail](#mail) to send real email.

## Configuration

Everything is environment variables; `.env.example` documents all of them.
The ones worth knowing:

| Variable                         | Default   | What it does                                                  |
| -------------------------------- | --------- | ------------------------------------------------------------- |
| `APP_ENCRYPTION_KEY`             | —         | **Required.** Decrypts every stored Firefly token.            |
| `AUTH_SECRET`                    | —         | **Required.** Signs sessions.                                 |
| `DATABASE_URL`                   | —         | **Required.** Postgres connection string.                     |
| `REDIS_URL`                      | unset     | Response cache. Falls back to an in-process map.              |
| `FIREFLY_ALLOW_PRIVATE_NETWORKS` | `false`   | Allow LAN/loopback Firefly URLs. See the security note below. |
| `MAIL_TRANSPORT`                 | `console` | `console`, `smtp` or `resend`.                                |
| `PASSWORD_BREACH_CHECK`          | `false`   | Check new passwords against Have I Been Pwned.                |
| `CRON_SECRET`                    | unset     | Enables `GET /api/cron/health`; the endpoint 404s without it. |

### Mail

Console is the default so evaluation needs no mail provider. For real delivery
set `MAIL_TRANSPORT=smtp` with `SMTP_URL` (or `SMTP_HOST`/`SMTP_PORT`/
`SMTP_USER`/`SMTP_PASSWORD`), or `MAIL_TRANSPORT=resend` with `RESEND_API_KEY`.
A transport that is selected but not configured fails at boot rather than
silently swallowing every message.

To exercise the real SMTP path locally without owning a mail provider:

```bash
docker compose --profile mail up -d mailpit    # catches everything; UI on :8025
MAIL_TRANSPORT=smtp SMTP_HOST=mailpit SMTP_PORT=1025 \
  docker compose --profile app up -d --build app
```

## Architecture

```
┌─────────────┐   session cookie   ┌──────────────────────┐   Bearer PAT   ┌──────────────┐
│   Browser   │ ─────────────────► │  Next.js + Postgres  │ ─────────────► │ Firefly III  │
│  (no PAT)   │ ◄───────────────── │                      │ ◄───────────── │  instance    │
└─────────────┘    JSON / RSC      └──────────────────────┘    api/v1/*    └──────────────┘
                                      PAT encrypted at rest
```

Next.js 15 (App Router, React 19, TypeScript strict), Tailwind v4, PostgreSQL
via Drizzle, Redis, Recharts. Reads happen in Server Components; writes go
through Server Actions or a guarded proxy route.

Every Firefly call is proxied server-side. The Personal Access Token is sealed
with AES-256-GCM and never reaches the browser
([ADR-0002](docs/adr/0002-proxy-all-firefly-traffic.md)).

### Two things to get right before exposing this

**Set `FIREFLY_ALLOW_PRIVATE_NETWORKS=false` on anything internet-facing.** The
Firefly base URL is supplied by the user, which makes SSRF the primary risk in
this design; the controls are in [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)
§4.2.

**Back up `APP_ENCRYPTION_KEY` separately from your database.** It decrypts
every stored token. Losing it means every user re-enters theirs.

## Documentation

|                                              |                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| [docs/](docs/)                               | Documentation index                                                       |
| [docs/LEARNING.md](docs/LEARNING.md)         | Start here if you are picking this project up — the "why" and the gotchas |
| [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | Plan, architecture, API coverage inventory, backlog, verification logs    |
| [docs/adr/](docs/adr/)                       | Architecture decision records                                             |
| [docs/RELEASING.md](docs/RELEASING.md)       | Cutting and publishing a release                                          |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Setup and the four lint-enforced rules                                    |
| [CHANGELOG.md](CHANGELOG.md)                 | What changed, by version                                                  |
| [spec/README.md](spec/README.md)             | How the vendored Firefly API spec is maintained                           |

## Development

```bash
pnpm dev              # dev server
pnpm test             # unit tests (110)
pnpm lint             # includes the four enforced rules
pnpm typecheck
pnpm build
pnpm check:responsive # horizontal-overflow check at 4 widths (needs a session cookie)
```

The full gate, which is what CI runs:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Four rules are enforced by lint rather than convention — money stays a string
until rendered, dates are parsed in the user's timezone, the PAT never reaches
the browser, and the API spec is vendored. Each exists because of a specific
bug. [CONTRIBUTING.md](CONTRIBUTING.md) explains them.

## Licence

Not yet decided — see [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) §11, Q6.
Firefly III itself is AGPLv3.
