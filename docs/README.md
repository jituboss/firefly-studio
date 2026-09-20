# Documentation

## Start here

**[LEARNING.md](LEARNING.md)** — the handoff note. What this project is, what
state it is actually in, the traps the Firefly III API sets, and the
conventions that exist because something broke once. Read it before
`PROJECT_PLAN.md`; it is the "why", and it is deliberately kept short enough to
read in one sitting.

**[PROJECT_PLAN.md](PROJECT_PLAN.md)** — the "what", and the source of truth.
It is long, and meant to be navigated rather than read:

| Section | What is in it                                                                               |
| ------- | ------------------------------------------------------------------------------------------- |
| §1–§5   | Product shape, data model, security model, information architecture                         |
| §6      | Milestones M0–M8 and the effort reconciliation                                              |
| §7      | Firefly III API coverage inventory — every path, which epic owns it                         |
| §8      | The backlog: 224 items across 25 epics, each checked off with what shipped and what was cut |
| §9–§12  | Caching, proxy rules, open questions, definition of done                                    |
| §13–§16 | Verification logs, one per milestone or pass                                                |

The verification logs are the most useful part when something looks wrong.
They record what was checked against a live Firefly instance, what the instance
did that the spec did not predict, and the bugs that only surfaced by running
it.

## Reference

- **[adr/](adr/)** — architecture decision records. Four so far, and two of
  them explain deviations you would otherwise undo by accident:
  [ADR-0002](adr/0002-proxy-all-firefly-traffic.md) on why the Firefly token
  never reaches the browser, and
  [ADR-0004](adr/0004-hand-rolled-sessions-instead-of-authjs.md) on why Auth.js
  was rejected rather than never considered.
- **[SECURITY.md](SECURITY.md)** — how to report a vulnerability, what is in
  scope, and the hardening that has not been done yet, named item by item.
- **[RELEASING.md](RELEASING.md)** — versioning, image tags, and the steps to
  cut a release.
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** — setup, and the four rules that
  are enforced by lint rather than by convention.
- **[../spec/README.md](../spec/README.md)** — how the vendored Firefly III
  OpenAPI spec is updated and regenerated.

## Keeping these current

`PROJECT_PLAN.md` is the checklist; `LEARNING.md` is the narrative. When a
milestone or a pass finishes:

1. Check off its backlog items in §8, with a note on what actually shipped and
   what was cut. Nothing gets silently dropped — an item that was not built
   says so, and says what would unblock it.
2. Add a verification-log section. §13–§16 are the shape to copy.
3. Update `LEARNING.md`'s state section and add anything hard-won to its API
   findings. Trim it if it starts duplicating the plan — it is a handoff note,
   not a changelog. `CHANGELOG.md` is the changelog.
