# 1. Two-tier identity: our own auth in front of a user-supplied Firefly PAT

Date: 2026-09-16
Status: Accepted

## Context

Firefly III authenticates API callers with a Personal Access Token or OAuth2.
A client could simply ask for a token and call the API from the browser.

But the product requirement is that users sign in to _our_ application, with our
own account lifecycle (verification, password reset, MFA, session revocation),
and then attach their Firefly instance from a profile page. Those are two
different identities with two different lifetimes.

## Decision

Two tiers:

1. **App identity** — email + password (Argon2id) in our own Postgres, with
   database-backed sessions so they can be revoked server-side.
2. **Firefly identity** — a base URL and PAT per connection, sealed with
   AES-256-GCM under a key derived from `APP_ENCRYPTION_KEY`, stored in
   `firefly_connections`.

Signing in to Firefly Studio does not authenticate you to Firefly III. The
connection is a resource the signed-in user owns.

## Consequences

- A user can rotate their Firefly token without touching their app password,
  and vice versa.
- Multiple connections per user become natural (personal and business ledgers).
- We carry the full cost of being an identity provider: verification email,
  reset flow, MFA, session management, breach checks, audit log.
- Losing `APP_ENCRYPTION_KEY` makes every stored token undecryptable. The
  recovery path is "re-enter your token", not data loss, but it must be
  documented in the backup runbook (E25-04).
