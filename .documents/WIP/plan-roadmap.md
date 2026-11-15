# Foundation Uno — Roadmap

Unfinished stages and their exit gates, nothing more. **No stage in this file is
accepted.** A stage closes only when the independent Chief Master Architect records
`ACCEPT` against a published execution report, and the Owner authorises the next stage
with a new work order.

This file is a public planning summary. It is not an authorisation, not an acceptance
record, and not a substitute for the Owner-installed `workorder-active.md`.

---

## Stage sequence

Each stage depends on the previous stage's exit gate. Work may not start on a stage
whose predecessor is still open.

### U00 — Repository authority and bootstrap scaffold

**State: open.** The scaffold, the source inventory and the two-host bootstrap
verification are published and green, but U00 is **not** accepted.

Remaining obligation before U00 can be proposed for acceptance:

| # | Obligation | Owner of the obligation |
| --- | --- | --- |
| 1 | The canonical work order must sit at exactly `.documents/WIP/workorder-active.md`, with no root-level alternative anywhere in the checkout. | Owner installs; agent verifies |
| 2 | The parent workspace repository must carry an anchored ignore rule for this independent checkout, so it can never be absorbed as a submodule-style entry. | Owner/Architect policy; agent verifies only |
| 3 | A self-contained local implementation SOP and a strengthened `AGENTS.md` must let an agent without a Drive connector work safely. | Agent produces; Architect reviews |
| 4 | Both hosted verification jobs must be green at the exact published report commit. | Agent provides evidence; Architect verifies |

**Exit gate:** architect `ACCEPT` of the U00 report, plus a confirmed parent guard and a
green two-host CI run at the report commit.

### U01 — First extraction slice

Not started. Blocked on: U00 acceptance, and the Owner's explicit decisions on the open
architecture forks recorded in `.documents/Architecture/source-inventory.md` §11 —
`presentationSiteCode` fate, `siteMode` fate, locale set, content-root shape, and the
generated-vs-committed asset boundary.

**Exit gate:** a minimal, genuinely buildable single-Entity runtime with real tests, and
an accepted write ledger that names every extracted path before any source moves.

### U02 — Content ingestion and authoring path

Not started. Blocked on U01 exit.

**Exit gate:** one Entity's content can be authored and validated without any Hub/Spoke
machinery.

### U03 — Presentation and locale routing

Not started. Blocked on U02 exit, and on the Owner's accepted route schema.

**Exit gate:** the approved canonical address, optional base path and declared locales
serve correctly, with `canonicalLocaleTag` kept distinct from `localePathKey`.

### U04 — Contact and provider integration

Not started. Blocked on U03 exit.

**Exit gate:** a provider-neutral path with explicit secret handling, no credential in
the repository, and a recorded licence review for any contact module.

### U05 — Hardening and accessibility

Not started. Blocked on U04 exit.

**Exit gate:** the agreed quality gates run clean on both hosts.

### U06 — Release and installation capability

Not started. Blocked on U05 exit. Upstream `scripts/release/**` and
`scripts/installation/**` are **not** copied before this stage; Uno's own release and
installation capability remains a future obligation here, not something deleted
permanently.

**Exit gate:** a reproducible release artefact and a documented installation path.

### U07 — Independent product readiness

Not started. Blocked on U06 exit.

**Exit gate:** the Owner's acceptance criteria for a standalone product are met, and the
rights review for any assets, branding, prose and third-party content is closed.

---

## Dependency summary

```text
U00 → U01 → U02 → U03 → U04 → U05 → U06 → U07
```

There is no parallel track. A stage that cannot meet its exit gate stays open; it is
never marked complete because unrelated checks passed.
