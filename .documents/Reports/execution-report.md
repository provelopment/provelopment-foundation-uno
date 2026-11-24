# Execution Report — UNO-WO-104 / R01

**Truthful outcome: M1 delivered and hosted-green; M2 (D3 parity proof) not completed.** The publication-proven `routeTarget` capability is committed and independently verified on Ubuntu 24.04 and Windows 2025; `table` and `list` remain **uncredited**, and the only parity label ever printed is the unchanged A1 row **`U04_PARITY=3/17`, `U04_PROXY=45/59`**.

| | |
| --- | --- |
| Order | `UNO-WO-104 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **42,472 bytes**, SHA-256 `9499a59c8689ca03258321e832000d57564564f100f6ad00ad35442f1f1a37ad` — read from its ignored private slot, never staged, never published |
| Policy | Owner-reaffirmed `U04-A2-SAFE-REFERENCE-01`; no route, link, Site, provider or publication authority added |
| Start SHA | `04a425c165a17a181ec83592eb1e499b54270be1` (sanitised WO-103 report head) |
| Accepted ancestors | D1 product `140cb132…`, D2a product `734a345…` — preserved, not rewritten |
| **M1 product SHA** | **`604754ebf66cf40f3246f9539defaa10cb1b9d66`** (non-force push to the single Uno `origin/main`) |
| Report SHA | this commit, report-only, after the M1 product SHA |
| A2 credit | **none.** No `5/17`, `47/59`, `PARITY_TABLE=PASS` or `PARITY_LIST=PASS` is claimed; the oracle was not invoked at `A2` |

## 1. Preflight — agent-observed, bounded, once

Sole verified Uno checkout; empty `git rev-parse --show-prefix`; branch `main`; exactly one worktree and one remote (Uno's own `origin`); clean index and tracked tree; `HEAD == main == origin/main == git ls-remote origin main == 04a425c…`. Frozen Git blobs `AGENTS.md` `94f962d1…`, `README.md` `690f0870…`, `.documents/SOP/sop-implementation.md` `f30d6590…`, `verify-bootstrap.yml` `caac7d65…`, `verify-u01.yml` `8d19319d…`; declaration SHA-256 `b6213ed6ee2d…` and `58011c4324f5…`; protected WO-086 artifacts `5e40963895d2…` (90,536 B) and `1cdddb38a91b…` (17,405 B) — all unchanged before and after, and the protected pair was neither applied nor altered. Donor pins were treated as previously verified read-only facts.

## 2. M1 delivered — `routeTarget` proven by the existing publication gate

**Reader (`src/core/page-document.ts`).** The list-item union gains exactly one further form, so an item carries **at most one** of `href`, `linkId`, `routeTarget`; any two refuse. `routeTarget` is validated only as a lexical intent through the unchanged `isPageRoutePath()`, so a leading slash, host, scheme, locale prefix, `..`, percent escape, query, fragment, backslash, mixed case or over-long route refuses as `document:invalid-props`. It never becomes an `href` in the reader, and the legacy no-destination JSON and HTML stay byte-identical.

**Composer (`src/application/compose-uno-foundation-families.ts`).** Donor `route` now maps to `routeTarget` through the same strict text reader; nothing is concatenated, no Host, locale or Site is inferred and no planner is called. The existing at-most-one donor check and `links` forwarding are unchanged.

**Serving (`src/config/uno-serving.ts`) — the only new authority-bearing seam, and it adds none.** `collectRouteIntents()` walks **all** sections and nested layout children of the accepted Page and keys each occurrence deterministically `${section.id}:${itemIndex}`. `projectRouteTargets()` then proves each **distinct** intent once per request:

- *Qualified v2*: `buildUnoSiteRouteIndex()` must accept and yield **exactly one** candidate with the source Page's own `entityId`, `facetId`, `siteId` and full `localeTag` at the exact `routePath`; host, prefix and address come from that stored candidate, never from the request; `loadUnoCandidateSource()` must return that same candidate; `planUnoPublishedPage()` must accept with `delivery.public`, `sameQualifiedPage`, identical identity on all four axes and exact route, and `delivery.canonicalUrl === candidate.address`.
- *Legacy v1*: `buildUnoCandidateRouteIndex()` must accept and yield exactly one candidate with the same accepted Site and full locale at the exact relative route; the source is loaded and planned against the **stored** base `{canonical, aliases}`, and the plan must be `public` with identical identity on all four axes and exact route.
- Any missing, draft, unlisted, wrong-Facet, reused-`siteId`, wrong-Site, wrong-locale, ambiguous, unreadable, malformed-JSON or mismatching target returns one closed refusal, and `planUnoServingPage()` consequently returns `serving:publication-refused` for the **whole source Page** — before React, with no partial list and no silent conversion to inert text.

**Transport.** `UnoServingPageOutcome` and `UnoServingDecision` gain an **optional** `routeHrefs: ReadonlyMap<string,string>`; callers cannot supply it, and the no-intent branch keeps its previous observable shape. `page.tsx` forwards it to `UnoPageSections`, which renders an anchor for a `routeTarget` **only** when the map holds that exact `${node.id}:${itemIndex}` key; otherwise the label stays inert text. The renderer still performs no I/O, no `new URL`, no header read and no planning.

**Tests.** `tests/unit/uno-family-list-links.test.ts` grows to nine cases: exact `routeTarget` roundtrip with **no** `href` and no anchor; an anchor rendered only under the exact proof key, with wrong-key and empty-map cases proven not to invent one; ten malformed/crossed route refusals (`/notes`, `../notes`, query, fragment, `Notes`, five segments, `%2f`, empty, padded, backslash) plus `href`+`route` and `linkId`+`route`; and a composer case proving donor `route` becomes `routeTarget` with no `http` and no `href` in the composed document. Three previously correct refusal pins became stale the moment `route` composed and were updated to the now-correct reason (`family:target-refused`), not deleted.


## 3. Verification actually executed at the M1 product SHA

| Gate | Result |
| --- | --- |
| `pnpm test` | **1,287 passed / 1,287** (34 files) |
| `pnpm test:architecture` | **47 passed / 0 failed** |
| `pnpm lint` / `pnpm typecheck` | clean |
| `pnpm build` | fresh successful Next 16.4.6 production build |
| `git diff --check`, staged review | clean; exactly the seven allowlisted paths |
| `Verify U01 baseline` | run **45321867191** — ubuntu-24.04 **success 38/38**, windows-2025 **success 38/38** |
| `Uno Bootstrap Verify` | run **45321867011** — **success** on both legs |

Hosted output at this exact SHA still prints `U04_PARITY=3/17`, so D1 and D2a are intact and no false A2 bit exists. Changed paths: `src/core/page-document.ts`, `src/application/compose-uno-foundation-families.ts`, `src/config/uno-serving.ts`, `src/components/uno-page-sections.tsx`, `src/app/(site)/[...segments]/page.tsx`, `tests/unit/uno-foundation-families.test.ts`, `tests/unit/uno-family-list-links.test.ts`.

## 4. M2 not completed — the exact remaining evidence

The fourteen A2 flags stay **`false`** for both families (`source`, `reader`, `renderer`, `http`, `browser`, `refusal`, `rights`): this run produced **no** recovery-armed `next build`/`next start` for the A2 fixture, **no** Chromium pass at 390 and 1280 px in light, dark and reduced motion, and **no** executed cross-Site P6 route matrix. Reader-, composer- and renderer-level route proofs exist and are committed, but they are not the production observations the oracle requires. Consequently `scripts/verify-u04-22-module-consent.mjs` was **not** modified and still invokes the oracle at `A1`; the oracle itself, its checkpoints and every CI workflow are untouched.

Remaining work, precisely: install the A2 fixture variant inside the existing recovery-armed transaction (list index 2 with plain, `href`, `route:"wo104-target"` and `link:"help"` items plus a Markdown `detail`/`lede` and closed `surface`; Markdown `caption`/`lede`/`surface` on table index 13 while preserving the 17 family IDs and the A1 prose/callout values); add one **published public** `wo104-target` Page and, in separately restored permutations, a draft and an unlisted target; rebuild and start a fresh server per permutation and assert real 200/404 behaviour plus caption, `th[scope]`, focusable scroll, real anchors versus inert label, and no off-origin request or overflow; extend the three-Site P6 runner with cross-Site route positives and refusals on unrelated hosts and a shared-host `/docs` prefix while preserving its 154 checks and both restoration phases; add the seven mutation-sensitive A2 regressions to `tests/deployment/u04-family-closure.test.mjs`; and only once all fourteen flags are observed, change the runner's invocation to `checkpoint:"A2"` and require the unchanged oracle to print `PARITY_TABLE=PASS`, `PARITY_LIST=PASS`, `5/17`, `47/59`. No URL, Host, locale or Site authority may be added to reach that state.

## 5. Preservation and residue

Declarations, frozen documents, workflows, the oracle, the module registry, `package.json`, the lockfile, `src/proxy.ts`, `src/core/safe-author-url.ts`, `src/core/page-route-path.ts` and the private A2 pair are unchanged and hash-verified. No dependency, provider, DNS, deployment, release, tag, merge, parent or sibling action was taken. The tree is clean at the report head and no task scratch file remains.

## 6. Disposition

**M1 delivered, uncredited; M2 outstanding.** Requesting Architect review of the M1 increment and Owner direction for M2. U04 stays open; no stage closure, merge, release, deployment or provider action is conferred.
