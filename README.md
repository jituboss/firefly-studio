<div align="center">

<img src="app/icon.svg" alt="" width="80" height="80">

# Firefly Studio

**A modern web client for [Firefly III](https://firefly-iii.org)** — a real dashboard,
first-class reporting, fast transaction entry, and near-complete coverage of the
Firefly III REST API.

[![Release](https://img.shields.io/github/v/release/jituboss/firefly-studio?label=release&color=1e61c5)](https://github.com/jituboss/firefly-studio/releases)
[![Build](https://github.com/jituboss/firefly-studio/actions/workflows/release.yml/badge.svg)](https://github.com/jituboss/firefly-studio/actions/workflows/release.yml)
[![Docker](https://img.shields.io/docker/pulls/jituboss/firefly-studio?color=1e61c5)](https://hub.docker.com/r/jituboss/firefly-studio)
[![Licence](https://img.shields.io/badge/licence-AGPL--3.0-1e61c5)](LICENSE)

</div>

---

Firefly Studio is **not a fork**. Firefly III remains the system of record; this is a
presentation and workflow layer with its own identity system, so you sign in here and
attach your own Firefly instance with a Personal Access Token. Your ledger never moves,
and you can keep using Firefly III's own UI alongside it.

> **Status: beta (`v0.6.2`).** Milestones M0–M6 are complete — the whole
> money-management, reporting and automation surface runs against your own instance
> — and M7 is most of the way there: the app is installable, passes an automated
> accessibility audit in both themes, and ships with a bundle budget and a typed
> error taxonomy. What remains is i18n, optimistic updates and the M8 security
> pass. See the [roadmap](#roadmap).

## Features

|                                                                                                                                                                                                        |       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| **Dashboard** — net worth, income, spending and balance with period-over-period deltas, net-worth chart, top categories, upcoming bills, savings goals, budget pacing                                  | ✅    |
| **Transactions** — virtualised grid, filters, operator-aware search, saved views, full create/edit/split/duplicate/delete, bulk edit, quick add, CSV export, attachments, transaction links            | ✅    |
| **Accounts** — grouped list, per-account detail with balance history and money in/out                                                                                                                  | ✅    |
| **Budgets, categories, subscriptions, piggy banks** — full CRUD, budget limits, spending pace, annualised cost, savings progress, object groups                                                        | ✅    |
| **Reports** — net worth, income vs expense, categories, budgets, accounts, tags, subscriptions, a cash-flow Sankey, and a custom report builder; CSV and print-to-PDF                                  | ✅    |
| **Automation** — rule groups with a visual builder and a dry run, recurring transactions with a forecast and manual trigger, tags with a cloud view and bulk tagging                                   | ✅    |
| **Currencies** — enable/disable, set the primary currency, manage exchange rates                                                                                                                       | ✅    |
| **Attachments** — upload, drag/drop/paste, camera capture, lightbox preview, and a manager for everything stored                                                                                       | ✅    |
| **A front door** — the sign-in page doubles as the landing page: it explains what this is to a first-time visitor without making a returning one scroll past it                                        | ✅    |
| **Accounts & auth** — sign-up, email verification, password reset, database-backed sessions, TOTP two-factor with recovery codes, active-session management, audit trail, account deletion             | ✅    |
| **Connections** — guided onboarding that probes your instance, several instances per account with a switcher, background health checks, and an optional managed instance users can be provisioned onto | ✅    |
| **Settings & admin** — Firefly preferences, an About/diagnostics panel, owner-gated user, user-group and instance-configuration management, and a danger zone behind step-up re-auth                   | ✅    |
| **Operations** — multi-stage non-root image, migrations on boot, health and readiness endpoints, Redis-backed response cache, opt-in Sentry error reporting                                            | ✅    |
| **Installable** — web manifest and service worker, an offline page, and a cache that deliberately holds no financial data                                                                              | ✅    |
| **Accessible** — an axe-core gate over 19 routes in both themes with zero violations, a text alternative for every chart, and a typed error state for every kind of failure                            | ✅    |
| **Polish & hardening** — i18n, optimistic updates, load testing, e2e suite                                                                                                                             | M7–M8 |

167 of 224 backlog items are complete. The full backlog, with what shipped and what was
cut, is [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) §8.

## Quick start

### Run the published image

Released versions are on Docker Hub as
[`jituboss/firefly-studio`](https://hub.docker.com/r/jituboss/firefly-studio); `latest`
tracks the newest stable tag.

```yaml
services:
  app:
    image: jituboss/firefly-studio:latest
    ports: ['3000:3000']
    environment:
      APP_URL: http://localhost:3000
      DATABASE_URL: postgresql://firefly_studio:CHANGE_ME@postgres:5432/firefly_studio
      REDIS_URL: redis://redis:6379
      APP_ENCRYPTION_KEY: # 32 random bytes, base64 — see below
      AUTH_SECRET: # 32 random bytes, base64 — see below
      RUN_MIGRATIONS_ON_BOOT: 'true'
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: firefly_studio
      POSTGRES_PASSWORD: CHANGE_ME
      POSTGRES_DB: firefly_studio
    volumes:
      - pgdata:/var/lib/postgresql/data
      # The schema needs citext and pgcrypto; this creates them on first boot.
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

Copy [`docker/init-db.sql`](docker/init-db.sql) next to that file. Generate the two
secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

[deploy/truenas/](deploy/truenas/) is a complete worked deployment — Firefly Studio,
Firefly III, Postgres and Redis in one file — along with the traps that cost time the
first time.

### Run from source

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

Or build and run the whole stack in Docker with `docker compose --profile app up --build`.

### Connect a Firefly instance

You need a Firefly III instance and a Personal Access Token from **Options → Profile →
OAuth** in it. To develop against a throwaway one:

```bash
docker compose --profile firefly up -d    # http://localhost:8080
pnpm firefly:seed                         # realistic multi-account data
```

**No mail provider is configured by default.** Verification and reset links are printed
to the server log, which is enough to finish sign-up while evaluating. See
[Mail](#mail) for real delivery.

## Configuration

Everything is environment variables; [`.env.example`](.env.example) documents all of
them. The ones worth knowing:

| Variable                         | Default   | What it does                                                  |
| -------------------------------- | --------- | ------------------------------------------------------------- |
| `APP_ENCRYPTION_KEY`             | —         | **Required.** Decrypts every stored Firefly token.            |
| `AUTH_SECRET`                    | —         | **Required.** Signs sessions.                                 |
| `DATABASE_URL`                   | —         | **Required.** Postgres connection string.                     |
| `REDIS_URL`                      | unset     | Response cache. Falls back to an in-process map.              |
| `FIREFLY_ALLOW_PRIVATE_NETWORKS` | `false`   | Allow LAN/loopback Firefly URLs. See [Security](#security).   |
| `MAIL_TRANSPORT`                 | `console` | `console`, `smtp` or `resend`.                                |
| `PASSWORD_BREACH_CHECK`          | `false`   | Check new passwords against Have I Been Pwned.                |
| `CRON_SECRET`                    | unset     | Enables `GET /api/cron/health`; the endpoint 404s without it. |
| `SENTRY_DSN`                     | unset     | Error reporting. Unset sends no telemetry anywhere.           |
| `MANAGED_FIREFLY_URL`            | unset     | Offer a managed instance during onboarding. See below.        |

### Mail

Console is the default so evaluation needs no mail provider. For real delivery set
`MAIL_TRANSPORT=smtp` with `SMTP_URL` (or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
`SMTP_PASSWORD`), or `MAIL_TRANSPORT=resend` with `RESEND_API_KEY`. A transport that is
selected but not configured fails at boot rather than silently swallowing every message.

To exercise the real SMTP path locally without owning a mail provider:

```bash
docker compose --profile mail up -d mailpit    # catches everything; UI on :8025
MAIL_TRANSPORT=smtp SMTP_HOST=mailpit SMTP_PORT=1025 \
  docker compose --profile app up -d --build app
```

### A managed Firefly instance

Onboarding normally asks for a URL and a Personal Access Token. If you run Firefly III
yourself alongside this app, setting `MANAGED_FIREFLY_URL`, `MANAGED_FIREFLY_ADMIN_EMAIL`
and `MANAGED_FIREFLY_ADMIN_PASSWORD` adds a second path: the app registers the user on
that instance and mints their token for them, so they never see a token at all.
`MANAGED_FIREFLY_LABEL` names it in the UI, and the instance must have single-user mode
turned **off**.

This drives Firefly's own registration pages, because its API cannot set a user's
password or issue a token on their behalf — so re-verify it after a Firefly upgrade.
`server/managed-firefly` explains the constraint in full.

## Architecture

```
┌─────────────┐   session cookie   ┌──────────────────────┐   Bearer PAT   ┌──────────────┐
│   Browser   │ ─────────────────► │  Next.js + Postgres  │ ─────────────► │ Firefly III  │
│  (no PAT)   │ ◄───────────────── │                      │ ◄───────────── │  instance    │
└─────────────┘    JSON / RSC      └──────────────────────┘    api/v1/*    └──────────────┘
                                      PAT encrypted at rest
```

Next.js 15 (App Router, React 19, TypeScript strict), Tailwind v4, PostgreSQL via
Drizzle, Redis, Recharts. Reads happen in Server Components; writes go through Server
Actions or a guarded proxy route. The app has its own identity system, separate from the
Firefly connection — [ADR-0001](docs/adr/0001-two-tier-identity.md) explains why.

## Security

**The Personal Access Token never reaches the browser.** Every Firefly call is proxied
server-side, and the token is sealed with AES-256-GCM at rest
([ADR-0002](docs/adr/0002-proxy-all-firefly-traffic.md)). The proxy allows only paths
present in the vendored OpenAPI spec, and destructive operations sit behind step-up
re-authentication.

Two things to get right before exposing this:

- **Set `FIREFLY_ALLOW_PRIVATE_NETWORKS=false` on anything internet-facing.** The Firefly
  base URL is supplied by the user, which makes SSRF the primary risk in this design; the
  controls are in [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) §4.2.
- **Back up `APP_ENCRYPTION_KEY` separately from your database.** It decrypts every stored
  token. Losing it means every user re-enters theirs.

The M8 hardening pass is not finished — key rotation, a load test and an independent
review are still open, though CSRF, dependency scanning and secret scanning have landed. Treat this as beta software: fine on a private network or behind
an authenticating proxy, not yet audited for a hostile one.
[docs/SECURITY.md](docs/SECURITY.md) lists every known gap by name, says what is in scope,
and explains how to report something privately.

## Roadmap

M0–M6 shipped the product surface. The two remaining milestones are about making it fit
to hand to someone else:

| Milestone                   | What is left                                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M7 — Polish**             | Mostly landed: accessibility audit, PWA, prefetching, bundle budget, preferences page, empty and error states, most primitives. Left: i18n, optimistic updates, the last few primitives, a systematic responsive pass                   |
| **M8 — Hardening & launch** | CSP/HSTS and CSRF double-submit, an SSRF test suite over the existing guard, encryption-key rotation, dependency and secret scanning, `SECURITY.md` and a threat model, Playwright e2e and contract tests, backup/restore and user docs |

A few things are blocked rather than pending, and the plan records what would unblock
each: the export centre (all nine `/data/export/*` endpoints return HTTP 500 on Firefly
III 6.5.5 — an upstream `league/csv` bug), Firefly OAuth2 and social sign-in (need
registered clients), and scheduled reports (need a job runner). Webhooks were dropped
from scope deliberately: Firefly III already owns the delivery log and retry state, so a
second UI could only be a worse copy — see E17 in the plan.

## Documentation

|                                              |                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| [docs/](docs/)                               | Documentation index                                                       |
| [docs/LEARNING.md](docs/LEARNING.md)         | Start here if you are picking this project up — the "why" and the gotchas |
| [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | Plan, architecture, API coverage inventory, backlog, verification logs    |
| [docs/adr/](docs/adr/)                       | Architecture decision records                                             |
| [docs/SECURITY.md](docs/SECURITY.md)         | Reporting a vulnerability, what is in scope, and the known gaps           |
| [docs/RELEASING.md](docs/RELEASING.md)       | Cutting and publishing a release                                          |
| [deploy/truenas/](deploy/truenas/)           | A worked single-file deployment, and the traps in it                      |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Setup and the four lint-enforced rules                                    |
| [CHANGELOG.md](CHANGELOG.md)                 | What changed, by version                                                  |
| [spec/README.md](spec/README.md)             | How the vendored Firefly API spec is maintained                           |

## Development

```bash
pnpm dev              # dev server
pnpm test             # unit tests (350)
pnpm lint             # includes the four enforced rules
pnpm typecheck
pnpm build
pnpm check:bundle     # per-route gzipped JS against a committed budget
pnpm check:a11y       # axe-core over 19 routes, light and dark
pnpm check:responsive # horizontal-overflow check at 4 widths (needs a session cookie)
pnpm audit            # dependency advisories at moderate and above
```

The full gate, which is what CI runs:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Four rules are enforced by lint rather than by convention — money stays a string until
rendered, dates are parsed in the user's timezone, the PAT never reaches the browser, and
the API spec is vendored. Each exists because of a specific bug.
[CONTRIBUTING.md](CONTRIBUTING.md) explains them, and is worth reading before a first
pull request.

## Licence

[GNU Affero General Public License v3.0 or later](LICENSE).

AGPL matches Firefly III's own licence. The practical consequence: if you modify Firefly
Studio and let other people use it over a network, you have to offer them the source of
your modified version — running it as a service counts as distribution under AGPL §13.
Using it unmodified, for yourself or inside your organisation, carries no such
obligation.

Firefly III is a separate project, also AGPLv3; this client only consumes its REST API
and is not affiliated with or endorsed by it.
