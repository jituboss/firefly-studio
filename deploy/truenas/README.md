# TrueNAS SCALE deployment

`docker-compose.yml` and `init-db.sql` in this directory are **gitignored**:
they hold real generated secrets — the encryption key, both database
passwords, the Firefly admin password — and belong on the machine that deploys
them, not in the history. This file describes their shape so the deployment can
be rebuilt from scratch.

## What the stack runs

| Service    | Image                           | Published | Notes                                 |
| ---------- | ------------------------------- | --------- | ------------------------------------- |
| `app`      | `jituboss/firefly-studio:0.4`   | 3000      | Firefly Studio itself                 |
| `firefly`  | `fireflyiii/core:version-6.5.5` | 8080      | the ledger it is a client for         |
| `postgres` | `postgres:16-alpine`            | —         | both applications, separate databases |
| `redis`    | `redis:7-alpine`                | —         | the Firefly response cache            |

Postgres and Redis are deliberately not published to the host. Only the two
things you open in a browser are.

## Generate the secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # APP_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # AUTH_SECRET
openssl rand -hex 20                                                         # CRON_SECRET
openssl rand -hex 16                                                         # Firefly APP_KEY — EXACTLY 32 chars
```

Database passwords should stay alphanumeric: one of them is interpolated into
`DATABASE_URL`, where a `@` or `/` would need escaping.

**Keep `APP_ENCRYPTION_KEY`.** Losing it means every stored Firefly token
becomes undecryptable and every connection has to be re-authorised.

## init-db.sql is not optional

Postgres only runs it when the data directory is empty, and the application's
own migrations do not create what it creates. It must:

- `CREATE EXTENSION` `citext` and `pgcrypto` — the schema stores emails as
  `citext` and defaults ids to `gen_random_uuid()`, so the first migration
  fails without them;
- create the `firefly` role and database, with the password matching
  `DB_PASSWORD` on the `firefly` service.

Guard both with `IF NOT EXISTS` so the file stays safe to re-apply by hand
against a data directory that already exists.

## Dataset permissions

Each image runs as a different user, and a directory the container cannot write
to is the usual reason a TrueNAS deploy comes up unhealthy:

```bash
mkdir -p /mnt/<pool>/apps/firefly-studio/{postgres,redis,firefly-upload}
chown -R 70:70   /mnt/<pool>/apps/firefly-studio/postgres        # postgres
chown -R 999:999 /mnt/<pool>/apps/firefly-studio/redis           # redis
chown -R 33:33   /mnt/<pool>/apps/firefly-studio/firefly-upload  # www-data
```

Host paths rather than named volumes, so snapshots and replication cover the
data.

## Things to set per host

- `APP_URL` on both services — verification and reset links are built from it.
- `TZ` on every service.
- The pool name in every volume path.

## The managed Firefly instance

`MANAGED_FIREFLY_*` offers the bundled Firefly as a one-click choice during
onboarding: an account is created for each user and their token minted, so
nobody has to find a Personal Access Token by hand.

It requires Firefly's **single user mode to be off**, which means that instance
accepts registrations. That is fine while it is only reachable on the LAN — do
not port-forward 8080. Remove the `MANAGED_FIREFLY_*` variables to turn the
feature off and have each person attach their own instance instead.

## Upgrading

The `0.4` tag follows the newest patch in that line and never moves to 0.5, so
`docker compose pull && docker compose up -d` picks up fixes. Pin an exact
version instead to decide each upgrade yourself. Migrations run on boot
(`RUN_MIGRATIONS_ON_BOOT`), behind an advisory lock, so a restart is enough.
