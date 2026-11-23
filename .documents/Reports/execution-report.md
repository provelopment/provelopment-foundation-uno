# Execution Report — UNO-WO-091 / R01

**STOPPED AFTER CHECKPOINT A — P1–P3 AND BOTH GATE REPAIRS PUBLISHED AND CI-GREEN; P4–P6 NOT DELIVERED**

This file replaces its previous contents under the one authorized overwrite. It reports one execution that repaired the two known local gate defects, published the qualified multi-Site P1–P3 product source, and verified both hosted workflows at that exact product SHA. The P4–P6 runtime rewrite was not delivered, so no multi-Site runtime, browser proof or U04 parity credit is claimed. Nothing here is an Architect acceptance, a stage closure, a release or a deployment.

## 1. Authority, start, and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-091 / R01`, Edition `FINAL — EXECUTE` |
| ACTIVE identity | measured **26,519 bytes**, SHA-256 `254507334aa41bc5398b9fa1dcd2d20cef944300ada3d89e1b1c16a5ba1a4be2`; ignored, untracked, unstaged; body not reproduced |
| Required and actual start | `0c1eb55c4aeb8e4931f5ccc00bfc2843c88002a0` — local `HEAD`, `main`, `origin/main` and remote `main` all equal |
| Physical root | sole checkout at the verified physical Uno path (private machine path withheld); `--show-prefix` empty; one worktree; exactly one `origin` for `provelopment/provelopment-foundation-uno`; 0 staged, 0 untracked; parent `/00.foundation-uno/` ignore intact |
| Dirty inventory | exactly 17 tracked paths, each identified before any write: 10 product paths and 7 unit-test paths, all attributable to the WO-087 P1/P2 and WO-090 P3 records. No foreign or unknown dirty source |
| A2 preservation | `.temp/uno-u04-086/A2-tracked.patch` `5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87` and `.temp/uno-u04-086/A2-new/tests/unit/uno-family-links.test.ts` `1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f` — unchanged at start and end, unapplied, unrelocated, uncommitted |
| Declarations | `deployment/efs/manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`, `deployment/uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` — identical at start and end |
| Frozen governance | `AGENTS.md` `6c6d5dcb…`, `README.md` `97f93bda…`, `.documents/SOP/sop-implementation.md` `6d790ad4…` — unchanged; no Drive-to-repo synchronisation attempted |

## 2. A — the two gate defects, repaired without hiding anything

### A1 fixture ownership and race

The committed case snapshotted *all* peer-owned `.temp/wo031-*` names before and after itself, so any concurrently running independent case could turn it red while this case had cleaned its own sandbox. The global comparison was replaced with exact ownership evidence: the case now asserts its own `sandbox.scratchRoot` is empty after `restore` and `dispose`, that only its own `sandbox.sandbox` exists before the `finally`, and that it is gone afterwards. A second case was added as a mutation guard: with `dispose` skipped, the same scratch root must still be non-empty, so removing `dispose` from the positive case makes it fail instead of silently passing. All 26 pre-existing cases, the foreign-file refusals, the failed-restore backup retention and the real transaction logic are untouched.

Evidence: `node --test tests/deployment/u03-fixture-transaction.test.mjs` — **28 pass, 0 fail**, three consecutive runs, and the previously failing `u04-json-slice` consumer now reports **14 pass, 0 fail**.


### A2 Vitest scratch discovery

`scripts.test` changed only from `vitest run tests/unit` to `vitest run tests/unit --exclude "**/.temp/**"`. Nothing else in `package.json` changed and the lockfile is untouched. Evidence: `pnpm test` now reports **31 files / 1,242 tests passed** and the byte-frozen A2 copy under `.temp/` is no longer collected; deleting or relocating A2 was not done and no `--passWithNoTests` or test-ignore masking was used. Governance tests still pass (`tests/governance-docs.test.mjs` 9/9 and `scripts/verify-governance-docs.mjs` exit 0), so the frozen-literal concern did not materialise.
## 3. B — product commit A, published and CI-green

`3e51449cb3f28f073e20910651db50160a5ac0a9` — `UNO-WO-091 / R01: qualified multi-Site P1-P3 and gate repairs`, parent exactly `0c1eb55c4aeb8e4931f5ccc00bfc2843c88002a0`, 19 files, `+3,123 / −145`, non-force push to `main`, `git diff --cached --check` clean, staged set an explicit subset of the ledger.

Product paths in this commit: `src/core/efs/{manifest-graph,uno-config,uno-canonical-base,uno-route-address}.ts`, `src/application/{resolve-uno-committed-base,resolve-uno-committed-locales,validate-uno-site-publication-inputs,prepare-uno-page-delivery-candidate,plan-uno-published-page}.ts`, `src/adapters/efs/uno-confined-source-reader.ts`, plus the seven unit-test files and the two gate paths (`package.json`, `tests/deployment/u03-fixture-transaction.test.mjs`).

What that source now provides: a version-2 multi-Site address declaration validated against one manifest, with every Site independently bound by the qualified pair `{facetId, siteId}`, nested same-origin prefixes accepted under a whole-segment rule and same-prefix duplicates refused; one canonical-base call site inside `uno-config.ts` so no lexical URL/prefix/alias rule is restated; per-Site committed base and locale authority that cannot be satisfied by a sibling Site; and a qualified publication path whose delivery candidate, confined loader and published-Page planner all require the same `{site, host, manifest}` binding, with the v1 shapes preserved byte-for-byte in behaviour.

Hosted verification at the exact product SHA: `Uno Bootstrap Verify` run **45132730745** — success on `ubuntu-24.04` and `windows-2025`; `Verify U01 baseline` run **45132730884** — success. Both jobs completed green with no continue-on-error and no workflow change.

## 4. Local gate matrix measured in this run

| Gate | Result |
| --- | --- |
| `pnpm test` (A2-safe script) | **PASS** — 31 files, 1,242 tests |
| `pnpm exec vitest run tests/unit/efs-uno-published-page.test.ts` | **PASS** — 30 tests including 9 qualified multi-Site cases |
| `pnpm test:architecture` | **PASS** — 46 tests, 0 fail |
| `pnpm test:bootstrap` | **PASS** |
| `node --test tests/governance-docs.test.mjs`, `node scripts/verify-governance-docs.mjs` | **PASS** — 9 tests, exit 0 |
| `pnpm lint`, `pnpm exec eslint . --max-warnings 0` | **PASS** — exit 0, 0 warnings |
| `pnpm typecheck` | **PASS** — exit 0 |
| `git diff --cached --check` | **PASS** — clean |
| `node --test tests/deployment/u03-fixture-transaction.test.mjs` | **PASS** — 28 tests, three consecutive runs |
| `node --test tests/deployment/u04-json-slice.test.mjs` | **PASS** — 14 tests |
| `pnpm build`, `pnpm test:http`, `verify-u03-http`, `verify-u03-published-http`, `verify-u04-json-slice`, `verify-u04-22-module-consent`, `verify-vercel-readiness`, `pnpm audit` | **PASS** — recorded green in the immediately preceding checkpoint run; not re-executed after commit A because no runtime path changed and CI re-ran them at `3e51449` |

## 5. Not delivered — P4, P5, P6

The runtime half of this order was not executed. `src/config/uno-serving.ts` still resolves one global committed authority, the `(site)/[locale]/[[...segments]]` tree is still in place, the SEO endpoints still use the legacy binding, and no three-Site fixture, G01–G05 guard group or browser proof was added.

The reason is execution capacity remaining in this run, not a technical or authorization blocker: the route replacement requires creating `(site)/[...segments]/page.tsx` and `layout.tsx`, deleting the old pair only after the replacement passes, rewriting the serving authority to an all-Sites indexed decision used by page, metadata, media, robots and sitemap, and then building the three-Site transaction, the Chromium suite and the hosted guard wiring. Attempting that with the remaining budget would have risked landing a half-migrated route tree and a red build — the one outcome this order and the standing rules forbid — and would have consumed the capacity needed to publish this report.

The next activation can proceed directly from `3e51449` with the design already authorised in §4.C: one immutable all-Sites authority built once per request, `matchUnoSiteRouteCandidate` selecting the only binding that owns the normalised Host and whole-segment prefix, that decision threaded into source load, publication, media, locale, canonical, robots and sitemap, the catch-all route replacing the locale tree only after its tests pass, and `scripts/verify-u03-published-http.mjs` made to require the three-Site HTTP and browser assertions so an uninvoked script can never earn credit.

## 6. Preservation, rights and warnings

Both A2 artifacts are byte-identical to the start of the run and remain unapplied. Both committed declaration digests are unchanged, so no persistent deployment or content change was made; no `wo091-` fixture file was created because no fixture run was performed. No protected file, workflow, lockfile, dependency, brand or presentation file was modified. No secret, private machine path or Owner order text appears in this report. No external provider, DNS, registry, analytics or Drive request was issued; the only network activity was the authorised GitHub push and CI readback.

Warnings and advisories: `pnpm audit --prod --audit-level high` and the full audit recorded no known vulnerabilities at the checkpoint. Two pre-existing repository conditions are recorded for the Architect and were not changed: `deployment/site.config.json` remains absent and stays a separately governed presentation-stage obligation, and the retained `.temp` scratch tree is deliberately untracked.

## 7. Git state and disposition

Product head `3e51449cb3f28f073e20910651db50160a5ac0a9`; parent `0c1eb55c4aeb8e4931f5ccc00bfc2843c88002a0`. The report-only commit that carries this file follows the product commit as a separate one-path non-force push; its own SHA is deliberately not stated here. The working tree is clean apart from the ignored `.temp/uno-m1-091/` scratch and the preserved A2 and prior-order artifacts.

**Disposition requested:** independent Architect review of `3e51449` — the v2 address/binding contracts, the single canonical-base call site, the qualified loader/delivery/planner binding equality, and the two gate repairs — followed by an Owner decision that authorises P4–P6 as the remaining bounded runtime work starting from this product SHA. No stage closure, A2/M2 activation, parity credit, release or deployment is requested.
