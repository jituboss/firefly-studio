# 2. Proxy all Firefly III traffic server-side

Date: 2026-09-16
Status: Accepted

## Context

The browser could call the user's Firefly instance directly, which would be
simpler and lower-latency. It would also require handing the PAT to the client.

## Decision

Every Firefly call goes through `/api/ff/[...path]` on our server. The token is
decrypted per-request, attached as a Bearer header, and never serialised into
any response.

## Consequences

Enabled by this choice:

- The PAT is never in the client bundle, in `localStorage`, or in a devtools
  network panel.
- Self-hosted instances on a LAN, behind a VPN, or without CORS headers work
  without any Firefly-side configuration.
- We get one place to add response caching (E22-01), per-user rate limiting
  (E22-03), a destructive-operation allowlist (E23-04), and audit logging.
- Firefly's `X-Trace-Id` can be captured into our own trace, so a failure is
  debuggable across both systems.

Costs accepted:

- Our server becomes a bandwidth and latency hop, including for attachment
  downloads, which must be streamed rather than buffered.
- **We accept SSRF as our primary security risk**, because the destination URL
  is user-supplied. Mitigation is specified in PROJECT_PLAN.md §4.2 and owned by
  E23-01: DNS resolve-then-pin, an IP policy flag, no redirect following, and
  cloud metadata ranges blocked unconditionally.
