# Firefly Studio

A modern front-end client for [Firefly III](https://firefly-iii.org) — a real
dashboard, first-class reporting, fast transaction entry, and complete coverage
of the Firefly III REST API.

Firefly Studio is **not** a fork. Firefly III remains the system of record;
this is a presentation and workflow layer that owns its own identity system, so
you sign in here and attach your own Firefly instance.

> **Status: M0 (Foundation) complete.** The shell, design system, database,
> tooling and generated API surface are in place. Authentication and the
> onboarding wizard land in M1 — there is no sign-in yet.

## What is here today

| Area                                                                 | State |
| -------------------------------------------------------------------- | ----- |
| Next.js 15 + React 19 + TypeScript strict                            | ✅    |
| Tailwind v4 design tokens, light/dark, no flash                      | ✅    |
| Postgres schema (16 tables) + advisory-locked migrations             | ✅    |
| Firefly III v6.5.5 spec vendored, 230 operations generated           | ✅    |
| Money (`decimal.js`) and timezone-safe date modules, lint-enforced   | ✅    |
| Docker Compose: app, Postgres, Redis, optional real Firefly III      | ✅    |
| CI: format, lint, typecheck, test, migrate, build, image, spec drift | ✅    |
| Authentication and onboarding                                        | M1    |
| Dashboard, accounts, transactions backed by real data                | M2    |

The full backlog — 224 items across 25 epics — is in
[PROJECT_PLAN.md](PROJECT_PLAN.md).

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

Add a real Firefly III instance to develop against:

```bash
docker compose --profile firefly up -d    # http://localhost:8080
```

## Architecture

```
┌─────────────┐   session cookie   ┌──────────────────────┐   Bearer PAT   ┌──────────────┐
│   Browser   │ ─────────────────► │  Next.js + Postgres  │ ─────────────► │ Firefly III  │
│  (no PAT)   │ ◄───────────────── │                      │ ◄───────────── │  instance    │
└─────────────┘    JSON / RSC      └──────────────────────┘    api/v1/*    └──────────────┘
                                      PAT encrypted at rest
```

Every Firefly call is proxied server-side. The Personal Access Token is sealed
with AES-256-GCM and never reaches the browser. See
[ADR-0002](docs/adr/0002-proxy-all-firefly-traffic.md).

**If you expose this to the internet, set `FIREFLY_ALLOW_PRIVATE_NETWORKS=false`.**
The Firefly base URL is user-supplied, which makes SSRF the primary risk in this
design; the controls are specified in PROJECT_PLAN.md §4.2.

`APP_ENCRYPTION_KEY` decrypts every stored token. Back it up separately from
your database, and treat losing it as "every user re-enters their token".

## Documentation

- [PROJECT_PLAN.md](PROJECT_PLAN.md) — plan, API coverage inventory, backlog
- [CONTRIBUTING.md](CONTRIBUTING.md) — setup and the four enforced rules
- [docs/adr/](docs/adr/) — architecture decision records
- [spec/README.md](spec/README.md) — how the vendored API spec is maintained

## Licence

Not yet decided — see PROJECT_PLAN.md §11, Q6. Firefly III itself is AGPLv3.
