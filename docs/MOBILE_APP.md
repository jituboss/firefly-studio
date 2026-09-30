# Firefly Studio Mobile — Architecture & Plan

> **Status:** decided 2026-09-30. The chosen approach is Option C: shared core, a server-side API,
> and a native UI. The app connects to a Firefly Studio server and nothing else. Nothing is built
> yet. Written against `v0.13.0`.
> **Record before code:** ADR-0005. The decision reverses a v1 non-goal (`PROJECT_PLAN.md` §1.4:
> "Native mobile apps — PWA only in v1"), so update §1.4 as well.

---

## 1. Summary

The mobile app is an **Expo (React Native) app in this repository**. On first launch it asks for a
**Firefly Studio server URL**. From there it behaves like the web app: the same sign-up and sign-in,
the same onboarding, the same ledger, the same rules. It is a second client of the same server.

- **The server does all the Firefly work.** The app never talks to Firefly and never holds a PAT.
  ADR-0001 and ADR-0002 apply unchanged.
- **Writes and computed views go through one service layer**, which the web's Server Actions and a
  new `/api/v1` both call. A fix to how a split is saved or how a budget converts currency ships
  once, in the server image, and both clients get it.
- **Pure logic, contracts and design tokens are shared packages.** The app formats money, parses
  dates and colours an expense exactly as the web does, because it runs the same code.
- **The UI is native.** The web's component files can't run in React Native: it renders HTML with
  Tailwind CSS, Radix, Recharts and Server Components, and React Native has none of these. The app
  shares the components' _contracts_ (props, rules, tokens) and draws them with native renderers.

A change to logic, data, Firefly behaviour or colours reaches both apps. A change to a web page's
_layout_ has to be ported. §7 covers how to keep that cheap.

---

## 2. What the codebase allows — measured on `v0.13.0`

| Area                                | Size                    | How the app uses it                                                                                                                                                          |
| ----------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/` (pure logic)                 | ~8,100 lines, 46 files  | **~90 % shared as a package.** Only `env`, `logger`, `request-id`, `totp`, `access-log`, `csp` and `image-compress` are platform-bound, and all but the last are server-only |
| `server/firefly/types.ts`           | hand-written types      | **Shared as a package.** Pure types                                                                                                                                          |
| `spec/generated/request-schemas.ts` | 80 Zod schemas          | **Shared.** Zod runs on Hermes, so forms validate on the phone against the schemas the proxy enforces                                                                        |
| `server/` (auth, Firefly, crypto)   | ~10,500 lines           | **Reused over HTTP.** It stays where it runs today                                                                                                                           |
| Server Actions                      | 103 exports in 28 files | **Not callable from native.** Their Firefly rules move into `server/services/*`, which both the actions and `/api/v1` call                                                   |
| `components/` + `app/**/*.tsx`      | ~31,600 lines           | **~0 % directly.** DOM + Tailwind + Radix. Props, state logic and hooks can be extracted                                                                                     |
| `app/globals.css` tokens            | 97 `oklch()` values     | **Via a build step.** RN accepts neither CSS variables nor `oklch()`                                                                                                         |

**The seam that makes this cheap:** `getActiveConnection()` (`server/firefly/api.ts:88`) resolves
the connection from the database via `requireSession()`, not from a cookie. The only cookie reads are
in `server/auth/session.ts`. If `getSession()` also accepts `Authorization: Bearer`, then
`fireflyGet`, `fireflyWrite`, the cache, the rate limiter, the allowlist and the proxy all work for
the app unchanged.

---

## 3. The decision, and what was rejected

| Option                                                                          | Verdict                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C. Shared core + server API, native UI, connects to a Studio server**         | **Chosen.** The web stays idiomatic Next.js, the app feels native, and Firefly behaviour lives in one place: the server                                                                                                                                               |
| A. Capacitor/WebView shell around the PWA                                       | Rejected as a foundation. It doesn't feel native, App Store review can reject a thin wrapper (guideline 4.2), and it inherits the phone overlay problems in `LEARNING.md` §7c. The PWA already covers "on the home screen"                                            |
| B. Rewrite the web in RN primitives + `react-native-web`                        | Rejected. It rewrites ~31k lines of the most-verified code and gives up Server Components, the PAT-free render path, the bundle budget, the axe gate and the print pipeline                                                                                           |
| C′. "Direct mode": the app talks straight to Firefly with a PAT in the keystore | Rejected (considered on 2026-09-30). It would need the Firefly layer ported to run on the phone, puts a long-lived, full-scope PAT on the device, loses Studio identity, MFA, audit and cache, and makes each Firefly quirk a fix that has to ship through app stores |

---

## 4. Target architecture

```
┌──────────────────────┐                          ┌──────────────────────────────────────────┐
│  Web (Next.js, RSC)  │── cookie + CSRF ────────►│  Firefly Studio server  (this repo;      │
│                      │   Server Actions, /api/ff │  one image, one compose file)            │
└──────────┬───────────┘                          │                                          │
           │ imports                              │   /api/ff/*   proxy: reads, autocomplete │   Bearer PAT   ┌────────────┐
   ┌───────┴─────────────────────────┐            │   /api/v1/*   app API (NEW)              │──────────────► │ Firefly III│
   │ packages/core       pure logic  │            │        │                                 │                └────────────┘
   │ packages/contracts  types + zod │            │        ▼                                 │
   │ packages/client     fetch+query │            │   server/services/*  (NEW, extracted     │
   │ packages/tokens     design tokens│           │   from Server Actions, shared by both)   │
   └───────┬─────────────────────────┘            │        │                                 │
           │ imports                              │   fireflyGet / fireflyWrite / cache /    │
┌──────────┴───────────┐                          │   rate limit / audit / SSRF guard        │
│  Mobile (Expo, RN)   │── Bearer session token ─►│   Postgres · Redis                       │
│  apps/mobile         │   /api/v1, /api/ff        └──────────────────────────────────────────┘
└──────────────────────┘
```

Three rules:

1. **The device never holds the PAT.** The app authenticates to _Studio_, and Studio talks to
   Firefly. Attaching a Firefly by PAT sends the token to the server once, where it is sealed; the
   app keeps no copy.
2. **One service layer, two adapters.** A Server Action and an `/api/v1` route are both thin
   wrappers around the same `server/services/*` function. Neither contains business rules.
3. **App writes never go through the raw proxy.** A `PUT /transactions/{id}` that omits a split
   _deletes the split_ (`LEARNING.md` §7). The services re-read and resend the whole group, and the
   raw proxy does not. When the caller is the app, the proxy is for reads and autocomplete only.

### 4.1 Repository layout

The Next.js app stays at the repository root for now. The Dockerfile, standalone build, `check:*`
scripts, bundle budget and CI all assume the root. Move it to `apps/web` only if that becomes painful.

```
firefly-studio/
├─ app/ components/ server/ …    # the web app and the server, where they are today
│  └─ server/services/           # NEW: the Firefly rules, extracted from Server Actions
│  └─ server/views/              # NEW: view models shared by pages and /api/v1/views
├─ lib/                          # web-only helpers + re-export shims during migration
├─ packages/
│  ├─ core/        # was lib/*: money, date, date-range, reports, reconcile, fx, sankey,
│  │               #   amortisation, search-operators, rule-expressions, error-taxonomy, …
│  ├─ contracts/   # Firefly types, spec request schemas, /api/v1 request + response schemas,
│  │               #   cache-tag map, error codes, primitive prop types
│  ├─ client/      # typed fetch client + TanStack Query hooks; base URL and token injected
│  └─ tokens/      # tokens.json → CSS variables (web) + sRGB theme (native)
├─ apps/mobile/    # Expo app
└─ pnpm-workspace.yaml           # packages: ['.', 'packages/*', 'apps/*']
```

Every shared package lists `react` as a **peer** dependency. The web runs React 19.3, and React
Native pins its own React version. Two copies of React fail at runtime, not at build.

### 4.2 The `/api/v1` layer

Plain Next.js route handlers under `app/api/v1/`, in five groups:

| Group                                                                              | What it serves                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `meta`                                                                             | `{ product: 'firefly-studio', version, apiVersion, minAppVersion }`                            |
| `auth/*`: sign-up, verify, sign-in, MFA, sign-out, elevate                         | Studio identity: the same flows as `app/(auth)` (§5)                                           |
| `onboarding/*`, `connections/*`                                                    | The same wizard as `app/(onboarding)`: managed ledger, attach by URL + PAT, personalise (§5.3) |
| Commands: `transactions`, `budgets`, `bills`, `piggy-banks`, `attachments`, …      | Writes. Each one calls a `server/services/*` function                                          |
| Views: `views/dashboard`, `views/budgets`, `views/reports/*`, `views/accounts/:id` | The same view models the web pages render                                                      |
| `me/*`                                                                             | Studio-owned data: preferences, dashboard layout, saved views, notifications, tour state       |

**Commands** look like this:

```
POST   /api/v1/transactions          → services.transactions.create(input)
PUT    /api/v1/transactions/:id      → services.transactions.update(id, input)
POST   /api/v1/transactions/:id/convert
POST   /api/v1/budgets/:id/limits    → services.budgets.saveLimit(input)
```

**Views** matter because several screens fan out: a monthly report grid is one `/insight/*` call
per month (`LEARNING.md` §7). Server-side, the fan-out stays next to Redis and the phone makes one
request. Pages already call a `lib/` builder after fetching (`reports/net-worth/page.tsx` →
`buildNetWorth`), so a view is the page's fetch block moved into `server/views/<name>.ts` and called
from both the page and the route.

**Simple lists** (accounts, categories, tags, autocomplete) need no view. The app reads
`/api/ff/v1/*`, which is already allowlisted, rate-limited, validated and cached.

### 4.3 Extracting the service layer

Today a Server Action parses `FormData`, applies Firefly's rules, writes, and revalidates or
redirects. `createBudgetAction` (`server/firefly/budget-actions.ts`) is typical: it nulls the
auto-budget fields when the type is `none` because Firefly rejects them otherwise. That rule is what
the app needs. Split each action like this:

```ts
// packages/contracts/src/budgets.ts — shared, pure
export const BudgetInput = z.object({ name: z.string().min(1), autoBudgetType: …, … });
export type BudgetInput = z.infer<typeof BudgetInput>;

// packages/core/src/budgets.ts — shared, pure, unit-tested
export function toFireflyBudgetPayload(input: BudgetInput): Record<string, unknown> { … }

// server/services/budgets.ts — server-only
export async function createBudget(input: BudgetInput): Promise<Budget> {
  return (await fireflyWrite<{ data: Budget }>('/v1/budgets', 'POST', toFireflyBudgetPayload(input))).data;
}

// server/firefly/budget-actions.ts — web adapter, signature unchanged
export async function createBudgetAction(_prev, formData) {
  const parsed = BudgetInput.safeParse(budgetFormToInput(formData));
  if (!parsed.success) return { error: firstIssue(parsed) };
  const budget = await createBudget(parsed.data);
  revalidatePath('/budgets'); revalidatePath('/dashboard');
  redirect(`/budgets/${budget.id}`);
}

// app/api/v1/budgets/route.ts — app adapter
export const POST = apiRoute(BudgetInput, async (input) => ({ data: await createBudget(input) }));
```

Do this one resource at a time, in the order the app needs them (§9), not all 103 at once. Server
Action signatures stay the same, so no web form changes. The payload builders also become
unit-testable, which closes part of the gap `LEARNING.md` §8 names ("Do not assume anything in
`server/firefly/*-actions.ts` is covered").

### 4.4 Versioning — the constraint the web never had

The web and its server always deploy together. The app does not: a phone can run a six-month-old
build against a server upgraded yesterday, and a self-hoster can do the reverse.

- `/api/v1` is **additive only**. A breaking change becomes `/api/v2`, and both are served until
  `minAppVersion` passes it.
- `apiVersion` in `meta` lets the app hide features the server is too old to serve, instead of
  failing when they're used.
- Every `/api/v1` response is validated against its `contracts` schema **in the server's tests**.
  The app validates in development only, and tolerates unknown fields in production.
- Server Actions stay free to change. Only `/api/v1` is a public contract.
- Because Firefly behaviour lives on the server, **a fix for a Firefly quirk ships in the Studio
  image alone.** No app release is needed.

---

## 5. Connecting, signing in and onboarding — the same as the web

### 5.1 The first screen

```
┌──────────────────────────────────────────┐
│  Firefly Studio                          │
│                                          │
│  Server  [ https://studio.example.com ]  │
│                                          │
│  [ Continue ]        [ Try the demo ]    │  demo → fs.rezaur.xyz pre-filled
└──────────────────────────────────────────┘
```

- `GET /api/v1/meta` proves the URL is a Studio and not something else. It also forces an upgrade
  when the app is older than `minAppVersion`.
- HTTPS is required, except for `http://` on a private-range address, which is allowed with a visible
  warning. That is the trade-off `FIREFLY_ALLOW_INSECURE_HTTP` makes. It needs iOS ATS and Android
  network-security exceptions scoped to private ranges.
- The app remembers several servers, so one phone can hold a personal and a household Studio.
- Native `fetch` isn't subject to CORS, so the server needs no CORS configuration.

### 5.2 Authentication for a native client

Keep ADR-0004's model (opaque, database-backed, revocable sessions, no JWT) and add a second way to
present the token:

- **`POST /api/v1/auth/sign-in`** takes `{ email, password, deviceName }` and returns
  `{ token, expiresAt }`, or `{ mfaRequired, challengeId }`. It creates the same `sessions` row the
  web does, marked `client = 'mobile'`, so it appears in Settings → Security → sessions and can be
  revoked there.
- **`auth/sign-up`, `auth/verify`, `auth/mfa`, `auth/sign-out`, `auth/elevate`** mirror the web
  flows and reuse `server/auth/*`: the same password policy, breach check, rate limits and audit
  events. For email verification and password reset, the web's link flow stays. The emailed link
  opens the app through a universal / app link when the app is installed; a 6-digit code in the
  same email covers a user reading mail on another device.
- **`getSession()`** checks `Authorization: Bearer` first. If that header is present, it
  authenticates by the header alone and ignores cookies. It never mixes the two.
- **CSRF** is skipped only for requests _authenticated by_ a bearer token. A request with a bogus
  bearer header and a valid cookie must fail. It must not slip past both checks.
- **Lifetime:** a longer idle expiry for mobile (e.g. 30 days), with the same absolute cap. The token
  lives in `expo-secure-store` (Keychain / Keystore). Biometric unlock (`expo-local-authentication`)
  gates the app locally and does not replace the server session.
- **Rate limits** use the existing Postgres limiter, keyed by user rather than IP (a phone's IP
  changes constantly).
- **The demo account** keeps its refusals (`server/auth/demo.ts`). They are enforced server-side, so
  they apply to the app automatically.

### 5.3 Onboarding a ledger from the app

The web's onboarding wizard (`app/(onboarding)`, `server/onboarding/actions.ts`) moves behind
`/api/v1/onboarding/*`, and the app shows the same steps:

| Step                           | What happens                                                                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Choose a ledger**            | If the server has a managed Firefly (`MANAGED_FIREFLY_URL`), offer **"Create my ledger"** first. Otherwise, or as a second choice, offer **"Connect my Firefly III"**                                           |
| **Create my ledger** (managed) | One tap. The server runs `provisionManagedConnection`, which ships today: it registers a Firefly user and mints its token. No URL, no PAT, no Firefly UI. The version gate and currency probe run as on the web |
| **Connect my Firefly III**     | URL → the server probes it (SSRF guard, named errors) → the app opens the instance's Personal Access Token page in an in-app browser → the user pastes the token → the server validates, seals and stores it    |
| **Personalise**                | Number/date format, week start, featured accounts and a dashboard preset, the same as the web's step 3                                                                                                          |

Resuming works as it does on the web: progress is derived from database state, so a user who starts
on the phone can finish on a laptop, and the reverse.

**What the app does _not_ do:** create a Firefly user on an arbitrary self-hosted Firefly. Firefly's
API can't do it: the `User` schema has no password field, and Passport scopes token creation to the
token owner's own session (verified against 6.5.5, `server/managed-firefly/index.ts`). The only
working path drives Firefly's HTML registration form, and Studio does that server-side only for the
instance its operator configured, keeps on a private network and preflights after upgrades. For any
other instance, the app opens that instance's `/register` page in the in-app browser, and the user
continues with "Connect my Firefly III".

**The PAT on the phone.** When a user pastes a PAT, it passes through the phone once. That is
unavoidable if they created it on the phone. It goes straight to the server over TLS, is never
written to storage or logs, and the app clears the clipboard after the paste.

---

## 6. The mobile app stack

| Concern        | Choice                                                  | Why                                                                                                                    |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework      | **Expo** (managed, dev client, EAS Build/Submit/Update) | No native project to maintain; supports pnpm monorepos; OTA updates for JS-only fixes                                  |
| Navigation     | **Expo Router**                                         | File-based, like `app/` on the web, so screen paths mirror web routes and deep links map 1:1                           |
| Styling        | **NativeWind v4**                                       | Tailwind class names on RN reading the same token names, so `bg-card text-expense` means the same on both              |
| Server state   | **TanStack Query v5** via `packages/client`             | Already a web dependency. Query keys follow the server's cache tags (§7.3)                                             |
| Lists          | **FlashList**                                           | Replaces TanStack Virtual for the transaction list                                                                     |
| Charts         | **victory-native** (Skia) + **react-native-svg**        | Area and bar charts. The Sankey uses `core/sankey.ts` for layout and draws with SVG                                    |
| Forms          | Controlled inputs + `contracts` Zod schemas             | The same schema validates on the phone and in the route                                                                |
| Secure storage | `expo-secure-store`, `expo-local-authentication`        | Session token, biometric lock                                                                                          |
| Camera / files | `expo-image-picker`, `expo-document-picker`             | Receipt capture straight into `/api/attachments/upload`, the one feature better on a phone                             |
| In-app browser | `expo-web-browser`                                      | The Firefly PAT page during onboarding; "Open on the web" links                                                        |
| PDF export     | Server-rendered PDF, shared with the share sheet        | `lib/pdf/spec.ts` is pure: render on the server rather than port jspdf                                                 |
| Errors         | `@sentry/react-native`, opt-in, PII off                 | Same policy as E1-10                                                                                                   |
| Money & dates  | `core/money`, `core/date`                               | decimal.js and date-fns run on Hermes. **Verify** `@date-fns/tz` against Hermes `Intl` on Android before relying on it |

---

## 7. Keeping the two apps looking and behaving alike

### 7.1 One token source

`packages/tokens/tokens.json` holds the palette (light and dark), semantic colours (`income`,
`expense`, `transfer`, `warning`, `over-budget`), chart palette, type scale, spacing and radii. A
build script writes:

- `app/tokens.css`, which `globals.css` imports, keeping the `oklch()` values and the
  `prefers-color-scheme` / `[data-theme]` blocks exactly as today;
- `packages/tokens/dist/native.ts`: the same tokens **converted to sRGB hex** with a gamut-clipping
  check, which feeds NativeWind's config and the chart theme.

CI fails if the generated files are stale. Changing `expense` in one file changes it on both
platforms.

### 7.2 Same props, two renderers

Each `components/ui/` primitive the app needs gets a native twin with **the same props type**,
exported from `contracts`:

```
contracts:  AmountProps, BadgeProps, ProgressBarProps, DeltaProps, EmptyStateProps …
web:        components/ui/amount.tsx        (span, data-slot="amount", Tailwind)
native:     apps/mobile/ui/amount.tsx       (Text, accessibilityLabel, NativeWind)
```

The primitive's rules live in `core`, and both renderers call them. For `<Amount>`, that is
`describeMoney`, `isNegative`, the sign glyph and the screen-reader phrase. The rendering is written
twice; the rules are written once. When a web primitive gains a prop, the native twin fails to
compile until it handles it.

The primitives to twin first: `Amount`, `Delta`, `ProgressBar`, `Badge`, `Card`, `EmptyState`,
`ErrorState` (driven by `core/error-taxonomy`), `CurrencyInput`, `Combobox` (over the same
`/autocomplete/*`), and `Sheet` (a native bottom sheet).

### 7.3 Same screens, same behaviour

- **Routes mirror the web.** `apps/mobile/app/transactions/[id].tsx` corresponds to
  `app/(app)/transactions/[id]/page.tsx`, so a Studio link (from an email, a notification or a
  shared URL) opens the same screen in the app.
- **The navigation is the web's phone navigation.** The tab bar and "More" sheet come from
  `lib/mobile-nav.ts` and the user's saved choices in `server/mobile-nav.ts`, so customising the
  bottom bar on the web changes it in the app.
- **Cache tags → query keys.** `tagsForPath` moves to `contracts`. After a write, the app
  invalidates the same tags the server just invalidated in Redis, so the two caches can't disagree
  about what is stale (`LEARNING.md` §5 rule 6).
- **The lint rules cover `packages/*` and `apps/mobile`**: no `Number()`/`parseFloat` in money
  paths, and no `new Date(string)` outside `core/date`.
- **The error taxonomy** moves to `core`, so "Firefly unreachable" and "token revoked" read the same
  on both platforms, and an empty list is never a failed read in disguise (`LEARNING.md` §7a).
- **The PR template gains a parity line:** "Does this change a primitive, a token, a service, a view
  or an `/api/v1` shape? Does the app need the same change?"

---

## 8. What the app contains in v1

**The target is parity with the web.** v1 ships the flows people use on a phone. Everything else
opens the matching web page in the in-app browser, signed in, until it's ported. Because every screen
reads the same server, each later screen is UI work only.

| In the app (v1)                                                        | v1 opens the web page; ported later                             |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Server URL, sign up, verify, sign in, MFA, password reset              | Settings: security, sessions, audit log, account deletion       |
| Onboarding: managed ledger, connect by PAT, personalise                | Connections manager (rename, rotate token)                      |
| Connection switcher, connection banner, biometric lock, hide balances  | Dashboard Customize mode                                        |
| Dashboard with the saved layout                                        | Bulk edit, CSV/PDF export                                       |
| Transactions: list, search with operators, detail, add, edit, splits   | Attachment manager                                              |
| Receipt capture and attachments                                        | Account create/edit, reconciliation, amortisation               |
| Accounts: list, detail, balance chart                                  | Budget/bill/piggy create and edit, object groups                |
| Budgets with pacing; bills; piggy-bank deposit/withdraw                | Custom report builder, cash-flow Sankey, the other five reports |
| Reports: net worth, income vs expense, categories; notifications inbox | Rules, recurring, tags, currencies, admin, danger zone          |

The in-app browser needs a signed-in web session. `POST /api/v1/auth/web-handoff` exchanges the
app's bearer token for a single-use, 60-second code, and `/auth/handoff?code=…` turns that into a
normal cookie session, so the user isn't asked for a password again.

---

## 9. Roadmap

New epic **E26 · Mobile**. Ideal days for one engineer, in the units of `PROJECT_PLAN.md` §6.1.

**Sequencing against v1.0.** M8's launch blockers (E24 test infrastructure, E23-05 key rotation,
backup docs) are still open. Phases 1–2 are server work that improves the web too: a service layer
with unit tests and a versioned API with contract tests, which overlaps E24. They can run alongside
M8. The Expo app itself (Phase 3 onwards) should wait for v1.0 unless priorities change on purpose.

### Phase 0 — Decide (1 d)

- [ ] **E26-01** `P0` `0.5d` ADR-0005: native client, Studio-only connection, server-side services, shared packages; amend §1.4 non-goals
- [ ] **E26-02** `P0` `0.5d` Spike: Expo app in the pnpm workspace importing one shared package, built on iOS and Android. Confirms Metro resolution, React peer setup and `@date-fns/tz` on Hermes before anything moves

### Phase 1 — Monorepo and shared packages (8 d)

Exit: web gates all green, with the pure logic imported from packages.

- [ ] **E26-03** `P0` `1d` Workspace config, package scaffolding, TS project references, lint/test/coverage over packages
- [ ] **E26-04** `P0` `2d` Pure `lib/` modules → `packages/core`, with re-export shims at the old paths so no import changes in the same PR. Tests move with them; the coverage gate follows
- [ ] **E26-05** `P0` `1d` `server/firefly/types.ts`, the generated request schemas and `tagsForPath` → `packages/contracts`
- [ ] **E26-06** `P0` `2d` `packages/tokens`: `tokens.json`, CSS + native generators, oklch→sRGB with gamut check, staleness check in CI. **Web pixel-identical**, proven with the before/after screenshot diff from `LEARNING.md` §7e
- [ ] **E26-07** `P1` `1d` Codemod `@/lib/*` imports to package imports, delete the shims
- [ ] **E26-08** `P1` `1d` Docker standalone build and `check:bundle` unaffected (the image must stay self-contained)

### Phase 2 — The API layer (≈23 d)

Exit: every v1 screen in §8 has an `/api/v1` endpoint, contract-tested, with the web using the same services.

- [ ] **E26-09** `P0` `3d` Bearer sessions: the `getSession()` bearer path, `sessions.client` column + migration, sign-in/MFA/sign-out/elevate routes, CSRF skipped only for bearer-authenticated requests, sessions list shows the device. Security tests: bearer+cookie mixing, revoked token, expired token
- [ ] **E26-10** `P0` `1.5d` Sign-up, verification and password reset over `/api/v1`, with app links plus a code in the same email
- [ ] **E26-11** `P0` `1d` `apiRoute()` helper: Zod-parse the body, map `FireflyRequestError` to the error taxonomy, audit guarded calls, no-store headers
- [ ] **E26-12** `P0` `0.5d` `GET /api/v1/meta`
- [ ] **E26-13** `P0` `2d` `onboarding/*` and `connections/*`: managed provisioning, URL probe, attach by PAT, personalise, list/switch. Extracted from `server/onboarding/actions.ts`, which then calls the same services
- [ ] **E26-14** `P0` `4d` Transaction services: create, update with full-group resend, delete, convert, reconciled flag, splits. The largest and riskiest item. Re-run the §13 lifecycle against a live instance
- [ ] **E26-15** `P0` `3d` Services for budgets/limits, bills, piggy-bank adjust and attachments
- [ ] **E26-16** `P0` `4d` Views: dashboard, budgets (FX-converted), net worth, income vs expense, categories, account detail
- [ ] **E26-17** `P1` `1.5d` `me/*`: preferences, dashboard layout, saved views, notifications, mobile-nav choices
- [ ] **E26-18** `P0` `0.5d` Web handoff: bearer → single-use code → cookie session (§8)
- [ ] **E26-19** `P0` `1.5d` Contract tests: every `/api/v1` response validated against its `contracts` schema in CI
- [ ] **E26-20** `P1` `0.5d` `packages/client`: typed fetch with injected base URL and token, TanStack Query hooks, tag-based invalidation

### Phase 3 — App foundation (≈13 d)

Exit: enter a Studio URL (or the demo), sign up, onboard a ledger, and see a live dashboard in both themes.

- [ ] **E26-21** `P0` `2d` Expo app: Expo Router, NativeWind wired to tokens, light/dark from `Appearance` plus a manual override, fonts
- [ ] **E26-22** `P0` `3d` Server URL + `meta`, multiple servers, sign up / verify / sign in / MFA / reset, secure token storage, revoked-session handling, the onboarding wizard with clipboard clearing
- [ ] **E26-23** `P0` `3d` Native primitives with shared prop types (§7.2)
- [ ] **E26-24** `P0` `1d` App shell: tab bar and More sheet from `lib/mobile-nav.ts`, connection switcher and banner, in-app browser with handoff
- [ ] **E26-25** `P0` `3d` Dashboard from `views/dashboard` with the saved layout, charts, hide balances
- [ ] **E26-26** `P1` `1d` Biometric lock, app-switcher privacy blur

### Phase 4 — Record and check (≈15 d)

Exit: the full transaction lifecycle works without opening the web.

- [ ] **E26-27** `P0` `4d` Transaction list (FlashList, infinite pagination), search with operators and warnings, detail
- [ ] **E26-28** `P0` `4d` Add/edit with splits, account/category/budget pickers over autocomplete, foreign amounts
- [ ] **E26-29** `P0` `2d` Receipt capture → compress → upload → attach
- [ ] **E26-30** `P0` `3d` Accounts, budgets with pacing, bills, piggy-bank deposit/withdraw
- [ ] **E26-31** `P1` `2d` The three reports in §8

### Phase 5 — Release (≈8 d)

- [ ] **E26-32** `P0` `2d` EAS Build profiles, signing, `eas update` channels tied to `apiVersion`
- [ ] **E26-33** `P0` `2d` Accessibility pass: VoiceOver and TalkBack over every screen, dynamic type, contrast from tokens
- [ ] **E26-34** `P0` `1d` Maestro end-to-end flows against the demo server (sign in → add → see it on the dashboard)
- [ ] **E26-35** `P0` `2d` Store listings, privacy labels (no tracking; financial data stays on the user's server), review notes with the demo account
- [ ] **E26-36** `P1` `1d` User docs: connecting the app to a self-hosted Studio, reverse proxy and LAN notes

**Total: ≈68 ideal days** (about 19–20 weeks for one engineer at 70 % focus). Phases 1–2 (~31 d)
are useful even if the app never ships.

**After v1 (parity):** port the "opens the web page" column of §8 screen by screen. Each is UI work
over endpoints that mostly exist by then. **Later (P2):** push notifications for bills and
over-budget alerts (needs the job runner E14-13 is blocked on), home-screen balance widget,
share-sheet "add receipt from Photos", offline outbox for transactions entered with no signal.

---

## 10. Risks

| Risk                                                                  | Mitigation                                                                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| The two UIs drift apart                                               | Shared prop types (§7.2), shared tokens with a staleness check, mirrored routes, the parity line in the PR template  |
| An app write re-introduces a Firefly data-loss quirk (split deletion) | App writes only through services (§4 rule 3); services own the full-group resend; live-instance verification per §13 |
| The service extraction regresses the web                              | One resource per PR, Server Action signatures unchanged, re-run the transaction lifecycle against a live instance    |
| An old app meets a new server, or the reverse                         | Additive-only `/api/v1`, `minAppVersion`, `apiVersion` feature gating (§4.4)                                         |
| Bearer auth opens a hole CSRF used to cover                           | Bearer or cookie, never both; tests for each mixing case; tokens only in secure storage                              |
| The web handoff becomes a session-theft vector                        | Single use, 60-second expiry, bound to the issuing session, audited                                                  |
| Self-hosted Studio behind a LAN or self-signed TLS                    | Clear "can't reach this server" state, documented CA install and VPN guidance, no "trust any certificate" switch     |
| Metro and pnpm symlinks, two React versions                           | The Phase 0 spike proves it before any code moves                                                                    |
| Store review rejects an app that needs your own server                | "Try the demo" on the first screen, with review notes and a demo login                                               |
| Solo capacity: this competes with the v1.0 launch                     | Phases 1–2 double as test and hardening work; the app itself waits for v1.0                                          |

---

## 11. Open decisions

- **Q-M1** Distribution: through the App Store and Play Store only, or also as sideloadable builds
  for self-hosters (F-Droid, TestFlight)? This affects Sentry, the licence notice (AGPL) and update
  channels.
- **Q-M2** ~~Onboarding in the app?~~ **Resolved:** yes, the same wizard as the web (§5.3).
- **Q-M3** Offline: is read-only cached data enough for v1, or is an offline outbox needed for
  entering transactions without signal? The outbox needs idempotency keys on `/api/v1` writes, which
  are cheap to add now and expensive to add later. Decide before Phase 2's command endpoints.
- **Q-M4** Move the web app to `apps/web` now or later? The recommendation is later (§4.1).
