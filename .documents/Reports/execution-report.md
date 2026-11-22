# Execution Report — UNO-WO-079 / R01

**DELIVERED — ONE-FILE PORTABILITY CORRECTION, BOTH HOSTED WORKFLOWS GREEN AT THE PRODUCT HEAD**

This document replaces the previous contents of this path under one Owner-authorized overwrite. It records a completed,
narrowly bounded corrective order that made the durable family prefix proof independent of Git history. It is not an
Architect acceptance, a WO-078 acceptance, a stage closure, a release or a deployment.

## 1. Authority and starting point

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-079 / R01`, Edition `FINAL — EXECUTE`, repair of the shallow-checkout durability verification after the WO-078 hosted STOP |
| Owner activation identity | ACTIVE `.documents/WIP/workorder-active.md` measured **28,130 bytes**, SHA-256 `d156595fea8df279e4888f6eb18ebcef28e585ce20f9863540db37d0be6f9179`; the installed private file, its order ID, edition, start SHA, byte count and digest all matched the Owner activation. Its text and the activation message are deliberately not reproduced. |
| Required start | `5a089c94de0b11a2c51f76cd34dafbd9ac91522a`, matched by local `HEAD`, local `main`, `origin/main` and the remote `main` ref before any write |
| Prior report blob | `c6591aa6b0066f169bd6548276b16ebf064df465`, the required start value |
| Product commit | **`5835735d3c153bfd6fe9ab51b53444c13f50de3a`**, parent exactly `5a089c94…`, subject `UNO-WO-079 / R01: make durable family prefix proof shallow-safe`, **one** tracked path changed |
| Product-head hosted result | `Verify U01 baseline` run `44986944413`: **success** on `ubuntu-24.04` and `windows-2025`. `Uno Bootstrap Verify` run `44986944404`: **success** on both. Jobs, steps 25–32 and step logs were inspected, not badges. |
| Agent-observed local conditions (not independently certified) | the authorized physical checkout and every inspected ancestor resolve to one physical location with no junction, symlink or reparse escape; the parent-owned anchored ignore entry is present and unmodified; exactly one worktree, one local `main` tracking `origin/main`, one remote resolving only to the Uno repository; clean index and worktree before the product commit and after it; no stash, no conflict, no hook override and no active hook; `.documents/WIP/` held exactly the three tracked plan files plus the one ignored private ACTIVE |
| Pins | all **30** pinned Git blobs of this order (T01, R01 and Q01–Q28) matched at the required start and again in the final tree; the seven pinned donor evidence blobs and the Apache-2.0 `LICENSE` blob `d6456956…` at donor commit `c05c55ea…` were read-only and unchanged |
| Immutable filesystem evidence | manifest SHA-256 `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`; selected Site SHA-256 `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952`; re-verified after every stateful runner and before staging |
| Toolchain | committed Node `26.13.1`, pnpm `11.6.0`, Next `16.4.6`; repo-local Playwright browser cache; no install, dependency, lockfile, workflow or configuration change |

## 2. The correction (exactly one tracked file)

`scripts/verify-u03-published-http.mjs` only: **+16 / −8** lines in two hunks, both inside the durable family proof.

1. The provenance constant `DURABLE_PREFIX_BLOB = "f215b094…"` is replaced by an independent historical literal
   `DURABLE_PREFIX_SHA256 = "bbc5416a5b8e2f1f8b419e33bb535de1ef283a9a777764e16562b975c6bd1901"` — the SHA-256 of the
   six original sections as they serialized before the family work. The predecessor blob is now named only in a
   comment; nothing in the predicate reads Git.
2. The runnable predicate now computes
   `createHash("sha256").update(JSON.stringify(page.sections.slice(0, 6))).digest("hex")` from the committed Page, using
   the already imported `createHash`, and compares it with that literal, under the **unchanged exact label**
   `DURABLE_FAMILY_SOURCE the six original sections still equal the starting committed blob`.

The label appears exactly once; the six-id assertion, the 23-section assertion and the exact seventeen composed-suffix
assertion are untouched; `spawnSync` remains imported and used by its seven other, unrelated checks; no environment
variable, shallow-checkout branch, catch-and-pass, skip, fallback or self-derived expectation was introduced, and the
digest is never recomputed from the Page to become its own oracle. The new lines are UTF-8/LF and `git diff --check` is
clean.

## 3. Positive and negative proof of the new predicate (read-only, in-memory)

| Case | Digest | Predicate |
| --- | --- | --- |
| The committed six sections, unchanged | `bbc5416a5b8e2f1f8b419e33bb535de1ef283a9a777764e16562b975c6bd1901` | **true** (equals the pinned literal) |
| Exactly one first-six section's text changed in memory | `a7156eee0abe0087490a5d8d483cdcb500eb99f1fb162a17c9e6a517c0c3b020` | **false** |
| The same six sections reordered | `c9db9b6b84d082aa9b305cbd3ba195b5ff9dea01923ef1bd9afe50725fec95e5` | **false** |

The probe ran in ignored task scratch, mutated nothing on disk, and re-read the committed Page afterwards to confirm it
still holds the same six sections and 23 top-level sections. A changed prefix can therefore never satisfy the check, and
a missing historical Git object can no longer fail it.

## 4. Local evidence (Agent-observed, Windows, this checkout)

| Gate | Result |
| --- | --- |
| `pnpm exec vitest run tests/unit/uno-foundation-families.test.ts` (Q01, read-only) | PASS — **190** tests |
| `node --test tests/deployment/u04-22-module-consent.test.mjs` (Q02, read-only) | PASS — **46** tests, including the three durable label/predicate mutation audits |
| `node --test tests/deployment/u03-trace.test.mjs` | PASS — 28 tests |
| `pnpm test:bootstrap`, governance test, `verify-governance-docs`, `pnpm test:architecture` | PASS |
| `pnpm typecheck`, `pnpm lint`, `pnpm exec eslint . --max-warnings 0` | PASS — no errors, no warnings |
| `pnpm test` | PASS — 30 files, **1,128** tests |
| Eight deployment suites, `verify-vercel-readiness`, `verify-u04-security-exception` | PASS, offline |
| `node scripts/verify-u03-published-http.mjs` | PASS — **977 passed, 0 failed**; labels executed: `DURABLE_FAMILY_SOURCE` 14, `DURABLE_FAMILY_REFUSALS` 22, `DURABLE_FAMILY_HTTP` 29, `DURABLE_FAMILY_MEDIA` 26, `DURABLE_FAMILY_BROWSER` 126, `DURABLE_FAMILY_RESTORE` 5 |
| `node scripts/verify-u04-json-slice.mjs` | PASS — **464 passed, 0 failed** |
| `node scripts/verify-u04-22-module-consent.mjs` | PASS — **733 passed, 0 failed**, `FAMILY_BROWSER` and `DIVIDER_PARITY` pass |
| `pnpm build` and `node scripts/verify-u03-trace.mjs --expect committed` | PASS — bounded trace, no new asset entry |
| `pnpm test:http` / `node scripts/verify-u03-http.mjs` | PASS — **105** and **135** passed, 0 failed |
| Post-run digests | unchanged: manifest `b6213ed6…`, selection `58011c43…`, Components Page file SHA-256 `31f9adac…`, plate `25bde641…`, fixtures `a4bde851…` / `f2c8696c…` |

## 5. Product-head hosted evidence (independently inspectable)

| Item | Ubuntu 24.04 | Windows 2025 |
| --- | --- | --- |
| `Verify U01 baseline` (run `44986944413`) job | success | success |
| Step 27 `Run production HTTP and browser (U03 published Pages, restored afterwards)` | success | success |
| `verify-u03-published-http` | **977 passed, 0 failed** | **977 passed, 0 failed** |
| Steps 28–32 (`U04 A1 JSON Page vertical slice`, `U04 22-module consent hermetic guard`, `U04 22-module and four-provider consent`, `Deployment readiness fixtures`, `Deployment readiness`) | all success, none skipped | all success, none skipped |
| `verify-u04-json-slice` / `verify-u04-22-module-consent` | 464/0 and 733/0 | 464/0 and 733/0 |
| `verify-u03-http` / `verify-u01-http` | 135/0 and 105/0 | 135/0 and 105/0 |
| Browser and parity labels | `BROWSER_MATRIX=16/16`, `FAMILY_BROWSER=PASS`, `DIVIDER_PARITY=PASS` | same |
| Durable labels executed (per OS) | SOURCE 14, REFUSALS 22, HTTP 29, MEDIA 26, BROWSER 126, RESTORE 5 | same |
| `Uno Bootstrap Verify` (run `44986944404`) | success | success |

No `FAIL` line appears in either job log, and the shallow hosted checkout is exactly the condition the corrected
predicate now tolerates: the required portability proof is hosted, not local.

## 6. Immutable product data, rights and privacy

No deployment declaration, Page, source fixture or asset changed under this order. The committed Components Page stays
at Git blob `91d2750c9d0692e7a71b60dd4da0569b6d08afb2` (23 sections: six native, seventeen bounded family samples), the
durable source and bindings at `efadae06…` and `5f0b6cf9…`, the Page-owned plate at `70477a24…` (191 bytes, SHA-256
`25bde641ce447275f7eff9d03859d07062ae34f9e3597eff18cf07bb384eae47`), and manifest/selection at their pinned blobs and
digests. Exactly three published `en-001` Pages remain, the reserved `https://uno-starter.example` canonical stays
illustrative and non-live, and the undeclared legacy Home Markdown is still not a fallback.

Donor reference remains the pinned read-only `provelopment/provelopment-foundation` commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` with Apache-2.0 `LICENSE` blob
`d645695673349e3947e8e5ae42332d0ac3164cd7`; only concepts were consulted at the seven pinned blobs and nothing was
copied. No private machine path, profile or home directory, personal identifier, credential, token, secret, ACTIVE text
or activation message appears in this report, the commit subject or any changed file. No release, tag, merge, history
rewrite or purge, settings/visibility change, provider or network operation, domain/DNS/TLS action or deployment
occurred, and no real domain is claimed.

## 7. Prior orders, accounting and remaining warnings

`UNO-WO-071` activation evidence stays unresolved; `UNO-WO-072` privacy/report and `UNO-WO-073` write-ledger remain
`REVISE`; `UNO-WO-076` remains STOP/`REVISE`; `UNO-WO-078` remains `REVISE` with its product head `e04399d…` and report
head `5a089c9…` **red** on both operating systems at `66 passed, 1 failed` with downstream stages skipped, while its
`Uno Bootstrap Verify` runs were green. Those historical results are recorded here unchanged and are **not**
retroactively accepted or turned green; this order is a separate correction.

Accounting is unchanged: **22/22** registered modules, **4/4** asset zones, **16/16** browser matrix, **17/17** bounded
family mappings, **1/17** accepted full parity (`divider`) and **43/59 = 72.88%** proxy. The committed durable
Components sample is bounded evidence, not parity. U04, U05, U06 and U07 remain **OPEN**; no stage closure, release or
deployment follows from this order.

**Historical private-path exposure: unresolved — Owner decision required.** The moderate development dependency advisory
remains unwaived, the production dependency graph audits clean, and the Windows `DEP0190` deprecation warning remains a
known, reported warning in this environment.

## 8. Report-head state

| Item | Status |
| --- | --- |
| Report overwrite count | **1** (`R01_WRITE_COUNT=1`), from this fully prevalidated ignored-scratch draft |
| Frozen bootstrap, governance and privacy gates re-run against this new report | PASS locally before the report-only commit |
| Report-head `Verify U01 baseline` / `Uno Bootstrap Verify` on Ubuntu and Windows | **PENDING at write time** — deliberately not predicted in this document |
| Architect `ACCEPT / REVISE / STOP` | PENDING; the Agent does not self-accept |
