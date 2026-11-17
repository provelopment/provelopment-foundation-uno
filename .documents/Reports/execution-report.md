# UNO-WO-031 / R01 — Fixture ownership is the exclusive create plus its bytes; U03 publication proof re-verified

**Work order:** `UNO-WO-031 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 21,681 bytes, SHA-256 `d8d1e1a2579fd6a8970dc274baee28538b96c6dc616a7425baa64efb34c8dea8`, heading
`UNO-WO-031 / R01 — Close fixture ownership race; finish U03 local publication assurance`; verified byte-for-byte,
ignored, untracked, unstaged, never printed, never staged.
**Push authorization:** the activation carries `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
**Required start = actual start:** `3b084911f5d375ba22ee8a4e5c92de796004a89c`.

## 1. Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| 1 · Intervening `EEXIST` preserves the stranger | **PASS** | the competitor's bytes *and* device/inode survive; install fails; both declarations restore byte-for-byte; nothing is reported as owned |
| 2 · Post-claim partial write removes only its own file | **PASS** | ownership is recorded from the granted handle before any content byte, so the owned partial file is removed and no declaration or fixture remains modified |
| 3 · Replaced file fails closed | **PASS** | the replacement survives; restore refuses; both recovery copies stay; `dispose()` refuses; no absolute path in the diagnostic |
| 4 · Prior coverage retained | **PASS** | all 19 earlier cases still pass; the seven write positions, five preflight refusals, restore failure and recovery, idempotence, symlink/junction guard and the happy path all assert real bytes and real identity |
| 5 · Component-aware containment | **PASS** | a sibling whose name extends the root, a literal `..` traversal and a duplicate/colliding declaration are refused before mutation; the root must be its own canonical directory |
| 6 · Publication HTTP retained | **PASS** | **195 / 0** positive checks, then the original **103 / 0** and **91 / 0** fail-closed gates after exact restoration and rebuild |
| 7 · Every existing gate blocking on both hosts | **PASS** | product head: 4 jobs `success`, **27** steps each, 0 failures; report head repeated in §7 |
| `COMMITTED_UNPUBLISHED` | **PASS** | `deployment/efs/manifest.json` `84866290…`, `deployment/uno.config.json` `fda8188c…`, `deployment/efs/content/home.en-001.md` `ef4254a3…` |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, deployment, alias, domain or setting change |
| `STAGE` | U03 **OPEN** | no origin, no permanent publication, no browser/accessibility/crawler proof, no U04 renderer |

## 2. The defect and its correction

**The race.** `install()` pushed each planned fixture path into its removal set and *then* attempted the exclusive
create. Exclusive creation is the only moment the OS can tell this transaction "yes, this file is yours": if an
unrelated file appeared after preflight, `wx` failed `EEXIST` and the rollback nevertheless unlinked that stranger. A
second, independent weakness was containment by string prefix, which accepted a sibling such as `<root>-other`.

**Ownership is now the granted handle.** `install()` opens each fixture with `wx`; only a returned handle produces a
record. The record carries the device/inode pair read by `fstat()` from that handle, captured *before* the content
write and written through the same handle, so a partial write is still an owned file while a refused create claims
nothing at all.

**Removal needs identity *and* bytes.** The first CI run of this order proved why identity alone is insufficient: on
Ubuntu the ownership suite failed at the replaced-file case because ext4 handed the just-freed inode straight back to
the replacement, so the stranger carried the same device/inode pair. `restore()` now also requires the file to hold
exactly the bytes this transaction wrote there (or, after a partial write, the bytes it read back from its own handle).
A reused inode with foreign content, a link, an unprovable identity or unreadable content all fail the restore closed:
`preserveScratch`, both recovery copies kept, `dispose()` refused, bounded reasons with no absolute path. `prepare()`
proves the platform can even distinguish two files at one path and refuses with `identity:unprovable` rather than ever
unlinking by pathname alone.

**Containment is component-aware.** `componentsWithin()` uses `path.relative()` from the verified root and rejects
empty, absolute or `..`-bearing results before the physical `lstat`/`realpath` walk; the root itself must exist, be a
directory, and be its own canonical path. Duplicate fixture paths and any fixture colliding with a declaration are
refused.

**No independent mutation remains.** The runner delegates all seven temporary writes and every restoration to the
sanctioned helper, arms it before the first destructive action, restores in an unconditional `finally`, disposes only a
verified scratch, and carries no warning interceptor. Outdated comments promising unconditional cleanup of unverified
files were replaced with the actual ownership rule.

## 3. Commits and the exact path set

| Role | Commit | Content |
| --- | --- | --- |
| Product (1) | **`f4f28c9a51b233f9c3efd3635101b54b6451178f`** | the seven ledger paths; direct child of `3b08491` |
| Product (2) | **`4473fef8aa8393cd72c3ad5410de3cb43d3d064e`** | the POSIX ownership repair in four of those same paths; direct child of (1) |
| Report | the report-only child of (2); its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

**Why two product commits, stated plainly.** The first exact-head run was **red and is not claimed as a success**:
[run 44044669226](https://github.com/provelopment/provelopment-foundation-uno/actions/runs/44044669226), job
`verify (ubuntu-24.04)`, step 20 `Run fixture transaction fault injection`. Diagnosis: ext4 reuses a freed inode for the
next file at the same path, so device/inode identity alone could not distinguish this transaction's file from a
replacement — the real defect the order's criterion 3 exists to prevent. The fix is content as a second independent
proof. Amend, rebase, reset and force-push are forbidden by the order, so the repair is an ordinary forward commit on
the same branch and the same ledger; nothing was weakened, skipped or re-run to green.

| # | Op | Path | Start blob → final blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | EDIT | `scripts/uno-u03-fixture-transaction.mjs` | `b602062b…` → `902ca69c…` | 21,900 |
| 2 | EDIT | `tests/deployment/u03-fixture-transaction.test.mjs` | `369f6574…` → `5dcb9ed1…` | 32,207 |
| 3 | EDIT | `scripts/verify-u03-published-http.mjs` | `46b74a7c…` → `2b98dab3…` | 34,193 |
| 4 | EDIT | `tests/architecture/u01-boundaries.test.mjs` | `08220578…` → `d1ff4447…` | 59,778 |
| 5 | EDIT | `.documents/Architecture/source-inventory.md` | `a8842294…` → `84241dab…` | 129,845 |
| 6 | EDIT | `.documents/WIP/plan-roadmap.md` | `b9783bbb…` → `efd582f7…` | 10,174 |
| 7 | OVERWRITE | `.documents/WIP/plan-next.md` | `608ab4f0…` → `3b8b4785…` | 2,018 |

Exactly these seven paths changed across the whole order: no route, page, component, core rule, application use case,
next configuration, dependency, lockfile, workflow or deployment input was touched.

## 4. Guards (agent-reported, sanitized)

| Guard | Result |
| --- | --- |
| ACTIVE | 21,681 bytes, digest and heading matching the activation; ignored, untracked, unstaged, absent from every diff |
| Physical root | the single Uno checkout resolved physically; no symlink, junction or reparse alias on the checkout, its ancestors or any target |
| Parent and siblings | parent-owned anchored `/00.foundation-uno/` ignore rule unchanged; parent, Foundation, Solo and every sibling read-only |
| Git | one worktree, `main`, one fetch/push remote `origin`, no mirror; the remote was re-read immediately before each push and was immobile both times |
| Head | `HEAD` = `origin/main` = `3b08491` at start; `f4f28c9` then `4473fef` pushed non-force; no amend, rebase, reset, tag, PR, merge or release |
| Pins | **31 / 31** immutable anchors byte-identical; **7 / 7** editable start blobs matched |
| Runtime | Node 26.13.1, pnpm 11.6.0; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 5. Test evidence

| Gate | Result |
| --- | --- |
| Fixture ownership + fault injection | **27 / 27** named cases, 0 failed |
| Positive/negative production HTTP | **195 passed, 0 failed**, exit 0 |
| Original U01 HTTP, re-run after restoration | **103 passed, 0 failed** |
| Original U03 fail-closed HTTP, re-run after restoration | **91 passed, 0 failed** |
| `pnpm test` | **733 / 733** |
| `pnpm test:architecture` | **41 / 41** |
| `pnpm test:bootstrap` / governance docs | **19 / 19** / PASS, **9 / 9** |
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | exit 0 / exit 0 / PASS |
| readiness fixtures / CLI | **69 / 69** / **101 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | **16 / 16** / **29 / 29** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean |

**The twenty-seven cases.** The original nineteen — happy path, idempotent repeated restore, five preflight refusals
(wrong digest, pre-existing path with the unknown file intact, dangling symlink, symlinked parent, absent scratch),
write faults at all seven positions, a caller exception after a complete install, a mid-fixture refusal, a restore that
cannot write failing closed and then recovering, scratch hygiene, and the single-entry-point surface — plus eight
ownership cases: an intervening `EEXIST` at the first path; an `EEXIST` at the fifth after four owned files were
created; a partial content write after a granted claim; an owned file replaced before restore; a target in a sibling
whose name extends the root; a literal `..` traversal; a duplicate fixture and a fixture colliding with a declaration;
and a replacement that reuses the freed inode (forced deterministically, so the Ubuntu class of failure is now caught on
Windows too). Each asserts the real bytes and the real device/inode on disk. Both symlink cases keep their
`NOT APPLICABLE` status on a host without symlink privilege, and this host supports them, so all twenty-seven ran.


## 6. Warnings, classified

Two **moderate** advisories remain — the dev-only `minimatch` family reachable through ESLint; zero high and zero
critical is what the blocking gate reports, and the threshold was neither waived nor relaxed. Node's benign
"typeless package.json" notice still appears because the gate deliberately intercepts no warning event and consumes no
stderr. Turbopack's "dynamic filesystem access" tracing notice for the serving composition is expected: that module
reads the fixed declarations by design. No gate, step, matrix entry or `continue-on-error` was added, removed or muted.

## 7. Hosted CI

| Head | Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- | --- |
| `4473fef` (final product) | Verify U01 baseline | `44045454075` | success | success | **27** / **0** |
| `4473fef` (final product) | Uno Bootstrap Verify | `44045454095` | success | success | 10 / **0** |
| `f4f28c9` (superseded) | Verify U01 baseline | `44044669226` | **failure** at step 20 | success | — / **1** |
| `f4f28c9` (superseded) | Uno Bootstrap Verify | `44044669249` | success | success | 10 / 0 |

The final product head is green on both hosts, including the blocking ownership suite before the publication gate, and
so is the bootstrap workflow at the same head. Log **text** is **UNVERIFIED** — this client reads job and step
conclusions only; the failing step above is named from its step conclusion, and its cause was reproduced locally (see
§3). The report head repeats both workflows at the final commit; its run IDs are returned privately to the Owner.

## 8. Rights, privacy and cleanup

**Provenance.** Every changed file is original **Uno-owned** work, class `NEW` / focused rewrite. The pinned read-only
Foundation GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains comparison context with **no code, fixture, asset
or mark copied**. No dependency, SDK, secret or licence changed; Apache-2.0 notices, the brand ledger, the
public/internal facts, unlisted non-discovery and the 17-family / 22-module obligations are intact and **not** delivered
by this order.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or fixture publication content appears in
either product commit, the workflow, CI output or this report. Refusals and diagnostics carry bounded reason tokens and
relative task-owned names only; a test asserts the diagnostic contains no absolute path. The test-only base stays the
literal `http://localhost:3000` and was never committed.

**Provider actions: zero.** The only external effect was the authorized non-force Git push and whatever build the
existing Git integration starts from it.

**Cleanup.** Task-owned `.temp/` scratch removed; no `wo029-*`, `wo030-*` or `wo031-*` fixture or scratch survives; the
three committed deployment inputs are at their pinned blobs; no unknown file was deleted; the tree is clean at the final
product head; the private ACTIVE remains ignored and unstaged.

## 9. U03 remains open — four Owner decisions

1. The **real HTTPS canonical origin** to declare as the base.
2. **Which real, named authored Pages** are approved to publish.
3. **Whether and when the protected `/` demonstration** may be replaced or retired.
4. Whether **build-time publication / rebuild-to-publish** is the accepted operational model, since a published address
   exists only after a build enumerates it.

Proofs a localhost fixture cannot supply remain unclaimed: a live HTTPS origin, real browser and accessibility
behaviour, crawler behaviour, and public provider verification. U04 JSON module/rendering and 17 → 22 family coverage
remain future approved obligations, not permissions in this order.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`**: exclusive creation as the only
ownership boundary, identity *and* byte-level proof before any removal, a stranger's file never deleted, a replacement
failing closed with its recovery copies kept, component-aware containment, twenty-seven ownership and fault cases, the
publication surface unchanged at 195/0 with the original 103 and 91 fail-closed checks green afterwards, 733 unit and 41
architecture checks passing, four hosted jobs green on Ubuntu and Windows at the final product head, zero provider
actions, and the committed deployment still unpublished.
