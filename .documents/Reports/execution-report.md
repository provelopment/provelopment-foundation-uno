# Execution Report — UNO-WO-103 / R01

**Truthful outcome: `DELIVERED D2a, D2b PENDING`.** A real, additive, tested destination capability is committed and independently hosted-green on Ubuntu 24.04 and Windows 2025; `route` proof, the D3 evidence matrix and A2 credit are **not** delivered, and the A1 row remains the only parity claim: **`U04_PARITY=3/17`**, `U04_PROXY=45/59`.

| | |
| --- | --- |
| Order | `UNO-WO-103 / R01`, `FINAL — EXECUTE` — D2a, D2b, D3 under one activation |
| ACTIVE | **36,440 bytes**, SHA-256 `0ec112f7ca58828c15cc75aeb33715fe6de4b14f0f73ea99639cf7ce3d3861e1` — exact, private, ignored/untracked, never staged or published |
| Policy | Owner-reaffirmed **`U04-A2-SAFE-REFERENCE-01`**; no route, link, provider or publication authority added |
| Starting SHA | `23d9d3d744eed492bb79200c0e7688bd6a174168` (report-only head after WO-102 D1) |
| **D2a product SHA** | **`734a345fd382e4de7d1eaa9c56d1a65f2cc551a4`** — non-force push to the one Uno `origin/main` |
| Report SHA | this commit (report-only, after the product SHA) |
| A1 credit | **retained and re-proven**: hosted output at `734a345` prints `PASS U04_LABEL U04_PARITY=3/17` |
| A2 credit | **none.** No 5/17 or 47/59 exists anywhere in this report, and the closure oracle was not invoked at `A2` |

## 1. Preflight — agent-observed, bounded

Resolved root `C:\Users\Sean\Documents\Provelopment\00.foundation-uno`; empty `git rev-parse --show-prefix`; branch `main`; exactly one worktree and one remote, that remote being Uno's own `origin`; clean index and tracked tree. `HEAD == main == origin/main == git ls-remote origin main == 23d9d3d744eed492bb79200c0e7688bd6a174168`. The ACTIVE exists only at its ignored private slot. Frozen Git blobs `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `.documents/SOP/sop-implementation.md` `f30d6590…`, `.github/workflows/verify-bootstrap.yml` `caac7d65…`, `.github/workflows/verify-u01.yml` `8d19319d…`; committed declaration hashes `deployment/efs/manifest.json` `b6213ed6ee2d…` and `deployment/uno.config.json` `58011c4324f5…` — all unchanged before and after. Both protected WO-086 artifacts were present, hash-verified and left **byte-exact and unapplied** (90,536 B `5e40963895d2…`; 17,405 B `1cdddb38a91b…`). Donor commit `c05c55e…` and its five blobs were treated as previously verified pinned read-only facts; no further research loop was run and nothing was copied.

## 2. D2a delivered — closed document-local declarations, safe `href`, inert `link`, real Markdown ledes

**Reader, `src/core/page-document.ts`** — one additive v1 surface, no parallel schema:

- Optional document `links`: at most **32** own entries, each id a lowercase hyphenated slug of at most 64 code points, each value **exactly** `{reference:"applicationLink", key}` with a lowercase dotted/hyphenated opaque key of at most 96 code points. Duplicate JSON members were already refused by the strict reader; unknown reference kinds, extra keys, padded, uppercase or oversized values, and a non-record `links` all refuse the whole Page.
- `UnoProseListItem` now admits **at most one** destination form: `href` or `linkId`. Two forms refuse. `href` passes through the unchanged `classifyAuthorDestination`, so `javascript:`, `data:`, `vbscript:`, whitespace and control characters refuse as `document:unsafe-link`. The reserved `#link:` marker namespace is refused after percent and numeric-character-reference normalisation, so it cannot be laundered into an apparently local fragment. `linkId` must be a slug of at most 64 and must name a declaration in the **same** document — an undeclared id refuses the Page as `document:unresolved-target`. An unused declaration is legal and simply never activates.
- `route` is deliberately **not readable**: it needs a server publication proof that this run did not build, so it still refuses as a feature rather than rendering a guessed anchor.
- With no new field authored the document serialises and renders **byte-identically**; the legacy assertion in the new suite pins the exact JSON string and the exact HTML string.

**Composer, `src/application/compose-uno-foundation-families.ts`** — an optional donor `links` record is forwarded verbatim to the strict reader (the reader remains sole authority), donor item `href` is forwarded for that same classifier, donor item `link` becomes a validated `linkId`, and donor `route` refuses. A **Markdown** lede on `table`/`list` now stays inside the family (`lede` plus the variant-wide `markdown` flag) through a new heading-only wrapper, so `**emphasis**` renders as `<strong>` instead of literal stars and the optional `h2` still appears once; a plain lede keeps the byte-identical hoisted `content.prose` form. No canonical URL, route or Site fact is produced here.

**Renderer, `src/components/uno-page-sections.tsx`** — a proven-classifier `href` becomes exactly one ordinary `<a href … rel="noreferrer noopener">`; a declared-but-inactive application link renders as inert label text in a `span` with **no** anchor, `href`, key or request. The renderer stays a pure function: it never calls a planner and never invents a route.

**CSS, `src/app/globals.css`** — scoped link and inert-label rules on existing `--uno-*` tokens only.

**Tests** — new `tests/unit/uno-family-list-links.test.ts` (five cases, 60+ assertions): declared inert link with the opaque key provably absent from section data and HTML; three classified `href` forms with an exact literal roundtrip and exact anchor markup; ten obfuscated/unsafe destinations all refused; eleven malformed declaration and crossed-shape refusals including the duplicate JSON member; and exact legacy JSON and HTML bytes. `tests/unit/page-document.test.ts` and `tests/unit/uno-foundation-families.test.ts` gained the cross-form, script-scheme, undeclared-id, mixed-destination and Markdown-lede cases, with every superseded pin updated to the newly correct expectation rather than deleted.


## 3. Verification actually executed

Local at the product head: `pnpm test` **1,283 passed / 1,283** (34 files), `pnpm test:architecture` **47 passed / 0 failed**, `pnpm typecheck` clean, `pnpm build` a fresh successful Next 16.4.6 production build, `git diff --check` clean, staged paths reviewed as exactly the seven allowlisted files (`src/app/globals.css`, `src/application/compose-uno-foundation-families.ts`, `src/components/uno-page-sections.tsx`, `src/core/page-document.ts`, `tests/unit/page-document.test.ts`, `tests/unit/uno-foundation-families.test.ts`, new `tests/unit/uno-family-list-links.test.ts`).

Hosted at the exact product SHA `734a345`, through the unchanged workflows:

| Workflow | Run | ubuntu-24.04 | windows-2025 |
| --- | --- | --- | --- |
| `Verify U01 baseline` | `45316600279` | **success**, 38/38 steps | **success**, 38/38 steps |
| `Uno Bootstrap Verify` | `45316600154` | **success** | **success** |

The same hosted matrix still executes and passes U01, U03 published HTTP/Chromium, the three-Site P6 runner, the safe-query suite, the U04 slice and the U04 22-module runner on both operating systems, and it still prints `PASS U04_LABEL U04_PARITY=3/17` — proof that WO-102 D1 is preserved and that no false A2 bit was introduced.

**A2 evidence matrix — 14 flags, all `false`, and the reason is stated rather than papered over.** No HTTP or Chromium probe was run for these two families in this run, so every dimension is unobserved: `table` `source/reader/renderer/http/browser/refusal/rights` = false, `list` likewise. Reader and renderer proofs do exist for the **destination** surface (the new suite), but the order's dimensions require a real recovery-armed production server and a real browser at 390 and 1280 px, which this run did not stand up. The runner `scripts/verify-u04-22-module-consent.mjs` was **not modified** and still calls the oracle at `A1`.

## 4. Exactly what remains — D2b and D3

**D2b — publication-verified `route`.** Reader: admit `routeTarget` only as a lexical intent (reuse `isPageRoutePath()`, rejecting leading slash, host, scheme, locale prefix, `..`, percent escape, query, fragment and backslash) and never as an `href`. Serving: in `src/config/uno-serving.ts`, inside the existing `planUnoServingPage()` decision, project each distinct intent through the **same** stored binding and `planUnoPublishedPage()` gate — stored canonical origin and prefix, same entity/facet/site, exact authored full locale, `public`, exact authored route, and `canonicalUrl` equal to the stored candidate address — then pass an immutable positional map of proven URLs to the server renderer; any absent, draft, unlisted, wrong-Site, wrong-locale or forged target must refuse the **whole source Page** through the existing approved 404. No `new URL(route, requestHost)`, no `sites[0]`, no default owner, no recursion into `planUnoServingPage()`. Tests: the wrong-Facet, reused-`siteId`, shared-host, wrong and absent locale, unlisted, draft, forged-candidate, foreign-Host, missing-binding, alias and malformed-path matrix, plus loopback positives on two unrelated hosts and a shared-host `/docs` prefix.

**D3 — actual credit.** Extend the recovery-armed U04 fixture with one rich `table` and one four-item `list` (safe `href`, proven same-Site `route`, declared inert `link`), install a genuinely published target Page in the same transaction, build and start a fresh server, run real HTTP and Chromium at 390 and 1280 px in light, dark and reduced-motion, assert caption, `th[scope]`, focusable scroll, real anchors versus inert label, no off-origin requests and no overflow, then restore declarations, source and media with exact digest proof in `finally`; extend the three-Site P6 runner with cross-Site route-intent positives and refusals while preserving its 154 checks and both restoration phases; add the seven mutation-sensitive A2 regressions to `tests/deployment/u04-family-closure.test.mjs`; and only then call the unchanged oracle with `checkpoint:"A2"` for `PARITY_TABLE=PASS`, `PARITY_LIST=PASS`, `5/17`, `47/59`.

## 5. Preservation, residue and limits

Declarations, frozen documents, workflows, the closure oracle, the module registry, `package.json`, the lockfile, `src/proxy.ts`, `src/core/safe-author-url.ts`, `src/core/page-route-path.ts` and the private A2 patch/test are all unchanged; the two protected artifacts are byte-identical. No dependency, provider, DNS, deployment, release, tag, merge, parent or sibling-repository action was taken; no fixture was mutated in this run, so no restoration phase existed and no `.temp/uno-wo103-*` residue remains (the one JSON reporter scratch file was deleted). The tree is clean at the report head.

Limits stated plainly: `route` remains refused, so the `route` half of `U04-A2-SAFE-REFERENCE-01` is **not** implemented; the fourteen A2 flags are unobserved; the D1 Markdown-lede gap is now closed for `table` and `list`; and the parity oracle was never invoked at `A2`. This run delivered the destination half of D2 as verified, hosted-green product rather than reporting research, and it did not manufacture credit it did not earn.

## 6. Disposition

`DELIVERED D2a, D2b PENDING`. Requesting Architect review of the D2a increment and Owner direction for D2b/D3. U04 stays open; no stage closure, merge, release, deployment or provider action is conferred.
