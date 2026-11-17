# UNO-WO-029 / R01 — Positive publication proved over a real production build; committed deployment still unpublished

**Work order:** `UNO-WO-029 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 26,154 bytes, SHA-256 `f14294f9d97e5e67cbbd126efe9c5ebe4f83308de8d9f09ab685fe38d187d584`,
heading `UNO-WO-029 / R01 — Positive U03 publication HTTP, locale layouts and SEO`; verified byte-for-byte before any
write; ignored, untracked, unstaged, never printed, never staged.
**Push authorization:** the activation contains `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
**Required start = actual start:** `7a3ccbab5cfb3703c50d48635ed31957eb286118`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `POSITIVE_PRODUCTION_HTTP` | **PASS** | four published Pages answered **200** over a real `next build`/`next start` loopback server with the authored title, one `h1` and a safe body |
| `TRUTHFUL_LOCALE_DOCUMENT` | **PASS** | `<html lang="en-001">` and `<html lang="de-DE">` from the stored, validated locale authority |
| `CANONICAL_AND_HREFLANG` | **PASS** | exact canonical and OG URLs; same-Page `en-001`/`de-DE` alternates; **one** `x-default`, on the published default Home only, never on About |
| `ALIAS_REDIRECT` | **PASS** | `/en` answers **307** to `http://localhost:3000/en-001`; no other alias, no host or language guess |
| `ROBOTS_AND_SITEMAP` | **PASS** | `robots.txt` 200 `text/plain` naming the canonical sitemap and disallowing nothing; `sitemap.xml` 200 `application/xml` with exactly the four public URLs, both locales and no draft/unlisted URL |
| `STRICT_REFUSALS` | **PASS** | ten addresses refused with **404**, no redirect, no canonical/`hreflang`/OG and the approved 404 document |
| `FIXTURE_RESTORED` | **PASS** | both declarations restored byte-for-byte with matching SHA-256 and Git blobs; five fixture sources removed; `deployment/**` clean |
| `COMMITTED_UNPUBLISHED` | **PASS** | committed manifest still declares no `publication`; `uno.config.json` still states no base |
| `DEMONSTRATION_PRESERVED` | **PASS** | `/` unchanged: one `h1`, approved copy, `lang="en"`, noindex/nofollow, no canonical or `hreflang` |
| `BASELINE_PRESERVED` | **PASS** | unit 733/733, architecture 40/40, U01 HTTP **103/0**, U03 HTTP **91/0**, brand 29/29, security 16/16, readiness **101** checks, fixtures 69/69 |
| `HOSTED_CI` | **PASS** | product head: 4 jobs `success`, 26 steps, 0 failures; report head repeated below |
| `PROVIDER_ACTIONS` | **ZERO** | no Vercel/provider call, deployment, alias, domain or setting change |
| `STAGE` | U03 **OPEN** | no production origin, no permanent publication, no browser/accessibility proof, no U04 renderer |

## 2. Commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`d4cad1f49dd066ab3a080b5953d52799801bc034`** | exactly the seventeen ledger operations; direct child of `7a3ccba` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Op | Path | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | MOVE | `src/app/page.tsx` → `src/app/(demo)/page.tsx` | `837aad87…` (unchanged) | 9,335 |
| 2 | MOVE + CSS import | `src/app/layout.tsx` → `src/app/(demo)/layout.tsx` | `c7dc9392…` → `fd862652…` | 2,361 |
| 3 | MOVE + EDIT | `src/app/[locale]/[[...segments]]/page.tsx` → `src/app/(site)/[locale]/[[...segments]]/page.tsx` | `97948ac2…` → `edd31fcd…` | 7,813 |
| 4 | CREATE | `src/app/(site)/[locale]/layout.tsx` | ABSENT → `1df44e05…` | 2,661 |
| 5 | CREATE | `src/app/global-not-found.tsx` | ABSENT → `5bac4074…` | 1,632 |
| 6 | EDIT | `next.config.ts` | `ad198a02…` → `271506a1…` | 937 |
| 7 | EDIT | `src/config/uno-serving.ts` | `3a89bf92…` → `f36dc9d2…` | 19,450 |
| 8 | CREATE | `scripts/verify-u03-published-http.mjs` | ABSENT → `3c56a603…` | 33,374 |
| 9 | EDIT | `.github/workflows/verify-u01.yml` | `ac55b963…` → `d37bcc4f…` | 5,732 |
| 10 | EDIT | `scripts/verify-vercel-readiness.mjs` | `47f9a994…` → `8d71b515…` | 25,742 |
| 11 | EDIT | `tests/deployment/verify-vercel-readiness.test.mjs` | `6fa970ba…` → `9edb1271…` | 28,222 |
| 12 | EDIT | `tests/deployment/node26-security-floor.test.mjs` | `4df7910b…` → `001ec3fc…` | 12,454 |
| 13 | EDIT | `tests/deployment/uno-brand-copy.test.mjs` | `e3bc6321…` → `30f892c8…` | 17,636 |
| 14 | EDIT | `tests/architecture/u01-boundaries.test.mjs` | `664f1e1f…` → `4194e920…` | 55,521 |
| 15 | EDIT | `.documents/Architecture/source-inventory.md` | `56b6d895…` → `f8e8f0a7…` | 123,489 |
| 16 | EDIT | `.documents/WIP/plan-roadmap.md` | `1c7a005c…` → `9ffc7fc4…` | 10,320 |
| 17 | OVERWRITE | `.documents/WIP/plan-next.md` | `913e0519…` → `2e6318f9…` | 1,676 |

The three moved sources are staged as renames; the old paths are absent from the final tree.

## 3. Guards (sanitized)

| Guard | Result |
| --- | --- |
| ACTIVE | one private file, 26,154 bytes, digest and heading matching the activation, ignored, untracked, unstaged, absent from every diff |
| Physical root | the single Uno checkout resolved physically; no symlink, junction or reparse alias on the checkout or its ancestors |
| Parent and siblings | parent-owned anchored `/00.foundation-uno/` ignore rule unchanged; parent, Foundation, Solo and every sibling read-only |
| Git | one worktree, `main`, exactly one fetch/push remote `origin`, no mirror; remote re-read immediately before the push and unchanged |
| Head | `HEAD` = `origin/main` = `7a3ccba` at start; product head `d4cad1f` pushed non-force |
| Pins | **20 / 20** immutable anchors byte-identical; **15 / 15** editable and move sources matched their start blobs; **6 / 6** destinations untracked before the write |
| Runtime | Node 26.13.1, pnpm 11.6.0; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 4. What was built

**A. Two root layouts, one truthful language per document.** The demonstration moved intact into the `(demo)` route
group (`page.tsx` byte-identical, `layout.tsx` changed only in one CSS import depth), and the published Site moved into
its own `(site)` root. `src/app/(site)/[locale]/layout.tsx` owns `<html>` and `<body>` for a published Page and renders
the **authored** full tag it gets from `resolveUnoServingLocaleTag`: `de-de` maps back to `de-DE`, `en-001` to `en-001`,
and only an explicitly stored short alias (`en`) is reported as an alias for a redirect-only request. No Host, cookie,
`Accept-Language`, environment value or raw path is authority; an unknown or hostile key renders the 404.
`src/app/global-not-found.tsx` is the complete HTML 404 for an address matching no route — the approved visible copy, one
`h1`, the return link, `lang="en"`, `noindex, nofollow`, the same stylesheet, no analytics — enabled by the one approved
Next 16 flag `experimental.globalNotFound` beside the existing `devIndicators: false`.

**B. One source of SEO truth in the real HTML.** A public Page's `generateMetadata` consumes
`planUnoServingDiscovery()` — the same plan behind `robots.txt` and `sitemap.xml` — and emits the exact canonical URL,
the matching OG URL, the same-Page public locale alternates and the `x-default` the plan declares (Home only). A public
Page that cannot be found in that plan is refused rather than served with invented links; an unlisted Page keeps its own
canonical and `noindex,nofollow` with no alternate; a JSON body is still refused until U04's renderer exists. The
`[locale]` layout enumerates the published locales and the page enumerates the published route shapes, both from the same
publication gate, with `dynamicParams = false`, so an address that was never enumerated takes the router's 404 document
instead of streaming a shell.

**C. Restore-in-finally positive proof.** `scripts/verify-u03-published-http.mjs` (Node built-ins only, no shell, no
dependency, no network beyond loopback) refuses to start unless both committed declarations match their pinned SHA-256
and the five fixture sources are absent; backs both declarations up into ignored `.temp/wo029-*` scratch; installs the
synthetic fixture (two locales, four Pages, a short alias, base `http://localhost:3000`); validates it through the **real**
confined loader, planner and serving composition; builds and serves the real production output on `127.0.0.1` with an
ephemeral port; proves the positive and negative surface over real HTTP; then restores both declarations byte-for-byte and
removes exactly the five fixture files in an unconditional `finally`, rebuilds the **unpublished** configuration and
re-runs the two original HTTP gates against it.

## 5. Test evidence

| Gate | Result |
| --- | --- |
| Positive/negative production HTTP (`verify-u03-published-http`) | **195 passed, 0 failed**, exit 0 |
| Original U01 HTTP, re-run inside that gate after restoration | **103 passed, 0 failed** |
| Original U03 fail-closed HTTP, re-run after restoration | **91 passed, 0 failed** |
| `pnpm test` | **733 / 733**, 23 files |
| `pnpm test:architecture` | **40 / 40** |
| `pnpm test:bootstrap` | **19 / 19** |
| governance docs + fixtures | PASS, **9 / 9** |
| `pnpm lint` / `pnpm typecheck` | exit 0 / exit 0 |
| `pnpm build` | PASS |
| readiness fixtures / CLI | **69 / 69** / **101 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | **16 / 16** / **29 / 29** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean |

**Real HTTP statuses in the fixture run.** `/en-001`, `/de-de`, `/en-001/about`, `/de-de/about` **200** with the authored
title, one `h1`, `lang` = `en-001`/`de-DE`, exact canonical and OG URLs and correct alternates. `/en` **307** →
`http://localhost:3000/en-001`. `/robots.txt` **200** `text/plain`; `/sitemap.xml` **200** `application/xml` with exactly
four `<loc>` entries and one `x-default`. `/` **200** with the unchanged demonstration. `/en-001/draft`, `/de-de/draft`,
`/en-001/hidden`, `/de-de/hidden`, `/en-001/wo029-about`, `/xx-001`, `/en-001/does-not-exist`, `/en-us`,
`/en-001/about/extra` and `/de` each **404**, with no redirect and no advertised link. In the committed configuration every
localized address remains a **404** with the approved document.

**Warnings, disclosed.** Two **moderate** advisories remain — the same dev-only `minimatch` denial-of-service family,
reachable only through the ESLint toolchain. Zero high and zero critical is what the blocking gate reports. Turbopack
reports a benign "dynamic filesystem access" tracing warning for the serving composition; it is expected because that
module deliberately reads the fixed declarations, and it changes no content or routing.


## 6. Hosted CI

**Product head `d4cad1f49dd066ab3a080b5953d52799801bc034` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `44037758112` | success | success | **26** / **0** |
| Uno Bootstrap Verify | `44037758182` | success | success | 10 / **0** |

The U01 workflow runs the new blocking `node scripts/verify-u03-published-http.mjs` step after `pnpm build`,
`pnpm test:http` and `node scripts/verify-u03-http.mjs`, before the readiness gates, on **both** hosts. No prior step was
removed, skipped, muted or made non-blocking; the bootstrap workflow is byte-identical. Actual log **text** is
**UNVERIFIED** — this client reads job and step conclusions only. The report head repeats the same four jobs; its run IDs
are returned privately to the Owner.

## 7. Rights, privacy and cleanup

**Provenance.** All new and changed files are original **Uno-owned** work, class **NEW / REWRITE concept**; the pinned
read-only Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains comparison context with **no code
copied**. The five fixture documents are short original test text with no external link, image or HTML. No dependency,
SDK, asset, secret or licence changed; Apache-2.0 `LICENSE`/`NOTICE`, the brand ledger and the 17-family / 22-module
obligations are intact and explicitly **not** delivered by this order.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or fixture publication content appears in the
product commit, the workflow, CI output or this report. The fixture base is the literal test-only
`http://localhost:3000` and was never committed: `deployment/efs/manifest.json` and `deployment/uno.config.json` are at
their original blobs (`84866290…`, `fda8188c…`) with no `publication` and no base.

**Provider actions: zero.** No provider API call, deployment, promotion, alias, domain or settings change; the only
external effect was the authorized non-force Git push and any build the existing Git integration starts from it.

**Cleanup.** Task-owned `.temp/` scratch (probe scripts, pin script, command logs, fixture backups) removed; `.next`,
`node_modules` and the package store stay ignored; no unknown file was deleted; the tree is clean at the product head; the
private ACTIVE remains ignored and unstaged.

## 8. What remains — U03 stays OPEN

1. **No production origin.** The committed declaration still states no base; choosing the real HTTPS canonical origin is
   an Owner decision this Agent must not infer. The proof above uses a test-only loopback base.
2. **No permanent publication.** The committed manifest declares no `publication`, so the deployed site serves the
   demonstration only and answers real 404s everywhere else.
3. **No browser, accessibility or crawler proof.** The HTTP gate inspects real responses, not a rendered browser, and
   claims no Lighthouse, assistive-technology or search-engine behaviour.
4. **Rebuild-to-publish.** A published address exists only after a build enumerates it, exactly as a file-based site
   does; the operational trigger for that rebuild is an Owner release decision.
5. **No JSON renderer.** A published-but-unlisted JSON Page is classified and refused; U04's versioned document contract
   and renderer are still required before any JSON body may be served.
6. **Provider state.** Production SHA, build log and analytics remain **UNVERIFIED** by this Agent.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint: two
truthful root layouts, a validated per-locale document, canonical/`hreflang`/OG taken from the same discovery plan behind
`robots.txt` and `sitemap.xml`, one temporary alias redirect, four published Pages proved over a real production build
with ten strict refusals, a fixture restored byte-for-byte in `finally`, 195 positive/negative checks green, the original
103 and 91 fail-closed checks still green afterwards, 733 unit tests and 40 architecture checks passing, four hosted jobs
successful on Ubuntu and Windows, zero provider actions, and the committed deployment still unpublished.
