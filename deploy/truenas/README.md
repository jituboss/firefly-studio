# TrueNAS SCALE deployment

[`docker-compose.example.yml`](docker-compose.example.yml) is the whole stack,
with every secret replaced by a `CHANGE_ME_` placeholder. Start there:

```bash
cp docker-compose.example.yml docker-compose.yml
# fill in every CHANGE_ME_ value, then paste the result into TrueNAS as a
# custom app — or run it from a dataset with `docker compose up -d`
```

`docker-compose.yml` is gitignored, so the filled-in copy cannot be committed by
accident. That is deliberate and it is the only reason the example exists as a
separate file: the deployed version holds the encryption key, both database
passwords and the Firefly admin password, and none of those belong in a public
history.

**The placeholders are not valid keys, and the stack refuses to start on them.**
That is the point. An example that boots as-is is an example that someone
deploys as-is, on credentials published in this repository — a back door with
documentation. Failing loudly on the first run is the cheaper mistake.

One self-contained file, deliberately. Named volumes, so there are no dataset
directories to create and no ownership to get right, and the database bootstrap
SQL is inlined as a `configs:` entry rather than being a second file to place.

## What the stack runs

| Service    | Image                            | Published | Notes                                 |
| ---------- | -------------------------------- | --------- | ------------------------------------- |
| `app`      | `jituboss/firefly-studio:latest` | 3000      | Firefly Studio itself                 |
| `firefly`  | `fireflyiii/core:version-6.5.5`  | 8080      | the ledger it is a client for         |
| `postgres` | `postgres:16-alpine`             | —         | both applications, separate databases |
| `redis`    | `redis:7-alpine`                 | —         | the Firefly response cache            |

Postgres and Redis are deliberately not published to the host. Only the two
things you open in a browser are.

## Generate the secrets

One command per placeholder in the example:

```bash
openssl rand -base64 32   # APP_ENCRYPTION_KEY
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 20      # CRON_SECRET
openssl rand -hex 16      # Firefly APP_KEY — must be EXACTLY 32 characters
openssl rand -hex 16      # firefly_studio database password
openssl rand -hex 16      # firefly database password
openssl rand -hex 12      # MANAGED_FIREFLY_ADMIN_PASSWORD
```

Nothing should be left when you are done — excluding the header, which names
the token in prose and would otherwise match itself:

```bash
grep -n CHANGE_ME_ docker-compose.yml | grep -v '#'   # no output = ready to deploy
```

The one that hides from a casual read is inside the bootstrap SQL at the bottom
of the file, in the middle of a quoted `CREATE ROLE` statement rather than on an
`ENV: value` line of its own. A find-and-replace catches it; an eye scanning the
left-hand column does not.

**Both database passwords appear twice in the file, and the pairs have to
match.** They are far enough apart to miss:

| Password         | Appears as                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| `firefly_studio` | `POSTGRES_PASSWORD` on `postgres`, and inside `DATABASE_URL` on `app`  |
| `firefly`        | `DB_PASSWORD` on `firefly`, and inside the bootstrap SQL at the bottom |

Get a pair out of step and Postgres creates the role with one password while the
application tries the other. Neither reports a password problem: Firefly Studio
cannot open its database and Firefly III cannot log in, both of which surface as
an unhealthy container. Because each placeholder is unique, a global
find-and-replace per password does the right thing.

Database passwords should stay alphanumeric — `openssl rand -hex` guarantees it.
One of them is interpolated into `DATABASE_URL`, where a `@` or a `/` would have
to be percent-encoded, and a password that quietly truncates the connection
string is a confusing way to spend an evening.

**Keep `APP_ENCRYPTION_KEY`.** Losing it means every stored Firefly token
becomes undecryptable and every connection has to be re-authorised.

## The inlined bootstrap SQL is not optional

It is already in the example; this is what it is for, in case you ever need to
rebuild or re-apply it. Postgres runs it only when the data directory is empty,
and the application's own migrations do not create what it creates:

- `CREATE EXTENSION` `citext` and `pgcrypto` — the schema stores emails as
  `citext` and defaults ids to `gen_random_uuid()`, so the first migration
  fails without them;
- create the `firefly` role and database, with the password matching
  `DB_PASSWORD` on the `firefly` service.

Both statements are guarded with `IF NOT EXISTS`, so it stays safe to re-apply
by hand against a data directory that already has data — which is what you have
to do if you change a password after the first boot.

**It is written without a `DO $$ … $$` block on purpose.** Compose treats `$$` as the escape for
a literal `$`, so a dollar-quoted block arrives inside the container as `DO $`
and fails with `syntax error at or near "$"` — _after_ the `CREATE EXTENSION`
lines above it have already succeeded, so the file looks like it ran and the
failure only surfaces later as Firefly III being unable to log in. Use
`SELECT '…' WHERE NOT EXISTS (…)\gexec` instead, which needs no dollar sign.

## Storage

Named volumes, deliberately. The four images run as four different users — 70
(postgres), 999 (redis), 1001 (the app) and 33 (www-data, Firefly) — and a host
path the container cannot write to is the usual reason a TrueNAS deploy comes up
unhealthy. Letting Docker own the directories removes that class of problem
entirely.

If you would rather use dataset paths for snapshot and replication coverage,
swap the volumes for host paths and `chown` each to the uid above.

## Mail

`MAIL_TRANSPORT` is `console` until a real transport is set, which prints
verification and reset links to the container log instead of sending them. For
SMTP you need `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASSWORD`; the app
refuses to start with `MAIL_TRANSPORT=smtp` and no host, because a selected but
unconfigured transport silently swallows every message.

**Leave `SMTP_SECURE` unset on port 587.** The transport turns implicit TLS on
only for 465 and otherwise starts plaintext and upgrades with STARTTLS, which is
what the submission port expects — forcing it true makes the connection hang
rather than fail with anything useful.

`MAIL_FROM` has to be a domain the provider will accept; most reject a sender
they have not verified.

## Things to set per host

- `APP_URL` on `app`, and `APP_URL` on `firefly` — verification and reset links
  are built from them, and a wrong value sends mail pointing at the wrong host.
- `TZ` on every service.

## The managed Firefly instance

`MANAGED_FIREFLY_*` offers the bundled Firefly as a one-click choice during
onboarding: an account is created for each user and their token minted, so
nobody has to find a Personal Access Token by hand.

It requires Firefly's **single user mode to be off**, which means that instance
accepts registrations. That is fine while it is only reachable on the LAN — do
not port-forward 8080. Remove the `MANAGED_FIREFLY_*` variables to turn the
feature off and have each person attach their own instance instead.

## Upgrading

Every stable release publishes four tags pointing at the same image:

| Tag      | Moves to                                 | Use it when                     |
| -------- | ---------------------------------------- | ------------------------------- |
| `0.9.1`  | never                                    | you want to decide each upgrade |
| `0.9`    | the newest patch in the 0.9 line         | you want fixes, not features    |
| `latest` | the newest stable release, across minors | you want everything as it lands |
| `0`      | the newest 0.x                           | same as `latest` until 1.0      |

Migrations run on boot (`RUN_MIGRATIONS_ON_BOOT`) behind an advisory lock, so a
restart is all an upgrade needs — no separate migration step, and two containers
starting at once cannot race each other.

### A moving tag does not move on its own

This is the part that catches people, and it is not a registry problem.
`docker compose up -d` uses whatever image is already cached under the tag; it
does not ask Docker Hub whether the tag still points there. So `latest` can be
four releases ahead while the container keeps starting from the image pulled
months ago, with nothing on screen to say so — the tag looks right, the app is
old.

The compose file sets `pull_policy: always` on `app` for exactly this reason.
With it, every `up` re-resolves the tag to a digest, and the container is
recreated only when that digest actually changed. Nothing happens on an `up`
when you are already current.

Without it, the pull has to be explicit:

```bash
docker compose pull app && docker compose up -d app
```

### Reclaiming the old images

Superseded images are not deleted, they are just untagged — three or four
upgrades and there is a few GB of nothing on the pool:

```bash
docker image prune -f          # untagged images only
docker image prune -af         # everything not backing a running container
```

`-f` is the one to run on a schedule. `-af` also removes images you have pulled
but are not currently running, which on a NAS is usually not what you meant.

### Updating from the TrueNAS UI

For a custom app, **Edit → Save** redeploys the stack, which with
`pull_policy: always` is enough to pick up a new release. From a shell in the
app's dataset, the equivalent is the `pull` + `up -d` pair above.

### Updating without touching the NAS

To have a release land by itself, run a watcher alongside the stack rather than
opening the NAS to the internet — nothing in the release pipeline should be able
to reach inward, and a webhook endpoint on a machine holding your financial data
is a poor trade for saving a click.

```yaml
watchtower:
  image: containrrr/watchtower
  restart: unless-stopped
  command: --cleanup --include-restarting firefly_studio
  environment:
    TZ: Asia/Dhaka
    WATCHTOWER_POLL_INTERVAL: '21600' # six hours
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

Two things to weigh before adding it:

- **The Docker socket is root on the host.** Any container that can reach it can
  start a privileged container on your NAS. That is the standing cost of every
  auto-updater of this shape, Watchtower included.
- **It is named `firefly_studio` on purpose.** Left unscoped, Watchtower updates
  every container it can see — including `postgres` and `fireflyiii/core`, where
  an unattended major-version jump is how a ledger gets hurt. Those two are
  pinned for a reason; keep them out of it.

If you would rather not give anything the socket, a cron job on the host does
the same work with none of the exposure:

```bash
cd /path/to/the/stack && docker compose pull app && docker compose up -d app && docker image prune -f
```

### Which tag to follow

`latest` crosses minor versions, and before 1.0 a minor bump is where breaking
changes are allowed to live. Following it means an untested release can land on
your ledger unattended. `0.9` only ever moves to a patch, which is the safer
thing to point an unattended updater at; move it by hand when you have read the
changelog and decided to take the next minor.

## The demo account

The demo tooling ships **inside the image**, already built. Running `pnpm`
in the container's shell fails and will keep failing: there is no `scripts/`
directory, no TypeScript, no tsx, and the container runs as uid 1001, which
cannot write to `/app` — so corepack cannot even unpack a package manager
there. Use `node` against the prebuilt bundles instead.

From the TrueNAS shell, inside the app container:

```sh
FIREFLY_URL=http://firefly:8080 \
FIREFLY_PAT=<a personal access token on that instance> \
DEMO_CURRENCY=BDT \
  node dist/demo-seed.cjs --reset

FIREFLY_URL=http://firefly:8080 FIREFLY_PAT=<token> \
  node dist/demo-account.cjs
```

`FIREFLY_URL` must be the address **the app** uses — the compose service name,
not `127.0.0.1`, which inside the container is the container. `DATABASE_URL`
and `APP_ENCRYPTION_KEY` are already in the environment.

**`--reset` destroys that ledger**: accounts, transactions, budgets, the lot.
Point it at the demo instance, never at one holding real data.

Then set `DEMO_EMAIL` and `DEMO_PASSWORD` on the `app` service and restart it.
The sign-in page grows a "Try the demo" button; without those two variables the
demo does not exist and nothing about the app changes.
