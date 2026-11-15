# AGENTS.md — Foundation Uno

This is the **public, repo-local entry point** for anyone working in this repository.
It is deliberately **self-contained**: an Implementation Agent with no Drive connector can
start here, read the local SOP, and work safely.

## Read these first

1. **This file** — role, boundary and the non-negotiable rules.
2. **[`.documents/SOP/sop-implementation.md`](.documents/SOP/sop-implementation.md)** — the
   complete local operating procedure in numbered, implementable form. It is the working
   manual; read it in full before touching anything.
3. **[`.documents/WIP/plan-roadmap.md`](.documents/WIP/plan-roadmap.md)** — the canonical
   `U00–U07` stage sequence and exit gates —
   plus **[`plan-next.md`](.documents/WIP/plan-next.md)** and
   **[`plan-outlook.md`](.documents/WIP/plan-outlook.md)**, which carry no authority.
4. **The Owner-installed order** at exactly `.documents/WIP/workorder-active.md`. It is
   private, ignored and untracked. Reading it is read-only onboarding.

> **Drive read status, stated honestly.** The canonical documentation folder lives outside
> this repository and is maintained **only by the Architect**:
> <https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0>
>
> An Implementation Agent without a Drive connector **has not read those documents** and
> must not claim to have done so. The seven canonical documents are `AGENTS.md`,
> `SOP-ARCHITECT.md`, `SOP-IMPLEMENTATION.md`, `README.md`, `PLAN.md`, `BLUEPRINT.md` and
> `WIP.md`. Where this file and the canonical Drive records differ, **the Drive records
> govern**; the physical, Owner-installed work order governs the current stage of work.

## Roles

| Role | May | May not |
| --- | --- | --- |
| **Owner** | Authorise stages, install the work order, grant exceptions | Delegate authority silently |
| **Chief Master Architect** | Read this repository read-only, decide `ACCEPT / REVISE / STOP`, maintain the canonical Drive documents | Execute implementation work |
| **Implementation Agent** | Execute exactly the installed order within its ledger | Self-accept, issue orders, edit Drive, extend authority |


## What Foundation Uno is

An independent, open-source Next.js / TypeScript extraction serving **exactly one
Entity**:

> Entity → Facet → Site → Page → localized representation

The scope is deliberately narrow. Keep it narrow.

## Repo-local rules

These rules are absolute for this repository.

1. **One Entity.** Foundation Uno serves exactly one Entity. Any contribution that
   introduces a second Entity, a multi-Entity publication surface, or tenant
   multiplexing is out of scope and must be refused, not accommodated.
2. **No Hub/Spoke.** Foundation Uno has no Spoke Hub, no Spoke identity, no Spoke
   membership, no Spoke routing and no Spoke switching. Upstream modules that exist only
   to support Hub/Spoke are not carried over. Do not reintroduce that vocabulary or its
   machinery through an "adapter" by another name.
3. **No project code changes without a work order.** Do not add source, change
   architecture, introduce a framework, restructure the repository or alter CI without a
   physical, Owner-installed `workorder-active.md` **plus** an explicit Owner activation
   message for the stage you are working on. A repository file that merely mentions a
   stage is not an authorisation. The one-time R03 bootstrap exception described below has
   been **consumed** and grants nothing further.
4. **No writes to reference material.** The upstream Foundation repository and any local
   upstream checkout are strictly read-only. Never modify, generate into, install into,
   build in, fetch into, reset, clean, or write an index/cache/hook/log inside them.
   Read only.
5. **Only the verified project root.** Write only inside the verified local Foundation
   Uno project root and only within the paths the current work order explicitly
   allowlists. Never write to a parent, sibling or unrelated repository, or to a user
   profile directory. The single **consumed** R03 bootstrap exception below is the only
   historical instance of a parent write; it authorises nothing beyond itself.
6. **No GitHub operations outside an issued order.** Do not push, create repositories,
   open or merge pull requests, create tags or releases, alter repository settings, or
   change Actions configuration unless the current work order authorises that specific
   operation. Never force-push, never rewrite published history.
7. **Test locally before any permitted push.** Run the verification commands locally and
   get a real green result before publishing. Do not push red and then fix it on the
   remote, and never disable, skip, loosen or `continue-on-error` a check to manufacture
   a passing status.
8. **Report evidence.** Every stage ends with a truthful report of what was run, what
   passed, what was skipped, and what remains unverified. Unavailable or failed
   mandatory verification is reported as unverified — never as passing.
9. **No secrets, ever.** Do not commit credentials, tokens, private keys, `.env` files,
   personal data, private documentation extracts, or machine-specific absolute paths.
   Public documents use repo-relative or symbolic paths.

## One-time Owner exception — consumed

**The Owner normally controls physical work-order installation.** An Implementation Agent
must not write, replace, move or author the work order, and must not touch the parent
workspace repository.

For `UNO-WO-001 / R03` **only**, the Owner explicitly delegated two narrowly bounded actions
to the Implementation Agent:

1. a **single, exact-byte installation** of the Architect-authored R03 order at the
   canonical path, and
2. a **narrowly bounded parent-repository repair** — appending one anchored ignore rule to
   the parent workspace root `.gitignore`, plus one isolated **local** parent commit.

**That exception has been consumed.** It does not establish, and nothing may be inferred
from it as:

- standing permission to write, edit, configure or otherwise modify the parent repository,
- permission to install, replace or author any further work order,
- permission to push, tag, release or otherwise publish the parent repository — the R03
  parent commit is local only and was never pushed,
- permission to repeat, extend or generalise the exception for a later task.

Outside that single consumed instance, the parent and every reference repository are
strictly read-only.

## The four WIP slots


`.documents/WIP/` holds exactly four entries and nothing else — no archive, no dated copy,
no second order, no duplicate status register.

| Slot | Visibility | Meaning |
| --- | --- | --- |
| `workorder-active.md` | private, ignored, untracked | The Owner-authorised order for the current stage. Read-only after installation. Never published, never staged. |
| `plan-roadmap.md` | public, tracked | Unfinished stages `U00–U07` and their exit gates. Never an acceptance record. |
| `plan-next.md` | public, tracked | The single next authorised item. Header-only while nothing is authorised. |
| `plan-outlook.md` | public, tracked | Optional ideas. Never a requirement. |

A root-level `workorder-active.md` is **never** valid and its presence is a hard stop.

## One report

Exactly one run report exists: `.documents/Reports/execution-report.md`. Each real run
**overwrites** it — including a run that stopped or failed. No archives, no dated copies,
no per-stage variants. It records what was actually executed, with real versions, real
counts and honest `PASS / FAIL / UNVERIFIED / NOT APPLICABLE` marks, never a PASS for
something that did not run.

## Scope boundary in one line


Foundation Uno is a single-Entity, Hub/Spoke-free, Apache-2.0 Next.js foundation;
anything that widens that scope needs an Owner decision first, not a pull request.

## Current stage

**U01 — independent codebase and reliable baseline (bounded technical baseline).** The Owner
closed `U00` by explicit activation and authorised a restricted U01 commencement. What exists
now is a real but deliberately minimal Next.js / TypeScript runtime: a non-indexable technical
placeholder at `/`, one pure `src/core/efs/identity.ts` copied verbatim from GEO-03
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` (Git blob `7e6f8e0a4f0b9ba7b90f66c44205ff67befb7d20`),
an Uno-only exact dependency lock, focused unit and architecture-refusal tests, and two-host
CI alongside the unchanged U00 bootstrap workflow.

This is a **technical baseline**, not a published Uno website and not U01 completion. It now
includes a pure authoring kernel (content-slug and relative route-path contracts), a new
Uno-owned locale policy requiring an authored language **and region** with explicit
short-language mappings only, and a source-adoption ledger. There are **no P01–P08 website
features**, no published Site, no Page starter, no routing or locale authority, no content
model, no presentation shell, no contact delivery, no analytics, no Connect module, and **no
release and no deployment**.

`U00` and `U01` stay distinct: U00 is the governance and extraction contract; this is its
bounded first technical slice. **No stage is self-accepted.** An Agent `COMPLETE` is not an
Architect `ACCEPT`, and only the Owner may close a stage.


The **canonical** stage sequence `U00–U07`, with each stage's scope and exit gate, is
`.documents/WIP/plan-roadmap.md`. An offline agent must follow that file and must not
substitute its own stage names, re-scope a stage or reorder the sequence.

`plan-next.md` and `plan-outlook.md` carry no authority. **No implementation permission may
be inferred from any planning file**, from this document, from a green CI run or from the
existence of the scaffold. Only an Owner-issued work order plus an Owner activation message
authorises work.

## Start gate for any run

Before editing anything, confirm all of the following and stop on any mismatch:

- the physical root resolves to the expected directory with no escaping reparse point,
- exactly one checkout and one worktree, the expected branch and `HEAD`, a clean tracked
  tree apart from files this run owns,
- `origin` is the single Uno remote and no other remote exists,
- the active order sits at exactly `.documents/WIP/workorder-active.md`, with no
  root-level alternative, and its ID, edition and hash match the Owner handoff,
- the parent workspace repository ignores this checkout through its **own root** ignore
  file — a match reported from a nested file inside this repository is a false positive,
- protected references and the tracked-path ledger are unchanged.

## Verifying the baseline

The **U00 governance gate** is dependency-free and unchanged:

```sh
node --check scripts/verify-bootstrap.mjs
node --test tests/bootstrap.test.mjs
node scripts/verify-bootstrap.mjs
```

The **U01 runtime gates** need Node.js 24 and pnpm 11.6.0, use the committed lock and the
exact direct dependency set, and are the same commands the hosted workflow runs:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test:bootstrap
pnpm test:architecture
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:http
```

The U00 commands verify the **scaffold**; the U01 commands verify a real build and real tests.
Do not describe the U00 validator as evidence about runtime behaviour, never report a check as
passing when it did not run, and never weaken, skip or loosening a check to manufacture green.
