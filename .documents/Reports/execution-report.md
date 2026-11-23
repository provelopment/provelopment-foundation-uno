# Execution Report — UNO-WO-093 / R01

**STOPPED — the 404 boundary is not repairable inside the authorized ledger.**

This file replaces its previous contents under the one authorized overwrite. `UNO-WO-093 / R01` produced the complete P4/P5 serving composition and a working host-qualified route: `/en-001` served 200 with its reserved canonical, `/en` answered one 307, and `pnpm test:http` reached **104/105**. The single remaining failure is the approved 404 document, and it could not be produced from a root-level catch-all under a `(site)` route-group root layout by any means the ledger permits. The runtime change was therefore reverted in full rather than published red.

## 1. Authority and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-093 / R01`, `FINAL — EXECUTE` |
| ACTIVE | **18,240 bytes**, SHA-256 `19daaf8b4c342ddbb66dd418c5fb156ae9e229415a172ae0dc5ca5cc7e948433` — exact match; sole ACTIVE; ignored, untracked, unstaged |
| Start | `7c258172fa443e20268bffb4ce874473d7624cc5` — `HEAD`, `main`, `origin/main` and remote `main` equal |
| Physical | sole checkout (private path withheld), empty `--show-prefix`, one worktree, one `origin` at this Uno remote, clean index and worktree |
| A2 | `A2-tracked.patch` `5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87`, `uno-family-links.test.ts` `1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f` — unchanged, unapplied |
| Declarations | `manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`, `uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` — byte-identical at start and end; no transaction was armed, so no fixture exists and nothing required restoration |

P1–P3 and the WO-092 authority fixes were not repeated, and no administrative checkpoint was created.

## 2. What was built and what it proved

`src/config/uno-serving.ts` was rewritten as the single qualified authority: legacy version 1 preserved exactly, version 2 validated once through `validateUnoSiteAddressConfig` into an immutable all-Sites lookup, `{host, pathname}` request input with a strict authority grammar (scheme, credentials, path, space, bracket, empty label, doubled dot, wrong port and wrong case all refuse), exact Host-to-configured-origin comparison only, a Site passed unchanged from match to loader to planner with `facetId`/`siteId`/`entityId` and canonical equality enforced, per-Site locale policy, host-scoped discovery that plans each Site separately before combining public URLs, media authorised across the request Host's own bindings with refusal when a locator reads ambiguously, and host-scoped `robots.txt`/`sitemap.xml`.

The route tree became `(site)/[...segments]` with a **non-throwing** root layout that renders `<html><body>` and sets `lang` from the served Page's authored `localeTag` (neutral `en` on the refusal shell only), a Page that is the first 404 boundary, `generateMetadata` that returns non-indexable metadata instead of throwing, and one `React.cache`d decision keyed by the primitive Host and pathname. `next.config.ts` tracing moved to `'/[...segments]'`.

Two genuine defects in the new module were found and fixed by measurement, not assumption: both `planUnoServingPage` and `resolveUnoSiteDecision` read the pathname only from their positional argument, so the object form silently refused every request as `serving:input-invalid`. A temporary diagnostic test (created, run, deleted) proved the split exactly — string form `served`, object form `served`, decision `refused serving:input-invalid` — and after the fix the real production gate agreed.

Measured on real `next build && next start`: `/en-001` → **200** with the reserved canonical `https://uno-starter.example/en-001`; `/en` → **307** to that root; `pnpm test:http` → **104 passed, 1 failed**.

## 3. The one failure, and why it is not repairable here

The remaining failure is `the 404 page offers the demonstration homepage as its way back`. The response is a correct `404`, but its HTML carries no `href="/"`; the approved heading, sentence and link text appear only inside the RSC flight payload, and the anchor is present there as a client-module reference (`$L6`, i.e. `next/link`) rather than rendered markup. The document is Next's not-found shell (`id="__next_error__"`).

The ordered remedy was implemented exactly: the root layout never throws, the Page raises `notFound()`, `not-found.tsx` sits beside it, and metadata never throws. The child boundary is nevertheless **bypassed**, because the `(site)` group's root layout owns the `<html>` document and Next resolves the not-found to the application-level document instead of the segment boundary. Every variant the ledger allows produced the same result:

- `not-found.tsx` as `export { default } from '../../not-found'`;
- `not-found.tsx` as a self-contained component using a plain same-origin `<a href="/">`;
- root layout with and without `export const dynamic = 'force-dynamic'`;
- `experimental.globalNotFound` at its committed `true` and at `false`;
- full `.next` removal and a clean rebuild, to exclude a stale cached module.

In each case: status 404, `__next_error__` present, `href="/"` absent from HTML, flight payload unchanged. Producing the approved document needs one of: a `src/app/(site)/not-found.tsx` at the group root, a different grouping of the site root layout, or an edit to the read-only `global-not-found.tsx`. All three are outside the §3 ledger, so this is a genuine boundary/authority decision rather than an implementation defect.

## 4. Withdrawal

The runtime change was reverted in full: `src/config/uno-serving.ts`, `src/app/robots.txt/route.ts`, `src/app/sitemap.xml/route.ts`, `src/app/uno-media/[...segments]/route.ts`, `next.config.ts` and `src/app/(site)` restored from `7c25817`, and `src/app/(site)/[...segments]/` removed. The worktree and index are clean at `7c258172fa443e20268bffb4ce874473d7624cc5`, the committed `[locale]` route tree is back byte-identical, and the two committed declarations and both A2 artifacts are unchanged. No workflow, test assertion, threshold or permission gate was modified at any point; no `continue-on-error`, `if: false`, skip, stub or softened exit was introduced; no product code was published.

Because the product tree is byte-identical to a commit whose Ubuntu and Windows workflows were already green, no new CI run is claimed for it and none is required to prove its state.

## 5. Requested disposition

Owner decision on the 404 boundary, one of: (a) authorize `src/app/(site)/not-found.tsx` as the group-level boundary, (b) authorize replacing the `(site)` root-layout grouping with a structure in which a child `not-found.tsx` is honoured, or (c) authorize the minimal edit to the read-only `global-not-found.tsx` so the approved anchor is server-rendered. Any one of them unblocks a run that otherwise already reaches 104/105 with the qualified composition working, and P6 can then proceed unchanged.

Not requested: A2/M2 activation, stage closure, parity credit, merge, tag, release or deployment.
