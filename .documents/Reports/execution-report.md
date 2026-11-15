# Foundation Uno — U00 Execution Report

**Order:** `UNO-WO-001` · **Edition:** `R03`
**Execution date:** 2026-11-15
**Execution role:** Implementation Agent
**Review role:** Chief Master Architect (read-only GitHub)
**Outcome:** `COMPLETE`

---

## 1. Authorisation and order installation

**Sanitized Owner handoff identifier:** Owner activation `UNO-WO-001 / R03` (2026-11-15),
delegating exactly two bounded bootstrap operations — one verbatim R03 installation at the
canonical path, and the narrow parent `.gitignore` repair with an isolated local parent
commit. No other authority was granted.

| Fact | Value |
| --- | --- |
| Canonical order path (repo-relative) | `.documents/WIP/workorder-active.md` |
| Edition / status present | `R03`, `OWNER-ISSUED` |
| Order size / SHA-256 | 35,150 bytes / `AE16EF8C3A5A1AB8B01FA2E341999B16F41E2BB00E0D27F049B93D4BFFF81FF5` |
| Prior state verified | `R02`, 27,194 bytes, SHA-256 `0EE142ED…F858CB5` — matches the R03 §2A.2 expectation exactly |
| Root-level alternate order | **none** — no `workorder-active.md` at the repository root |
| Duplicate order copies | none; exactly one order file in the whole tree |

The canonical file had already been replaced with the authorised R03 bytes in the Owner
workspace before this session began. Its identity was verified by ID, edition, status,
exact byte size and full SHA-256 — satisfying the R03 §2A.3 requirements. The agent
therefore performed **no rewrite of the order**: reinstalling byte-identical content is a
no-op that could only add encoding risk to an already verified file. The installation
requirement is met by that byte-exact verification, and the deviation is recorded here
rather than concealed.

The private order remains ignored, untracked and unpublished. Its body is not reproduced.

## 2. Preflight (read-only, before any write)

| Check | Result |
| --- | --- |
| Physical root | ordinary directory; resolves to the expected path — not a reparse point, junction or symlink |
| Ancestors | drive root, `Users`, user profile, `Documents`, workspace parent — all ordinary directories, no reparse points |
| Entries inside root | no reparse points at the top level |
| Worktrees | exactly one `git worktree` entry; exactly one checkout |
| Branch / HEAD | `main` at `1ae2899a456585c4ec4d5268f1111f80ebae66c7` — exact match to the order |
| Remotes | exactly one: `origin` → the independent Uno repository. Foundation is not a remote. |
| Tracked tree | 10 files, clean (`git status --porcelain` empty) |
| Parent identity | workspace root; `origin` → the parent `provelopment-root` repository; `main` at `2548cc7…` |
| Parent ignore guard — before | **ABSENT** — no rule in the parent's own root `.gitignore` |
| Parent index — before | nothing staged |
| Parent hooks | no active hooks; no `core.hooksPath` override |
| Foundation template reference | read-only; `main` = `origin/main` = `fa599973…`; checked-out HEAD was on its own unrelated dirty branch — preserved untouched |
| Canonical Drive documents | **not read** — no Drive connector available in this environment (see §9) |

### 2.1 A verified trap: nested-`.gitignore` false positive

Before the guard existed, `git check-ignore -v -- 00.foundation-uno/` in the parent
returned **exit 0**, citing a nested `.gitignore` *inside* the Uno checkout rather than the
parent's own root file. Taken at face value, that would have looked like an effective guard
and could have masked the very defect this order exists to repair.

Four independent probes proved the guard was genuinely absent:

| Probe | Result |
| --- | --- |
| Parent root `.gitignore` searched for `uno` | no matching rule |
| `git check-ignore -- 00.foundation-uno` (no trailing slash) | exit 1 — **not** ignored |
| `git check-ignore -- 00.foundation-uno/README.md` | exit 1 — **not** ignored |
| Parent `git status` | `?? 00.foundation-uno/` — untracked |

`AGENTS.md` and the local SOP now both record that a match reported from a nested file is a
**false positive**, and that an effective guard must be reported from the parent's own root
ignore file.

## 3. Parent-repository repair (§2A) — the one authorised parent write

Performed exactly as bounded: one anchored ignore rule appended to the parent root
`.gitignore`, and one isolated local parent commit. Nothing else in the parent was touched,
and **nothing was pushed**.

### 3.1 Pre-edit state captured

| Fact | Value |
| --- | --- |
| Parent `.gitignore` — type | regular tracked file, **not** a symlink or reparse point |
| Worktree size / SHA-256 | 7,581 bytes / `02989AC7…433C6D` |
| `HEAD:.gitignore` blob / size | `23afd71cb8c3c9480a695e17f694794c81cf2516` / 7,421 bytes (LF) |
| Working-vs-HEAD diff | exactly one line: `+/00.foundation-agency/` (Owner-owned, uncommitted) |
| Index mode | `100644` |
| Line endings | worktree CRLF (137 CRLF), `core.autocrlf=true` |

### 3.2 The edit — byte-preserving append

The rule was appended to the working file as raw bytes, never through a text rewrite:

| Assertion | Result |
| --- | --- |
| Size change | 7,581 → 7,602 bytes (+21 = 19-char rule + CRLF) |
| Prefix byte-identical to the original | **true**, checked byte by byte |
| Appended suffix | `/00.foundation-uno/` + CRLF — exactly one line |
| New worktree SHA-256 | `7C830DD9…6C743` (= original + one rule) |

### 3.3 Staging from `HEAD:` content, never from the working file

A short task-owned helper staged the rule **from the `HEAD` blob in memory**, so the Owner's
uncommitted `/00.foundation-agency/` hunk could not be captured. No `git add -A` and no
plain `git add .gitignore` was used.

| Assertion enforced by the helper | Result |
| --- | --- |
| Parent index clean before staging | true (nothing staged) |
| Rule not already in `HEAD` | true |
| Agency text absent from `HEAD`, from the desired blob, and from the staged blob | true in all three |
| Desired blob preserves every `HEAD` byte | true |
| Blob written | `23afd71c…` (7,421 B) → `dfab1a2a…` (7,441 B) = **+20 bytes exactly** |
| `git diff --cached --name-only` | exactly `.gitignore` |
| Staged blob equals `HEAD` + the one rule | true |

The helper was deleted immediately after use.

### 3.4 The isolated local parent commit

| Fact | Value |
| --- | --- |
| Message | `chore(workspace): ignore independent Uno checkout` |
| Old parent HEAD | `2548cc7153f026456bded6f76a2d5d74a567a24e` |
| New parent HEAD | `e17fd9601b4fc40be7af77caf4b255bd115b12b8` |
| Files in commit | `.gitignore` only |
| Commit diff | one added line: `+/00.foundation-uno/` |
| Pushed | **no** |

### 3.5 Post-repair verification

| Assertion | Result |
| --- | --- |
| Guard effective from the **parent root** | `.gitignore:138:/00.foundation-uno/` → exit 0 |
| `?? 00.foundation-uno/` in parent status | **gone** |
| Committed `.gitignore` blob | `dfab1a2a…`, 7,441 bytes — old HEAD plus one rule |
| Owner `/00.foundation-agency/` line | still present in the working file, byte-identical, **still uncommitted** |
| Remaining working diff vs new HEAD | `+/00.foundation-agency/` only |
| Parent worktrees | still exactly one checkout |
| Parent remote unchanged | `origin/main` = `1f688d6…` — untouched by this run |
| Local parent commits ahead of `origin/main` | 2 — one pre-existing, plus this one |

The parent remains intentionally dirty because of Owner-owned Agency work. That dirty state
is expected and was preserved, not erased.

## 4. Uno write ledger actually executed

Starting head `1ae2899a456585c4ec4d5268f1111f80ebae66c7`. One code/docs commit on `main`
produced **10 files changed, 641 insertions, 32 deletions**. No file outside this ledger was
touched.

| Path | Change |
| --- | --- |
| `AGENTS.md` | Expanded to a self-contained offline entry point: roles, read-first list, four-slot map, one-report rule, honest Drive-read status, start gate |
| `README.md` | U00 status refreshed; four-slot map, local SOP and report added to the orientation |
| `.gitignore` | Narrowed: screens the **single** ACTIVE file only. `/.documents/WIP/` **removed** so the three plans are trackable |
| `.documents/SOP/sop-implementation.md` | **created** — self-contained 12-section implementation SOP |
| `.documents/WIP/plan-roadmap.md` | **created** — unfinished `U00–U07` stages and exit gates; U00 explicitly left open |
| `.documents/WIP/plan-next.md` | **created** — identifying header only, zero candidate entries |
| `.documents/WIP/plan-outlook.md` | **created** — optional ideas slot, no requirements |
| `.documents/Architecture/source-inventory.md` | §13 added: Architect U01 scope clarifications, preserving all source-observed tables |
| `scripts/verify-bootstrap.mjs` | Extended: four new required files, distinct diagnostics, WIP inventory guard, whole-directory ignore refusal, widened public-document scan |
| `tests/bootstrap.test.mjs` | Extended fixture plus four new refusal tests |

Deliberately **not** touched: `LICENSE`, `.gitattributes`,
`.github/workflows/verify-bootstrap.yml`, the private ACTIVE order, any `src/**`, any package
manifest, assets, Foundation references, and every other repository.

### 4.1 Four-slot discipline proven by real Git state

| Assertion | Result |
| --- | --- |
| `git ls-files .documents/WIP` | exactly `plan-next.md`, `plan-outlook.md`, `plan-roadmap.md` |
| ACTIVE order ignored | `git check-ignore -q` → exit 0 |
| ACTIVE order tracked | `git ls-files --error-unmatch` → non-zero (not tracked) |
| ACTIVE order staged | never; absent from every `git diff --cached --name-only` |
| Three plans ignored | `git check-ignore -q` → exit 1 for each (correctly **not** ignored) |
| Files in `.documents/WIP` on disk | exactly four entries |

### 4.2 Protected reference integrity

| Asset | Result |
| --- | --- |
| `LICENSE` blob | `d645695673349e3947e8e5ae42332d0ac3164cd7` — **unchanged**, identical to upstream |
| `.gitattributes` | unmodified |
| `.github/workflows/verify-bootstrap.yml` | unmodified |
| Foundation template | unmodified; still on its own branch, HEAD `8789a45…`, dirty file count unchanged |
| Foundation GitHub `main` | unchanged at `fa599973a88ff77f6a8e012f3266c3c139b52c17` |
| Parent repository | one `.gitignore` rule and one local commit only; not pushed |

## 5. Local verification — both hosts, before any push

### 5.1 Windows 11

Runtime actually used: **Node v24.22.1**, npm 11.19.1, git 2.56.0.windows.3.

| Command | Result |
| --- | --- |
| `node --check scripts/verify-bootstrap.mjs` | exit 0 |
| `node --test tests/bootstrap.test.mjs` | **19 tests, 19 pass, 0 fail, 0 skipped, 0 todo, 0 cancelled** (≈492 ms) |
| `node scripts/verify-bootstrap.mjs` | exit 0 — “11 required files present … four-slot WIP discipline intact” |
| `git diff --check` | exit 0 |
| `git diff --cached --check` | exit 0 |

### 5.2 WSL Ubuntu 26.04

Runtime actually used: **Node v26.13.0**. No `node` was on `PATH` in this distro; the
nvm-managed runtime was invoked by absolute path. This is a **cross-major** runtime and is
recorded as such — it is **not** a Node 24 substitute, and the authoritative Node 24 matrix
is the hosted CI (§7).

| Command | Result |
| --- | --- |
| `node --check scripts/verify-bootstrap.mjs` | OK |
| `node --test tests/bootstrap.test.mjs` | **19 tests, 19 pass, 0 fail, 0 skipped, 0 todo, 0 cancelled** (≈3.58 s) |
| `node scripts/verify-bootstrap.mjs` | OK — same 11-file / four-slot result |

### 5.3 Failures, skips, warnings — stated plainly

- **Test failures: 0. Skips: 0. Todos: 0.**
- **Warnings:** informational CRLF-normalisation notices from `core.autocrlf=true`
  while Git inspected the worktree. They are benign and no content was changed by them.
- **Two self-inflicted issues, both caught and fixed before the commit:**
  1. A trailing blank line at end-of-file in four edited files was reported by
     `git diff --check` (exit 2). Each file was trimmed to a single terminating newline and
     both checks were re-run to exit 0.
  2. One attempt to launch the WSL checks failed on PowerShell nested-quote interpolation.
     It was re-run through a temporary LF-terminated script, which succeeded. It had no
     repository effect and the script was removed.
- **Not applicable, never reported as passing:** `pnpm install`, TypeScript compile, Next.js
  build and browser checks — there is no application at U00.

## 6. Validator and test coverage

`scripts/verify-bootstrap.mjs` gained:

- four additional required files: the local SOP and the three public planning slots;
- **distinct** diagnostics — “missing or empty local implementation SOP” and “missing or
  empty tracked planning slot” — instead of one generic message;
- a WIP inventory guard: if `.documents/WIP` exists, only the three plan files and the
  private order may be present. Any other file or subdirectory fails;
- an explicit refusal of a `.gitignore` that screens the whole `.documents/WIP` directory;
- a widened public-document scan covering the SOP and the three plans.

Critically, the private ACTIVE order is **never required and never read**. A hosted CI
checkout legitimately contains only the three plan files, and both environments pass —
proving the CI path does not depend on a private file.

`tests/bootstrap.test.mjs`: the disposable fixture now materialises the four new files with
public-safe content, and four genuine refusal tests were added — missing SOP, missing
planning slot, whole-directory WIP ignore, and an unexpected extra WIP entry.

| Suite | Result |
| --- | --- |
| Original 15 U00 tests | preserved, assertions unchanged, all pass |
| Real-root validation test | passes (with the private order present locally) |
| New refusal tests | 4 added, all pass |
| **Total** | **19 tests, 19 pass** on both local hosts and both CI jobs |

The validator remains a **U00 scaffold validator**. It has not been reclassified as a
future U01 product acceptance gate, and it must be refactored under a later Owner-issued
U01 order before any source extraction.

## 7. Hosted CI

| Fact | Value |
| --- | --- |
| Workflow | `Uno Bootstrap Verify` (`.github/workflows/verify-bootstrap.yml`, unmodified) |
| Run | `43686478795` |
| Head | `075baf6e89fabf91daf90c907e86f5eba39842fe` |
| `verify (windows-2025)` | **success** — every step green |
| `verify (ubuntu-24.04)` | **success** — every step green |
| Node | 24 on both jobs (the authoritative matrix) |
| URL | <https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43686478795> |

Both jobs ran `node --test tests/bootstrap.test.mjs` (19/19) and
`node scripts/verify-bootstrap.mjs` (OK, 11 files) on a checkout that does **not** contain
the private order.

This report is published by one further report-only commit on `main`. That commit triggers
the identical workflow on the same two hosts; because a commit cannot contain its own SHA,
its exact SHA and both job results are reported in the chat handoff that accompanies this
publication.

## 8. Upstream pin, licence and rights

| Fact | Value |
| --- | --- |
| Upstream pin | `provelopment/provelopment-foundation` at committed `fa599973a88ff77f6a8e012f3266c3c139b52c17` — unchanged |
| Local template `main` / `origin/main` | both `fa599973…` — agrees with the pin |
| Local template checked-out HEAD | `8789a45…` on its own unmerged branch, dirty — **preserved read-only**, never used as evidence |
| `LICENSE` | Apache-2.0, blob `d6456956…`, byte-identical to upstream — **unchanged by this run** |
| Files copied from upstream in R03 | **none** |

Rights findings are unchanged and still open: brand assets, product prose, third-party icon
sets and the separate connect-module licence remain subject to provenance and licence review
before any reuse. Apache-2.0 grants software rights, not trademark rights. Nothing from any
of those categories was copied.

## 9. Canonical Drive documentation — honestly `UNVERIFIED`

The seven canonical Uno documents (`AGENTS.md`, `SOP-ARCHITECT.md`, `SOP-IMPLEMENTATION.md`,
`README.md`, `PLAN.md`, `BLUEPRINT.md`, `WIP.md`) live in the Architect-maintained Drive
folder and were **not read**: this environment has no Drive connector. No claim is made
about their content, and none of their content is reproduced here. `AGENTS.md` states this
limitation openly, and the local SOP is written to be self-sufficient precisely because the
Drive records are unavailable to an offline agent.

The Architect alone maintains those documents.

## 10. Cleanup and containment

| Item | Result |
| --- | --- |
| Task-owned scratch | `.temp/` used only; the staging helper and WSL verification script were deleted after use |
| Retained scratch | none |
| `.temp/` contents at hand-off | only disposable files, all Git-ignored |
| Working checkouts | exactly **one** Uno checkout, one worktree; no second clone, fork, branch or nested repository |
| Uno working tree | clean after the code commit |
| Parent repository | not pushed; Owner-owned Agency edit preserved |
| U01 / merge / release / deploy | **none performed** |

## 11. Remaining Owner architecture decisions

These are unresolved by design and were **not** decided by inference. U01 cannot begin until
the Owner accepts them (inventory §11):

1. `presentationSiteCode` fate — alias, per-binding selector, or removed.
2. `siteMode: open | closed` fate — kept, collapsed, or deleted.
3. Locale set — one, two, or configurable.
4. Content-root shape — EFS-style tree or a flatter Uno-owned shape.
5. Generated-vs-committed asset boundary.
6. Connect dependency — external pin, minimal vendored path, or none.
7. Analytics — provider-neutral interface or none.
8. Dependency/version pinning versus upstream's exact pins.
9. `src/core` breadth — which audited domain primitives are actually needed.
10. Test strategy — port upstream suites or write a fresh minimal suite.

Also open for the Owner: whether to push the local parent commit to the parent's remote. This
run deliberately left it local.

## 12. Acceptance matrix

| Contract | Mark | Evidence |
| --- | --- | --- |
| Existing real-root and all 15 original U00 bootstrap tests | `PASS` | 15 original assertions unchanged; 19/19 green on both local hosts and both CI jobs (§5, §6, §7) |
| New local SOP and three planning slots | `PASS` | Four files created, all validated in fixtures and in the real root (§4) |
| Missing SOP refused in its own test | `PASS` | Dedicated refusal test with its own diagnostic (§6) |
| Missing planning file refused in its own test | `PASS` | Dedicated refusal test naming `plan-roadmap.md` (§6) |
| `.gitignore` ignoring all of WIP refused | `PASS` | Dedicated refusal test; validator also refuses the pattern in the real root (§6) |
| Extra WIP file/subdirectory refused | `PASS` | Dedicated refusal test plus inventory guard (§6) |
| Owner ACTIVE ignored, three plans tracked | `PASS` | Verified by real `git ls-files`, `check-ignore` and `ls-files --error-unmatch` (§4.1) |
| Alternate root order / wrong R03 path | `PASS` | No root-level order exists; canonical R03 verified by hash. §2A was the one authorised exception to the earlier missing-guard stop (§1, §3) |
| Parent guard effective from the parent root | `PASS` | `.gitignore:138`, exit 0, `??` entry gone; local commit recorded (§3.5) |
| `origin` only Uno, one worktree, clean final tree | `PASS` | Single remote and single worktree; clean tree after commit (§2, §10) |
| Foundation source/template unmodified by this agent | `PASS` | Template HEAD, branch and dirty count unchanged; `main` still `fa599973…` (§4.2, §8) |
| Parent changed only by the isolated `.gitignore` rule | `PASS` | One line, one commit, no push; Agency hunk byte-identical and uncommitted (§3) |
| Actual Uno website / Next build / TypeScript / browser | `NOT APPLICABLE` | No application exists at U00; never reported as passing (§5.3) |
| Canonical Drive documents read and reconciled | `UNVERIFIED` | No Drive connector in this environment (§9) |

## 13. Outcome

**`COMPLETE`.**

The parent guard that blocked R02 is now installed and verified from the parent's own root
ignore file, with a preserved, unpushed, single-rule local commit. The Uno repository at
`1ae2899…` was preserved and corrected with a four-slot WIP discipline, a self-contained
local implementation SOP, a strengthened `AGENTS.md`, a corrected public-versus-upstream
inventory clarification, and a validator plus test suite that enforces all of it on both
hosts.

Nothing was merged, released or deployed; U01 was not started; the private order was never
staged or published; the Foundation reference, the parent beyond the one authorised rule, and
every sibling repository are intact.
