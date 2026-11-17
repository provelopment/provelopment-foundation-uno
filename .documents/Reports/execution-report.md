# UNO-WO-028 / R01 — Explicit Page publication, locale serving and discovery integrated; nothing published

**Work order:** `UNO-WO-028 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 21,685 bytes, SHA-256 `503d2cde8b3b10e0fb35bc4d40c887f45f93bdb9d1d63a9cc052a8d3eff47fe0`,
heading `UNO-WO-028 / R01 — Integrate explicit Page publication, locale serving and SEO`; verified byte-for-byte
before any write; ignored, untracked, unstaged, never printed, never committed.
**Owner decision:** the activation approves the integrated U03 contract in §3.
**Push authorization:** the activation contains `AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`.
**Required start = actual start:** `f86817f2c704ca90d293c111de91bae4eee23daf`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `PUBLICATION_AUTHORITY` | **PASS** | optional Page key `publication: "draft" \| "published"`; absent and `draft` are not published; one new closed code `page:invalid-publication` |
| `NO_INFERENCE` | **PASS** | no Site default, no `public` property, no file/route/Site/host inference; committed manifest declares none and was not edited |
| `PUBLISHED_PAGE_PLAN` | **PASS** | `plan-uno-published-page` composes six accepted contracts; the candidate's own validated Page must declare `published` |
| `DISCOVERY_PLAN` | **PASS** | `plan-uno-public-discovery` emits sorted canonical entries and same-Page alternates; unlisted Pages excluded everywhere; `x-default` only for a public default-locale Home |
| `SERVING_BOUNDARY` | **PASS** | `src/config/uno-serving.ts` is the only server IO boundary; one `process.cwd()`, no env, host, proxy header or geo fallback |
| `REAL_ROUTES` | **PASS** | localized segment, `robots.txt` and `sitemap.xml` exist and refuse everything the committed declaration does not publish |
| `SAFE_MARKDOWN` | **PASS** | React text nodes only; no `dangerouslySetInnerHTML`, no raw HTML, image, link, table or block quote; unsupported input fails the whole document |
| `PRODUCTION_404_TRUTH` | **PASS** | `/en`, `/en-001`, `/en-001/about`, `/en-001/home`, `/de`, unknown, `/robots.txt`, `/sitemap.xml` all real 404 (§5) |
| `PUBLIC_DEMONSTRATION_INTACT` | **PASS** | U01 HTTP **103 / 0** unchanged; `/` still 200, noindex, one `h1`, no canonical or `hreflang` |
| `FOCUSED_TESTS` | **PASS** | **34** new cases (94 / 17 / 11 across the three suites) with real confined fixtures |
| `BASELINE_PRESERVED` | **PASS** | 733 unit tests over 23 files (697 + 36); 40 architecture checks (36 + 4); no skipped or weakened test |
| `LOCALE_LANGUAGE_ATTRIBUTE` | **UNVERIFIED** | the byte-frozen root layout renders `<html lang="en">`; a truthful per-Page attribute is impossible without changing it |
| `POSITIVE_PUBLIC_HTTP` | **NOT CLAIMED** | no committed Page is published and no domain exists; positive decisions are proved against fixtures only |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, deploy, alias, domain, promotion or settings change |
| `STAGE` | U03 **OPEN** | no domain chosen, no committed Page published, no release or closure |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`61fdf762f0beec9580b0e052aa542a5f0d6ffd2e`** | exactly seventeen ledger paths; direct child of `f86817f` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Op | Path | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | EDIT | `src/core/efs/manifest-graph.ts` | `d08d213e…` → `76e9ef09…` | 30,457 |
| 2 | EDIT | `tests/unit/efs-manifest-graph.test.ts` | `2b166c66…` → `3891e4b0…` | 38,998 |
| 3 | CREATE | `src/application/plan-uno-published-page.ts` | ABSENT → `ef1dd48e…` | 14,897 |
| 4 | CREATE | `tests/unit/efs-uno-published-page.test.ts` | ABSENT → `376581a2…` | 17,638 |
| 5 | CREATE | `src/application/plan-uno-public-discovery.ts` | ABSENT → `c98aca51…` | 15,706 |
| 6 | CREATE | `tests/unit/efs-uno-public-discovery.test.ts` | ABSENT → `8417cee5…` | 12,714 |
| 7 | CREATE | `src/config/uno-serving.ts` | ABSENT → `3a89bf92…` | 17,337 |
| 8 | CREATE | `src/app/[locale]/[[...segments]]/page.tsx` | ABSENT → `97948ac2…` | 6,122 |
| 9 | CREATE | `src/app/robots.txt/route.ts` | ABSENT → `e29bcc4b…` | 1,189 |
| 10 | CREATE | `src/app/sitemap.xml/route.ts` | ABSENT → `ec329af3…` | 1,157 |
| 11 | CREATE | `src/components/uno-safe-markdown-page.tsx` | ABSENT → `8f3b95ac…` | 7,921 |
| 12 | CREATE | `scripts/verify-u03-http.mjs` | ABSENT → `efb9ff48…` | 9,971 |
| 13 | EDIT | `.github/workflows/verify-u01.yml` | `e373acef…` → `ac55b963…` | 5,137 |
| 14 | EDIT | `tests/architecture/u01-boundaries.test.mjs` | `bb048eea…` → `664f1e1f…` | 54,108 |
| 15 | EDIT | `.documents/Architecture/source-inventory.md` | `d7864318…` → `56b6d895…` | 119,830 |
| 16 | EDIT | `.documents/WIP/plan-roadmap.md` | `d052728c…` → `1c7a005c…` | 10,202 |
| 17 | OVERWRITE | `.documents/WIP/plan-next.md` | `80a1b6d9…` → `913e0519…` | 1,602 |

Seven editable start blobs matched, all ten CREATE destinations were absent, `git diff --cached --check` was clean,
ACTIVE was never staged, and the working tree was clean at the product head.

## 3. Guards (sanitized)

| Guard | Result |
| --- | --- |
| ACTIVE | one private file at the expected path, 21,685 bytes, digest and heading matching the activation, ignored, untracked, unstaged, absent from every diff |
| Physical root | the single Uno checkout resolved physically; no symlink, junction or reparse alias on the checkout or its ancestors |
| Parent and siblings | parent-owned anchored `/00.foundation-uno/` ignore rule verified and unchanged; parent, Foundation, Solo and every sibling path and remote strictly read-only |
| Git | one worktree, `main`, exactly one fetch/push remote `origin` for `provelopment/provelopment-foundation-uno`, no mirror; no reset, rebase, force, clean or amend |
| Head and remote | `HEAD` = `origin/main` = `f86817f` at start and re-read immediately before the push, where it had not moved |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, the ignored private ACTIVE, `plan-outlook.md` |
| Pins | **29 / 29** immutable anchors byte-identical; **7 / 7** editable start blobs matched; **10 / 10** CREATE paths ABSENT |
| Runtime | Node 26.13.1 and pnpm 11.6.0; frozen install in-root; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 4. What was built

**A. Explicit publication authority (3A).** The manifest Page validator accepts exactly one additional optional
own-data key, `publication`, whose only literals are `"draft"` and `"published"`. Absent and `"draft"` are not
published; a declared literal is kept verbatim and frozen on the validated Page. An invalid value refuses as the one
new closed code `page:invalid-publication`; unknown keys still refuse as `shape:unsupported-field`; an accessor is
refused with **zero invocations**; symbol keys and exotic prototypes refuse as `input:unreadable`. There is no
Site-level publisher, no manifest default, no `public` property and no inference from a file, a route candidate, a
selected Site, a host or an environment. `deployment/efs/manifest.json`, `deployment/uno.config.json` and the Home
Markdown were **not edited**: the authored Home remains unpublished and the declaration remains base-free.

**B. Published-Page planner (3B).** `planUnoPublishedPage` takes exactly `{manifest, selection, base, pathname,
loadedSource}` and composes — never duplicating — the manifest graph, the stored locale authority, the selection, a
caller-proposed base, the route matcher, the accepted delivery candidate with its header and discoverability
classifications. It returns a deeply frozen `{identity, document, delivery}` with the exact canonical URL, public and
unlisted flags, robots intent, indexability and eligibility, or one of fourteen closed `publication:` literals. The
publication gate is the candidate's **own validated Page**, so a valid file, a `public` property, a matched route, a
selected Site or an accepted delivery candidate can never publish anything by itself.

**C. Discovery planner (3B).** `planUnoPublicDiscovery` takes exactly `{decisions, locales}` and emits sorted
canonical entries with same-Page locale alternates. It refuses mixed Sites, undeclared locales, duplicate URLs
(case-insensitively too), duplicate Page locales, unusable or non-ASCII URLs, oversized collections and contradictory
decisions. Only `public` Pages appear; `unlisted` Pages are absent from every entry, every alternate and every
`x-default`, and `x-default` is emitted only for a published public default-locale Home.

**D. Serving integration (3C).** `src/config/uno-serving.ts` is the only server IO boundary: it reads the two fixed
declarations from `process.cwd()` — used once, never from a request — resolves the committed base through
`resolveUnoCommittedBase`, loads one address through the confined loader and refuses unless the base, the Page's own
publication, the source and the authority all agree. `src/app/[locale]/[[...segments]]/page.tsx` renders one visible
`h1`, the description and the inert Markdown body, with per-Page title, description, canonical, OG URL and robots;
a JSON Page is refused for serving until its versioned contract and renderer exist in U04. `robots.txt` and
`sitemap.xml` are generated only from a valid base and a public discovery plan, XML-escaped, bounded and `no-store`;
without them both are real 404s. No `basePath`, rewrite, proxy, tenant gateway, provider call or domain exists.

**E. Safe Markdown (3C).** `src/components/uno-safe-markdown-page.tsx` parses a small subset (headings `##`–`######`,
paragraphs, lists, fenced code) into inert blocks and renders them as React children. Raw HTML, images, links, block
quotes, tables, a second `h1`, an unclosed fence, an unsupported language and any cap breach fail the whole document,
and the caller answers 404 rather than rendering a partial page.

**F. Route honesty note.** The segment declares `generateStaticParams` over the addresses the *same* gate accepts and
`dynamicParams = false`, so an address the committed declaration does not publish is refused by the router with the
ordinary fully rendered 404 document. This was deliberate: a purely streaming `notFound()` produced a 404 whose
visible page required hydration, which degraded the approved 404 copy and broke the frozen U01 HTTP contract. The
address set is derived from the same declarations at build time, so publication still controls it; the committed
build produces an empty set.


## 5. Test evidence — 34 new cases, real confined fixtures, both HTTP truths

| Suite | Cases | What is proved |
| --- | ---: | --- |
| `efs-manifest-graph` | 94 (86 + 8) | absent publication stays absent; both literals kept and frozen; eight invalid spellings refused as `page:invalid-publication`; unknown key refused; accessor with zero invocations; symbol and exotic prototype; publication refused on Entity, Facet and Site; the committed manifest is unpublished |
| `efs-uno-published-page` | 17 | **real synthetic fixture root** (`deployment/efs/manifest.json`, `deployment/uno.config.json`, three Markdown and two JSON sources) read through the **real confined loader**: published public Home, published Markdown About, published **unlisted** JSON Page; exact canonical URLs and robots intent; the planner's own decisions fed into discovery (unlisted excluded, `x-default` correct); absent/draft/invalid publication refused; invalid base; unknown and wrong-locale addresses; invalid JSON with a declared Markdown fallback refused; forged loader records (`pageId`, `accepted:false`, extra key, empty sources) refused as `publication:source-refused`; forged kind and body refused by the header projector; hostile accessor with zero getter calls; throwing proxy; vocabulary frozen; refusal echoes nothing; the committed deployment serves no Page, lists no address, plans no discovery and emits no robots or sitemap |
| `efs-uno-public-discovery` | 11 | sorted canonical entries and same-Page alternates; unlisted excluded from entries, alternates and `x-default`; duplicate URL (case-insensitive); duplicate Page locale; second Site; undeclared locale; invalid locale policy; five unusable URLs; malformed and contradictory decisions; empty and oversized requests; order-independent, fresh and frozen output; hostile accessor, symbol and proxy |

**Broad local gates.**

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — both dependency blobs unchanged |
| Focused suites | **122 / 122** (3 files) |
| `node scripts/verify-governance-docs.mjs` | PASS — three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** |
| `pnpm test:bootstrap` | **19 / 19** |
| `pnpm test:architecture` | **40 / 40** (36 + 4) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **733 passed / 733**, 23 files — 697 previous + **36 new** |
| `pnpm build` | PASS — `/`, `/_not-found`, `/icon.svg` static; `/[locale]/[[...segments]]`, `/robots.txt`, `/sitemap.xml` present |
| `pnpm test:http` | **103 passed, 0 failed** — every prior assertion, including the 404 page's own copy |
| `node scripts/verify-u03-http.mjs` | **91 passed, 0 failed** |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean |

**Real production HTTP statuses (loopback, production build).** `/` **200** with its approved copy, one `h1` and
`noindex, nofollow`, and no canonical or `hreflang`. `/en`, `/en-001`, `/en-001/about`, `/en-001/home`, `/de`,
`/en-001/does-not-exist`, `/robots.txt` and `/sitemap.xml` each **404**, with no `Location`, no `rel="canonical"`, no
`hreflang`, no `<urlset`, no `Disallow:`, no `Sitemap:` and no `<article>` body. The refused documents advertise no
document content type and never claim an indexable response; the HTML 404s carry the approved not-found page.

**Warnings, disclosed.** Two **moderate** advisories remain — the same dev-only `minimatch` denial-of-service family
(`>=7.0.0 <11.0.1`, patched `>=11.0.1`) reached only through the ESLint toolchain, never a runtime or production
dependency path. They are recorded, not waived: the blocking threshold is zero high or critical, and zero is what the
gate reports.

**Gates not claimed.** `LOCALE_LANGUAGE_ATTRIBUTE` is **UNVERIFIED**: the frozen root layout renders `<html lang="en">`
and this order forbids editing it, so a served `en-001` Page would carry a wrong language attribute. No positive public
HTTP response is claimed, because the committed declaration publishes nothing.


## 6. Hosted CI

**Product head `61fdf762f0beec9580b0e052aa542a5f0d6ffd2e` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `44032323343` | success | success | 25 / **0** |
| Uno Bootstrap Verify | `44032323521` | success | success | 10 / **0** |

The U01 workflow now runs the new blocking `node scripts/verify-u03-http.mjs` step after the production build and the
existing English-demonstration HTTP gate; every prior step is preserved and none uses `continue-on-error`. The
bootstrap workflow is byte-identical. Log **text** is **UNVERIFIED** — this client reads job and step conclusions only.
The report-only head repeats the same four jobs; its run IDs are returned privately to the Owner.

## 7. Rights, privacy and cleanup

**Provenance.** All new files are original **Uno-owned** work, class **NEW** (with a **REWRITE concept** for the
composition); the pinned read-only Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`
(`src/core/page-document.ts`, blob `a12d964c…`) remains comparison context with **no code copied**. No Foundation,
Solo or Connect source, image, brand, fixture or licence-uncleared asset was used; Apache-2.0 `LICENSE`/`NOTICE` and
the 17-family / 22-module requirements are intact.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or unpublished external content appears in
the product commit, CI or this report. No guard was weakened, no threshold raised, no workflow bypassed and no test
skipped. The committed declaration, the committed manifest and the Home Markdown were not edited; no domain, origin
or placeholder was installed. `deployment/**`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx`,
`next.config.ts`, `package.json`, the lockfile and every brand asset are byte-identical.

**Provider actions: zero.** No provider API call, deployment, promotion, alias, domain or settings change; the only
external effect was the authorized non-force Git push and any build the existing Git integration starts from it.

**Cleanup.** Task-owned `.temp/` scratch (fixture probe, pin script, command logs, fixture roots) removed; `.next`,
`node_modules` and the package store stay ignored; no unknown file was deleted; the tree is clean at the product head;
the private ACTIVE remains ignored and unstaged.

## 8. What remains unimplemented — U03 stays OPEN

1. **No canonical domain.** The committed declaration states no base; choosing the real HTTPS origin is an Owner
   decision this Agent must not infer.
2. **No published Page.** The committed manifest declares no publication, so the committed deployment serves no
   localized page, no `robots.txt` and no `sitemap.xml`.
3. **No positive live HTTP or browser proof.** Positive decisions are proved against synthetic confined fixtures; a
   positive *public* response requires a domain and an explicit publication first.
4. **No JSON Page rendering.** A JSON body is classified but refused for serving until its versioned document
   contract and renderer exist (U04).
5. **Wrong language attribute.** The frozen root layout forces `<html lang="en">`; a truthful per-Page attribute needs
   an Owner-approved change to that file. Reported **UNVERIFIED**, never claimed.
6. **Build-time address set.** The localized route enumerates its addresses from the same declarations at build time,
   so publishing a new Page requires a rebuild, exactly as a file-based site does. This is disclosed as a design
   consequence, not hidden.
7. **Provider state.** Production SHA, build log and analytics remain **UNVERIFIED** by this Agent.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint:
explicit Page publication authority with one closed code, two composed planners, one server boundary, three real
surfaces that refuse the unpublished committed deployment with fully rendered 404s, safe Markdown presentation, 34 new
fixture-driven cases, 733 unit tests and 40 architecture checks green, U01 HTTP 103/0 preserved, U03 HTTP 91/0,
zero provider actions and U03 still open.
