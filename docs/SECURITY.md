# Security policy

## Reporting a vulnerability

**Do not open a public issue.** Report privately through GitHub:
[Security → Report a vulnerability](https://github.com/jituboss/firefly-studio/security/advisories/new).

Please include the version (the nav shows it, or `GET /api/health`), what you
did, what happened, and what you expected. A proof of concept against your own
instance helps more than a description.

This is a small project with no security team and no bug bounty. Expect a first
response within a week. If a report is valid you will be credited in the
advisory unless you ask not to be.

## What is in scope

Firefly Studio is a client. It holds your Firefly III **Personal Access Token**,
your app account credentials, and your app-side preferences — it does not hold
your ledger, which stays in Firefly III. The things worth attacking here are:

| Area                | Why it matters                                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Firefly proxy   | `/api/ff/[...path]` injects the decrypted PAT server-side. Anything that reaches another user's connection, or escapes the spec-generated path allowlist, is a finding.           |
| Token storage       | PATs are sealed with AES-256-GCM under `APP_ENCRYPTION_KEY`. Recovering a token without the key is a finding.                                                                     |
| SSRF                | The Firefly base URL is user-supplied. Reaching a host the guard is supposed to refuse — cloud metadata, loopback, link-local, or via DNS rebinding or a redirect — is a finding. |
| Session handling    | Sessions are database-backed and revocable. Forging one, or using one after it has been revoked, is a finding.                                                                    |
| Authentication      | Sign-in, reset, email verification, TOTP, and the step-up re-auth that gates destructive operations.                                                                              |
| Cross-tenant access | Anything that lets one app account read or write another's data, in our database or through their Firefly connection.                                                             |

Out of scope: vulnerabilities in Firefly III itself (report those to
[the Firefly III project](https://github.com/firefly-iii/firefly-iii/security/policy)),
findings that need an already-compromised host or database, missing hardening
headers with no demonstrated impact, and reports produced solely by a scanner
without a working exploit.

## Known gaps, stated plainly

The M8 hardening milestone has not run yet. The following are known and
tracked, so they are not new findings — though a report demonstrating that one
of them is exploitable in a way this note does not describe certainly is:

- **Redirect following is untested** (part of `E23-01`). The SSRF guard resolves
  a host once and validates the address, and the Firefly client does not follow
  redirects — but no test asserts that second half, so it is an assumption
  rather than a guarantee.
- **No key rotation** for `APP_ENCRYPTION_KEY` (`E23-05`). Rotating it today
  means every user re-authorises their connection.
- **No automated dependency or secret scanning** in CI (`E23-06`, `E23-08`).
- **No independent security review.** Nothing here has been audited by anyone
  outside the project.

Treat this as beta software: run it on a private network or behind an
authenticating proxy. It is not yet hardened for a hostile origin.

## What the app already does

- The PAT never reaches the browser. Every Firefly call is proxied server-side
  ([ADR-0002](adr/0002-proxy-all-firefly-traffic.md)).
- The proxy allows only paths present in the vendored OpenAPI spec, and refuses
  the webhook endpoints outright.
- Destructive operations sit behind step-up re-authentication.
- Passwords are Argon2id. Sessions live in Postgres and can be revoked
  individually; sign-in is rate-limited per account.
- TOTP two-factor with single-use recovery codes.
- A strict Content-Security-Policy with a per-request nonce, plus HSTS,
  `frame-ancestors 'none'`, COOP/CORP and `nosniff`.
- CSRF double-submit on every route handler that writes, alongside the
  `SameSite=Lax` session cookie.
- Outbound Firefly URLs are checked against the SSRF guard before any request,
  with private-network access off by default.
- Logs redact anything token-shaped; Sentry is opt-in and receives an internal
  user id, never an email address.

## Operator responsibilities

Two things the app cannot do for you:

1. **Back up `APP_ENCRYPTION_KEY` separately from the database.** It decrypts
   every stored token. Losing it means every user re-enters theirs; leaking it
   alongside a database dump means every token is exposed.
2. **Keep `FIREFLY_ALLOW_PRIVATE_NETWORKS=false` on anything internet-facing.**
   It exists for LAN self-hosting, and it is the single setting that turns the
   SSRF guard off.
