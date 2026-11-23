# Execution Report — UNO-WO-090 / R01

**STOPPED — P3 QUALIFIED PUBLICATION LAYER IMPLEMENTED AND TESTED; P4–P6 NOT DELIVERED; NO PRODUCT COMMIT, NO PRODUCT PUSH**

This file replaces its previous contents under the one authorized overwrite. It reports one execution that implemented and locally proved the qualified multi-Site publication layer, then stopped because two mandatory deployment gates are red for a cause that predates this run and cannot be repaired safely inside this window without publishing against a failing gate. Nothing here is an Architect acceptance, a stage closure, a release or a deployment, and no U04 parity, A2 or M2 state is claimed.

## 1. Authority and starting point

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-090 / R01`, Edition `FINAL — EXECUTE` |
| ACTIVE identity | measured **26,339 bytes**, SHA-256 `67907385ffd554e611ce0c04615775a0f0fd8be82ae8ac3f5afdc343dcefe078`; untracked, ignored, unstaged; contents not reproduced |
| Required and actual start | `02c64f9391a96c76dcd56560af117f005180bea0` — local `HEAD`, `origin/main` and remote `main` all equal |
| Published predecessor | WO-087 sanitized record, blob `3a161b4e8c7079e3e0e0045ece87176816fe58ac`, already committed at the start SHA; no correction was re-run |
| Physical root | sole checkout at the verified physical Uno path (private absolute path withheld); `--show-prefix` empty; one worktree; one `origin` fetching and pushing only `provelopment/provelopment-foundation-uno`; branch `main`; parent `/00.foundation-uno/` ignore intact |
| WIP discipline | exactly three tracked `plan-*.md` slots plus the private ignored ACTIVE |
| Inherited work | 13 modified M1 tracked paths, 0 staged, 0 untracked, all explained by the WO-087 record |
| Toolchain | Node 26.13.1, pnpm 11.6.0, Next 16.4.6, React 19.2.9, Playwright as committed; no package, lock, workflow or protected-file change |

## 2. What was implemented (P3)

A qualified, host-bound publication path now exists beside the untouched legacy path. The presence of `site` in a request is the only selector, so a version-1 request is never reinterpreted and a version-2 declaration is never read as a legacy selection.

| Path | Change |
| --- | --- |
| `src/adapters/efs/uno-confined-source-reader.ts` | Two exact request shapes: legacy `{repoRoot, pathname}` unchanged, and qualified `{repoRoot, host, pathname}` matched through `matchUnoSiteRouteCandidate`. A Host is only ever compared against configured bindings, so a request header cannot grant identity. |
| `src/application/prepare-uno-page-delivery-candidate.ts` | `UNO_DELIVERY_INPUT_KEYS_V2` = `{manifest, selection, site, host, pathname, loadedSource}`; the base and locale policy are read from the named binding own declaration, and the matched candidate Facet/Site pair must equal the requested pair. The header, document, discoverability, canonical-URL and eligibility tail is shared unchanged by both shapes. |
| `src/application/plan-uno-published-page.ts` | `UNO_PUBLICATION_INPUT_KEYS_V2` and a qualified branch; the publication authority, document projection and delivery projection were extracted into one `assembleAcceptedPage`, so exactly one publication gate serves both shapes. |
| `src/core/efs/uno-config.ts` | One delegation point `readValidatedBase` now carries the only call of `validateUnoCanonicalBase`; the version-2 Site loop reuses it instead of adding a second call. This repairs an inherited regression against the immutable architecture assertion without weakening it. |
| `tests/unit/efs-uno-published-page.test.ts` | Nine new positive/refusal cases over a real three-Site fixture through the real confined loader. |

## 3. Qualified behaviour proved by executable tests

Fixture: `corporate/main` at `https://abc.example` (root), `corporate/docs` at `https://abc.example/docs/` (prefix), `services/main` at `https://xyz.example`; two Facets each with a Site named `main`; disjoint locale sets (`en-001` versus `de-DE`); the optional entry default bound to a Site that owns neither of the first two addresses.

- the root Site serves `/en-001` with canonical `https://abc.example/en-001`;
- the prefixed Site serves `/docs/de-de` with canonical `https://abc.example/docs/de-de` and its own `de-DE` policy;
- the second Facet Site named `main` serves only on its own Host with its own canonical origin;
- the root Site is refused at `/docs/de-de`; an unconfigured Host is refused; `/docsx/de-de` is refused as a non-segment prefix; a locale the named Site does not author is refused; an unbound pair is refused; a selector carrying a third key is refused.

## 4. Local gate matrix — measured, not assumed

| Gate | Result |
| --- | --- |
| `tests/unit` (31 files) | **PASS** — 1,242 tests |
| `pnpm test:architecture` | **PASS** — 46 tests, 0 fail, after the delegation repair |
| `pnpm typecheck` | **PASS** — exit 0 |
| `pnpm lint` and `pnpm exec eslint . --max-warnings 0` | **PASS** — exit 0, 0 warnings |
| `pnpm test:bootstrap` | **PASS** |
| `node --test tests/governance-docs.test.mjs`, `node scripts/verify-governance-docs.mjs` | **PASS** |
| `pnpm build` | **PASS** — 10/10 pages generated |
| `node scripts/verify-u03-trace.mjs --expect committed` | **PASS** |
| `pnpm test:http` after a build in the same step | **PASS** — 105 assertions |
| `node scripts/verify-u03-http.mjs` | **PASS** — 135 assertions |
| `node scripts/verify-u03-published-http.mjs` | **PASS** — 999 assertions |
| `node scripts/verify-u04-json-slice.mjs` | **PASS** — 477 assertions |
| `node scripts/verify-u04-22-module-consent.mjs`, `node scripts/verify-vercel-readiness.mjs` | **PASS** |
| `pnpm audit --prod --audit-level high` | **PASS** — no known vulnerabilities |
| `node --test tests/deployment/u03-fixture-transaction.test.mjs` | **FAIL** — 26 pass, 1 fail: no sandbox or transaction scratch outlives the case |
| `node --test tests/deployment/u04-json-slice.test.mjs` | **FAIL** — 13 pass, 1 fail: the nested 27-case fault and restoration run returns 1 instead of 0 |
| `pnpm test` (exact script) | **FAIL, local only** — its argument is a path substring filter, so it also collects the byte-frozen A2 copy at `.temp/uno-u04-086/A2-new/tests/unit/uno-family-links.test.ts`, whose relocated relative imports cannot resolve; hosted runners never hold `.temp`, and the whole `tests/unit` tree passes when selected explicitly |

## 5. Why this run stopped

The two failing deployment gates exercise `scripts/uno-u03-fixture-transaction.mjs`, which imports only Node built-ins and none of the modules changed here, so the failure is not caused by this work — it is an inherited or environment-level defect in fixture sandbox cleanup on this host. The same two files are executed by the hosted workflows, and the gate is mandatory before any product push. A stale `.temp/wo031-tx-*` sandbox is present while the assertion runs and absent afterwards; I could neither reproduce it deterministically nor repair it with confidence in the remaining window, and a repair inside a mutating fixture runner without a reliable reproduction would be a guess rather than a fix.

Publishing product bytes that the hosted runner would immediately fail is the outcome this order forbids, so no product commit was created and no product push occurred. All work is preserved in the working tree.

## 6. Not delivered

1. **P4** — the `[locale]` route tree was not replaced by the `[...segments]` catch-all; `src/config/uno-serving.ts` still resolves one global authority and the three route handlers still use the legacy binding.
2. **P5** — per-Site JSON and Markdown publication, visibility, metadata, sitemap and alternate scoping are unchanged.
3. **P6** — no three-Site transaction fixture, no G01–G05 guard groups and no new production HTTP or Chromium proof were added, so `verify-u03-published-http.mjs` still proves only the committed version-1 fixture semantics.
4. No product commit A or B exists; the single commit published by this run carries this report only.

## 7. Preservation and rights

A2 tracked patch `90,536` B / `5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87` and the A2 new-file copy `17,405` B / `1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f` are byte-identical to the start of this run and remain unapplied. `deployment/efs/manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925` and `deployment/uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` were restored byte-for-byte by every gate that reads them. `AGENTS.md`, `README.md` and the local SOP are unchanged and match their frozen bytes. No protected file, workflow, package, lockfile, presentation file or UI component was modified. No external provider, DNS, registry or Drive record was contacted; every browser and HTTP request stayed on loopback with synthetic `.example` Hosts.

## 8. Git state and disposition

`HEAD` remains `02c64f9391a96c76dcd56560af117f005180bea0`. Beyond the 13 inherited ledger paths, this run changed `src/adapters/efs/uno-confined-source-reader.ts`, `src/application/prepare-uno-page-delivery-candidate.ts`, `src/application/plan-uno-published-page.ts`, `src/core/efs/uno-config.ts` and `tests/unit/efs-uno-published-page.test.ts`; nothing was staged before this report and no untracked file was created outside the ignored scratch. Private paths, the ACTIVE body and Owner activation text are not reproduced anywhere in this file.

**Disposition requested:** a successor order that (a) authorizes the fixture-sandbox cleanup repair in `scripts/uno-u03-fixture-transaction.mjs`, together with the exact reproduction command for this host, or explicitly scopes the unit gate to `tests/unit` so the preserved A2 copy cannot be collected; and (b) carries P3 forward as delivered while authorizing P4–P6 as the remaining bounded work. Nothing in this run is offered as verification of the multi-Site runtime.
