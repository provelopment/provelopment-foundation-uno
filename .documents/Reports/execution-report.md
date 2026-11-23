# Execution Report — UNO-WO-092 / R01

**PARTIAL — THE TWO VERSION-2 AUTHORITY DEFECTS ARE FIXED, TESTED AND PUBLISHED WITH GREEN UBUNTU AND WINDOWS CI; THE P4–P6 RUNTIME, VISIBILITY, DISCOVERY AND MULTI-SITE PROOF ARE NOT DELIVERED**

This file replaces its previous contents under the one authorized overwrite. It reports one execution that repaired both v2 authority defects exactly as §4.A requires, verified the full local battery, published one product commit, and confirmed both hosted workflows at that exact product SHA. It also reports, with evidence, that the ordered P4–P6 runtime replacement was attempted, built, served and then **reverted**, because it could not satisfy an existing mandatory gate. Nothing here is an Architect acceptance, a stage closure, an A2/M2 activation, a parity credit, a release or a deployment.

## 1. Authority, start and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-092 / R01`, edition `FINAL — EXECUTE` |
| ACTIVE identity | measured **22,748 bytes**, SHA-256 `412791bac0a479ee3da360be4843ecaa395449f68604bc20883a2519f17aa614` — exact match; sole ACTIVE; ignored, untracked, unstaged; body not reproduced |
| Required and actual start | `5804083481618b4878e29e4e8cd0c047f6bd88d9` — `HEAD`, `main`, `origin/main` and remote `main` all equal |
| Physical root | sole checkout (private path withheld), `--show-prefix` empty, one worktree, exactly one `origin` at this Uno remote, branch `main`; parent `/00.foundation-uno/` ignore intact |
| Working tree | clean tracked worktree and empty index at start; no foreign, unknown or unowned path |
| A2 preservation | `A2-tracked.patch` `5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87` and `A2-new/tests/unit/uno-family-links.test.ts` `1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f` — unchanged at start and end, unapplied |
| Declarations | `manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`, `uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` — identical at start and end; no fixture transaction was run |
| Frozen governance | `AGENTS.md`, `README.md`, `.documents/SOP/sop-implementation.md` unchanged; no Drive synchronisation attempted |

No P1–P3 work was reimplemented, republished or reopened, and no administrative checkpoint was created.

## 2. §4.A — the two version-2 authority defects, repaired

### A1 order-dependent address ownership

The committed validator compared a new canonical only against **older canonicals** and a new alias only against older canonicals and aliases, so `A.alias = B.canonical` validated whenever `A` was declared first and the answer depended on `sites[]` order. The two separate sets were replaced with **one normalized ownership index across every canonical and alias address**, consulted in both directions: an exact collision now refuses as `config:duplicate-site-address` whichever Site is declared first, and a canonical that a later Site claims as an alias fails identically. Two Sites may still share one host under disjoint whole-segment prefixes, and an unrelated alias on that host still validates; the existing duplicate-prefix and overlap refusals are unchanged.

### A2 the implicit first-Site entry default

When several Sites were bound with no authored `default`, the validator filled `selectedSite` with `sites[0]` and then checked the installation language mapping against that arbitrary Site. That implicit choice is removed: `selectedSite` is now present **only** when `default` is authored, or when the declaration binds exactly one Site and the entry is therefore unambiguous (the single-Site v2 case the order requires to stay valid). A multi-Site no-default declaration validates identically under any permutation, keeps every Site active, and produces no entry target at all — so nothing can later mistake declaration order for publication authority.

The language mapping is no longer validated against one chosen Site. Each bound Site now validates only **its own projection** of the mapping (the entries whose target that Site actually authors), a mapping target that no bound Site owns refuses as `config:invalid-language-preferences`, and a declaration where no bound Site declares locales refuses as `config:locale-authority-missing`. No per-Site preference, translation or alias is synthesized.

### Regression and refusal coverage

Six new cases in `tests/unit/efs-uno-config.test.ts` assert specific closed codes or exact absences: alias-claimed-as-canonical in both declaration orders, canonical-claimed-as-alias, alias-alias duplication in both orders, disjoint prefixes plus an unrelated alias still accepted on one host, no promoted `sites[0]` with permutation independence, and mapping-projection acceptance plus unowned-target refusal. The suite is **55 tests, 0 failed**.

## 3. P4–P6 — attempted, blocked, reverted

The runtime half was implemented and then withdrawn. What was built and what it did is recorded here so the next activation starts from evidence rather than from a blank page.

Built and locally exercised: a dual-mode authority in `src/config/uno-serving.ts` (legacy v1 unchanged, version 2 validated once through `validateUnoSiteAddressConfig` into an all-Sites binding set), `{host, pathname}` request input with a strict authority grammar that rejects a scheme, path, userinfo, empty label or foreign port, exact Host comparison against configured origins only, host-scoped discovery that plans each Site separately before combining public URLs, per-Site media authorisation across the host's bindings with a refusal when a locator reads ambiguously, and host-scoped `robots.txt`/`sitemap.xml`. The route tree was replaced by `(site)/[...segments]` with `dynamic = "force-dynamic"`, no `generateStaticParams` and no `dynamicParams` gate, `Host` read through `headers()` as a lookup key only, `<html lang>` taken from the matched Page's authored `localeTag`, and one `cache`d request decision shared by `generateMetadata` and the render. `next.config.ts` tracing moved to `'/[...segments]'`. That build **compiled and served**: `next build` reported `ƒ /[...segments]`, `ƒ /robots.txt`, `ƒ /sitemap.xml`, `ƒ /uno-media/[...segments]` and a static `○ /`, with typecheck, lint, 1,248 unit tests, the 46 architecture tests, the bounded-trace check and the 1,242-test unit gate all green.

It was reverted because it broke a mandatory, pre-existing gate that could not be repaired inside this ledger without weakening it. `verify-u01-http` (run by `pnpm test:http`) requires that the 404 document at an unknown address contain the approved heading, copy and a `href="/"` return link. With a root-level catch-all, an unknown address is no longer an *unmatched* route: `notFound()` is raised from inside the `(site)` group's own root layout, and Next 16 answered with its not-found shell (`<html id="__next_error__">`, status 404) instead of the approved document. Three in-ledger remedies were tried on a real production build and none changed the result: a segment-level `not-found.tsx` rendering the approved copy, the same boundary with a plain same-origin anchor instead of `next/link`, and `experimental.globalNotFound` toggled off. The measured outcome was identical each time (103–104 of 105 checks passing, the same single failure), so the route replacement was withdrawn rather than shipped with a red gate, a muted assertion or a deleted check.

The exact revert: `src/config/uno-serving.ts`, `src/app/robots.txt/route.ts`, `src/app/sitemap.xml/route.ts`, `src/app/uno-media/[...segments]/route.ts`, `next.config.ts` and `scripts/verify-u03-trace.mjs` restored from `5804083`, and `src/app/(site)/[...segments]/` removed with `src/app/(site)/[locale]/` restored, leaving the committed route tree byte-identical. No workflow file, test assertion, threshold or permission gate was changed at any point in this run, and no `continue-on-error`, `if: false`, skip or stub was introduced.

Consequently P5 (per-Site JSON/Markdown publication, visibility, locale redirects, metadata, host-scoped sitemap/robots, owned media at runtime) and P6 (`scripts/verify-u03-multisite-http.mjs`, the three-Site fixture, G01–G05, `tests/deployment/u03-multisite-contract.test.mjs` and the two new blocking Windows/Ubuntu steps) are **not delivered**, and no multi-Site runtime, browser or parity claim is made. The `verify-u03-trace` capsule-allowlist edit that the new route required was withdrawn with it.

## 4. Product publication

| Item | Value |
| --- | --- |
| Product commit | `e75c463a807e364e7f3df1e537cf61f3264d5d44` — `UNO-WO-092 / R01: fix v2 address ownership and implicit entry Site` |
| Parent | `5804083481618b4878e29e4e8cd0c047f6bd88d9` (exact required start) |
| Diff | 2 files, `+259 / −28`: `src/core/efs/uno-config.ts`, `tests/unit/efs-uno-config.test.ts` — both in the §3 ledger |
| Index hygiene | explicit-path staging only, `git diff --cached --check` clean, no generated output, no `.temp`, no fixture file |
| Push | non-force `main`, readback `e75c463…` |
| Hosted CI | `Verify U01 baseline` run **45139107974** — success on `ubuntu-24.04` and `windows-2025`; `Uno Bootstrap Verify` run **45139107946** — success on both legs |

## 5. Local battery measured in this run (at the product tree)

| Gate | Result |
| --- | --- |
| `pnpm build` | **PASS** — 10 routes incl. `ƒ /[locale]/[[...segments]]`, `/robots.txt`, `/sitemap.xml`, `/uno-media/[...segments]` |
| `pnpm test` | **PASS** — 31 files, 1,242 tests (A2-safe exclude intact) |
| `pnpm exec vitest run tests/unit/efs-uno-config.test.ts` | **PASS** — 55 tests incl. the 6 new v2 authority cases |
| `pnpm test:architecture` | **PASS** — 46 tests, 0 failed |
| `pnpm test:bootstrap` | **PASS** |
| `tests/governance-docs.test.mjs` + `scripts/verify-governance-docs.mjs` | **PASS** — exit 0, frozen bytes unchanged |
| `pnpm lint` | **PASS** — exit 0, no warning |
| `pnpm typecheck` | **PASS** — exit 0 |
| `node scripts/verify-u03-trace.mjs --expect committed` | **PASS** — bounded inputs only |
| `pnpm test:http` (`verify-u01-http`) | **PASS** — 105/105 |
| `node scripts/verify-u03-http.mjs` | **PASS** — 135/135 |
| `node --test tests/deployment/u03-fixture-transaction.test.mjs` | **PASS** — 28/28 |
| `node --test tests/deployment/u04-json-slice.test.mjs` | **PASS** — 14/14 |
| `node scripts/verify-u03-published-http.mjs` | **PASS** — 999/999 incl. real Chromium |
| `node scripts/verify-u04-json-slice.mjs` | **PASS** — 477/477 |
| `node scripts/verify-u04-22-module-consent.mjs` | **PASS** — 808/808 |
| `pnpm audit --prod --audit-level high` and `pnpm audit --audit-level high` | **PASS** — no known vulnerabilities |
| `git diff --cached --check` | **PASS** — clean |

No gate count fell: every suite reports at or above its previous count, and the 6 new config tests are additive.

## 6. Rights, preservation and warnings

All new logic in the published commit is original Uno-authored code (REWRITE). No Foundation, Solo or Connect source, asset, brand, provider, DNS, deployment, release or analytics change; no external network request beyond the authorised GitHub push and CI readback; no secret, private absolute path, account name, ACTIVE content or activation text appears in this report or in any published file. No package, lockfile, dependency, workflow, protected `(demo)` route or unrelated component was modified. The two committed declarations are byte-identical to the start and no `wo092-*` fixture was ever created, so there is nothing to restore and no leftover scratch to clean; the only scratch written is task-owned `.temp/uno-m1-092/` and the ignored `.temp` build logs.

Advisory recorded for the Architect, not changed here: `deployment/site.config.json` remains absent and stays a separately governed presentation-stage obligation, not a publisher.

## 7. Remaining obligations and requested disposition

Outstanding for a future activation, in the order the work now needs to be done: settle the 404 boundary question for a root-level catch-all under Next 16 (the evidence above shows the failing mechanism precisely: `notFound()` raised inside a catch-all group's root layout yields the not-found shell rather than the approved document, and neither a segment boundary nor `globalNotFound` changes it) before any route replacement is attempted; then re-apply the serving composition and host-scoped SEO exactly as described in §3; then build `scripts/verify-u03-multisite-http.mjs` with the three-Site fixture, G01–G05, Chromium on loopback and byte-exact restoration, add its contract test and the two blocking workflow steps, and only then claim P4–P6.

**Disposition requested:** independent Architect review of `e75c463a807e364e7f3df1e537cf61f3264d5d44` — specifically the single normalized address-ownership index, the removal of the implicit first-Site entry default with its permutation-independence coverage, and the per-Site language-mapping projection — plus an Owner decision on the 404-boundary design question that blocked the runtime replacement in this run. No stage closure, A2/M2 activation, parity credit, merge, release or deployment is requested.

