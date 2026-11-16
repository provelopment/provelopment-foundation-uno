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

**State: closed by explicit Owner activation.** The Owner closed U00 by the activation that
authorised the bounded U01 commencement. This entry is a one-line record only: U00 is no
longer a remaining stage and its requirements are not restated here.

### U01 — Independent codebase and reliable baseline

**State: CLOSED by explicit Owner activation (formal stage 2 of 8).**

The Owner closed `U00` by explicit activation and authorised the bounded U01 sequence.
Delivered: a real App Router runtime with a non-indexable technical placeholder at `/`, later
replaced by the accepted English informational demonstration; one pure `src/core/efs/identity.ts`
copied verbatim from GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`; an adapted pure
authoring kernel (`src/core/page-content.ts`, `src/core/page-route-path.ts`); a new Uno-owned
locale policy (`src/core/efs/uno-locales.ts`) requiring an authored language **and region** with
explicit short-language mappings only; an Uno-only exact dependency lock; focused unit and
architecture-refusal tests; a loopback production HTTP proof; a source-adoption ledger with a
17-row section matrix and 22 capability contracts; and two-host CI beside the unchanged U00
workflow.

**Stage-exit correction (Owner-authorized, `UNO-WO-013 / R01`).** The exit gate below — an
accepted extraction ledger naming every path, a genuinely buildable baseline with real tests,
and a recorded dependency set — was met and independently reviewed, so U01 now closes there.
An earlier sentence in this file listed "full module parity with the Foundation Page composer"
and "real public routing/locale behaviour" as unfinished U01 work. That was inconsistent with
the stage assignment in this same roadmap and is corrected here: **routing, locale serving,
content reading and metadata parity belong to U03**, and **presentation shell plus module and
family parity belong to U04**. Neither is a U01 obligation.

Scope: extract a **buildable, testable Foundation-derived Next.js / TypeScript source
baseline** into this independent repository against the Owner-approved source pin, and
establish that the independent codebase builds and its baseline checks pass.

U01 is a **baseline** stage. It does **not** remove the Hub/Spoke domain — that belongs to U02 —
and it does **not** deliver public routing, locale serving or metadata parity, which belong to U03.

**Exit gate:** an accepted extraction ledger naming every path before any source moves, a
genuinely buildable baseline with real tests, and a recorded dependency set.

### U02 — Remove Hub/Spoke domain and establish single-Entity authority

**State: IN PROGRESS — single-Entity authored graph declared, validated and tested.**

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
