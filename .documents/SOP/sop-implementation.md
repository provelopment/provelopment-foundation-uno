# Foundation Uno — Implementation Agent SOP

**Status:** public, repo-local, self-contained.
**Audience:** an Implementation Agent that has **no** Drive connector and no access to
the canonical documentation folder.
**Authority:** this SOP operationalises the Owner-issued work order. It never overrides
it. Where this SOP and the current work order differ, the **work order governs**.

Nothing in this file is an authorisation to do work. Work begins only when an
Owner-installed work order says so.

Throughout this document, two symbolic labels are used instead of any real machine path:

- `<UNO_ROOT>` — the verified local Foundation Uno project root.
- `<FOUNDATION_TEMPLATE_REFERENCE>` — a local, strictly read-only upstream checkout.

---

## Mandatory start gate

Read, in this order and before touching anything:

1. `<UNO_ROOT>/AGENTS.md`
2. `.documents/SOP/sop-implementation.md` (this file)
3. `.documents/WIP/plan-roadmap.md`, `plan-next.md`, `plan-outlook.md`
4. the single Owner-installed `.documents/WIP/workorder-active.md`

Then STOP if any of these is true:

- the active file is missing, or another order exists at the repository root,
- the active file's ID, edition or hash does not match the Owner's handoff,
- the parent workspace repository does not ignore this checkout,
- the resolved root escapes via a junction, symlink or reparse point,
- `origin` points anywhere other than the independent Uno repository.

Reading the order is read-only onboarding. Do not edit it, move it, back it up, or
create a second copy anywhere.

---

## 1. What Foundation Uno is

One Entity, and one only. The content chain is fixed:

```text
Entity → Facet → Site → Page → localized representation
```

- **No Hub.** No Spoke Hub, no Spoke identity, no membership, no routing, no switching.
- **One publisher.** There is no second publisher, no multi-publisher identity and no
  `publicationOwnedBy`-style ownership split.
- **Technical reference is the Foundation Next.js / TypeScript product.** Its EFS content
  model is the starting architecture.
- **Foundation Solo supplies the procedural pattern only.** Do not port Solo's Rust code
  or adopt its locale design without an explicit Owner decision.

Any request that widens the scope to a second Entity or reintroduces Hub/Spoke
vocabulary — including "just an adapter" by another name — is refused, not accommodated.

## 2. Write confinement

- Write only inside `<UNO_ROOT>`, and only to paths the current work order explicitly
  allowlists.
- `<FOUNDATION_TEMPLATE_REFERENCE>` and the upstream GitHub repository are **strictly
  read-only**: do not modify, generate into, install into, build in, fetch into, reset,
  clean, or write an index, cache, hook or log inside them.
- The parent workspace repository, every sibling repository and every unrelated
  directory are read-only. The single narrow exception is a parent ignore-rule repair
  **only** when an Owner-issued order expressly authorises that exact edit.
- **Never paste a real local absolute path into a committed file.** Use the symbolic
  labels `<UNO_ROOT>` and `<FOUNDATION_TEMPLATE_REFERENCE>`. A committed document must
  not contain a user-profile path or a platform absolute path.
- Never write to a user profile, a system directory or a global Git configuration.

## 3. The work order is final and unmodified

- The only valid location is exactly `.documents/WIP/workorder-active.md`.
- A root-level `workorder-active.md` is **never** valid.
- The file is private, ignored and untracked. Never stage, commit, push or quote its body.
- Inspect its ID, edition and hash before acting, and confirm they match the Owner's
  handoff. A mismatch is a STOP, not something to reconcile by guessing.
- If the order is missing or its bytes are unavailable, STOP and ask the Owner for those
  bytes. Never reconstruct an order from a summary, and never author a replacement.

## 4. Parent protection

- The parent workspace repository must carry an **anchored** ignore rule for this
  checkout (`/00.foundation-uno/`) so it can never be absorbed as an entry.
- Verify it directly against the parent, and confirm the rule is reported from the
  parent's own root ignore file — a match reported from a nested file inside this
  repository is a false positive and proves nothing.
- A missing guard is a STOP. An Implementation Agent does **not** edit the parent unless
  a work order explicitly and narrowly grants that one-time repair.

## 5. The four WIP slots and the single report

`.documents/WIP/` holds **exactly four** entries. Nothing else — no `Archive/`,
no `Reports/`, no dated duplicates, no second order.

| Slot | Visibility | Rule |
| --- | --- | --- |
| `workorder-active.md` | private, ignored, untracked | The Owner-authorised order. Read-only after installation. Never published. |
| `plan-roadmap.md` | public, tracked | Unfinished stages and their exit gates. Never mark a stage accepted here. |
| `plan-next.md` | public, tracked | The single next authorised item only. Header-only when nothing is authorised. |
| `plan-outlook.md` | public, tracked | Optional ideas. Never a requirement. |

Status rules:

- A stage closes only on Architect `ACCEPT` plus a new Owner work order. A plan file is
  not an acceptance record.
- Exactly **one** run report exists: `.documents/Reports/execution-report.md`. Overwrite
  it. Do not create archives, dated copies or a second register.
- The Architect alone maintains the canonical documents; an Implementation Agent never
  synchronises them.

## 6. Per-run preflight

Before any edit in any run, verify and record:

1. The physical root resolves to the expected directory, and no ancestor or entry is a
   junction, symlink or reparse point that escapes it.
2. Exactly one checkout and one worktree; the expected branch and HEAD; a clean tracked
   tree apart from files this run owns.
3. `origin` is the single Uno remote and nothing else.
4. Protected references are unmodified, and the tracked-path inventory is exactly the
   expected ledger.
5. The active order's ID, edition and hash match the Owner handoff.
6. The parent guard is effective from the parent's own root ignore file.

STOP on any mismatch, on any unknown or unowned changed file, or on any required change
that falls outside the ledger.

## 7. Testing, staging and publication

Local-first, always:

```sh
node --check scripts/verify-bootstrap.mjs
node --test tests/bootstrap.test.mjs
node scripts/verify-bootstrap.mjs
git diff --check
```

- Run the focused checks on the available local hosts **before** any authorised push.
- Do not push red and repair on the remote. CI is a confirmation gate, not a debugger.
- Never mask a skip, a warning or an error. Never disable, loosen, `continue-on-error`
  or silently reclassify a check to manufacture a passing status.
- Before staging, inspect `git diff --cached --name-only` and `git diff --cached --check`,
  and run a human secret and private-path scan over the staged content.
- Never stage the private active order.
- Push only to the authorised Uno `origin/main`, only after local green. Never force-push,
  never rewrite published history.

## 8. Scratch, cleanup and containment

- Task-owned scratch lives in `<UNO_ROOT>/.temp/`, which is Git-ignored.
- Use only that directory, or a task area the agent platform genuinely provides for the
  run. Do not invent an arbitrary global temporary folder.
- Remove task-owned, safe-to-delete artefacts when they are no longer needed. Record
  anything deliberately retained.
- Never delete an unknown file, an Owner file or another agent's work.
- No second clone, no second worktree, no nested repository and no extra branch.

## 9. The one report

Every real run overwrites `.documents/Reports/execution-report.md`, exactly once —
**including** a run that STOPPED or FAILED. It must state:

- the order ID and edition, and the install path/edition/hash with a sanitized Owner
  handoff identifier,
- preflight results: root, parent guard, remote, worktree, protected references,
- the starting head and the added/modified/publicly tracked ledger,
- the actual local commands and the actual runtime versions, with exact test counts and
  any failures, skips or warnings,
- the upstream pin and licence/source findings,
- the final CI runs, head and job results,
- cleanup performed and any remaining Owner architecture decisions,
- each acceptance item marked `PASS`, `FAIL`, `UNVERIFIED` or `NOT APPLICABLE` — never a
  PASS for something that was not actually executed,
- one clear outcome: `COMPLETE`, `FAILED` or `STOPPED`.

Never publish the private work-order body, credentials, private Drive document content or
a personal filesystem path. Do not put the report's own commit SHA inside its own body.

## 10. Narrow standing report-only exception

Once an Owner-issued order that grants it is installed and activated, a single narrow
exception exists: the agent may commit and push **only**
`.documents/Reports/execution-report.md` as a report-only change, and only after verifying
a safe root, an effective parent guard, a clean `main`, the correct single remote and zero
private material.

That exception covers no other path and no other GitHub operation. It is not a general
push permission, it does not authorise a force-push, and it cannot be extended by the
agent's own judgement.

## 11. What the agent may never do

- Self-accept a stage, or issue the next work order.
- Edit the canonical Drive documentation.
- Modify any parent file outside a narrowly issued exception, or touch any reference
  repository.
- Merge, release, deploy, create tags, open pull requests, alter repository settings.
- Extend its own authority, or treat a green CI run as permission for the next stage.

The Architect reads the published report at the exact commit and decides
`ACCEPT / REVISE / STOP`, then maintains the canonical documents. The Owner separately
authorises the next step.

## 12. Scope-applicable safety

- **Ports and adapters, inward only.** Imports point inward to the content core. The core
  does not import the presentation layer, and no provider is reachable from the domain.
- **One Entity, refused otherwise.** A second Entity, a tenant axis or a multi-publisher
  surface is a refusal, not a configuration.
- **Authored source and path validation.** Content paths are validated against the
  declared tree; never resolve an unvalidated path into the filesystem.
- **Unlisted pages stay unlisted.** Unlisted content is `noindex` and discoverable by no
  route, sitemap or navigation surface.
- **Private properties and assets stay private.** No private property or asset may reach a
  public response or a committed artefact.
- **Rights, notice and licence.** Brand assets, product prose, third-party icons and any
  separate licence instrument (for example a connect-module licence) require a provenance
  and rights review before they are committed. Apache-2.0 grants software rights, not
  trademark rights.
- **No silent gate bypass.** A test gate is never skipped, loosened or reclassified to
  make a run look green.

---

## Closing rule

If an instruction here conflicts with the current Owner-installed work order, follow the
work order and record the conflict in the report. If an instruction conflicts with a
safety boundary above, STOP and report — do not rationalise a workaround.
