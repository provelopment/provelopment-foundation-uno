# Execution Report — UNO-WO-078 / R01

**STOPPED / FAILED — PRODUCT COMMITTED BUT HOSTED GATE RED / AWAITING OWNER DIRECTION**

This document replaces the previous contents of this path under one Owner-authorized overwrite. It records a **failed**
`UNO-WO-078 / R01` attempt: the product commit was made and pushed as the order requires, but the CI-enforced
`Verify U01 baseline` workflow failed at that exact head on both operating systems. The order forbids a self-authorized
retry or a second product commit, so this run **STOPPED**. Nothing here is an acceptance, a delivery claim, a stage
closure or a parity uplift.

## 1. Authority, start and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-078 / R01`, Edition `FINAL — EXECUTE`, durable bounded seventeen-family evidence on the committed Components Page |
| Owner activation identity | ACTIVE `.documents/WIP/workorder-active.md` measured **34,151 bytes**, SHA-256 `921813c391788e54ff381d55d8f2999abc1ed2cfac983406ae643d88e2d2e28c`; both matching the Owner activation. The ACTIVE text, the activation message, private paths and credentials are deliberately not reproduced. |
| Required start | `c642dcc34d34f23213675d0823ed2f9661b760d2`, matched by local `HEAD`, local `main`, `origin/main` and the remote `main` ref before any write; its product predecessor `e38e0e6cd210570e7895da8b33ffec3638fd43e5` and report blob `1631183ed4acf40778c3854ce185ff2a93a6a353` unchanged |
| Product commit | **`e04399d555ce425a99858548a566618313a6bfab`**, parent exactly `c642dcc…`, subject `UNO-WO-078 / R01: durable bounded family evidence on Components`, **11** tracked paths changed (8 modified, 3 added) |
| Product-head hosted result | `Verify U01 baseline` run `44985336563`: **FAILED** on `ubuntu-24.04` and `windows-2025` at step 27. `Uno Bootstrap Verify` run `44985336632`: success on both. Baseline steps 28–32 did not execute because the job stopped at step 27. |
| Agent-observed local conditions (not independently certified) | the authorized physical checkout and every inspected ancestor resolve to one physical location with no junction, symlink or reparse escape; the parent-owned anchored ignore entry for this checkout is present and was not modified; exactly one worktree, one local `main` tracking `origin/main`, one remote resolving only to the Uno repository; clean index and worktree at the start and after the product commit; no stash, no conflict, no hook-path override and no active hook; `.documents/WIP/` held exactly the three tracked plan files and the one ignored private ACTIVE |
| Pins and new targets | all 32 pinned Git blobs matched at the required start and again before the product commit; the three new targets were proven absent and created exclusively; the seven pinned donor blobs at donor commit `c05c55ea…` (including the Apache-2.0 `LICENSE` `d6456956…`) matched exactly, read-only |
| Declaration digests | unchanged and re-verified after every stateful runner and both commits: manifest `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`, selection `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` |
| Host and toolchain | Windows, Node `v26.13.1`, pnpm `11.6.0`, Next `16.4.6`, repo-local Playwright Chromium cache; no install, dependency, lockfile, workflow, hook or config change |

## 2. The failure, its exact evidence and its cause

| Item | Observed |
| --- | --- |
| Failing check | `DURABLE_FAMILY_SOURCE the six original sections still equal the starting committed blob` |
| Failing step | `Verify U01 baseline`, job step 27 `Run production HTTP and browser (U03 published Pages, restored afterwards)`, on `ubuntu-24.04` and `windows-2025` |
| Failing command output | `verify-u03-published-http: 66 passed, 1 failed` then `verify-u03-published-http: FAILED`, identical on both operating systems |
| Skipped because of the failure | baseline steps 28 (`U04 A1 JSON Page vertical slice`), 29 (`U04 22-module consent hermetic guard`), 30 (`U04 22-module and four-provider consent`), 31 (`Deployment readiness fixtures`) and 32 (`Deployment readiness`) — none executed, none claimed |
| Root cause | that check compares the committed Page's six-section prefix against the starting Git blob via `git cat-file blob f215b094…`. The hosted checkout is shallow (single-commit clone), so the object is absent there; `git cat-file` exits non-zero and the check fails. The local clone is complete and holds the object, which is why every local run passed. This is a **defect in the new hosted gate this order required**, not a defect in the product data. |
| Local evidence for the same check | `git cat-file` succeeded locally and the check passed; the local published-HTTP runner reported **977 passed, 0 failed** on the identical tree |
| Why this is not repaired here | the fix requires editing the committed runner (or comparing a pinned value instead of reading history) and pushing a second product commit. The order states: if hosted red, STOP and never self-authorize a product retry or second product commit. **No retry was made and no second product commit exists.** |

## 3. Product paths (committed and pushed; not hosted-verified)

| ID | Path | Start blob | Product blob | Operation |
| --- | --- | --- | --- | --- |
| A01 | `deployment/efs/content/components.en-001.json` | `f215b094918be97f85b5d9c9a5a6ac16845fec0d` | `91d2750c9d0692e7a71b60dd4da0569b6d08afb2` | six original sections preserved value-identically and first; description updated; exactly seventeen composed nodes appended; 23 top-level sections; 15,432 file bytes |
| A02 | `deployment/efs/capsule/e_7a3knkx60eacyhca7a0cr1k6e1/foundation/main/wo078-family-plate.png` | NEW | `70477a240ff394095e8a2cdc0639c9f77cfdb395` | one original deterministic 64×40 RGB PNG, 191 bytes, SHA-256 `25bde641ce447275f7eff9d03859d07062ae34f9e3597eff18cf07bb384eae47`, PNG signature and IHDR/IDAT/IEND chunks with valid CRCs |
| A03 | `tests/fixtures/u04-durable-family-source.json` | NEW | `efadae06bce9115a9e6adac6e4176ed7099d2eba` | original test-only donor-shaped v1 source, 17 sections in the documented order, synthetic copy only |
| A04 | `tests/fixtures/u04-durable-family-bindings.json` | NEW | `5f0b6cf961e6d7eabf97484bd99779a393be456e` | one image binding to the Page-owned plate and one `{formRef:"wo078-contact", mode:"delivery-off"}` acknowledgement |
| T01 | `scripts/verify-u03-published-http.mjs` | `0d478edd73a64619270a6f837d5350176ed90301` | `63a5a025b8bf3657a97728e9f4c5e8b008ed6edd` | durable source/refusal/HTTP/media/browser/restore phases inside the committed-starter proof before any fixture; the deployment-tree guards tolerate only the five starter paths plus the one exact A02 asset and use `--untracked-files=all` so an untracked asset is named individually |
| T02 | `scripts/verify-u03-browser.mjs` | `5fb2b1e2b0ba9ba165263873c553e0faa6c0df88` | `5545e282a321ecdcbc583dac114d5def4fe8b488` | optional `durableFamilyPage` proof at 1280 and 390 CSS px, light and dark, and reduced motion; every check prefixed `DURABLE_FAMILY_BROWSER` |
| T03 | `scripts/verify-u04-json-slice.mjs` | `96099c105bd347644a96c3d5463b82436048738c` | `329cb7eb39509d4c1c6766119adafdf758a7b294` | allowlist expanded by the single exact A02 asset path in both guards plus `--untracked-files=all`; no digest or fixture-rights change |

| T04 | `tests/deployment/u04-22-module-consent.test.mjs` | `7ad1ab66099bf0532cd3924747293f51d039e8a7` | `7ee663e6819ebc6e144fa49e913e0028163a34b8` | three new mutation-sensitive audits binding every `DURABLE_FAMILY_*` label to its predicate in the hosted runner and the browser helper; all 733-case U04 guards preserved |
| T05 | `tests/unit/uno-foundation-families.test.ts` | `1593b1c603084a0c853fc188117611366855bdf0` | `357973ae3dda52043fd9b4b70d61af694af4d4df` | ten new focused tests over the inert A03/A04 data, the composer, the committed Page and the rendered suffix; the two ledger assertions that demanded "no durable published family Page" now demand the durable-and-bounded record instead |
| E01 | `.documents/Architecture/u04-family-parity.md` | `edb144420ff2ae39b06cdb6ecd6e035d208223fb` | `cb3360e6d58c629b2f6853d0ec49a3fd6641744a` | new section 7 recording the durable bounded composition, the owned asset, the real HTTP/Chromium/refusal/trace evidence, and the retained 1/17 parity and 43/59 proxy |
| E02 | `.documents/Architecture/u06-starter.md` | `a0ef2cc128dabf7ec0a3b4e6d0b3cecc83376ad6` | `ba5da5d7dda326b756f186402e05768292db33e9` | Components description updated to six native plus seventeen bounded samples, the owned plate and the unchanged three-Page, canonical and manifest facts |

`T06` (`tests/unit/efs-uno-published-page.test.ts`), `T07` (`scripts/verify-u03-trace.mjs`) and `T08`
(`tests/deployment/u03-trace.test.mjs`) were explicitly **conditional** and needed no change, so they keep their exact
start blobs. The committed build trace still ships only the declarations and the authored sources and does **not**
include the new asset, which is why T07/T08 remained untouched.

## 4. Local evidence (Agent-observed, Windows, this checkout)

| Gate | Result | Observed |
| --- | --- | --- |
| `pnpm exec vitest run tests/unit/uno-foundation-families.test.ts` | PASS | **190** tests (180 pre-existing plus 10 durable) |
| `pnpm exec vitest run tests/unit/efs-uno-published-page.test.ts` | PASS | 21 tests |
| `node --test tests/deployment/u04-22-module-consent.test.mjs` | PASS | **46** tests, including the three new durable audits |
| `node --test tests/deployment/u03-trace.test.mjs` | PASS | 28 tests |
| `pnpm test:bootstrap`, governance test, `verify-governance-docs`, `pnpm test:architecture` | PASS | frozen governance bytes intact |
| `pnpm typecheck`, `pnpm lint`, `pnpm exec eslint . --max-warnings 0` | PASS | zero errors, zero warnings |
| `pnpm test` | PASS | 30 files, **1,128** tests (from 1,118) |
| Eight deployment suites, `verify-vercel-readiness`, `verify-u04-security-exception` | PASS | offline, no provider action |
| `node scripts/verify-u03-published-http.mjs` | PASS locally | **977 passed, 0 failed** — the durable phases, the fixture transaction and both original gates; this is the gate that fails in hosted CI for the reason recorded in section 2 |
| `node scripts/verify-u04-json-slice.mjs` | PASS | **464 passed, 0 failed** |
| `node scripts/verify-u04-22-module-consent.mjs` | PASS | **733 passed, 0 failed**, unchanged predicate count, `FAMILY_BROWSER` and `DIVIDER_PARITY` pass |
| `pnpm build` and `node scripts/verify-u03-trace.mjs --expect committed` | PASS | bounded trace, no new asset entry |
| `pnpm test:http` / `node scripts/verify-u03-http.mjs` | PASS | **105** and **135** passed, 0 failed |
| Declaration and asset digests after every stateful runner | PASS | manifest `b6213ed6…`, selection `58011c43…`, Page `31f9adac…`, plate `25bde641…`, A03 `a4bde851…`, A04 `f2c8696c…` — all byte-stable |

The durable phases themselves issued these passing checks locally: `DURABLE_FAMILY_SOURCE` 14, `DURABLE_FAMILY_REFUSALS`
22, `DURABLE_FAMILY_HTTP` 29, `DURABLE_FAMILY_MEDIA` 26, `DURABLE_FAMILY_BROWSER` 126 and `DURABLE_FAMILY_RESTORE` 5.
**None of that is hosted evidence**, because the hosted run stopped at the failing check in section 2.

## 5. What the committed data contains (facts, not hosted verification)

- **Components Page:** six original native sections first and value-identical to the pre-order blob, then seventeen
  composed families in order — `family-0-prose`, `family-1-callout`, `family-2-list`, `family-3-faq`, `family-4-media`,
  `family-5-gallery`, `family-6-contactform`, `family-7-actions`, `family-8-divider`, `family-9-hero`,
  `family-10-stats`, `family-11-steps`, `family-12-quote`, `family-13-table`, `family-14-columns`, `family-15-cards`,
  `family-16-features`. The appended values equal `composeUnoFoundationSubset`'s own output for A03/A04 byte for byte,
  with 47 composed nodes, depth 4 and a 7,041-byte composed document — inside the 32-section, 128-node, depth-4 and
  64 KiB bounds.
- **Owned asset:** the single 191-byte PNG above is the only asset the Page declares; three occurrences (one `media`,
  two `gallery`) resolve to `/uno-media/en-001/components/{0,1,2}`.
- **Contact seam:** one `{formRef:"wo078-contact", mode:"delivery-off"}` acknowledgement; the Page shows only the fixed
  inert notice and carries no form control.
- **Three-Page invariant:** manifest, selection, Home JSON, About Markdown and the preserved undeclared
  `home.en-001.md` keep their exact blobs; the sitemap still holds exactly three reserved-canonical URLs; no fourth
  Page, route, locale, domain, DNS, TLS or deployment exists.

## 6. Rights, privacy, standing disclosures and prior orders

Donor reference remains the pinned read-only `provelopment/provelopment-foundation` commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` with its Apache-2.0 `LICENSE` blob
`d645695673349e3947e8e5ae42332d0ac3164cd7`. Only concepts and semantics were consulted at the seven pinned blobs; no
donor code, CSS, markup, art, brand or text was copied, and the A02 pixels and every A03 string are wholly original
Uno-owned material. No dependency, notice exception or licence waiver was added. No private path, machine-specific
profile path, personal name, credential, token, ACTIVE text, activation message or runtime secret appears in the
rendered HTML, static output, commit subject or this report. No release, tag, merge, history rewrite, settings change,
provider operation, domain/DNS/TLS action or deployment occurred.

- `UNO-WO-071` (activation-evidence), `UNO-WO-072` (privacy/report) and `UNO-WO-073` (write ledger) `REVISE` findings
  stand unchanged; `UNO-WO-076` remains a `REVISE` STOP with no product commit.
- **Historical private-path exposure remains unresolved — Owner decision required.** This order performed no history
  rewrite, log purge or disclosure response.
- The pre-existing moderate development advisory remains unwaived; the production dependency graph audits clean and the
  Windows `DEP0190` deprecation warning is a known reportable warning in this environment.

## 7. Report-head state and what remains open

| Item | Status |
| --- | --- |
| Report overwrite count | **1** (`R01_WRITE_COUNT=1`), from this validated ignored-scratch draft, under the order's STOP-reporting exception |
| Frozen bootstrap and governance gates against this newly written report | PASS locally, run before the report-only commit |
| Exact report-head `Verify U01 baseline` / `Uno Bootstrap Verify` on Ubuntu and Windows | **PENDING at write time** — deliberately not predicted; the baseline workflow is expected to fail again at the same step for the reason in section 2 |
| Product-head CI | **RED** (`Verify U01 baseline` failed; `Uno Bootstrap Verify` green) |
| Architect `ACCEPT / REVISE / STOP` | PENDING, not self-granted |

Accounting is unchanged: 22/22 module IDs, 4/4 asset zones, 16/16 browser matrix, 17/17 bounded family mappings,
**1/17** accepted full parity (`divider`) and **43/59 = 72.88%** proxy. This order adds a durable bounded composition
only; it cannot raise the proxy or the parity count.

| Remaining item | Status |
| --- | --- |
| Hosted durable-family gate | **FAILED** at the product head — needs an Owner-authorized corrective order (for example, replacing the history lookup with a pinned comparison) |
| U04 sixteen family parity gaps | OPEN, unchanged |
| U05 safe actions and provider gating | OPEN, outside this order |
| U06 two independent installs, clean-room/upgrade/rollback | OPEN; not attempted |
| U07 security and release audit | OPEN, outside this order |
| Historical exposure remediation | OPEN, Owner decision required |
| Stage closure | NOT APPLICABLE — no stage may close on a red hosted head |
