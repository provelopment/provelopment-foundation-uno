# AGENTS.md — Foundation Uno

This is the **public, repo-local entry point** for anyone working in this repository.

The **canonical governing records are not in this repository.** They are maintained by
the Architect in the Uno project documentation folder:

- Canonical Uno documentation folder: <https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0>
  - `AGENTS.md` — canonical agent rules
  - `SOP-ARCHITECT.md` — Architect role and review procedure
  - plus `README.md`, `PLAN.md`, `BLUEPRINT.md`, `WIP.md`

This file is a synchronised, public summary and convenience entry point. Where this file
and the canonical Drive records differ, **the Drive records govern**, and the physical,
Owner-installed work order governs the current stage of work.

Read the canonical `AGENTS.md` and `SOP-ARCHITECT.md` before doing any work here.

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

## Scope boundary in one line

Foundation Uno is a single-Entity, Hub/Spoke-free, Apache-2.0 Next.js foundation;
anything that widens that scope needs an Owner decision first, not a pull request.

## Current stage

**U00 — project bootstrap.** Governance documents, a source extraction inventory and a
dependency-free bootstrap verifier with tests. There is **no Uno runtime, no build, no
release and no deployment** yet, and this repository's presence is not authorisation for
the next stage.

## Verifying the scaffold

```sh
node --test tests/bootstrap.test.mjs
node scripts/verify-bootstrap.mjs
```

No dependencies are installed at U00.
