# UNO-WO-030 / R01 — Fixture recovery armed before the first write; U03 publication proof re-verified

**Work order:** `UNO-WO-030 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 19,535 bytes, SHA-256 `e83ec71688a3744de080ef020325cda5cb1f5469d7c8bac418717145f9a31c8e`, heading
`UNO-WO-030 / R01 — U03 publication transaction safety and end-to-end conformance`; verified byte-for-byte before any
write; ignored, untracked, unstaged, never printed, never staged.
**Push authorization:** the activation contains `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
**Required start = actual start:** `dce99c67b762d5ab0c6f524264c8e67d2ebcbbbb`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `RECOVERY_DEFECT_CLOSED` | **FIXED** | intent is recorded before each write and recovery is armed before the first destructive action, so no failure position can leave a modified declaration without a rollback path |
| `WRITE_POSITION_COVERAGE` | **PASS** | a fault at **every** write position — before the first write, after the manifest, after the config, and at each of the five fixture creations — restored the exact original bytes |
| `FAIL_CLOSED_RESTORE` | **PASS** | a restore that cannot write reports failure, preserves both recovery copies and never claims success; the same transaction verifies and cleans up once the fault is removed |
| `NO_UNKNOWN_DELETION` | **PASS** | a pre-existing file at a planned fixture path is refused and survives byte-for-byte; only transaction-created files are ever removed |
| `CONTAINMENT` | **PASS** | `lstat` (not `existsSync`) proves each source absent, so a dangling link cannot masquerade as absent; a symlinked parent is refused |
| `WARNING_INTERCEPTION_REMOVED` | **DONE** | `process.on('warning', …)` is gone; the gate consumes no warning event and no stderr |
| `POSITIVE_PROOF_PRESERVED` | **PASS** | four published Pages **200**, `/en` **307**, canonical/OG/`hreflang`, `robots.txt`, `sitemap.xml`, `/` demonstration, ten strict **404**s — 195 checks |
| `BASELINE_PRESERVED` | **PASS** | unit 733/733, architecture **41/41**, U01 HTTP **103/0**, U03 HTTP **91/0**, brand 29/29, security 16/16, readiness 101, fixtures 69/69, fault injection 19/19 |
| `COMMITTED_UNPUBLISHED` | **PASS** | both declarations at their pinned blobs; no `publication`, no base; `deployment/**` clean |
| `HOSTED_CI` | **PASS** | product head: 4 jobs `success`, **27** steps, 0 failures; report head repeated below |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, deployment, alias, domain or setting change |
| `STAGE` | U03 **OPEN** | no origin, no permanent publication, no browser/accessibility/crawler proof, no U04 renderer |

## 2. Commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`cc4b4698eee474ec717fd7dffea8d8d4ebb716e7`** | exactly the eight product ledger operations; direct child of `dce99c6` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Op | Path | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | CREATE | `scripts/uno-u03-fixture-transaction.mjs` | ABSENT → `b602062b…` | 13,641 |
| 2 | EDIT | `scripts/verify-u03-published-http.mjs` | `3c56a603…` → `46b74a7c…` | 33,879 |
| 3 | CREATE | `tests/deployment/u03-fixture-transaction.test.mjs` | ABSENT → `369f6574…` | 19,739 |
| 4 | EDIT additive | `.github/workflows/verify-u01.yml` | `d37bcc4f…` → `edf50313…` | 6,214 |
| 5 | EDIT additive | `tests/architecture/u01-boundaries.test.mjs` | `4194e920…` → `08220578…` | 58,448 |
| 6 | EDIT evidence | `.documents/Architecture/source-inventory.md` | `f8e8f0a7…` → `a8842294…` | 126,274 |
| 7 | EDIT U03 lines | `.documents/WIP/plan-roadmap.md` | `9ffc7fc4…` → `b9783bbb…` | 10,256 |
| 8 | OVERWRITE | `.documents/WIP/plan-next.md` | `2e6318f9…` → `608ab4f0…` | 1,955 |

No route, component, core rule, application use case, declaration, content file, Next configuration, dependency or
provider setting changed. The workflow gained one blocking step and lost none.

## 3. Guards (agent-reported, sanitized)

| Guard | Result |
| --- | --- |
| ACTIVE | 19,535 bytes, digest and heading matching the activation; ignored, untracked, unstaged, absent from every diff |
| Physical root | the single Uno checkout resolved physically; no symlink, junction or reparse alias on the checkout, its ancestors or any fixture/scratch target |
| Parent and siblings | parent-owned anchored `/00.foundation-uno/` ignore rule unchanged; parent, Foundation, Solo and every sibling read-only |
| Git | one worktree, `main`, one fetch/push remote `origin`, no mirror; remote re-read immediately before the push and unchanged |
| Head | `HEAD` = `origin/main` = `dce99c6` at start; product head `cc4b469` pushed non-force |
| Pins | **30 / 30** immutable anchors byte-identical; **7 / 7** editable sources matched their start blobs; both CREATE destinations untracked before the write |
| Runtime | Node 26.13.1, pnpm 11.6.0; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 4. The recovery defect and its fix

**The defect.** `installFixture()` performed every destructive write and only afterwards did the caller set
`installed = true`. An exception inside that window left the declarations modified with recovery disarmed, and the
`finally` then deleted the scratch backups — the only copies of the originals.

**The fix.** `prepareUnoU03FixtureTransaction()` returns an **armed** transaction before anything is touched:

1. **Preconditions, before any mutation.** Physical root and every target proven by walking each component with `lstat`
   and comparing `realpath`; each declaration's SHA-256 compared with its pin; each fixture source proven absent with
   `lstat` so a dangling link cannot look absent; a unique scratch directory created with `mkdtemp`.
2. **Verified recovery copies.** Both complete original buffers are written to scratch with an exclusive create and
   re-read to confirm the digest.
3. **Armed installation.** `install()` records its intent *before* each write, so a throw during a write is covered;
   the two declarations are replaced and the five sources are created with the exclusive `wx` flag, never overwriting an
   unexpected file. Any failure rolls back in place and returns the original exception's name.
4. **Idempotent, verifying restore.** `restore()` rewrites the original bytes, re-checks each digest and size, removes
   only files this transaction created (reversed) and confirms each is gone. Success is reported once; repeats are
   `idempotent`. Failure sets `preserveScratch`, reports bounded path-free reasons and never claims success — and
   `dispose()` refuses to delete unverified scratch.
5. **Bounded reporting.** `describe()` exposes counts and outcomes only: no path, byte or secret.

The positive runner now uses this module for every mutation, arms before its first write and calls `restore()` in an
unconditional `finally`, then `dispose()` only when that restore verified. Its own blanket
`process.on('warning', …)` interceptor was removed, so no warning event or stderr is silently consumed.


## 5. Test evidence

| Gate | Result |
| --- | --- |
| Fixture-transaction fault injection (`node --test …u03-fixture-transaction.test.mjs`) | **19 / 19** named subcases, 0 failed |
| Positive/negative production HTTP (`verify-u03-published-http`) | **195 passed, 0 failed**, exit 0 |
| Original U01 HTTP, re-run inside that gate after restoration | **103 passed, 0 failed** |
| Original U03 fail-closed HTTP, re-run after restoration | **91 passed, 0 failed** |
| `pnpm test` | **733 / 733**, 23 files |
| `pnpm test:architecture` | **41 / 41** (one new boundary assertion) |
| `pnpm test:bootstrap` / governance docs | **19 / 19** / PASS, **9 / 9** |
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | exit 0 / exit 0 / PASS |
| readiness fixtures / CLI | **69 / 69** / **101 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | **16 / 16** / **29 / 29** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean |

**The nineteen fault-injection subcases.** happy-path install and restore; idempotent repeated restore; wrong original
digest refused; a pre-existing fixture path refused with the unknown file's bytes intact; a dangling symlink at a
fixture path; a symlinked parent directory; an absent scratch root; write faults at positions 1–7 (before the first
write, after the manifest, after the config, and at each of the five creations, each asserting the exact attempted
write sequence); a caller exception after a complete install; a second transaction refusing a mid-fixture root; a
restore that cannot write failing closed with both backups retained and the scratch preserved, then succeeding and
cleaning only transaction-owned scratch once the fault is removed; scratch hygiene across a case; and the module's
single-entry-point surface refusing an unauthorised call. Both symlink subcases report `NOT APPLICABLE` on a host
without symlink privilege while the remaining seventeen still execute; this host supports them, so all nineteen ran.

**Real HTTP statuses re-proved.** `/en-001`, `/de-de`, `/en-001/about`, `/de-de/about` **200** with the authored title,
one `h1`, `lang` = `en-001`/`de-DE`, exact canonical and OG URLs and correct alternates; `/en` **307** to
`http://localhost:3000/en-001`; `/robots.txt` **200** `text/plain`; `/sitemap.xml` **200** `application/xml` with four
`<loc>` entries and one `x-default`; `/` **200** with the unchanged demonstration; ten refused addresses each **404**
with no redirect and no advertised link. In the committed configuration every localized address is still a **404**.

**Warnings, classified.** Two **moderate** advisories remain — the same dev-only `minimatch` family reachable only
through ESLint; zero high and zero critical is what the blocking gate reports. Node's benign "typeless package.json"
notice still appears because the gate now deliberately does **not** intercept warnings; it is reported here rather
than consumed. Turbopack's "dynamic filesystem access" tracing notice for the serving composition is expected: that
module reads the fixed declarations by design.


## 6. Hosted CI

**Product head `cc4b4698eee474ec717fd7dffea8d8d4ebb716e7` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `44041104690` | success | success | **27** / **0** |
| Uno Bootstrap Verify | `44041104618` | success | success | 10 / **0** |

The new blocking `node --test tests/deployment/u03-fixture-transaction.test.mjs` step runs before
`node scripts/verify-u03-published-http.mjs` on both hosts, so recovery is proved on Linux and Windows. No prior step
was removed, skipped, muted or made non-blocking; the bootstrap workflow is byte-identical. Actual log **text** is
**UNVERIFIED** — this client reads job and step conclusions only. The report head repeats both workflows; its run IDs
are returned privately to the Owner.

## 7. Rights, privacy and cleanup

**Provenance.** All new and changed files are original **Uno-owned** work, class `NEW` / `REWRITE`; the pinned
read-only Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains comparison context with **no
code, fixture, asset or mark copied**. No dependency, SDK, secret or licence changed; Apache-2.0 notices, the brand
ledger, the public/internal facts, unlisted non-discovery and the 17-family / 22-module obligations are intact and
explicitly **not** delivered by this order.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or fixture publication content appears in the
product commit, the workflow, CI output or this report. The transaction reports bounded reason tokens only. The
test-only base stays the literal `http://localhost:3000` and was never committed: `deployment/efs/manifest.json` and
`deployment/uno.config.json` are at `84866290…` and `fda8188c…`, the Home source at `ef4254a3…`.

**Provider actions: zero.** No provider API call, deployment, promotion, alias, domain or settings change; the only
external effect was the authorized non-force Git push and any build the existing Git integration starts from it.

**Cleanup.** Task-owned `.temp/` scratch removed; no `wo030-*` directory or fixture file survives; `.next`,
`node_modules` and the package store stay ignored; no unknown file was deleted; the tree is clean at the product head;
the private ACTIVE remains ignored and unstaged.

## 8. U03 remains open

After this correction the remaining Owner decisions are, once each: the real HTTPS canonical origin; which real
authored Pages may be `published`; whether and when the protected `/` demonstration is replaced or retired; and whether
a rebuild-to-publish operation is approved, since a published address exists only after a build enumerates it. Full
browser, accessibility and crawler proof, and JSON-module rendering (U04), are **not** claimed. This order does not
close U03.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`**: one armed transaction that closes the
recovery window, nineteen fault-injection subcases covering every write position and the fail-closed path, the warning
interceptor removed, the positive publication surface re-proved unchanged at 195/0 with the original 103 and 91
fail-closed checks green afterwards, 733 unit and 41 architecture checks passing, four hosted jobs successful on Ubuntu
and Windows, zero provider actions, and the committed deployment still unpublished.
