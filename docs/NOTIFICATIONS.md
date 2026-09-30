# Firefly Studio Notifications — Plan

> **Status:** proposed 2026-09-30, written against `v0.13.1`. Nothing below is built yet.
> **Epic:** E27 (backlog in §12). **Record before code:** ADR-0006 (E27-01).
> **Related:** `PROJECT_PLAN.md` §3 (data model), E2-24 (health checks), E6-08 and E8-06 (the two
> alerts that exist), E14-13 (scheduled reports, blocked on the job runner this plan adds), and
> `MOBILE_APP.md` §9, which lists push as a P2 that "needs the job runner E14-13 is blocked on".

---

## 1. Summary

Notifications should tell someone about a change in their money **before they open the app**. Today
they only report something the person is already looking at.

This plan does four things:

1. **Adds an event engine.** A scheduler inside the app container, plus post-write hooks and
   optional Firefly webhooks, turns ledger changes into notifications whether or not anyone is
   signed in.
2. **Adds 36 notification kinds** across transactions, budgets, subscriptions, savings,
   accounts, reports, connections and security. Each kind declares its default channels, its
   deep link and its dedupe key.
3. **Adds a notification centre** at `/notifications`, with history, filters, bulk actions and a
   single `/notifications/{id}/open` route. That route marks the notification read and sends the
   person to the right transaction, budget or settings page. Push clicks use the same route.
4. **Adds push through Firebase Cloud Messaging (FCM).** Web push goes to the installed PWA and to
   desktop browsers. The Expo app (E26) registers its devices in the same table.

The work comes to about 44 ideal days in five phases. Phases 1 and 2 are useful without Firebase:
they fix the inbox and make alerts appear without a page visit.

---

## 2. What exists today — measured on `v0.13.1`

| Piece      | Where                                                         | What it does                                                                  |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Table      | `server/db/schema.ts` `notifications`                         | `user_id`, `kind`, `payload` jsonb, `read_at`, timestamps; partial unread idx |
| Service    | `server/notifications.ts`                                     | `createNotification`, `listUnreadNotifications`, mark read, dismiss all       |
| Actions    | `server/notifications-actions.ts`                             | Mark read / dismiss all, revalidating `/dashboard`, `/budgets`, `/bills`      |
| UI         | `components/notifications/inbox.tsx`                          | Bell + Popover; **unread only**, text built from `kind` + `payload`           |
| Producer 1 | `app/(app)/budgets/page.tsx` `syncBudgetNotifications`        | `over_budget` when spent > limit                                              |
| Producer 2 | `app/(app)/bills/page.tsx` `syncBillNotifications`            | `unpaid_bill` when the next expected date has passed with no payment          |
| Producer 3 | `server/connections/health.ts`                                | `connection_failing` on the transition into a failing status                  |
| Scheduling | `app/api/cron/health/route.ts`, opportunistic shell re-checks | Health only. There is no job runner (E2-24, E14-13)                           |

### 2.1 Defects to fix first

These are in the shipped code, and the new design has to avoid all of them:

1. **Duplicates are checked by kind only, not by the thing being reported.** `createNotification`
   looks for an unread row with the same `kind` and returns it if one exists. While "Groceries is
   over budget" is unread, "Transport is over budget" is silently dropped. The same happens with a
   second overdue bill and a second failing connection.
2. **Marking an alert read brings it back.** The duplicate check only looks at unread rows, and
   the producers run on every page render. So reading the Groceries alert and then opening
   `/budgets` creates it again. This teaches people to ignore the bell.
3. **Alerts only exist after a page visit.** Producers 1 and 2 are side effects of a GET render. An
   over-budget alert appears only after the person opens the Budgets page, which already shows the
   same red bar. A GET that writes is also the wrong shape: prefetching `/budgets` (E22-04) can
   create a notification.
4. **The inbox can go stale.** Mark-read revalidates three paths, but the bell renders in the
   `(app)`, `(settings)` and `(admin)` layouts, so on any other page the count stays stale until the
   next navigation.
5. **There is no history.** Once something is read it is gone from every screen, so "what was that
   alert yesterday?" has no answer.

---

## 3. What makes a notification useful here

These rules settle most of the design questions below:

- **Say what changed and what to do about it.** "Groceries is at 82 % with 11 days left" is useful.
  "Budget alert" is not. Every kind has a primary action, and most have a secondary one.
- **Tell people what they don't already know.** Someone who adds a transaction in this browser does
  not need a push about it. Someone whose recurring rent just posted, or whose partner logged a
  purchase in Firefly's own UI, does.
- **Report each event once.** Every kind has a **dedupe key** that names the thing and the period:
  `budget.threshold:{conn}:{budget}:{limit}:{80}`. A read notification stays read. The next period
  gets a new key.
- **Group bursts.** A Data Importer run that creates 180 transactions should produce one
  notification ("180 transactions imported into Checking"), not 180 pushes.
- **Keep money off the lock screen by default.** Push payloads pass through Google and appear on
  lock screens. Amounts are opt-in (§9.6), consistent with the hide-balances preference (E3-14).
- **Let people control everything, with sensible defaults.** Every kind can be turned off per
  channel except security alerts, which always go to the in-app inbox.

---

## 4. Event catalogue

The **Default** column lists the channels on for a new account: `I` in-app, `P` push, `E` email
(Phase 5). Anything absent is off but can be turned on. **Phase** is when the detector ships.

### 4.1 Transactions

| Kind                              | Fires when                                                                                                                               | Default | Opens                                                 | Phase |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- | ----- |
| `transaction.created`             | A transaction appears that **was not created from the device being notified**: recurring, importer, Firefly UI, another household member | I P     | `/transactions/{groupId}`                             | 2     |
| `transaction.batch`               | ≥ 5 `transaction.created` events for one connection within the coalescing window (§7.4) are combined into one                            | I P     | `/transactions?start=…&end=…` (window)                | 2     |
| `transaction.large`               | A withdrawal at or above the user's threshold (off until set; the settings page suggests the 95th percentile of the last 90 days)        | I P     | `/transactions/{groupId}`                             | 2     |
| `transaction.income`              | A deposit into an asset account at or above an optional threshold ("Salary received")                                                    | I       | `/transactions/{groupId}`                             | 2     |
| `transaction.uncategorised`       | Weekly, if there are ≥ 10 uncategorised withdrawals in the last 30 days                                                                  | I       | `/categories/uncategorised`                           | 4     |
| `transaction.duplicate_suspected` | Same amount, same counterparty, within 2 days, different journals, and neither is linked to the other                                    | I       | `/transactions/{groupId}` (with the pair highlighted) | 4     |
| `transaction.unusual`             | Spend at a payee is more than 3× its 6-month median, with at least 4 prior payments                                                      | I       | `/transactions/{groupId}`                             | 4     |

### 4.2 Budgets

| Kind                    | Fires when                                                                                                 | Default | Opens                                            | Phase |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ | ----- |
| `budget.threshold`      | Spent crosses the warning threshold (default 80 %, configurable 50–95 %) of the current limit              | I P     | `/budgets/{id}?start=…&end=…` (the limit period) | 2     |
| `budget.exceeded`       | Spent crosses 100 % (replaces today's `over_budget`)                                                       | I P     | `/budgets/{id}?start=…&end=…`                    | 2     |
| `budget.pace`           | Mid-period, % spent exceeds % of period elapsed by ≥ 20 points while under 80 % ("spending ahead of pace") | I       | `/budgets/{id}`                                  | 2     |
| `budget.period_summary` | A limit period closes: planned against actual, and what rolled over                                        | I       | `/reports/budgets?start=…&end=…`                 | 4     |
| `budget.no_limit`       | A new period starts for an active budget with no limit and auto-budget `none`                              | I       | `/budgets/{id}` (limit form open)                | 4     |

All budget figures go through `lib/budget-currency.ts`, so foreign-currency spending counts toward
the limit exactly as the Budgets page counts it (§7c of LEARNING.md). Otherwise a push could
disagree with the page it opens.

### 4.3 Subscriptions (bills)

| Kind                  | Fires when                                                                                                                           | Default | Opens                              | Phase |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------- | ----- |
| `bill.upcoming`       | `next_expected_match` is N days away (default 3; choices 1, 3, 7) and there is no payment yet in that period                         | I P     | `/bills/{id}`                      | 2     |
| `bill.due_today`      | `next_expected_match` is today and unpaid                                                                                            | I       | `/bills/{id}`                      | 2     |
| `bill.overdue`        | The expected date has passed with no matched payment (replaces today's `unpaid_bill`). Fires once per expected date                  | I P     | `/bills/{id}`                      | 2     |
| `bill.paid`           | A transaction was matched to the bill (a new entry in `paid_dates`)                                                                  | I       | the matched transaction            | 2     |
| `bill.amount_changed` | The matched payment is outside `amount_min`–`amount_max` ("Netflix charged 17.99, above its usual 15.49"), which catches price rises | I P     | the matched transaction, then bill | 2     |
| `bill.ending`         | `end_date` or `extension_date` is within 14 days                                                                                     | I       | `/bills/{id}/edit`                 | 4     |

### 4.4 Savings, accounts and recurring

| Kind                     | Fires when                                                                                        | Default | Opens                      | Phase |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ------- | -------------------------- | ----- |
| `piggy.milestone`        | A piggy bank crosses 25 / 50 / 75 %                                                               | I       | `/piggy-banks/{id}`        | 2     |
| `piggy.reached`          | A piggy bank reaches its target                                                                   | I P     | `/piggy-banks/{id}`        | 2     |
| `piggy.behind`           | Target date within 30 days and the pace (E9-04's "behind" badge) says it will be missed           | I       | `/piggy-banks/{id}`        | 2     |
| `account.low_balance`    | An asset account drops below a per-account threshold (set from the account page; off until set)   | I P     | `/accounts/{id}`           | 2     |
| `account.cc_payment_due` | A `ccAsset` account's `monthly_payment_date` is 3 days away                                       | I P     | `/accounts/{id}`           | 2     |
| `account.reconcile_due`  | An asset account with reconciled history has not been reconciled for 35 days (the E4-06 workflow) | I       | `/accounts/{id}/reconcile` | 4     |
| `recurrence.ending`      | A recurrence's last repetition (`repeat_until` or the final `nr_of_repetitions`) is within 7 days | I       | `/recurring/{id}`          | 4     |

### 4.5 Reports and digests

| Kind             | Fires when                                                                                                               | Default | Opens                                   | Phase |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------- | ----- |
| `digest.weekly`  | Monday 08:00 local time: last week's spending, compared with the 8-week average, the top 3 categories and upcoming bills | I P     | `/reports/income-expense?start=…&end=…` | 4     |
| `digest.monthly` | 1st of the month, 08:00: earned, spent, savings rate, net worth change, and the largest category change                  | I P E   | `/reports/income-expense?start=…&end=…` | 4     |

Digest figures come from the same functions the report pages use, so `check:reconcile` (E14-15)
already covers the numbers they send.

### 4.6 Connections, security and system (Studio-owned)

| Kind                          | Fires when                                                                                               | Default  | Opens                   | Phase |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ----- |
| `connection.failing`          | Existing E2-24 transition into a failing status (renamed from `connection_failing`)                      | I P      | `/settings/connections` | 1     |
| `connection.recovered`        | Transition back to `ok`. It also marks the matching `connection.failing` as resolved                     | I        | `/dashboard`            | 4     |
| `connection.version_changed`  | `firefly_version` differs from the last probe (an upgrade, or a downgrade below the recommended version) | I        | `/settings/about`       | 4     |
| `fx.rate_missing`             | A budget converted spend but lacked a rate for a currency (what 0.11.4 discloses on the page)            | I        | `/exchange-rates`       | 4     |
| `security.new_sign_in`        | `auth.login` / `auth.signed_in` from a device and IP pair not seen in 90 days                            | I P E 🔒 | `/settings/security`    | 4     |
| `security.password_changed`   | `auth.password_reset.completed`                                                                          | I E 🔒   | `/settings/security`    | 4     |
| `security.mfa_disabled`       | `auth.mfa.disabled`                                                                                      | I P E 🔒 | `/settings/security`    | 4     |
| `security.recovery_codes_low` | ≤ 2 unused recovery codes remain                                                                         | I 🔒     | `/settings/security`    | 4     |
| `admin.user_signed_up`        | A Studio administrator's instance has a new sign-up (0.10.1's admin role)                                | I        | `/admin/users`          | 4     |

🔒 means the in-app channel cannot be turned off, and push/email ignore quiet hours. Security
notifications are fed from `recordAudit`, which already records every one of these actions.

---

## 5. Architecture

```
            ┌──────────────────────── sources ────────────────────────┐
 Studio write (Server Action / proxy)   Firefly webhook (opt-in)   Scheduler tick (5 min)
            │ post-write hook                 │ signed POST            │ sweeps + polling
            ▼                                 ▼                        ▼
      ┌─────────────────────────── detectors (server/notifications/detectors/*) ──────────┐
      │ budget · bill · transaction · piggy · account · digest · security · connection     │
      └──────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ notify({ userId, connectionId, kind, payload, dedupeKey, actor })
                                             ▼
                            ┌─────── server/notifications/service.ts ───────┐
                            │ dedupe · preferences · coalescing · retention  │
                            └──────┬──────────────────────┬──────────────────┘
                                   │ insert row           │ enqueue deliveries (push / email)
                                   ▼                      ▼
                          notifications table     notification_deliveries (outbox)
                                   │                      │ drained by the scheduler
                                   ▼                      ▼
                  bell · /notifications centre     FCM HTTP v1 ──► browser SW / Expo app
                                   └───── both open /notifications/{id}/open ─────┘
```

### 5.1 Three event sources, one path

1. **Post-write hook (instant, Studio writes).** `fireflyWrite` already maps every write to cache
   tags through `tagsForPath`. A similar `eventsForWrite(method, path, response)` emits domain
   events: `transaction.stored`, `budget_limit.stored`, `piggy.adjusted`, and so on. The event
   carries `actor: { userId, sessionId }`, so push can skip the device that made the change (§7.3).
   Detectors that depend on the write, such as the budget threshold for the transaction's budget,
   run **after** the response is sent, via `after()` from `next/server`. A slow detector never slows
   a save.
2. **Firefly webhooks (instant, changes made outside Studio; opt-in per connection, Phase 4).**
   Firefly can POST `STORE_TRANSACTION` / `UPDATE_TRANSACTION` / `DESTROY_TRANSACTION` /
   `STORE_UPDATE_BUDGET_LIMIT` with a `TRANSACTIONS` response (vendored spec,
   `WebhookTrigger`). Studio registers the webhook server-side with the PAT. E17 dropped a
   **webhooks UI**, not this: the proxy keeps refusing `/webhooks*` to browsers. Details are in §8.
3. **Scheduler sweeps (time-based events, plus changes from outside Studio when webhooks are
   off).** Every tick, for each healthy connection whose sweep is due, the scheduler looks for
   transactions created since a watermark, re-evaluates budgets and bills, and runs any digest that
   is due. Polling is the default because it needs nothing from the network: Firefly never has to
   reach Studio.

Only the detectors know Firefly. The service, the channels and the UI only see `kind + payload`.

### 5.2 The scheduler — the job runner the project never had

E2-24 and E14-13 both rejected BullMQ for the same reason: a queue and a worker process are too
much for a single-container self-host. That reasoning still holds, so this plan uses the same
approach as E2-24:

- **In-process ticker.** `instrumentation.ts` (Node runtime only) starts `server/jobs/scheduler.ts`,
  which runs every 60 s. Each tick takes a Postgres **session advisory lock**
  (`pg_try_advisory_lock`) and returns immediately if another replica holds it. Two replicas never
  run the same sweep, and there is nothing extra to deploy. The migration runner already uses an
  advisory lock (E25-02), so the pattern is proven here.
- **Jobs are rows, not timers.** A `job_runs` table records `(job, scope_id, last_started_at,
last_finished_at, last_error)`. A tick picks up anything due, such as the notification sweep per
  connection every 5 min, the delivery drain every tick, retention daily and digests hourly. A
  restart loses nothing: the next tick sees what is overdue.
- **Bounded work.** Each tick has a time budget (20 s) and a per-connection cap on concurrent
  requests. A slow instance delays only its own sweep.
- **External cron still works.** `GET /api/cron/notifications` behind `CRON_SECRET` runs one tick,
  for anyone on serverless or who prefers cron. `SCHEDULER=inprocess|external|off` (default
  `inprocess`) chooses the mode.
- **Scheduled reports benefit too.** E14-13 was blocked only on this runner, since the mail half
  exists (E2-28). E27-36 moves it onto the scheduler, and its "Scheduled" nav entry can return
  (LEARNING.md §6).

### 5.3 Reading Firefly without a session

`server/firefly/api.ts` resolves the connection from `requireSession()`, which background work
does not have. `server/connections/health.ts` already works around this with `getConnectionToken`
and `probeInstance`. E27-12 generalises that into
`withConnection(connectionId, fn)`. It returns a reader and writer bound to one connection, using
the same client, SSRF guard, cache namespace and tag invalidation as the request path. It never
takes a user id from input: callers pass a connection row they loaded themselves.

This covers part of `MOBILE_APP.md` §4.3 ("Extracting the service layer"). Build it so that
extraction can absorb it rather than duplicate it.

### 5.4 Module layout

```
lib/notification-catalog.ts          pure: kinds, category, severity, defaults, title/body, target, dedupe key
lib/notification-catalog.test.ts
server/notifications/service.ts      notify(), list/paginate, mark read/unread, archive, retention
server/notifications/preferences.ts  read/write per-kind channel prefs, thresholds, quiet hours
server/notifications/coalesce.ts     burst grouping for transaction.created
server/notifications/detectors/*.ts  one file per domain; each is (ctx, since) => NotifyInput[]
server/notifications/actions.ts      'use server' — only thin wrappers (LEARNING §5 rule 4)
server/push/fcm.ts                   FCM HTTP v1 sender (hand-rolled JWT, no firebase-admin)
server/push/devices.ts               register / refresh / prune device tokens
server/jobs/scheduler.ts             tick, advisory lock, job_runs
app/(app)/notifications/page.tsx     the centre
app/(app)/notifications/[id]/open/route.ts   mark read → validate → redirect
app/(settings)/settings/notifications/        preferences + devices
app/api/hooks/firefly/[connectionId]/route.ts webhook receiver (Phase 4)
app/api/cron/notifications/route.ts
public/sw.js                         + push and notificationclick handlers
```

`lib/notification-catalog.ts` is **client-safe and pure**. It is the single place that turns
`kind + payload` into words and a link. The bell, the centre, the push sender and the email
renderer all call it, so the text people see is the same on every surface. Text is rendered at
read time, not stored, so i18n (E21-07) can translate old notifications as well as new ones.

---

## 6. Data model

One migration (E27-03). No table stores ledger data beyond what a notification needs to render
its sentence. This is the same exception `notifications.payload` already makes, and retention
(§6.5) limits it.

### 6.1 `notifications` — extended

| Column          | Type                    | Notes                                                                                                                |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`            | uuid                    | existing                                                                                                             |
| `user_id`       | uuid → users            | existing                                                                                                             |
| `connection_id` | uuid → connections null | **new.** Null for Studio-owned kinds (security, admin). Cascade-deletes with the connection                          |
| `kind`          | text                    | existing; values from §4. The migration renames the three existing kinds                                             |
| `category`      | text                    | **new.** `transactions`/`budgets`/`bills`/`savings`/`accounts`/`reports`/`connections`/`security`; used by filters   |
| `severity`      | text                    | **new.** `info` / `success` / `warning` / `critical`. It sets the icon and colour, and whether quiet hours apply     |
| `payload`       | jsonb                   | existing. The ids and figures the catalogue needs to render the notification and its link                            |
| `dedupe_key`    | text                    | **new.** Unique with `user_id` (partial index where not null)                                                        |
| `group_count`   | int default 1           | **new.** Used by `transaction.batch` and by repeat events that update a row instead of inserting                     |
| `actor_session` | uuid null               | **new.** Session that caused it, so push can skip that device                                                        |
| `read_at`       | timestamptz null        | existing                                                                                                             |
| `archived_at`   | timestamptz null        | **new.** Hidden from the default view but still searchable in the Archived tab                                       |
| `resolved_at`   | timestamptz null        | **new.** Set when the condition clears (connection recovered, bill paid after an overdue alert). Shown as "Resolved" |
| `created_at`    | timestamptz             | existing                                                                                                             |

Indexes: `(user_id, created_at desc)` for the centre, the existing partial unread index, and
unique `(user_id, dedupe_key)`.

**Dedupe semantics** (this fixes §2.1 defects 1 and 2): `notify()` is an
`insert … on conflict (user_id, dedupe_key) do nothing`. A key that has fired once, read or not,
never fires again, because the key includes the period. Kinds that should update in place (the
batch count, a bill amount revised within the same period) use `do update` and leave `read_at`
untouched.

### 6.2 `notification_preferences` — new

| Column    | Type  | Notes                                                                                                              |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `user_id` | uuid  | PK part                                                                                                            |
| `kind`    | text  | PK part. Only rows that differ from the catalogue default exist                                                    |
| `in_app`  | bool  | Ignored for 🔒 kinds                                                                                               |
| `push`    | bool  |                                                                                                                    |
| `email`   | bool  |                                                                                                                    |
| `params`  | jsonb | Per-kind settings: `{ thresholdPct: 80 }`, `{ daysBefore: 3 }`, `{ minAmount: "500.00" }`, `{ accountId → floor }` |

Global settings go in `user_preferences` (new columns): `quiet_hours_start`, `quiet_hours_end` (a
local time; the zone comes from `users.timezone`), `push_show_amounts` (default **false**),
`digest_weekly_day`, and `digest_hour`.

### 6.3 `push_devices` — new

| Column                       | Type            | Notes                                                                                                                                                                      |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                         | uuid            |                                                                                                                                                                            |
| `user_id`                    | uuid → users    | cascade                                                                                                                                                                    |
| `session_id`                 | uuid → sessions | **null on session delete, then pruned.** Signing out, or revoking a session on Settings → Security, removes the device                                                     |
| `platform`                   | text            | `web` / `android` / `ios`                                                                                                                                                  |
| `token`                      | text unique     | FCM registration token. Not a credential for our API, but it lets anyone who holds it push to this device, so it is never logged (redaction list) or sent back to a client |
| `label`                      | text            | "Chrome on macOS", derived with `describeDevice` (`lib/audit-labels.ts`)                                                                                                   |
| `created_at`, `last_seen_at` | timestamptz     | `last_seen_at` refreshes on each app load. Tokens unseen for 60 days are pruned                                                                                            |
| `disabled_at`, `last_error`  |                 | Set when FCM answers `UNREGISTERED` / `INVALID_ARGUMENT`                                                                                                                   |

### 6.4 `notification_deliveries` — new (the outbox)

`notification_id`, `device_id` (null for email), `channel`, `status`
(`queued`/`deferred`/`sent`/`failed`/`dropped`), `not_before` (quiet hours), `attempts`,
`last_error`, `sent_at`. The scheduler drains rows that are due, retrying with backoff (1 m, 5 m,
30 m, then `failed`). This gives a delivery log to debug "I never got the push" from, the same
reason E2-09 exposed the audit log.

### 6.5 `connection_watermarks` — new, and retention

`connection_id` PK, `tx_created_after` (the newest `created_at` seen), `bill_paid_snapshot`
jsonb (`billId → paid_dates` last seen, so `bill.paid` fires on a new entry), and
`piggy_snapshot` jsonb (`piggyId → percent band`). This is detector state only.

**Retention** (a daily job): archive read notifications after 90 days, and delete anything older
than 365 days along with its deliveries. Deleting an account already cascades (E2-10).

---

## 7. Delivery rules

### 7.1 Deciding the channels

```
channels = catalogue.defaults(kind) ⊕ notification_preferences(user, kind)
if 🔒: in_app = true
if demo account (lib/demo.ts): push = email = false        # the password is public
if no push_devices: push = false
```

### 7.2 Quiet hours

Push and email created inside quiet hours are queued with `not_before` set to the end of the
window. In-app rows are written immediately. `critical` severity (security, connection failing)
ignores quiet hours. When a deferred push is released, pushes that have since been superseded
(the same collapse tag, or a notification now marked `resolved_at` or read) are dropped rather
than delivered late.

### 7.3 Don't notify the device that made the change

A Studio write records `actor_session`. Push skips devices whose `session_id` matches it, and the
in-app row for a `transaction.created` the user made themselves is not written at all. If you add
a transaction on your phone, your laptop still gets the push. The phone that made the change does
not.

### 7.4 Coalescing

`transaction.created` events are held for 2 minutes per connection. If 1–4 arrive, each becomes
its own notification. At 5 or more they become one `transaction.batch` row, updated in place as
more arrive, with a link to the transaction list filtered to that window. Push fires once per
batch.

### 7.5 Rate limiting

A hard cap of 20 pushes per user per hour, with security kinds exempt. Anything over the cap still
creates the in-app row, and the next allowed push says "and 12 more in Studio". This prevents a
detector bug or a large import from flooding someone's phone.

---

## 8. Firefly webhooks as a real-time source (Phase 4, opt-in)

Polling every 5 minutes is enough for bills and budgets. For "a transaction was just created" it
is slow. Webhooks make it immediate, but they only work when **Firefly can reach Studio over
HTTP**, which is true in the common compose setup and false for a Studio on a laptop against a
remote Firefly. So webhooks are opt-in per connection, and polling keeps running as a safety net
because a missed webhook is invisible otherwise.

- **Registration.** On opt-in, Studio calls `POST /api/v1/webhooks` with the connection's PAT:
  title `Firefly Studio notifications`, `url = {APP_URL}/api/hooks/firefly/{connectionId}`,
  triggers `STORE_TRANSACTION`, `UPDATE_TRANSACTION`, `STORE_UPDATE_BUDGET_LIMIT` (the spec allows at most 3),
  response `TRANSACTIONS`, delivery `JSON`, and a generated secret. The webhook id and the secret
  are stored on `firefly_connections`, **with the secret sealed like the PAT** (same envelope,
  §4.1). Removing the connection or turning off the option deletes the webhook in Firefly.
  This is a server-side call, so the proxy's refusal of `/webhooks*` for browsers stays in place.
- **Receiving.** `POST /api/hooks/firefly/{connectionId}` checks the signature header against the
  sealed secret in constant time, rejects deliveries more than 5 minutes old, returns 200
  immediately and processes the payload with `after()`. It never trusts the payload's figures for
  anything a person will read: it takes the transaction id and re-reads it through
  `withConnection`. The route sits outside the CSRF check (it is not a browser request) and
  carries its own rate limit.
- **Verify before building (LEARNING.md §7):** the exact signature header format and the hash
  algorithm, whether a `TRANSACTIONS` payload for a split group arrives once or once per journal,
  and whether Firefly retries a non-2xx response. The spec does not document any of these. Test
  each against the dev 6.5.5 container first and record the results in §7 of LEARNING.md.
- **SSRF does not apply to this route:** Firefly calls us, and we make no outbound request based
  on the payload.

---

## 9. Push via Firebase Cloud Messaging

### 9.1 Why FCM, and what it costs a self-hoster

FCM gives one sender for web push (Chrome, Edge, Firefox, and Safari 16.4+ when installed as a
PWA), Android and iOS. The Expo app (E26) needs FCM or APNs anyway, so one provider covers both
clients. The cost is that **every self-hoster must create their own Firebase project**, because a
project's credentials cannot be shared. Push is therefore **optional**: with no Firebase settings,
the push column is hidden and everything else in this plan works.

The sender sits behind a small `PushProvider` interface. Standard Web Push with VAPID keys, which
needs no Google account, can be added later without touching detectors or the UI. It is not in
this plan's scope.

### 9.2 Configuration — at runtime, not build time

The published Docker image is built once, so `NEXT_PUBLIC_*` variables are **fixed at build time
and cannot be set by a self-hoster**. The Firebase web config therefore comes from the server:

```
# server-only
FIREBASE_SERVICE_ACCOUNT_JSON=<base64 of the service-account JSON>   # project_id, client_email, private_key
# sent to the browser at runtime (not secrets, but instance-specific)
FIREBASE_WEB_API_KEY=…  FIREBASE_WEB_APP_ID=…  FIREBASE_MESSAGING_SENDER_ID=…  FIREBASE_VAPID_PUBLIC_KEY=…
```

`lib/env.ts` validates them as a group: all or none. If only some are set, boot fails with a clear
message, as `MAIL_TRANSPORT=smtp` does today. The settings page receives the web config as props
from its Server Component. `.gitleaks.toml` gains a rule for the base64 service-account blob
(the default rules already catch a raw PEM private key). `docs/` gains a short Firebase setup
guide with screenshots (E27-19).

### 9.3 Server side — a hand-rolled HTTP v1 sender

`firebase-admin` is a large dependency for one API call. `server/push/fcm.ts`:

1. Signs an RS256 JWT with `node:crypto` from the service account (scope
   `https://www.googleapis.com/auth/firebase.messaging`), exchanges it at
   `oauth2.googleapis.com/token`, and caches the access token until 5 minutes before it expires.
2. `POST https://fcm.googleapis.com/v1/projects/{project}/messages:send`, one request per token,
   with concurrency 10. **Data-only messages**, so our service worker controls the display on
   every browser:
   `{ token, data: { nid, title, body, url: "/notifications/{nid}/open", tag, severity }, webpush: { headers: { Urgency, TTL } }, android: { collapse_key: tag, priority }, apns: { headers: { "apns-collapse-id": tag } } }`
3. Classifies errors. `UNREGISTERED` or `INVALID_ARGUMENT` on the token disables the device.
   `QUOTA_EXCEEDED`, `UNAVAILABLE` and 5xx retry with backoff. `SENDER_ID_MISMATCH` logs an operator
   error once.

This follows the project's usual approach: the mail transports use plain `fetch` (E2-28), and the
service worker is hand-written (E22-07).

### 9.4 Browser side

- **Asking for permission.** Never on page load. The prompt comes from a click on "Turn on push"
  on Settings → Notifications, in the centre's empty state, or in a one-time card after the person
  first sets a budget limit or a subscription. On iOS the button explains that push needs the app
  installed to the home screen (Safari's rule) and links to how.
- **Loading the SDK.** `firebase/app` and `firebase/messaging` are **dynamically imported** only
  after that click, so no page except the one being used pays for them (`check:bundle` stays
  green). `getToken(messaging, { vapidKey, serviceWorkerRegistration })` reuses the existing
  `/sw.js` registration. There is no second `firebase-messaging-sw.js` and no `importScripts` from
  a CDN in the worker.
- **Token lifecycle.** On each authenticated load, if permission is `granted`, the app calls
  `getToken` again and upserts the device (`last_seen_at`). This handles token rotation, which
  FCM does without warning. Signing out calls `deleteToken` and deletes the row.
- **CSP (`lib/csp.ts`).** Only when push is configured, `connect-src` adds
  `https://fcmregistrations.googleapis.com`, `https://firebaseinstallations.googleapis.com` and
  `https://fcm.googleapis.com`. Nothing is added to `script-src`: the SDK is bundled.

### 9.5 Service worker (`public/sw.js`)

- `push`: parses `event.data.json()` and calls `showNotification(title, { body, tag, icon, badge,
data: { url } })`. If a Studio window is focused, it `postMessage`s the window to refresh the
  bell instead of showing a system notification.
- `notificationclick`: focuses an existing Studio tab and navigates it, or opens a new window, at
  `data.url`, which is always `/notifications/{id}/open`.
- `navigator.setAppBadge(unread)` updates the installed-app badge where supported.
- The worker's existing rule stays: **it stores nothing that required a session.** Push payloads
  are shown and dropped.
- **Verify before building:** the exact shape of an FCM data-only message when it reaches a raw
  `push` handler (whether the fields are top-level or under `data`) in Chrome, Firefox and
  installed Safari.

### 9.6 What a push may say

With `push_show_amounts = false` (the default):

> **Groceries is at 82 %** — 11 days left in October.
> **Netflix is due in 3 days.**
> **12 new transactions in Checking.**

With it on, the figures are added ("€412 of €500"). A push never carries account numbers, IBANs,
notes or attachment names. The in-app centre always shows full detail, because it is behind the
session and respects hide-balances like the rest of the app.

---

## 10. The notification centre — `/notifications`

### 10.1 Layout

```
┌ Notifications ─────────────────────────────────────── [Mark all read] [⚙ Settings] ┐
│ [All 42] [Unread 5] [Archived]        Category: [All ▾]   Connection: [All ▾]        │
│──────────────────────────────────────────────────────────────────────────────────────│
│ TODAY                                                                                  │
│ ● ⚠  Groceries is at 82 % — 11 days left              2h   [View budget] [⋯]          │
│ ● 🧾 Netflix charged 17.99, above its usual 15.49     5h   [View] [Update subscription]│
│ YESTERDAY                                                                              │
│   ↓  Salary received — 3,850.00 into Checking         1d   [View]                     │
│   ⧉  12 transactions imported into Checking           1d   [Review] [Categorise]      │
│ EARLIER THIS WEEK                                                                      │
│   ✓  Connection "Home" recovered — Resolved           3d                               │
└──────────────────────────────────────────────── [Load more] ──────────────────────────┘
```

- **Rows.** Category icon, severity shown by colour **and** icon shape (never colour alone,
  PROJECT_PLAN §5.1), sentence, relative time (absolute on hover and for screen readers), a primary
  action and a `⋯` menu with _Mark read/unread_, _Archive_, _Mute this kind_, _Snooze 1 day_
  (bills and budgets), and _Notification settings for this kind_. The unread dot is paired with
  bold text and an `sr-only` "Unread".
- **Groups.** Today / Yesterday / Earlier this week / Earlier, using the user's timezone through
  `lib/date.ts`.
- **Filters.** In the URL (`?tab=unread&category=budgets&connection=…`), following the transaction
  filters' URL-state pattern. The connection filter appears only with 2+ connections (E2-23).
- **Paging.** Cursor on `(created_at, id)`, 30 per page, "Load more" (not infinite scroll, which
  is inaccessible to keyboard users without a skip).
- **Bulk.** Checkbox selection with the same bulk bar pattern as the transaction grid: mark read,
  archive.
- **States.** Skeleton `loading.tsx` (which also enables prefetch, E22-04), an empty state that
  offers to turn on push (§9.4), and `readFailure()` for errors, so a database failure does not look
  like an empty inbox (LEARNING §7a).
- **Phone.** The Table card mode (E21-11). The page is reachable from the bell, the More sheet
  (`lib/mobile-nav.ts`), the ⌘K palette (`lib/command-catalog.ts`) and the `G N` shortcut.
- **Optimistic.** Mark read and archive use `useOptimistic` with rollback, following
  `inline-category.tsx` (E22-06).

### 10.2 `/notifications/{id}/open` — one way in, from anywhere

Clicks from the bell, the centre, a push, an email or the Expo app all go through this route:

1. `requireSession()`. It loads the notification **scoped to the session user**; any other id is a
   404, so there is no ownership oracle.
2. Marks it read.
3. Resolves the target with `catalogue.target(kind, payload)`. The target is always an app-relative
   path from a fixed table and never a URL taken from the payload, so there is no open redirect.
4. If the notification's `connection_id` is not the active connection, it switches first (the
   E2-23 switcher logic), so "View transaction" opens the right ledger.
5. For entity targets (a transaction, budget, bill or piggy bank), it checks existence with a
   cheap cached read. If the entity was deleted, it shows a small "This transaction no longer
   exists" page with a link to the centre instead of a 404 inside someone else's context.
6. `redirect(target)`.

### 10.3 The bell, improved

The popover shows the **latest 8 rows, read and unread**, with category icons and relative times,
a _Mark all read_ button, and a **View all** link to the centre. The unread count refreshes on
window focus and when the service worker posts a message. Mark-read revalidates the shared layout
(`revalidatePath('/', 'layout')`), which fixes defect 4. The existing Popover primitive already
handles Escape, click-away and `aria-expanded` (E21-01).

### 10.4 Settings → Notifications

- **Channels grid.** One row per kind, grouped by category, with In-app / Push / Email switches.
  🔒 rows show a locked in-app switch with the reason. Push and Email columns appear only when that
  channel is configured on the server.
- **Per-kind settings inline.** Budget warning %, bill reminder days, large-transaction amount (with
  the suggested 95th-percentile figure), and income threshold. Per-account low-balance floors live
  on each account page and are listed here read-only, with links.
- **Quiet hours, digest day and time, and "Show amounts in push".**
- **Devices.** "This browser: On/Off", then the other devices with label, platform, last seen and
  Remove. **Send test push** sends to one device and reports the outcome from the delivery log.
- A **Delivery log** panel shows the last 50 deliveries with status and error, for "I didn't get
  it" questions.

---

## 11. Security and privacy checklist

- Webhook secrets are sealed with the PAT envelope. Device tokens and webhook payloads are added to
  the `redact()` serialiser.
- `/notifications/{id}/open` resolves targets from a fixed table and never redirects to a
  payload-supplied URL.
- Every service query is scoped by `user_id` from the session. Background detectors take the user
  id from the connection row they loaded, never from input.
- The demo account (`lib/demo.ts`) refuses push registration and email, because its password is
  public.
- Push payloads carry no amounts by default and never carry account identifiers (§9.6).
- The cron and webhook routes are 404 when unconfigured (the `CRON_SECRET` pattern) and
  rate-limited.
- Deleting an account deletes its devices, deliveries and preferences (FK cascade). Revoking a
  session removes that session's devices.
- `docs/SECURITY.md` in-scope table gains: the webhook receiver, the open route and push tokens.

---

## 12. Backlog — E27 · Notifications & push

Legend as in `PROJECT_PLAN.md` §8. Estimates are ideal days.

### Phase 0 — Decide and fix (≈2 d)

- [ ] **E27-01** `P0` `0.5d` ADR-0006: event engine, in-process scheduler with advisory lock, FCM behind `PushProvider`, polling default with opt-in webhooks
- [ ] **E27-02** `P0` `1.5d` Fix the §2.1 defects on the current code: dedupe by entity and period, no re-creation after read, layout-wide revalidation. Producers stay inside page renders until E27-14/15 replace them

### Phase 1 — Model, catalogue and centre (≈10 d)

- [ ] **E27-03** `P0` `1d` Migration: extend `notifications`; add `notification_preferences`, `push_devices`, `notification_deliveries`, `connection_watermarks`, `job_runs`; new `user_preferences` columns; rename the three existing kinds
- [ ] **E27-04** `P0` `1.5d` `lib/notification-catalog.ts`: kinds, category, severity, default channels, 🔒, text, target, dedupe key; unit tests for every kind
- [ ] **E27-05** `P0` `1d` `server/notifications/service.ts`: `notify()` with `on conflict`, channel resolution (§7.1), cursor pagination, read/unread/archive/resolve
- [ ] **E27-06** `P0` `3d` `/notifications` centre (§10.1): tabs, filters in URL, day groups, row actions, bulk bar, loading/empty/error states, card mode, axe clean in both themes at 390 and 1280
- [ ] **E27-07** `P0` `0.5d` `/notifications/[id]/open` (§10.2) including connection switch and the deleted-entity page
- [ ] **E27-08** `P1` `1d` Bell popover: latest 8, read and unread, View all, refresh on focus, optimistic mark read
- [ ] **E27-09** `P1` `1.5d` Settings → Notifications: channels grid, per-kind settings, quiet hours, digest time, amounts toggle
- [ ] **E27-10** `P1` `0.5d` Entry points: ⌘K, More sheet, `G N`, account-page low-balance field

### Phase 2 — Event engine and first detectors (≈11 d)

- [ ] **E27-11** `P0` `2d` `server/jobs/scheduler.ts`: 60 s tick, `pg_try_advisory_lock`, `job_runs`, time budget; `/api/cron/notifications`; `SCHEDULER` env; retention job
- [ ] **E27-12** `P0` `1.5d` `withConnection(connectionId)` reader/writer for background work (§5.3), sharing client, guard, cache and tags
- [ ] **E27-13** `P0` `1d` `eventsForWrite` post-write hook in `fireflyWrite`, with `actor_session`, detectors run via `after()`
- [ ] **E27-14** `P0` `1.5d` Budget detectors: threshold, exceeded, pace, using `lib/budget-currency.ts`. Remove the page-render producer
- [ ] **E27-15** `P0` `1.5d` Bill detectors: upcoming, due today, overdue, paid, amount changed. Remove the page-render producer
- [ ] **E27-16** `P0` `2d` Transaction detector: `created_at` watermark polling, created, large, income, coalescing into `transaction.batch` (§7.4)
- [ ] **E27-17** `P1` `1d` Account detectors: low balance, credit-card payment due
- [ ] **E27-18** `P1` `0.5d` Piggy-bank detectors: milestone, reached, behind

### Phase 3 — Push via Firebase (≈9 d)

- [ ] **E27-19** `P0` `1d` Firebase env group in `lib/env.ts`, runtime web-config delivery, gitleaks rule, self-hoster setup guide with screenshots
- [ ] **E27-20** `P0` `1.5d` `server/push/fcm.ts`: JWT signing, token cache, send, error classification; unit tests with a mocked token endpoint
- [ ] **E27-21** `P0` `1.5d` `public/sw.js` push, notificationclick, focused-window message, app badge. First verify the FCM data-message shape in Chrome, Firefox and installed Safari
- [ ] **E27-22** `P0` `1.5d` Enable flow: gesture-only permission, lazy `firebase/messaging`, token register/refresh/delete, iOS install guidance, CSP additions, bundle budget unchanged for other routes
- [ ] **E27-23** `P0` `1d` Devices list, test push, delivery log; sign-out and session revoke remove devices; demo refusal
- [ ] **E27-24** `P0` `1.5d` Outbox drain: retries with backoff, quiet-hours deferral with supersede-drop, collapse tags, 20/hour cap
- [ ] **E27-25** `P1` `1d` End-to-end verification on a real phone (Android Chrome and an installed iOS PWA) and a desktop, against the dev Firefly: each Phase 2 kind produced and clicked through

### Phase 4 — Richer events (≈9 d)

- [ ] **E27-26** `P1` `2.5d` Firefly webhooks (§8): verify signature and payload shape live first, then opt-in registration, sealed secret, receiver, clean-up on removal
- [ ] **E27-27** `P1` `1.5d` Weekly and monthly digests from the report functions
- [ ] **E27-28** `P1` `1d` Security kinds from `recordAudit` (new sign-in on a device and IP pair not seen in 90 days, password, MFA, recovery codes)
- [ ] **E27-29** `P1` `0.5d` Connection recovered (resolves the failing alert), version changed
- [ ] **E27-30** `P2` `1d` Uncategorised backlog, reconcile due, recurrence ending, bill ending, budget with no limit
- [ ] **E27-31** `P2` `1.5d` Duplicate-suspected and unusual-spend detectors
- [ ] **E27-32** `P2` `0.5d` `fx.rate_missing`, `admin.user_signed_up`, `budget.period_summary`

### Phase 5 — Other channels and clients (≈3 d)

- [ ] **E27-33** `P2` `1.5d` Email channel through `server/mail` for digests and security kinds, with a one-click unsubscribe per kind
- [ ] **E27-34** `P2` `1d` Expo registration via `/api/v1/me/push-devices` (ties to E26-17); `platform` android/ios
- [ ] **E27-35** `P2` `0.5d` Move E14-13 scheduled reports onto the scheduler and restore the "Scheduled" nav entry

**Total ≈ 44 ideal days** (about 12–13 weeks for one engineer at 70 % focus). Phases 0–2 (~23 d)
fix the inbox and create alerts without a page visit, with no Firebase dependency.

---

## 13. Verification plan

Following LEARNING.md §7 and §8, all of this is checked against a running Firefly, not by reading
code:

- **Detectors:** for each Phase 2 kind, a Playwright script (the §16 throwaway pattern) against the
  compose app container creates the condition in the dev Firefly (a transaction that pushes
  Groceries past 80 %, a bill due in 3 days, and so on), runs one tick through
  `/api/cron/notifications`, and asserts one row. A second tick asserts no second row.
- **Dedupe after read:** mark read, run another tick, and assert no new row. This is the regression
  test for §2.1 defect 2.
- **Coalescing:** import 50 transactions through `/data/bulk/transactions` and assert one batch row
  and one delivery.
- **Push:** send a test push to each platform, click it, and assert the landing URL and that the
  notification is now read.
- **Gates:** `check:a11y` gains `/notifications` and `/settings/notifications`; `check:responsive`
  gains both, and needs to open the bell popover (the open item in PROJECT_PLAN §8.0 loose ends);
  `check:bundle` shows no growth outside the settings route.
- **Unit:** the catalogue (text, target and dedupe key for every kind), channel resolution, quiet
  hours across midnight and DST, coalescing boundaries, the FCM error mapping.

---

## 14. Open decisions

- **N1 — Firebase only, or add standard Web Push too?** Recommended: **FCM only for now**, behind
  `PushProvider`. VAPID Web Push would let self-hosters avoid a Google account, and can come later
  as its own item if people ask.
- **N2 — Push amounts off by default?** Recommended: **off**. The app's security model keeps as
  little of the ledger as possible outside the user's own instance (E22-07's reasoning), and a
  lock screen is outside it.
- **N3 — Should Studio register webhooks on someone's Firefly?** It writes configuration into
  their instance. Recommended: **opt-in per connection, with polling always on**. The toggle names
  the webhook it will create and deletes it when turned off.
- **N4 — `transaction.created` push on by default?** It is the event asked for, but in a
  one-person ledger with no imports it rarely fires, and in a shared one it can be noisy.
  Recommended: **on**, relying on the self-device skip (§7.3) and coalescing (§7.4).
