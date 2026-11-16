# UNO-WO-013 / R01 — U02 authored EFS graph, committed Home source, closed validator

**Order:** `UNO-WO-013 / R01` · FINAL — EXECUTE (Owner-activated) · **Executed:** 2026-11-16
**Workstream:** U02 — single-Entity EFS authority; authoring topology only
**Result:** **COMPLETE for this order's scope** — a real committed graph, a real committed Markdown
source, and executable refusal validation. This is **not** a route, a public Site, a release or a
deployment.
**Stages:** the Owner **closed U01** (formal stages **1 / 8 → 2 / 8**) and **opened U02**. U02 is **IN
PROGRESS**; U03–U07 not started. Formal closure is recorded by the Architect from the Owner's direct
authority, never by this report.
**Scorecard:** earned milestone score stands at **24.00%**; the Owner separately reports the English
demo live, but there is **no URL or independent live check in the GitHub record**, so the separate
**0.50 pp** live-verification credit remains **unearned**. The U02 **1.25-point** first authored-graph
milestone may only be recorded after independent acceptance of this report — nothing is claimed here.
**Provider:** **zero** Vercel actions by the Agent. No CLI, login, API, project, setting, credential,
deployment or URL was touched or invented.

## 1. Lineage, ledger and authorization facts

| Item | Value |
| --- | --- |
| Active order | `UNO-WO-013 / R01`, 25,432 bytes, SHA-256 `f977c78a55584225fa1c881b6f4baa78f283fd32c2eb55c158de3292ecd5e527` (identity only; the private body is not reproduced) |
| Required start / product parent | `db46a090490f4829ed92d4721526a5158ffdcd9f` — verified equal to `origin/main` before writing |
| **Product commit** | **`ac0d674037d5be0159c4b2637361b4a68fc0fa63`** — seven ledger paths, direct child of the start |
| **Report commit** | the report-only child of the product commit; its SHA is in the Owner handback because a report cannot contain its own commit |

Owner authorization, as verified non-secret facts: **U01 closure = YES**; **U02 opening = YES**;
**approved stale-roadmap reconciliation = YES** (routing, locale serving and metadata → U03;
presentation plus module/family parity → U04); **approved exact manifest schema = YES**; **approved
demo EntityID `e_7a3knkx60eacyhca7a0cr1k6e1` = YES**; **automated Vercel deployment from `main`
disabled for this order = YES**. The Agent made no provider call to verify that last fact and did not
attempt to.

| # | Path | Op | Purpose |
| --- | --- | --- | --- |
| 1 | `deployment/efs/manifest.json` | CREATE | One demo authored topology in the exact closed schema |
| 2 | `deployment/efs/content/home.en-001.md` | CREATE | Original English Home authoring source (not served) |
| 3 | `src/core/efs/manifest-graph.ts` | CREATE | Pure, fail-closed graph validator |
| 4 | `tests/unit/efs-manifest-graph.test.ts` | CREATE | 62 acceptance, refusal and hostile-input cases |
| 5 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | Added `src/core/efs/manifest-graph.ts` to `CORE_AUTHORED_FILES` only |
| 6 | `.documents/WIP/plan-roadmap.md` | EDIT | Owner-authorized U01 closure, U02 IN PROGRESS, stale sentence reconciled |
| 7 | `.documents/Architecture/source-inventory.md` | EDIT | One U02 adoption note with the four pinned upstream blobs |

Unchanged and re-verified by Git blob at the product commit: `src/app/page.tsx`
`7b7c883b3d3c92edfbfefd1f0614a192ed1814fc`, `src/app/layout.tsx`
`012f28c58ebdfb0bdda48cf7c80d147d1ff5ab98`, `src/app/globals.css`, `src/app/not-found.tsx`,
`scripts/verify-u01-http.mjs` `6c9f4b1ab191c5883a8216389ff5f595ba87ca55`, `src/core/efs/identity.ts`
`7e6f8e0a4f0b9ba7b90f66c44205ff67befb7d20`, `src/core/efs/uno-locales.ts`
`d4ac7a72d09647564a4f40d2632d2eb958f1fe5f`, `src/core/page-content.ts`
`de80f6129c61ec00ced1b71ba0ac9e2e616d819a`, `src/core/page-route-path.ts`
`4a39d98a8c2380a9d772ff5f12119546350cecfe`, `src/core/page-authoring-policy.ts`,
`src/application/resolve-declared-page-source.ts`, `package.json`, `pnpm-lock.yaml`, `next.config.ts`,
`tsconfig.json`, `.gitignore`, `.vercelignore`, both workflows, `AGENTS.md`, `README.md` and the local
SOP. No `deployment/uno.config.json`, no `deployment/site.config.json`, no `public/**`, no new script or
workflow.

**Privacy:** the private ACTIVE is untracked and ignored; no `.env`, token, credential or personal
detail exists in the tree or in this report; nothing outside this repository was written.

## 2. What was actually committed

**Manifest** — `deployment/efs/manifest.json`, Git blob `b077520f0a05e2e8da54f8d8be02a15660011993`
(767 bytes). Its complete authored shape:

```text
entities[1]
  └─ id: e_7a3knkx60eacyhca7a0cr1k6e1        (Owner-approved demo EntityID)
     facets[1]
       └─ id: "foundation"
          sites[1]
            └─ id: "main"
               pages[1]
                 └─ id: "home", route: ["home"]
                    representations[1]
                      └─ locale: "en-001"
                         sources[1]
                           └─ kind: "markdown",
                              path: "deployment/efs/content/home.en-001.md"
```

Source ownership is explicit and single: one authored Entity owns one Facet, which owns one Site, which
owns one Page, which owns one `en-001` representation, which declares exactly one candidate — the
Markdown file named above. There is no second owner, no publication binding, no host, no base path, no
selected public Site and no locale beyond `en-001`.

**Source content** — `deployment/efs/content/home.en-001.md`, Git blob
`1b062fb36a7ed7efab2d40b0b9a91371167497d4` (2,085 bytes). Original English prose describing the
one-Entity direction, what exists today, what is planned, and what the file is **not**. No raw HTML, no
image, no URL, no tracking, no contact promise, no publication claim and no metadata block granting
visibility. It is not a copy of the JSX page and is not served by any route.

**Validator** — `src/core/efs/manifest-graph.ts`, Git blob
`753709ee8d586a0073540dd52bc74b753b8a8cfc` (20,734 bytes).

- `validateUnoManifestGraph(input: unknown)` returns `{ accepted: true, graph }` — a deep-cloned,
  deeply frozen graph — or `{ accepted: false, reason }` with **no partial graph**.
- Exported types: `UnoManifestGraph`, `UnoManifestEntity`, `UnoManifestFacet`, `UnoManifestSite`,
  `UnoManifestPage`, `UnoManifestRepresentation`, `UnoManifestSource`, `UnoManifestSourceKind`,
  `UnoManifestRefusal`, `UnoManifestValidationResult`.
- Exported data: `REFUSAL_REASONS` (25 closed literals), `MANIFEST_CONTENT_ROOT` (`deployment/efs/content/`),
  `MANIFEST_GRAPH_LIMITS` (1 Entity; 8 Facets; 8 Sites; 64 Pages; 16 representations; 2 candidates;
  4 route segments; 240-character path; 512 total candidates).
- Reuses Uno's own contracts — `isEntityId`, `isContentSlug`, `HOME_CONTENT_SLUG`, `pageRoutePath`,
  `localeTagIssue`, `canonicalLocaleTag` — and adds no alternative regex spelling of any of them.
- Purity: no `fs`, `process`, environment, clock, network, adapter, Next.js, React or Node built-in; no
  import of the JSON manifest or the Markdown source; importing the module executes nothing.

**Tests** — `tests/unit/efs-manifest-graph.test.ts`, Git blob
`805d11912ea96afcd4afff82bd643a5daa102066` (21,889 bytes), 62 named cases in eight groups:
committed graph (4), entity cardinality (5), closed shape at every level (12), identifiers (6),
authoring routes (9), authored locales (4), declared source candidates (12), hostile and oversized input
(10).

## 3. Refusal semantics, proven rather than asserted

Every refusal is one closed literal, so a diagnostic can never echo an authored value, a path or a
caller message. Categories and the exact assertions that prove them:

| Category | Refused examples (each asserted by exact code) |
| --- | --- |
| Cardinality | zero Entities, two Entities (`entity:cardinality`) |
| Shape | missing/extra fields at root, facet, site, page, representation and source; empty facets, pages, representations and sources; a non-array children collection; a non-object node; a `null` root |
| Unsupported field | `properties`, `visibility`, `published`, `public`, `publicSite`, `publication`, `publications`, `spokeId`, `spokes`, `host`, `basePath`, `aliases`, per-source `state` |
| Identity | `b_` prefix, upper-cased EntityID, `Foundation` facet slug, duplicate facet/site/page ids |
| Route | non-array, empty, five segments, smuggled separator, `..`, duplicate route under distinct ids, `home` id away from `["home"]`, `["home"]` claimed by another id — and the positive distinct nested `offers/home` |
| Locale | bare `en`, `EN-001`, `en_001`, duplicate locale in one page |
| Source | unknown kind, kind/suffix mismatch, traversal, absolute path, backslash, query, hidden segment, percent-encoding, duplicate kind, duplicate path across the manifest, three candidates |
| Hostile input | accessor (getter invoked **0** times), symbol key, hostile prototype, throwing `ownKeys` trap with no message leakage, oversized facet list, non-mutation, determinism, deep freeze, no publication/host/URL authority in the result, closed-vocabulary check |

The two positive controls that stop this from being an always-refusing scanner: the committed manifest
validates, and a graph with an additional nested `offers/home` page plus a declared JSON candidate
validates.

## 4. Local gates (Windows, Node v24.22.1, pnpm 11.6.0, Next.js 16.4.2)

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — up to date, exit 0 |
| `node --test tests/governance-docs.test.mjs` | PASS — **6 / 6** |
| `node scripts/verify-governance-docs.mjs` | PASS — frozen bytes match |
| `pnpm test:bootstrap` | PASS — **19 / 19** |
| `pnpm test:architecture` (with the added core file) | PASS — **12 / 12** |
| `pnpm lint` | PASS — exit 0, no findings |
| `pnpm typecheck` | PASS — exit 0 |
| `pnpm test` | PASS — **229 / 229** in 8 files (167 prior + **62 new**) |
| `pnpm build` | PASS — exit 0, **3 static pages**, unchanged routes |
| `pnpm test:http` | PASS — **51 passed, 0 failed** over real loopback HTTP |
| `node --test tests/deployment/verify-vercel-readiness.test.mjs` | PASS — **44 / 44** |
| `node scripts/verify-vercel-readiness.mjs` | PASS — **70 checks, 0 failed**, `VERCEL_NOT_DEPLOYED_BY_AGENT` |

Nothing was skipped, softened or made tolerant of failure; no test was deleted to accommodate the new
code, and the architecture scanner now covers the new core file rather than exempting it.

## 5. Exact-head hosted evidence

**Product head `ac0d674037d5be0159c4b2637361b4a68fc0fa63`** — four jobs, all green:

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43833524306 | success | success | 9 / **0** each |
| Verify U01 baseline | https://github.com/provelopment/provelopment-foundation-uno/actions/runs/43833524104 | success | success | 20 / **0** each |

On Ubuntu the steps `Unit tests`, `Run production HTTP (English demonstration)`,
`Deployment readiness fixtures (offline, in-memory)` and
`Deployment readiness (offline; VERCEL_NOT_DEPLOYED_BY_AGENT)` are individually observed `success`, so
the new 62-case suite really ran on a hosted host — not only locally. The final report-only head repeats
both workflows on both hosts; its four run identities and eight job conclusions are stated in the Owner
handback. **Job log text is `UNVERIFIED`**: the logs endpoint returned 403 to this client, so no log line
is quoted and only job/step conclusions are claimed as PASS.

## 6. What this deliberately did not do

- **No route, no serving, no reader.** The Home Markdown is a declared source only; nothing parses or
  renders it, and `src/app/**` is byte-identical.
- **No public Site selection.** One Site exists in the authoring graph; selecting which Site is public is
  a later `deployment/uno.config.json` decision and no such file exists.
- **No new locale.** `en-001` is the only authored locale; `/en`, `/en-001`, `/about`, `/robots.txt` and
  `/sitemap.xml` still return real 404s.
- **No provider action of any kind.** No Vercel CLI, login, API, project, inspection, setting, domain,
  protection change, credential, deployment or URL. The Owner's reported live demo is recorded as an
  **Owner statement only**: the GitHub record contains no URL and no independent live observation, so
  this report asserts no live status.
- **No release, tag, branch merge, force push or stage closure.** No package, lockfile, workflow, Next
  config, governance file or planning slot beyond the one authorized roadmap correction was changed.

## 7. Remaining obligations (not this order)

- **U02 (still open):** the additive typed `properties` vocabulary, once the Owner approves exact fields,
  and the separately configured selected public Site in `deployment/uno.config.json`. This first manifest
  has no `properties` field by design, and any undeclared property is refused rather than ignored.
- **U03:** real path confinement and readers, Markdown/JSON parsing, locale routing, page visibility and
  SEO metadata parity, and the publication decision.
- **U04:** the presentation shell and the 22 capability/17 family parity work.
- **U05–U07:** unchanged in scope and dependency order.

## 8. Requested decision

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** on this exact bounded U02
order: seven product paths, a real committed graph and Markdown source, a pure closed validator with
proven refusals, 62 new cases, all existing gates intact, and both hosts green at the product head.

This report does not self-accept, does not close U02, does not claim the U02 milestone score and does not
assert any provider state.
