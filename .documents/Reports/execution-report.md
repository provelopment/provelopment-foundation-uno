# Foundation Uno — U00 Execution Report

**Order:** `UNO-WO-001` · **Edition:** `R01`
**Execution date:** 2026-11-15
**Execution role:** Implementation Agent
**Review role:** Chief Master Architect (read-only GitHub)
**Outcome:** `COMPLETE` — with three recorded `REVISE` / `UNVERIFIED` items (§3)

---

## 1. Root identity, repository state and remotes

| Fact | Value |
| --- | --- |
| Project root | `<UNO_ROOT>` (single physical directory in the Owner's workspace) |
| Root type | Ordinary directory — **not** a reparse point, junction or symlink; `LinkType` empty, `Target` empty |
| Ancestors inspected | drive root, `Users`, user profile, `Documents`, workspace parent — all ordinary directories, no reparse points |
| WSL path check | reachable from the WSL distro only as a Windows-mount path (`/mnt/...`) resolving back to the same filesystem; no symlink into a protected location |
| Pre-existing root contents | exactly one file: the Owner-installed `workorder-active.md` (26,104 bytes, SHA-256 `4DB1540A…6790F99B`). Left byte-identical and untracked. |
| Branch | `main` |
| Start state | **no Git repository** (uninitialized) — hence no start commit to record |
| Scaffold commit (full SHA) | `11eb0c50ff37da2796cc16dda763a541822313c6` |
| Report commit (full SHA) | recorded in §9 — this commit supersedes the scaffold SHA as the reported head |
| Worktrees | 1 (this checkout only) — verified with `git worktree list` |
| Remotes | exactly **1**, named `origin`, `https://github.com/provelopment/provelopment-foundation-uno.git` |
| Tracked files | 9 (§4) |
| Protected Foundation repository as a remote | **never** — no second remote was ever added |

`.gitignore` screens `/workorder-active.md`, `/.documents/WIP/` and `/.temp/`;
`git ls-files` contains no work-order path.

---

## 2. Source identity

### 2.1 Foundation upstream (read-only)

| Fact | Value |
| --- | --- |
| Repository | `provelopment/provelopment-foundation` (public) |
| `main` at analysis time | `fa599973a88ff77f6a8e012f3266c3c139b52c17` |
| Commit date | 2026-10-29T06:43:45Z |
| Baseline candidate in the order | `fa599973a88ff77f6a8e012f3266c3c139b52c17` |
| Candidate vs live `main` | **IDENTICAL** — no discrepancy |
| Files at that ref | 867 |
| Open PRs | #273 (draft, GEO-03 reference-publication migration) and #274 (draft, GEO-04 country-code retirement) — neither merged, neither used as a source |

### 2.2 Local template (read-only reference)

| Fact | Value |
| --- | --- |
| Is a Git checkout | yes |
| `main` ref | `fa599973a88ff77f6a8e012f3266c3c139b52c17` — **equals GitHub `main`** |
| `origin/main` | `fa599973a88ff77f6a8e012f3266c3c139b52c17` |
| **Checked-out HEAD** | `8789a450525d44dc8f60ea572ad84fcf64f2ace5` |
| Branch | `feat/foundation-geo-04-legacy-retirement` (= PR #274's unmerged head) |
| Dirty state | **DIRTY** — 3 modified, 2 untracked files |
| Remote | `origin → …/provelopment-foundation.git` |
| Worktrees | 1 |

**Recorded discrepancy:** the template's *object database* agrees with GitHub `main`,
but its *working tree* does not. It sits one commit away on an unmerged draft-PR branch,
with uncommitted edits. File-level fingerprints from that tree therefore describe
`8789a45` + local edits, **not** `fa599973`. The inventory was consequently built from
committed objects at `fa599973` (`git ls-tree`, `git cat-file`, `git rev-parse <ref>:<path>`),
never from the working tree, and no checkout/reset/clean/stash/fetch/index-write was
performed against the template.

`LICENSE` is the one bounded file that is byte-identical between `main` and the dirty
branch, which is why it was the only file copied.

---

## 3. Reference integrity and the three open items

### 3.1 Reference integrity — before and after

| Reference | Before | After | Verdict |
| --- | --- | --- | --- |
| Foundation template checkout | HEAD `8789a45…`, branch `feat/foundation-geo-04-legacy-retirement`, 5 dirty entries | HEAD `8789a45…`, same branch, **same 5 dirty entries** | **UNCHANGED** |
| Workspace parent repository (`provelopment-root`) | HEAD `2548cc7…` | HEAD `2548cc7…` | **UNCHANGED** |
| GitHub Foundation repository | `main` @ `fa599973…` | untouched; no write operation performed | **UNCHANGED** |
| Owner-installed work order | 26,104 bytes, SHA-256 `4DB1540A…F99B` | same bytes, untracked, ignored | **UNCHANGED** |

No generator, build, install, checkout, reset, clean, index write, cache, hook or fetch
was run inside any Foundation reference. No clone or worktree was created anywhere.

### 3.2 Open items for Architect acknowledgement

**A. Work order physical path differs from the order text — `REVISE`.**
The order states the file resides at `<UNO_ROOT>/.documents/WIP/workorder-active.md`. It
does not. It resides at `<UNO_ROOT>/workorder-active.md`. Content was verified to match
the Owner's activation exactly — ID `UNO-WO-001`, Edition `R01`, Status `OWNER-ISSUED`,
SHA-256 `4DB1540A90C232F74C584D488F4CE43ACC5113DA627945DA6C947E4A6790F99B`, 260 lines.
The order was honoured as authority. **Mitigation applied:** `.gitignore` screens *both*
the specified path and the actual path, so the private order cannot be published from
either location. **Owner action requested:** confirm the intended location.

**B. The workspace parent repository does not screen this project — `REVISE`.**
`<UNO_ROOT>` is nested inside the workspace parent repository `provelopment-root`
(remote `…/provelopment-root.git`, HEAD `2548cc7…`). Every sibling subproject has an
anchored `.gitignore` rule there; this one does not. `git status` in the parent reports
`?? 00.foundation-uno/` — untracked and unscreened. A stray `git add -A` in the parent
could therefore add a gitlink for this directory. The preflight requirement "verify the
parent checkout will not track Uno" is **not satisfiable** as installed. I did **not**
modify the parent repository: that is outside this order's ledger and explicitly
forbidden. **Owner action requested:** add an anchored `/00.foundation-uno/` rule to the
parent `.gitignore`.

**C. Canonical Drive documentation not read — `UNVERIFIED`.**
The canonical Uno documentation folder (`1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0`) was not
readable: no Google Drive connection is available to this agent. Per the order, the
explicit order scope governed instead and no architectural content was invented. The
Drive documents were **not** mirrored into this repository. **Action:** Architect
confirmation that the Drive set is unchanged and that §11 of the inventory matches it.

---

## 4. Files created and publication review

Nine files were staged and committed. All others in the root are ignored.

| File | Bytes (git) | Purpose |
| --- | --- | --- |
| `README.md` | 5,863 | Truthful public orientation; states the runtime is **not implemented yet** |
| `AGENTS.md` | 4,363 | Public repo entry point; canonical Drive links and repo-local rules |
| `LICENSE` | 11,358 | Complete, unmodified Apache-2.0 |
| `.gitignore` | 1,403 | Private authority, task scratch, credentials, build products |
| `.gitattributes` | 984 | `text=auto` plus explicit LF for authored text |
| `.documents/Architecture/source-inventory.md` | 43,491 | Source-verified U01 extraction matrix |
| `.documents/Reports/execution-report.md` | this file | U00 evidence (report commit) |
| `scripts/verify-bootstrap.mjs` | 8,991 | Dependency-free bootstrap validator |
| `tests/bootstrap.test.mjs` | 8,101 | 15 positive/refusal tests |
| `.github/workflows/verify-bootstrap.yml` | 1,244 | Two-host read-only bootstrap CI |

### 4.1 Publication review performed before commit

- `git diff --cached --name-only` → exactly the nine paths above.
- `git diff --cached --check` → clean (exit 0) after removing three end-of-file blank
  lines flagged on the first pass.
- `git ls-files` → contains **no** work-order path; `git check-ignore` confirms
  `workorder-active.md` and `.temp/` are ignored.
- Staged-content credential/private-path scan (AWS key id, GitHub token shapes,
  fine-grained PAT, Slack token, PEM private-key header, JWT, Windows user-profile path,
  WSL Windows-mount path) → **0 hits** after two self-inflicted hits were removed:
  the validator's own detector pattern and a fabricated sample token in a test were both
  rewritten to be assembled at runtime, so no token-shaped literal exists in the
  repository.
- Remote tree read back from the GitHub API after push → exactly the nine paths, no
  work-order file, no `.temp/`.

### 4.2 Licence review

`LICENSE` was copied byte-for-byte from the read-only source via a raw byte stream (no
text translation). Proof of identity: the repository's index/blob hash for `LICENSE` is
`d645695673349e3947e8e5ae42332d0ac3164cd7`, **identical** to the upstream blob at
`fa599973`. Size 11,358 bytes, LF-only, SHA-256 `CFC7749B…523D30`. It is the complete
Apache License 2.0 text including the `APPENDIX` boilerplate, with the standard
`Copyright [yyyy] [name of copyright owner]` placeholder — no copyright holder was
invented and no `NOTICE` file was created.

---

## 5. Windows 11 — focused, negative and CLI tests

Environment: Windows 11, native Node.js **v24.22.1** (matching the `node: 24.x` engine
observed upstream), run from `<UNO_ROOT>`.

| # | Command | Result |
| --- | --- | --- |
| 1 | `node --check scripts/verify-bootstrap.mjs` | pass — no syntax error |
| 2 | `node --test tests/bootstrap.test.mjs` | **15 tests, 15 pass, 0 fail, 0 skipped, 0 cancelled** |
| 3 | `node scripts/verify-bootstrap.mjs` | `verify-bootstrap: OK - 7 required files present, licence verified, private authority screened, no Hub/Spoke data, no credential or private-path leaks.` (exit 0) |
| 4 | `git diff --cached --check` | exit 0, clean (after removing 3 EOF blank lines) |
| 5 | `git check-ignore -v workorder-active.md` | matches `.gitignore:14:/workorder-active.md` |
| 6 | `git check-ignore -v .documents/WIP/workorder-active.md` | matches `.gitignore:13:/.documents/WIP/` |
| 7 | `git check-ignore -v .temp/U00/pkg.json` | matches `.gitignore:17:/.temp/` |
| 8 | `git status --short` | clean (only intentionally ignored work order and `.temp/`) |

### 5.1 The 15 tests, by name and direction

Positive: (1) a complete minimal scaffold is accepted with zero issues;
(2) the real Uno root passes the same validation.

Refusal: (3) missing `LICENSE`; (4) a non-Apache licence; (5) missing work-order ignore
pattern; (6) missing `.temp` ignore pattern; (7) stray `deployment/spokes.json`;
(8) missing `README.md`; (9) a README claiming a working website; (10) missing
`AGENTS.md`; (11) `AGENTS.md` without the canonical documentation reference; (12) an
empty required file; (13) a credential in a published document; (14) a machine-specific
private path in a published document; (15) a non-existent root reported rather than
thrown.

All fixtures were created under `<UNO_ROOT>/.temp/bootstrap-tests/` and removed by the
suite's `after()` hook. Verified afterwards: the fixture directory no longer exists.

### 5.2 Failures and skips

No test failures and no skipped tests on Windows. Two implementation defects were found
and fixed during the run, and are recorded rather than hidden:

1. An editing mistake truncated two lines of `gitignoreRules()`, producing
   `SyntaxError: Unexpected token 'export'`. Fixed before any commit.
2. `git diff --cached --check` flagged three end-of-file blank lines. Removed; re-verified.

---

## 6. WSL Ubuntu 26.04 — tests

**RUN.** Distro `Ubuntu 26.04.1 LTS` (WSL2), executing in the mapped root under the
Windows-mount path for `<UNO_ROOT>` — the *same single* Uno checkout, not a copy.

| # | Command | Result |
| --- | --- | --- |
| 1 | `node --test tests/bootstrap.test.mjs` | **15 tests, 15 pass, 0 fail, 0 skipped** |
| 2 | `node scripts/verify-bootstrap.mjs` | `verify-bootstrap: OK - …` (exit 0) |
| 3 | `git status --porcelain` | staged/clean as expected; no foreign files |

**Deviation recorded:** the WSL distro's default `PATH` has no `node`. A Node runtime is
present only via `nvm` at `~/.nvm/versions/node/v26.13.0/bin/node`, and that binary was
invoked by absolute path. **It is Node v26.13.0, not v24** — so the WSL run is a
cross-major extra data point, **not** a substitute for the pinned Node 24 verification.
Node 24 was verified natively on Windows and by hosted CI on both `ubuntu-24.04` and
`windows-2025`. All WSL output and scratch stayed inside `<UNO_ROOT>/.temp/`; nothing was
written to another repository.

---

## 7. GitHub target

| Fact | Value |
| --- | --- |
| Repository URL | <https://github.com/provelopment/provelopment-foundation-uno> |
| Visibility | **PUBLIC** (`isPrivate: false`, `visibility: PUBLIC`) |
| Owner / name | `provelopment` / `provelopment-foundation-uno` |
| Default branch | `main` |
| Branches | `main` only — no additional branch was created |
| Remote `main` HEAD | `11eb0c50ff37da2796cc16dda763a541822313c6` — **equal to the pushed local HEAD** |
| Local `origin` | `https://github.com/provelopment/provelopment-foundation-uno.git` (sole remote) |
| Creation command | `gh repo create provelopment/provelopment-foundation-uno --public --source=. --remote=origin --push` |
| Pre-creation collision check | repo absent (GraphQL "Could not resolve to a Repository") |
| Fork / template copy used | **no** — a fresh repository with a root commit, no Foundation history |
| Repository settings changed after creation | **none** (no secrets, no DNS, no provider integration, no release, no tag, no PR) |

---

## 8. Hosted CI

| Fact | Value |
| --- | --- |
| Workflow | `Uno Bootstrap Verify` (`.github/workflows/verify-bootstrap.yml`) |
| Run URL | <https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43682320187> |
| Head SHA for that run | `11eb0c50ff37da2796cc16dda763a541822313c6` |
| Run status / conclusion | `completed` / **`success`** |
| Job 1 | `verify (ubuntu-24.04)` — **success** |
| Job 2 | `verify (windows-2025)` — **success** |
| Permissions | `contents: read` only |
| Action pins | `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1), `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` (v7.0.0) |
| Pin verification | both full SHAs resolved via read-only GitHub API; both are tagged releases (v7.0.1 / v7.0.0), not branches |
| `persist-credentials` | `false` on checkout |
| Node in CI | `'24'` |
| What it proves | the **scaffold** is intact. It is **not** a Next.js build, and proves nothing about runtime behaviour. |

No check was disabled, skipped or marked `continue-on-error`. No red run was hidden.

---

## 9. Report commit

This report is published by an in-scope, report-only follow-up commit on `main`, as the
order directs, and is itself subject to the same two-host bootstrap verification.

- Scaffold commit: `11eb0c50ff37da2796cc16dda763a541822313c6` — verified green at
  run `43682320187`.
- **Final reported head:** the tip of `main` after this report commit. It is the commit
  that carries this file; its exact SHA is the repository's `main` head
  (<https://github.com/provelopment/provelopment-foundation-uno>) and the head of the
  second `Uno Bootstrap Verify` run. It is deliberately *not* the scaffold SHA above.
- No file outside the allowlisted ledger was touched by this commit.

---

## 10. Inventory summary — source-to-Uno decisions and U01 dependencies

Full matrix: [`.documents/Architecture/source-inventory.md`](../Architecture/source-inventory.md).
Against ref `fa599973`.

| Decision | Count | Representative modules |
| --- | --- | --- |
| `KEEP` | 5 | `src/core/efs/{properties,identity,locales}.ts`, `src/core/page-document.ts`, `LICENSE` |
| `ADAPT` | 13 groups | `src/core/efs/{publication,discovery}.ts`, `src/core/ui/**`, `src/application/**`, `src/app/**`, `src/config/**` (non-Spoke), `src/adapters/**` (content/maps/markdown/contact), `src/components/**`, page/site primitives, dictionaries, page JSON/Markdown loaders, `package.json`, `next.config.ts` |
| `DELETE` | 11 groups | `src/core/spoke/**`, all 14 `spoke-*` config modules, `deployment/spokes/**` (154 files), `deployment/spokes.json`, `deployment/tests/**`, the second-entity capsule, `src/core/foundation-installation/**`, `src/core/foundation-release/**`, `scripts/release/**`, `scripts/installation/**`, `.github/agent-reports/**`, upstream product manuals |
| `REPLACE` | 4 | `deployment/efs/manifest.json` (one Entity), `pnpm-lock.yaml`, `README.md`, `.github/workflows/ci.yml` |
| `FURTHER AUDIT` | 9 groups | `ARCHITECTURE.md`, 19 `src/core` domain primitives, `modules/connect/**`, the analytics adapter, the generated `public/**` boundary, country-code/CI-scope scripts, the `tests/**` matrix |

### 10.1 The five structural facts that will decide U01

1. **Content model already matches.** `PROPERTY_LEVELS = ["entity","facet","site","page","representation"]`
   is exactly Uno's chain — keep it.
2. **Publication ownership is Spoke-typed.** `EfsRuntimeSpokeIdentity` and
   `publicationOwnedBy(publication, spoke)` make the Spoke a *parameter of the ownership
   API*. Deleting `src/core/spoke/**` is not enough; the ownership layer must be rewritten.
3. **The presentation-site bridge.** `spokeId` + `presentationSiteCode` + `siteMode`
   (`closed`/`open`) + `defaultSiteId` is how a host/prefix selects a Site. With one Entity
   this must be re-derived, not copied.
4. **Owner-scoped asset loading has a generated boundary.** `owner-assets` routes depend on
   Spoke + Site + a generated catalog; `postinstall`/`build` can write into `public/`.
   Committed artefact vs generator is unresolved.
5. **Locale case-normalisation is two functions, not one.** `canonicalLocaleTag` (output)
   and `localePathKey` (lookup) must not be collapsed.

### 10.2 U01 dependencies that must be settled first

The ten Owner architecture decisions in inventory §11, of which the four blocking ones
are: `presentationSiteCode` fate, `siteMode` fate, content-root shape, and the
generated-vs-committed asset boundary.

---

## 11. Security, brand and provenance issues

| Issue | Severity | Current handling |
| --- | --- | --- |
| Private work order could be published | high | `.gitignore` screens both candidate paths; `git ls-files` contains none; remote tree verified |
| Machine-specific private paths in public files | medium | `verify-bootstrap.mjs` refuses them in published documents; this report uses `<UNO_ROOT>` |
| Credential-shaped literals in the repository | medium | two self-inflicted hits removed; validator and test assemble patterns at runtime; scan now reports 0 hits |
| Provelopment brand assets (`logo.svg`, `favicon.svg` in the entity capsule) | high | **not copied**; flagged for rights review — Apache-2.0 does not grant trademark rights |
| Upstream product prose (EN/DE) | medium | **not copied**; provenance review required per text |
| `modules/connect/LICENSE-CONNECT.md` is a separate licence | medium | flagged `FURTHER AUDIT`; not reused |
| No upstream `NOTICE` exists | low | no `NOTICE` invented; no third-party rights asserted |
| Live deployment hostname inside `deployment/spokes.json` | medium | **not copied**; the file is actively refused by the validator |

### 11.1 Owner / Architect decisions still required

1. Confirm the intended physical location of `workorder-active.md` (§3.2 A).
2. Authorise an anchored `/00.foundation-uno/` rule in the parent `.gitignore` (§3.2 B).
3. Confirm the canonical Drive documentation set is unchanged and matches inventory §11
   (§3.2 C).
4. Rule on the four blocking architecture decisions in §10.2 before U01 writes any code.
5. Confirm the rights position for brand assets, upstream prose and the Connect module
   before any of them is copied.

---

## 12. Cleanup and final state

| Item | State |
| --- | --- |
| Task-owned `.temp/` scratch | **removed** — `<UNO_ROOT>/.temp/` held only this task's evidence copies and the WSL helper script |
| Test fixtures | removed by the suite's own `after()` hook; verified absent |
| Retained material | the Owner-installed `workorder-active.md` (Owner-controlled, ignored, untracked) |
| `git status --porcelain` | clean apart from the intentionally ignored work order and `.temp/` |
| Tracked files | 10 after this report commit (nine scaffold files plus this report) |
| Worktrees | 1 |
| Remotes | 1 (`origin` → the Uno repository) |
| Foundation references | unchanged (§3.1) |
| Repository settings | untouched since creation |

---

## 13. Limitations and next task recommendation

### 13.1 Limitations — stated plainly

- This repository contains **no Uno runtime**. There is no Next.js app, no `src/`, no
  `package.json`, no build, no dev server, no release and no deployment. The green CI
  proves a governance scaffold, not website behaviour.
- The canonical Drive documentation was **not read** (§3.2 C).
- Upstream Foundation CI was **not executed**; no claim is made that it is green.
- The local template is **not** at `main` and is dirty (§2.2); all content claims are
  against committed objects at `fa599973`.
- WSL validation used Node **v26.13.0**; Node 24 was validated on Windows natively and in
  hosted CI on both runners.
- Runner image internals were not audited; only observed job conclusions are reported.
- No GitHub secret-scanning alert state was inspected beyond the staged-content scan in
  §4.1.

### 13.2 Recommendation

**Next task: U01 — first extraction slice**, scoped by inventory §7 and tested by
inventory §8, and **only after** the decisions in §11.1 are resolved.

This recommendation is **not** an implementation authorisation. U01 begins only under a
new Owner-issued work order, and it must repeat the preflight: verify the source pin, the
root, the remotes and the reference integrity before writing a single file.

No merge, no release and no deployment was performed or is proposed. The work stops here
for independent Chief Master Architect review.
