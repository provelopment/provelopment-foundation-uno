# Foundation Uno — Roadmap

Unfinished stages and their exit gates, nothing more. **No stage in this file is
accepted.** A stage closes only when the independent Chief Master Architect records
`ACCEPT` against a published execution report, and the Owner authorises the next stage
with a new work order.

This file is a public planning summary. It is not an authorisation, not an acceptance
record, and not a substitute for the Owner-installed `workorder-active.md`. **No
implementation permission may be inferred from this file or from any other planning slot:
planning describes intended stages, and only an Owner-issued work order authorises work.**

---

## Stage sequence

Each stage depends on the previous stage's exit gate. Work may not start on a stage
whose predecessor is still open. The stage names below are the canonical Foundation Uno
sequence and must not be re-scoped by an implementation agent.

### U00 — Safe foundation, independent repository and extraction contract

**State: open.** U00 is a *foundation and contract* stage: it establishes an independent
repository, a verified scaffold, a read-only extraction inventory and an explicit
extraction contract. It is **not** the acceptance point for any runtime.

**Evidence already reported or verified inside this stage** — recorded in the single
execution report, and awaiting Architect verification rather than assumed:

| Evidence | Status |
| --- | --- |
| Private work order at exactly `.documents/WIP/workorder-active.md`, with no root-level alternative anywhere in the checkout | reported and verified locally |
| Parent workspace guard: an anchored ignore rule reported from the parent's **own root** ignore file, with a preserved local parent commit | reported and verified locally — the parent commit is **local only**; it was neither pushed nor remotely verified |
| Four-slot WIP discipline and exactly one overwritten report | reported and verified |
| Self-contained local implementation SOP plus an offline `AGENTS.md` | reported for Architect review |
| Two-host hosted bootstrap tests green at the published report commit | reported for Architect verification |

**Remaining requirements before U00 can be accepted:**

| # | Requirement | Owner |
| --- | --- | --- |
| 1 | Architect `ACCEPT` of the published execution report at an exact commit | Chief Master Architect |
| 2 | Owner approval of the **exact source pin** used for extraction | Owner |
| 3 | Owner approval of the **material configuration decisions** left open in `.documents/Architecture/source-inventory.md` §11 | Owner |

**Exit gate:** Architect `ACCEPT` at a specific commit, plus Owner approval of the exact
source pin and of the open material configuration decisions. Green tests alone do not close
U00.


### U01 — Independent codebase and reliable baseline

Not started. Blocked on U00 acceptance.

Scope: extract a **buildable, testable Foundation-derived Next.js / TypeScript source
baseline** into this independent repository against the Owner-approved source pin, and
establish that the independent codebase builds and its baseline checks pass.

U01 is a **baseline** stage. It does **not** remove the Hub/Spoke domain, and it does
**not** deliver public routing or metadata parity — those belong to U02 and U03.

**Exit gate:** an accepted extraction ledger naming every path before any source moves, a
genuinely buildable baseline with real tests, and a recorded dependency set.

### U02 — Remove Hub/Spoke domain and establish single-Entity authority

Not started. Blocked on U01 exit.

Scope: remove the Hub/Spoke domain model and establish Uno's single-Entity authority,
including explicit refusal of a **zero-Entity** and a **two-Entity** configuration.
Spoke-owned publication identity and multi-publisher ownership are removed here.

**Exit gate:** one Entity is the only admissible topology, with refusal tests proving that
zero and two Entities are rejected.

### U03 — Public routing, content and metadata parity

Not started. Blocked on U02 exit, and on the Owner's accepted route schema.

Scope: public routing, content and metadata parity — canonical addresses, an optional base
path, Page and locale behaviour, and visibility. `canonicalLocaleTag` remains distinct from
`localePathKey`.

**Exit gate:** the approved route schema serves correctly, with declared locales and correct
visibility behaviour.

### U04 — One owner, one presentation shell

Not started. Blocked on U03 exit.

Scope: one owner and **one** presentation shell — assets, responsive navigation and
accessibility.

**Exit gate:** the single presentation shell meets the agreed responsive and accessibility
criteria.

### U05 — Retain appropriate website functionality

Not started. Blocked on U04 exit.

Scope: retain appropriate website functionality, including **safe contact** and explicitly
approved integrations.

**Exit gate:** the approved functionality works with explicit secret handling, no credential
in the repository, and a recorded licence review for any integration.

### U06 — Clean-room setup, upgrade and distribution

Not started. Blocked on U05 exit. Upstream `scripts/release/**` and
`scripts/installation/**` are **not** copied before this stage; Uno's own clean-room setup,
upgrade and distribution capability is a future obligation here, not something permanently
deleted.

**Exit gate:** a reproducible clean-room setup, a documented upgrade path and a
distributable artefact.

### U07 — Full independent review and Owner-controlled first release

Not started. Blocked on U06 exit.

Scope: a full independent review, followed by the Owner-controlled first release.

**Exit gate:** the independent review is closed and the Owner authorises the first release.


---

## Dependency summary

```text
U00 → U01 → U02 → U03 → U04 → U05 → U06 → U07
```

There is no parallel track. A stage that cannot meet its exit gate stays open; it is
never marked complete because unrelated checks passed.
