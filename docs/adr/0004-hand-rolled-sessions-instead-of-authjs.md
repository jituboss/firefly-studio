# 4. Database sessions implemented directly, not via Auth.js v5

Date: 2026-09-17
Status: Accepted
Supersedes: the "Auth" row of PROJECT_PLAN.md §2

## Context

The plan specified Auth.js v5 with the database session strategy, chosen
precisely so sessions could be revoked server-side (ADR-0001).

Auth.js forces the **JWT** strategy whenever the Credentials provider is used.
Its own documentation is explicit about this. Since email + password is our
primary sign-in method, adopting Auth.js would have given us stateless JWTs —
the one thing the plan picked Auth.js to avoid. Working around it means
shadowing Auth.js's session handling with our own table anyway.

Meanwhile `server/db/schema.ts` already models everything a session needs:
token hash, absolute expiry, idle expiry, elevation window, revocation
timestamp, IP and user agent.

## Decision

Implement sessions directly in `server/auth/session.ts`:

- 32 random bytes, base64url, in an `HttpOnly` `SameSite=Lax` cookie.
- Only the SHA-256 hash is stored; the raw token exists solely in the cookie.
- Absolute expiry 30 days, idle expiry 7 days, slid at most once per minute so
  a page view does not cost a write.
- `revokedAt` gives immediate server-side revocation; a password reset revokes
  every session for that user.
- `elevatedUntil` implements the step-up window that destructive proxy calls
  will require (E23-04).

Sign-up, sign-in, verification and reset are Next.js Server Actions, which
carry built-in CSRF protection (Origin/Host validation on every POST). That is
why there is no separate double-submit token for these forms.

## Consequences

- We own the session lifecycle, which is roughly 150 lines and exactly matches
  what §4.4 specified.
- No Auth.js dependency, and no adapter layer to keep in sync with our schema.
- OAuth sign-in (E2-11, P2) now needs a provider flow we write ourselves, or
  Auth.js reintroduced alongside for that path only. It is out of v1 scope, so
  this is deliberately deferred.
- Anything Auth.js would have given free — CSRF on non-action routes, provider
  plumbing — we must supply when we add non-action POST endpoints.
