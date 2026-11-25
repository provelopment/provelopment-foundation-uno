# AGENTS.md — Foundation Uno

**Purpose:** the short, stable entry point for agents. Detailed procedure belongs in the local SOP; current progress belongs in the roadmap and single execution report. Never append run history here.

## Read before acting

1. This file and `.documents/SOP/sop-implementation.md`.
2. `.documents/WIP/plan-roadmap.md`, `plan-next.md`, `plan-outlook.md` (planning only).
3. The sole private `.documents/WIP/workorder-active.md`, the Owner's matching activation, and `.documents/Reports/execution-report.md`.

Canonical Architect-maintained records: https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0. An offline agent must not claim to have read Drive. If a controlling instruction is missing or conflicts, STOP.

## Authority and boundaries

- **Owner:** sole source of implementation activation, scope exceptions, stage closure, release and deployment authorization.
- **Architect:** maintains canonical Drive records, independently reviews evidence, never writes GitHub or implementation files.
- **Implementation Agent:** acts only on the final exact-byte Owner-authorized `workorder-active.md` and matching activation. Never authors or extends its own authority or edits canonical Drive records.
- **Writes:** inside the physically verified Uno checkout and exact order ledger only. Parent, Foundation, Solo and sibling repositories are read-only; no standing external-file exception. An unexplained mid-run external file change means STOP: preserve it and restore nothing without Owner direction.
- **Git:** one checkout/worktree and Uno-only `origin`; no force push, unauthorised PR, merge, tag, release, deploy, settings change or secret publication. The ACTIVE order is ignored, untracked and never published.
- **Product:** one Entity per Installation; one or more concurrently active Facets, Sites per Facet, Pages per Site and explicitly authored full-locale representations per Page. Every valid Site may publish independently through its validated Facet/Site host and/or path binding; an optional explicit default is an entry preference, never an exclusive publisher. No arbitrary hierarchy or language ceiling and no Hub/Spoke or second Entity; resource, ownership and collision guards stay mandatory. Foundation Next.js/TypeScript is the technical source, not Solo Rust.
- **Current maturity:** the code is a technical baseline, not a published website; read the roadmap and report for status.
- **Proof:** local tests before any authorized push; exact-head hosted checks; one truthful overwritten `.documents/Reports/execution-report.md`; independent Architect `ACCEPT / REVISE / STOP`. A run is not self-accepted.

## Owner-controlled document freeze

**Never edit, append to, expand or rewrite `AGENTS.md`, `README.md` or `.documents/SOP/sop-implementation.md` without the Owner's express approval naming the change in a new work order.** This includes routine progress reports, source pins, CI results and past-order notes. `scripts/verify-governance-docs.mjs` checks their approved exact bytes in both hosted workflows. Changing or disabling that check also requires express Owner approval.
