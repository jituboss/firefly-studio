# Vendored Firefly III API specification

`firefly-iii-v1.yaml` is the OpenAPI 3.0 document for the Firefly III v1 API,
vendored from [`firefly-iii/api-docs`](https://github.com/firefly-iii/api-docs).

**Current version: see `VERSION`.**

It is committed deliberately rather than fetched at build time so that:

1. Builds are reproducible and work offline.
2. API drift shows up as a reviewable diff in a pull request, not as a runtime
   failure in production (PROJECT_PLAN.md §9.1, risk register).

## Updating

```bash
pnpm spec:update          # fetch the newest release, diff it, write it
pnpm spec:codegen         # regenerate spec/generated/
```

`spec:update` prints an operation-level diff — added, removed and changed
endpoints — and exits non-zero when operations were **removed**, because that is
always a breaking change for us.

## Generated output

`spec/generated/` is committed but never hand-edited.

| File            | Contents                                                        |
| --------------- | --------------------------------------------------------------- |
| `types.ts`      | Full request/response types via `openapi-typescript`            |
| `operations.ts` | Path + method registry, proxy allowlist classification, tag map |

Files under `spec/generated/` are excluded from lint and Prettier.
