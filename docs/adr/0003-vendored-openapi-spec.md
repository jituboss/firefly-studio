# 3. Vendor the Firefly III OpenAPI specification

Date: 2026-09-16
Status: Accepted

## Context

Firefly III publishes an OpenAPI document per release. We need typed access to
230 operations across 28 resource groups, and Firefly ships minor releases
often.

Fetching the spec at build time would keep us current automatically. It would
also make builds non-reproducible, break offline and air-gapped builds, and let
an upstream change break production with no reviewable diff.

`api-docs.firefly-iii.org` additionally sits behind Cloudflare and rejects
non-browser clients, so the practical source is the `firefly-iii/api-docs`
GitHub repository.

## Decision

Commit `spec/firefly-iii-v1.yaml` and the generated output in `spec/generated/`.
`pnpm spec:update` fetches the newest release, prints an operation-level diff,
and exits non-zero when operations were removed or renamed. CI runs it in
`--check` mode and separately fails if the committed generated output is stale.

## Consequences

- Builds are reproducible and work offline.
- An upstream breaking change arrives as a red CI job and a reviewable diff.
- The vendored spec can go stale if nobody runs the update; the informational CI
  job exists to make that visible.
- `spec/generated/` adds noise to the diff of any update PR. It is excluded from
  lint and Prettier to keep that noise mechanical.
