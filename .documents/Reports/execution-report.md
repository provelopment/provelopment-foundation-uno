# UNO-WO-019 / R01 — U02 closed by the Owner, U03 canonical candidate-address contract

**Order:** `UNO-WO-019 / R01` · FINAL — EXECUTE · **Activated order bytes:** 22,523 bytes, SHA-256
`7c85d15838875500b3c579b4d5460d10d12aadef242239ba2e90a3a3573e61a0` (verified before any work).
**Required start:** `6b1e9279bcf48a1af44305990ad4e8238e9d8d53` — matched `origin/main`, clean tree, one
worktree. Every one of the 23 pinned start guards matched.
**Stage:** the Owner's activation contains `I CLOSE U02 AND OPEN U03` and
`I APPROVE U03 ROUTE SCHEMA IN §3 OF UNO-WO-019 / R01`, so **U02 is CLOSED by explicit Owner
authority** and **U03 is OPEN**. That transition is the Owner's record; this report does not
self-accept anything and closes no further stage.
**Provider write actions by the Agent: ZERO.**

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `CANDIDATE_ROUTE_INDEX` | **PASS** | `src/core/efs/uno-route-address.ts`, 14,391 B, blob `5c087843…`; the committed fixture yields exactly one candidate `/en-001` |
| `EXACT_PATH_MATCHER` | **PASS** | `matchUnoCandidateRoute` compares one pathname byte-exactly; `/en`, `/EN-001`, `/en-001/home`, `/en-001/`, `//en-001`, query/fragment/percent/absolute-URL input and an over-long path all refuse with their exact codes |
| `CLOSED_REFUSALS` | **PASS** | 9 literals in `UNO_ROUTE_REFUSAL_REASONS` (6 required + 3 narrowly justified); every negative asserts the exact code and membership |
| `NON_PUBLICATION_BOUNDARY` | **PASS** | No `src/app` import; build route table is still `/`, `/_not-found`, `/icon.svg`; zero `en-001` occurrences in the build output |
| `EXISTING_SITE_PRESERVED` | **PASS** | 19 immutable paths blob-identical, including page `837aad87…`, layout `c7dc9392…`, CSS `8d9268c4…`, both SVGs `204b4d12…`, manifest `13d38f20…`, selection `71147d24…` |
| `EXISTING_404_BEHAVIOUR` | **PASS** | `pnpm test:http` 103/103 with its six 404 refusals unchanged |
| `LOCAL_GATES` | **PASS** | §5 — unit 374, HTTP 103, fixtures 66, readiness 100, security 16, brand 29, architecture 16, bootstrap 19, governance 6, lint 0/0, build 3 routes |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | §6 — four jobs, both hosts, zero non-success steps |
| `PROVIDER_INSPECTION` | **UNVERIFIED** | No Vercel tool exists in this session's toolset (discovery returned only GitLab, GitHub and Sentry, none connected); nothing was read, and no connection was initiated |
| `STAGE` | U02 **CLOSED** / U03 **OPEN** | Owner authority only; U03's remaining obligations are listed in §7 |

## 2. The two authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`28149c870d9107cac4bfb754a3d0a06a3a106685`** | exactly six ledger paths; direct child of `6b1e927` |
| Report | the report-only child of the product commit; its SHA is in the Owner handback | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Before → after blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/core/efs/uno-route-address.ts` | CREATE | *(absent)* → `5c087843…` | 14,391 |
| 2 | `tests/unit/efs-uno-route-address.test.ts` | CREATE | *(absent)* → `c197a96b…` | 27,008 |
| 3 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | `27fb081d…` → `23060855…` | 23,159 |
| 4 | `.documents/WIP/plan-roadmap.md` | EDIT | `e1600ecb…` → `87847654…` | 7,657 |
| 5 | `.documents/WIP/plan-next.md` | OVERWRITE | `05bd6e77…` → `08fbf365…` | 1,242 |
| 6 | `.documents/Architecture/source-inventory.md` | EDIT | `14fd2663…` → `5fbee6d1…` | 96,238 |

No other tracked path changed in the product commit; the private ACTIVE stayed ignored, untracked and
unstaged; `.temp/` was scratch only and is not committed or required. Total tracked change from the
required start is **seven** paths (six + the report).

## 3. What the candidate contract actually does

`buildUnoCandidateRouteIndex(manifest, selection)` validates the manifest first
(`route:manifest-invalid`), then the Site selection (`route:selection-invalid`), then walks **only** the
selected Site's Pages and representations. It never searches for another Site, never reads a source,
never chooses between sources and never decides visibility.

| Schema rule (Owner-approved §3) | Implemented behaviour |
| --- | --- |
| One Entity, one selected Site | Only `foundation`/`main` from `deployment/uno.config.json` is indexed; a second Entity or a different Site refuses |
| Authored locale is identity, lowercase key is the address | Candidate carries `localeTag` (`de-DE`) **and** `localePathKey` (`de-de`); no short-language mapping, no inference |
| Reserved Home → locale root | `id: "home"` + route `["home"]` → `/en-001`, `routePath: ""`; no `/en-001/home` alias |
| Other Pages → `/<key>/<route>` | `["offers","web-design"]` in `de-DE` → `/de-de/offers/web-design`, `routePath: "offers/web-design"`; no Site or Facet segment |
| Bounded | Relative route through `pageRoutePath` (≤4 segments, ≤160 chars), path key ≤64, whole pathname ≤240 ASCII |
| Exact match only | One leading slash, lowercase slug segments, no query/fragment/percent/backslash/scheme/doubled/trailing slash; `/en`, `/en-US`, `/en-001/home` never match |
| Sources preserved, not read | Candidate keeps `{kind, path}` declarations in authored order with no precedence and no authority |

**Committed-fixture evidence.** The real manifest plus the real selection produce exactly **one**
candidate: Entity `e_7a3knkx60eacyhca7a0cr1k6e1`, Facet `foundation`, Site `main`, Page `home`,
`localeTag` and `localePathKey` both `en-001`, `routePath` `""`, pathname `/en-001`, one `markdown`
source `deployment/efs/content/home.en-001.md`. **That candidate is not an active HTTP route:** the
production build still emits only `/`, `/_not-found` and `/icon.svg`, and no build output mentions
`en-001`.

**Immutability and determinism.** Every accepted result is freshly copied and recursively deep-frozen
(index object, array, candidate, sources, source); ordering uses a code-point comparator, never
`localeCompare`; repeated builds are byte-identical; two results share no mutable state; caller
manifest and selection are never mutated.

## 4. Refusals, non-vacuity and the unreachable guard

Nine literals: `route:manifest-invalid`, `route:selection-invalid`, `route:invalid-pathname`,
`route:unmatched`, `route:duplicate-address`, `route:unreadable`, plus the narrowly justified
`route:invalid-route`, `route:invalid-locale`, `route:pathname-too-long`.

Proved by category, each with its exact code:

- **Manifest**: zero Entities, two Entities, non-object manifest, duplicate Page route, Home id at a
  foreign route, source traversal, malformed locale, non-canonical authored tag, empty Pages.
- **Selection**: missing, unknown Facet, unknown Site, Entity mismatch, Site id under two Facets,
  wrong-Facet Site, unsupported version, and `host`/`publication`/`spokeId`/`basePath`/`release`.
- **Pathname**: `/en` (unmatched), `/EN-001`, `/en-001/home` (unmatched), `/en-US`, `/en-001/unknown`
  (unmatched), `/en-001/`, `//en-001`, `?x=1`, `#section`, `/%65n-001`, `/en-001/%2e%2e`,
  `http://…`, an over-long value, and non-string input without reading it.
- **Hostile**: accessor (getter invocation count proved **zero**), symbol key, throwing Proxy trap,
  non-plain prototype — all `route:unreadable`.

**The one unreachable guard, stated honestly.** `route:duplicate-address` is a live check, but no
validated input can reach it: a repeated pathname needs a repeated Page route
(graph → `page:duplicate-route`) or a repeated locale key inside one Page
(graph → `representation:duplicate-locale`). Rather than assert an unreachable fake, the test suite
proves both earlier exact upstream refusals, and `route:duplicate-address` remains in the closed
vocabulary as defence in depth. `route:invalid-route`, `route:invalid-locale` and
`route:pathname-too-long` are likewise unreachable through valid input for the same reason (the graph
or the documented bounds refuse first), which is recorded rather than papered over.


## 5. Local gates (Node 26, pnpm 11.6.0) — every one executed before the product commit

| Gate | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — no package or lockfile change |
| `node scripts/verify-governance-docs.mjs` | PASS — frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **6 pass, 0 fail** |
| `pnpm test:bootstrap` (tests + script) | **19 pass, 0 fail**; script OK (11 files, licence, four-slot discipline, no leaks) |
| `pnpm test:architecture` | **16 pass, 0 fail** — kernel list now includes `uno-route-address.ts`; every prior refusal retained; a React/Node import in a core file is still rejected |
| `pnpm lint` | exit 0 — **0 errors, 0 warnings** |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **374 passed / 374** across 11 files — 313 previous + **61** new route-address cases, 49 of them refusal cases |
| `pnpm build` | PASS — route table `/`, `/_not-found`, `/icon.svg`; 4 static pages; **no `/en-001`** |
| `pnpm test:http` | **103 passed, 0 failed** — the live `/` and the six established 404s unchanged |
| readiness fixtures | **66 pass, 0 fail** |
| readiness CLI | **PASS — 100 checks, 0 failed** |
| security floors | **16 pass, 0 fail** |
| brand/copy contract | **29 pass, 0 fail** |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical**; one moderate dev-only `minimatch` advisory (GHSA-g3hv-75wg-m249) unchanged and not waived |
| `git diff --check` | clean |

## 6. Hosted CI

**Product head `28149c870d9107cac4bfb754a3d0a06a3a106685` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | `43872189558` | success | success | 10 / **0** |
| Verify U01 baseline | `43872188550` | success | success | 24 / **0** |

Both hosts ran governance, bootstrap, architecture, lint, typecheck, unit, build, production HTTP, both
readiness steps, brand/copy, dependency audit and the Node 26 security floors with no non-success step.
The report-only head repeats the same four jobs; its two run IDs are in the Owner handback.
**Full log text is UNVERIFIED** — the GitHub API available to this client returns job and step
conclusions, not downloadable logs.

## 7. Warnings, provider state and non-claims

| Item | Disposition |
| --- | --- |
| Vercel inspection | **UNVERIFIED** — a tool-discovery call returned only GitLab, GitHub and Sentry, **no Vercel toolkit**; nothing was read, no connection was initiated, and no deployment, build log, alias, domain or Analytics state is claimed |
| Provider writes | **ZERO** — no provider tool was called; the only provider effect is the automatic Git-linked build the Owner authorised |
| Dev-only `minimatch` moderate advisory | Disclosed; high/critical gate still enforced at zero |
| Candidate address vs served route | A candidate is a proposal. `/en-001` still 404s; nothing is indexed, canonically advertised or rendered |
| Property `public` / manifest data | Still inert authorship metadata; never publication authority |
| Deferred U03 work | Source confinement and reading, document parsing, visibility/publication controls, safe HTTP error behaviour, metadata/SEO and `hreflang`, optional base path — each needs a later bounded Owner order |
| Stage | U02 **CLOSED** by the Owner's explicit activation; U03 **OPEN**; no later stage, release or promotion is authorised |

## 8. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for the U03
candidate-address checkpoint: one pure, Uno-owned index and byte-exact matcher for the already selected
`foundation/main` Site, deriving `/<lowercase-full-locale>` for the reserved Home declaration and
`/<lowercase-full-locale>/<relative-route>` otherwise, with a closed nine-literal refusal vocabulary,
deep-frozen deterministic output, preserved source declarations and no route, redirect, metadata
alternate, publication or locale activation anywhere in `src/app`. The live landing page, benefits
copy, black emblem, favicon, design, Analytics and `noindex, nofollow, nocache` are byte-identical to
the required start, and every previously established 404 behaviour is unchanged.
