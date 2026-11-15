# AGENTS.md — Foundation Uno

This is the **public, repo-local entry point** for anyone working in this repository.
It is deliberately **self-contained**: an Implementation Agent with no Drive connector can
start here, read the local SOP, and work safely.

## Read these first

1. **This file** — role, boundary and the non-negotiable rules.
2. **[`.documents/SOP/sop-implementation.md`](.documents/SOP/sop-implementation.md)** — the
   complete local operating procedure in numbered, implementable form. It is the working
   manual; read it in full before touching anything.
3. **[`.documents/WIP/plan-roadmap.md`](.documents/WIP/plan-roadmap.md)**,
   **[`plan-next.md`](.documents/WIP/plan-next.md)**,
   **[`plan-outlook.md`](.documents/WIP/plan-outlook.md)** — the public planning slots.
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
   stage is not an authorisation.
4. **No writes to reference material.** The upstream Foundation repository and any local
   upstream checkout are strictly read-only. Never modify, generate into, install into,
   build in, fetch into, reset, clean, or write an index/cache/hook/log inside them.
   Read only.
5. **Only the verified project root.** Write only inside the verified local Foundation
   Uno project root and only within the paths the current work order explicitly
   allowlists. Never write to a parent, sibling or unrelated repository, or to a user
   profile directory.
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

**U00 — repository authority and bootstrap scaffold.** Governance documents, a
source-verified extraction inventory, a self-contained local SOP, the four-slot WIP
discipline and a dependency-free bootstrap verifier with positive and refusal tests.

There is **no Uno runtime, no build, no release and no deployment** yet, and this
repository's presence is **not** authorisation for the next stage. U00 is **not accepted**:
acceptance requires an Architect `ACCEPT` of a published execution report plus a green
two-host CI run at that exact report commit.

The stage sequence and each stage's exit gate are in `.documents/WIP/plan-roadmap.md`.

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

## Verifying the scaffold

```sh
node --check scripts/verify-bootstrap.mjs
node --test tests/bootstrap.test.mjs
node scripts/verify-bootstrap.mjs
```

Two dependency-free commands, plus a syntax check. No packages are installed at U00 and
no lockfile exists. These commands verify the **scaffold**, not a runtime: there is no
application to build, so a build, TypeScript compile or browser check is NOT APPLICABLE
here and must never be reported as passing.
