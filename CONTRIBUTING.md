# Contributing to Firefly Studio

## Prerequisites

- Node 20.11+ to build; **Node 24 LTS is what CI and the Docker image run**, so match it if you can
- pnpm 12 — `corepack enable pnpm`
- Docker, for Postgres and Redis

## Getting started

```bash
pnpm install
cp .env.example .env

# Generate the two required secrets
node -e "console.log('APP_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))" >> .env
node -e "console.log('AUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))" >> .env

docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

To develop against a real Firefly III instance:

```bash
docker compose --profile firefly up -d   # http://localhost:8080
```

Register a user there, then create a Personal Access Token under
**Options → Profile → OAuth → Personal Access Tokens**.

## Commands

| Command                                           | What it does                               |
| ------------------------------------------------- | ------------------------------------------ |
| `pnpm dev`                                        | Next dev server                            |
| `pnpm build`                                      | Production build                           |
| `pnpm lint` / `pnpm lint:fix`                     | ESLint                                     |
| `pnpm format` / `pnpm format:check`               | Prettier                                   |
| `pnpm typecheck`                                  | `tsc --noEmit`                             |
| `pnpm test` / `pnpm test:watch` / `pnpm test:cov` | Vitest                                     |
| `pnpm db:generate`                                | Generate a migration from schema changes   |
| `pnpm db:migrate`                                 | Apply migrations (advisory-locked)         |
| `pnpm db:studio`                                  | Drizzle Studio                             |
| `pnpm spec:update`                                | Fetch a newer Firefly III spec and diff it |
| `pnpm spec:codegen`                               | Regenerate `spec/generated/`               |

## The four rules that are enforced, not suggested

These are wired into ESLint and CI because each one has a specific, expensive
failure mode. Do not work around them; if a rule is genuinely wrong for a case,
change the rule in a reviewed PR.

### 1. Money is a string until it is rendered

Firefly III returns amounts as strings (`"-1234.56"`) deliberately, to keep
clients from round-tripping them through a float. `0.1 + 0.2 !== 0.3`, and over
a few thousand transactions that drift becomes visible in a report total.

Use `lib/money.ts`. `Number()` and `parseFloat` are **lint errors** in `app/`,
`components/` and `server/`.

```ts
import { add, formatMoney, toApiString } from '@/lib/money';

const total = add(...transactions.map((t) => t.amount)); // Decimal
formatMoney(total, { currency: 'EUR', locale: 'en-GB' }); // display
toApiString(total); // back to the wire
```

### 2. Dates are parsed in the user's timezone, never the browser's

`new Date('2026-03-15')` is UTC midnight, which is 14 March for anyone west of
Greenwich. That single off-by-one moves transactions between months and
corrupts every report boundary.

Use `lib/date.ts`. `new Date(someString)` is a **lint error**.

### 3. The Personal Access Token never reaches the browser

All Firefly traffic is proxied server-side. The token is sealed with AES-256-GCM
and read only by `server/crypto`, only from the proxy. The API exposes
`tokenHint` (last four characters) and nothing more. `server/db/schema.ts`
exports `connectionPublicColumns` — select through it in any render path.

### 4. The Firefly client is generated, never hand-written

`spec/firefly-iii-v1.yaml` is vendored on purpose: builds stay reproducible and
API drift shows up as a reviewable diff instead of a production failure. Run
`pnpm spec:update` to pull a newer release; CI fails if `spec/generated/` is
stale.

## Architecture decisions

Significant decisions live in [`docs/adr/`](docs/adr/). Add one when you make a
choice that a future contributor would otherwise have to reverse-engineer.

## Commit and branch conventions

- Branch: `<type>/<backlog-id>-<slug>`, e.g. `feat/E5-07-split-editor`
- Commit subject: `<type>(<scope>): <summary>` — `feat`, `fix`, `chore`,
  `docs`, `refactor`, `test`, `perf`, `build`
- Reference the backlog item in the body so the plan stays the source of truth.

## Definition of done

Every item ships against docs/PROJECT_PLAN.md §12. The PR template restates it.
