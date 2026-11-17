# Foundation Uno — U00 Source Inventory and U01 Extraction Matrix

**Stage:** U00 · **Status:** read-only analysis / evidence
**Analysis date:** 2026-11-15
**Upstream reference (read-only):** `provelopment/provelopment-foundation`

> **This document is analysis and evidence. It is not permission to perform U01.**
> No Foundation runtime source has been copied into this repository. Every entry below
> describes a decision to be *taken* under a future Owner-issued work order, not work
> that has been done.

---

## 1. Reference identity actually observed

| Item | Observed value | How established |
| --- | --- | --- |
| Foundation GitHub `main` SHA | `fa599973a88ff77f6a8e012f3266c3c139b52c17` | GitHub API, 2026-11-15 |
| Commit date / subject | 2026-10-29T06:43:45Z · "fix(foundation): R9 post-audit corrections — public namespace rule, release packaging, truthful manuals, required production proof (#272)" | GitHub API |
| Work-order baseline candidate | `fa599973a88ff77f6a8e012f3266c3c139b52c17` | Work order UNO-WO-001 §2.6 |
| Candidate vs live `main` | **IDENTICAL** — no discrepancy | GitHub API comparison |
| Files tracked at that ref | 867 | `git ls-tree -r` against the local object database |
| Local template `main` ref | `fa599973a88ff77f6a8e012f3266c3c139b52c17` | `git rev-parse main` (read-only) |
| Local template `origin/main` | `fa599973a88ff77f6a8e012f3266c3c139b52c17` | `git rev-parse refs/remotes/origin/main` |
| Local template **checked-out HEAD** | `8789a450525d44dc8f60ea572ad84fcf64f2ace5` | `git rev-parse HEAD` (read-only) |
| Local template branch | `feat/foundation-geo-04-legacy-retirement` | `git rev-parse --abbrev-ref HEAD` |
| Local template worktree state | **DIRTY** — 3 modified, 2 untracked | `git status --porcelain` with `GIT_OPTIONAL_LOCKS=0` |
| Local template remote | `origin → https://github.com/provelopment/provelopment-foundation.git` | `git remote -v` |
| Local template worktrees | 1 (this checkout only) | `git worktree list` |

### 1.1 Discrepancy record — read this before trusting any "current file" claim

The local template is **not** checked out at `fa599973` and is **not** clean. Its `main`
ref and `origin/main` both resolve to exactly the GitHub `main` SHA, so the *repository
object database* agrees with GitHub. But the *working tree* does not:

- HEAD is `8789a45…`, one commit from `main`, on
  `feat/foundation-geo-04-legacy-retirement`.
- That branch is the head of **draft PR #274** (see §3). It is **not** merged `main`.
- The worktree carries uncommitted changes:
  - modified: `src/app/[[...segments]]/server-composition.tsx`
  - modified: `tests/browser/matrix.mjs`
  - modified: `tests/unit/efs-context-nav-links.test.tsx`
  - untracked: `tests/architecture/efs-connect-method-icon-contract.test.ts`
  - untracked: `tests/architecture/efs-shell-aside-contract.test.ts`

**Consequence, stated precisely:** every file-level SHA-256 captured from the local
checkout describes `8789a45` *plus local edits*. It does **not** describe `fa599973`.

Therefore this inventory was built from the **committed objects at `fa599973` in the
local object database** (`git ls-tree`, `git cat-file`, `git rev-parse <ref>:<path>`),
not from files in the template's working tree. No checkout, reset, clean, stash, fetch
or index write was performed against the template.

### 1.2 Verified content fingerprints at `fa599973`

Git blob object IDs are stable content addresses; they are the strongest available proof
that a later extraction reads the same bytes this analysis read.

| Path | Git blob @ `fa599973` | Working-tree SHA-256 (dirty `8789a45` checkout) | Agreement |
| --- | --- | --- | --- |
| `README.md` | `a8ff3c0aff79786eb7889da244bd2d048049f6b8` | `DB42815D…FF2F2C31` | differs (dirty tree) |
| `ARCHITECTURE.md` | `2e1fea74370976afc831f7a022f957e4739c648c` | `14BA5B73…45A612D8` | differs (dirty tree) |
| `AGENTS.md` | `b38bc26ac2f0f357c4e0e62980f065ebeed2c7b3` | `9CA73737…4E6A7F` | differs (dirty tree) |
| `LICENSE` | `d645695673349e3947e8e5ae42332d0ac3164cd7` | `CFC7749B…523D30` | **identical** |
| `package.json` | `7196d34d4bd5626546e3386e2ee7413383a98980` | `DC83D089…8F092D8` | differs (dirty tree) |
| `pnpm-lock.yaml` | `75897e6dc7726a61dbf5962911288a5c60cd5e92` | `90D3F0B3…7315208D` | differs (dirty tree) |
| `next.config.ts` | `fdc1339e62a085ee1b12d8a607ddd3bd287856ef` | `E7D1E97B…20D1F419` | differs (dirty tree) |
| `deployment/efs/manifest.json` | `68ccdd3357a3b2b41073c335547c52ff6e69e920` | `959FA110…00C4D4C` | differs (dirty tree) |
| `src/core/efs/publication.ts` | `711861d3070a10bee55a7134104a6deb3b9eca51` | `247CE754…48122C` | differs (dirty tree) |

`LICENSE` is the only bounded file that is byte-identical between `main` and the dirty
feature branch — which is why it could be copied into this repository with confidence.
Its Uno copy hashes to the same git blob `d645695…`, so the licence is provably the
unmodified upstream Apache-2.0 text (11,358 bytes, LF).

**`next.config.js` and `next.config.mjs` are ABSENT.** The project uses
`next.config.ts` only. Do not invent either alternative file.

---

## 2. Source technology — observations, not Uno dependencies

Recorded exactly as observed at `fa599973`, from `package.json`:

| Observation | Value |
| --- | --- |
| Node engine | `24.x` |
| Package manager | `pnpm@11.6.0` (declared in `packageManager`) |
| Next.js | `16.4.2` |
| React / React DOM | `19.2.9` |
| Zod | `4.6.7` |
| `marked` | `^18.0.11` |
| `sanitize-html` | `^2.18.1` |
| `@vercel/analytics` | `^2.0.1` |
| Tailwind CSS | `^4` via `@tailwindcss/postcss` |
| Test runner | Vitest `^4.1.12`, Vite `8.2.4`, plus a bespoke `tests/browser/matrix.mjs` |
| Package flags | `"private": true`, `"version": "0.1.0"`, `"license": "Apache-2.0"` |

**These are upstream facts, not Uno decisions.** U00 installs nothing and has no
`package.json`. Whether Uno adopts these exact versions is an Owner decision for U01
(§11). Inheriting someone else's version pins without a stated reason is inheritance by
accident, not by choice.

---

## 3. Upstream repository status at analysis time

| Item | State |
| --- | --- |
| Visibility | public |
| Default branch | `main` @ `fa599973` |
| Open PR #273 | **DRAFT** — "feat(efs): GEO-03 reference-publication migration (held candidate, do not merge)" · branch `feat/foundation-geo-03-reference-publication` · opened 2026-10-31 |
| Open PR #274 | **DRAFT** — "GEO-04 C01-R02: retire the country-code generator, catalogs and their CI/release seam" · branch `feat/foundation-geo-04-legacy-retirement` · opened 2026-11-01 |
| Relationship to this analysis | Neither PR is merged. Neither may be used as the extraction source. |
| Local template branch | `feat/foundation-geo-04-legacy-retirement` — the local checkout sits on **PR #274's unmerged head**, dirty on top of it. |

### 3.1 Why the two draft PRs matter to extraction

- **#273 (GEO-03)** is a *reference-publication migration*. It touches the EFS
  publication layer — the exact subsystem Uno must reshape. Extracting the publication
  model from `main` while this PR is in flight means the shape Uno freezes will differ
  from the shape upstream is converging on. That is acceptable (Uno deliberately
  diverges), but it must be a *recorded* divergence, not an accident.
- **#274 (GEO-04)** retires the country-code generator, catalogs and their CI/release
  seam. If Uno copies the country-code machinery from `main`, it inherits code upstream
  is already deleting.

**Consequence:** the local template is a *convenient object database*, not a source of
truth about "current" file contents. `fa599973` is the pin. Do not silently adopt
`8789a45`.

### 3.2 Known upstream CI / browser hazards affecting extraction

Observed structurally at `fa599973` and in the dirty worktree:

1. `package.json` declares both `dev` and `build` as shell chains
   (`node scripts/sync-runtime-assets.mjs && node scripts/efs/validate-publications.mjs
   && next …`). A generator runs **before** every build. Any Uno extraction that copies
   these scripts inherits a build that mutates the worktree — unacceptable for a clean
   repository.
2. `postinstall` runs `node scripts/sync-runtime-assets.mjs --if-deployment`. Install
   itself can write into `public/`. See §4.4 for the generated-boundary problem.
3. The browser matrix (`tests/browser/matrix.mjs`) is a **bespoke harness**, not
   Playwright and not Vitest browser mode; `vitest run` does not exercise it. It is
   being edited in the local dirty worktree — a strong signal it is currently unstable.
4. Two *untracked* architecture tests exist in the dirty worktree
   (`efs-connect-method-icon-contract`, `efs-shell-aside-contract`). Tests not committed
   upstream cannot be cited as upstream evidence; any "green upstream suite" claim that
   depends on them is unverified.
5. `.github/workflows/ci.yml` is the single upstream workflow (4 files exist under
   `.github/`, 3 of them `agent-reports/*.md`). Its job graph was **not executed** during
   this analysis — U00 forbids building or installing in the reference. Any statement
   that upstream CI is green is therefore **UNVERIFIED** here.

---

## 4. The five structural facts that govern the extraction

These are the things most likely to be got wrong by a naive "copy `src/` and delete the
Spoke files" approach.

### 4.1 The EFS content chain already matches Uno's target model

`src/core/efs/properties.ts` declares:

```ts
export const PROPERTY_LEVELS = ["entity", "facet", "site", "page", "representation"] as const;
```

and `src/config/efs/manifest.ts` mirrors it with `EfsEntityDeclaration`,
`EfsFacetDeclaration`, `EfsSiteDeclaration`, `EfsPageDeclaration`,
`EfsRepresentationDeclaration`. This is exactly Uno's
**Entity → Facet → Site → Page → representation** chain. The content model is a **KEEP**.

### 4.2 Publication is still coupled to Spokes — the load-bearing problem

`src/core/efs/publication.ts` exports `EfsBinding`, `MatchedBinding`, `matchBinding`,
`normalizeBindingHost`, `normalizePrefix`, `bindingIssues`, `parseContentRoute`,
`pathSegments`, `publicationForBinding` — and also:

- `interface EfsRuntimeSpokeIdentity`
- `publicationOwnedBy(publication, spoke: EfsRuntimeSpokeIdentity)`

`src/config/efs/owner.ts` adds `publicationOwnerInInstallation`,
`efsPublicationOwnerForRequest`, `hostClaimantsInInstallation`, `efsBindingOwner`.

So **the publication/ownership layer is defined in terms of a Spoke**, not in terms of
the single Entity. Uno cannot "just drop the Spoke directory": the Spoke identity is a
*parameter of the publication ownership API*.

### 4.3 The "presentation-site bridge" — `presentationSiteCode` + `siteMode`

In `deployment/efs/manifest.json` each publication carries `spokeId` **and**
`presentationSiteCode` (`"ww"` for the foundation publication, `"de"` for germany), and
each binding carries:

```json
{
  "id": "foundation-web",
  "host": "foundation-template.provelopment.com",
  "prefix": ["ww"],
  "entityId": "e_00000000000000000000000001",
  "facetId": "foundation",
  "siteIds": ["main"],
  "siteMode": "closed",
  "defaultSiteId": "main",
  "locales": ["en", "de"],
  "defaultLocale": "en",
  "canonical": true
}
```

`siteMode: "open"` lets a binding serve *any* of the Entity's Sites; `"closed"` restricts
it. Combined with `presentationSiteCode`, this is the **presentation-site bridge**: a
host/prefix points at a *presentation site*, which selects which Site — and therefore
which pages — is served. That one indirection is why upstream can host two Spokes on two
hosts with different content and different locale defaults.

Uno keeps one Entity, so the bridge must be **re-derived, not copied**: with one Entity
the multi-site selection collapses to "the Entity's Sites", and `presentationSiteCode`
becomes either a redundant alias for `defaultSiteId` or a genuine per-binding site
selector. Which of those it is, is an **Owner architecture decision** (§11).

### 4.4 Owner-scoped content and asset loading, and the generated boundary

`src/app/[site]/owner-assets/[...path]/route.ts` and
`src/app/[site]/[locale]/owner-assets/[...path]/route.ts` serve per-Site assets from an
owner-scoped path. Coupled with `src/config/efs/owner.ts`,
`src/config/runtime-asset-resolver.ts`, `src/config/runtime-asset-catalog.ts` and the
committed artefact `src/config/generated/runtime-asset-catalog.json`, asset resolution
depends on three things at once:

1. which **Spoke** owns the request,
2. which **Site** the binding selected,
3. a **generated catalog**.

`public/` is a **generated boundary**: `scripts/sync-runtime-assets.mjs` writes into it
(and `postinstall` may do so too). Any Uno tree that commits `public/` must commit its
generator with it, or the repository cannot be rebuilt from source. Conversely, copying
the generator means install/build mutate the worktree — which a clean repository must not
do. **This is an unresolved design tension, carried into U01 deliberately** (§11).

### 4.5 Locale case-normalisation

`src/core/efs/locales.ts` exports `localeTagIssue`, `canonicalLocaleTag`,
`localePathKey`, `parseAcceptLanguage`, `cookieLocalePreference`, `selectEntryLocale`,
`resolveRepresentation`, `advertisedHreflang`.

The presence of **both** `canonicalLocaleTag` and `localePathKey` is the hazard: the tag
used for `hreflang`/metadata and the key used to look up a file on disk are two different
normalisations. Manifest locales are lowercase (`en`, `de`) while locale tags may arrive
mixed-case from `Accept-Language` or a cookie. Any Uno rewrite that collapses these into
one function will either 404 on a valid locale or emit duplicate canonical URLs. This
must be preserved **deliberately** and tested by case (`EN`, `en-US` vs `en_us`, trailing
whitespace).

---

## 5. Extraction decision matrix

Columns: **Decision** is one of `KEEP` / `ADAPT` / `DELETE` / `REPLACE` / `FURTHER AUDIT`.
All paths are relative, at source ref `fa599973`.

### 5.1 Repository root and project configuration

| Path | Observed responsibility | Decision | Intended Uno path / owner | Hidden dependency or risk | Test / verification required |
| --- | --- | --- | --- | --- | --- |
| `README.md` | Product orientation for the multi-Spoke Foundation product | `REPLACE` | `README.md` (Uno-authored, present) | Describes a product Uno is not; copying it would misrepresent Uno | README truthfulness assertion in `verify-bootstrap.mjs` |
| `ARCHITECTURE.md` | 159 KB upstream architecture record, Spoke-centric | `FURTHER AUDIT` | `.documents/Architecture/` (Uno-authored, later) | Large; encodes Hub/Spoke assumptions Uno rejects | Read in full before reuse; never copy verbatim |
| `AGENTS.md` | Upstream agent working rules (26.9 KB) | `ADAPT` | `AGENTS.md` (Uno-authored, present) | Contains upstream-specific operational rules | Manual review; no private paths |
| `LICENSE` | Apache-2.0, complete, unmodified | `KEEP` | `LICENSE` (copied verbatim at U00) | None; blob `d645695…` proven identical | `verify-bootstrap.mjs` licence assertions |
| `package.json` | Scripts, deps, `engines.node 24.x`, `packageManager pnpm@11.6.0` | `ADAPT` | `package.json` (new, U01) | Spoke/release/installation scripts plus a pre-build generator chain | Build must not mutate worktree |
| `pnpm-lock.yaml` | 165 KB lockfile | `REPLACE` | `pnpm-lock.yaml` (regenerated U01) | A lockfile for a dependency set Uno does not have is unsound | `pnpm install --frozen-lockfile` in CI |
| `next.config.ts` | `env` from `deploymentEnvironment(resolveDeploymentForBuild())`, `devIndicators:false`, `turbopack` | `ADAPT` | `next.config.ts` (U01) | Imports deployment-build detection tied to `deployment/` | `next build` succeeds with no `deployment/` tree |
| `next.config.js` / `next.config.mjs` | **ABSENT** | n/a | n/a | Do not invent either file | n/a |
| `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.mts`, `pnpm-workspace.yaml`, `.gitattributes`, `.gitignore` | Tooling configuration | `ADAPT` | respective root files (U01) | `.gitignore` carries Spoke/`deployment` rules; `vitest.config.mts` defines `foundation` + `deployment` projects | Lint + typecheck + a single test project |
| `CLAUDE.md`, `BRAND_ASSETS.md`, `CUSTOMIZING.md`, `DEPLOYMENT.md`, `EFS-*.md` (4 files) | Product manuals and EFS migration evidence | `DELETE` | none | Product-specific; no Uno value | n/a |

### 5.2 Core EFS content model — the part Uno actually wants

| Path | Observed responsibility | Decision | Intended Uno path / owner | Hidden dependency or risk | Test / verification required |
| --- | --- | --- | --- | --- | --- |
| `src/core/efs/properties.ts` | `PROPERTY_LEVELS` entity/facet/site/page/representation; `resolveProperties`; `declared`/`inherited`/`suppressed` | `KEEP` | `src/core/efs/properties.ts` | None significant; matches Uno's chain exactly | Unit: inheritance, suppression, precedence |
| `src/core/efs/identity.ts` | `ENTITY_ID_PREFIX "e_"`, 16-byte entropy, `ENTITY_ID_PATTERN`, `mintEntityId` | `KEEP` | `src/core/efs/identity.ts` | Deterministic test minting must stay out of production paths | Unit: format, malformed-id rejection |
| `src/core/efs/locales.ts` | `canonicalLocaleTag` **vs** `localePathKey`, `parseAcceptLanguage`, `selectEntryLocale`, `resolveRepresentation`, `advertisedHreflang` | `KEEP` (preserve the two-function split) | `src/core/efs/locales.ts` | Collapsing the two normalisations breaks lookup or canonicals (§4.5) | Unit: case-mixed, regional, fallback, `hreflang` |
| `src/core/efs/discovery.ts` | `sitemapEntries(binding, pages)` | `ADAPT` | `src/core/efs/discovery.ts` | Takes an `EfsBinding`; binding loses `spokeId` | Unit: sitemap shape for one Entity |
| `src/core/efs/publication.ts` | Host/prefix binding match, `bindingIssues` reserved-first-segment rule, `parseContentRoute`, **plus** `EfsRuntimeSpokeIdentity` / `publicationOwnedBy` | `ADAPT` core, `DELETE` Spoke parts | `src/core/efs/publication.ts` | **The main risk in the whole extraction** (§4.2): the ownership API takes a Spoke | Unit: host/prefix matching, nested/sibling refusal, single-entity ownership |
| `src/core/page-document.ts` | Page document schema v1: section types, `PAGE_MAX_*` limits, visibility `public`/`unlisted` | `KEEP` | `src/core/page-document.ts` | Self-contained; limits encode product decisions | Unit: schema validation, bound enforcement |
| `src/core/{page-content,page-route-path,page-source,locale,site,site-identity,site-code,site-locale}.ts` | Page and Site identity primitives | `ADAPT` | `src/core/` | `site-code.ts` / `site-locale.ts` likely assume presentation codes | Unit per module; audit `site-code` semantics first |
| `src/core/spoke/**` (13 files: `coherence`, `hostname`, `hub-membership`, `model`, `resolve`, `site-ownership`, `spoke-hub-collection`, `spoke-id`, …) | Spoke Hub and Spoke identity/resolution | `DELETE` | none | **Uno forbids Hub/Spoke**, but callers outside `src/core/spoke` import these types | Grep every importer; typecheck must show zero references |
| `src/core/ui/**` (8 files) | Presentation contract, layout, shell, vocabulary | `ADAPT` | `src/core/ui/` | Vocabulary may carry Spoke terms | Unit + vocabulary review |
| `src/core/{analytics,booking,business,business-hours,business-identity,contact-form,contact-inquiry,display-labels,heading-anchor,legal,location-selection,maps,markdown-policy,notice,region,region-hours,regional-pages,safe-url,seo-metadata}.ts` (19 files) | Business/site domain primitives | `FURTHER AUDIT` | `src/core/` | Uno's single-Entity scope may not need `region*`, `location-selection` or `booking` | Decide at U01 against Uno's real page needs |
| `src/core/foundation-installation/**` (7), `src/core/foundation-release/**` (5) | Installation establishment and release identity | `DELETE` | none | Uno is not an installer and ships no releases | Confirm no core content module imports them |

### 5.3 Application layer, composition root, routes and config

| Path | Observed responsibility | Decision | Intended Uno path / owner | Hidden dependency or risk | Test / verification required |
| --- | --- | --- | --- | --- | --- |
| `src/application/**` (13 files) | Use cases: `page-context`, `page-source-resolution`, `route-discovery`, `site-switch`, `contact-*`, `booking-action`, `direction-link`, plus `efs-portability`, `establish-foundation-installation`, `foundation-*-ports` | `ADAPT` (content subset), `DELETE` (installation/portability) | `src/application/` | `establish-foundation-installation` and `efs-portability` implement the Installation lifecycle Uno drops; `site-switch` presumes runtime site selection | Unit per use case; zero references to deleted ports |
| `src/app/[[...segments]]/server-composition.tsx` | **Composition root** — builds request-scoped services | `ADAPT` | `src/app/**` (U01) | Wires Spoke resolution into everything; actively edited in the dirty worktree | Integration: one Entity resolves, no Spoke lookup |
| `src/app/[[...segments]]/{request-context,efs-request,dedicated-pages,spoke-navigation,legacy-test-runtime}.ts(x)` | Request context and Spoke navigation | `ADAPT`, `DELETE` (`spoke-navigation`, `legacy-test-runtime`) | `src/app/**` | `spoke-navigation.ts` is pure Hub/Spoke; `legacy-test-runtime.ts` is a test seam inside production code | Integration: navigation renders from one Entity |
| `src/app/[[...segments]]/{page,layout,error,global-error,not-found}.tsx`, `src/app/globals.css` | Route shell and error boundaries | `ADAPT` | `src/app/**` | Layout assumes Spoke/site context providers | Build + smoke render |
| `src/app/[site]/**` (`owner-assets` routes, `opengraph-image*`) | Per-Site asset and OG image routes | `ADAPT` | `src/app/**` | The `[site]` dynamic segment presumes multi-site addressing; OG model reads site config | Route test: asset served for the single Entity's Site |
| `src/app/{robots,sitemap-context,sitemap,robots-context,efs-asset-response,contact-actions}.ts` | Metadata routes and contact actions | `ADAPT` | `src/app/**` | Sitemap/robots read Spoke host routing | Metadata contract test |
| `src/config/**` (38 files) | Site/Spoke config loading, dictionary registry, zod schema, asset catalog, `hub-membership`, 14 `spoke-*` modules | `ADAPT` config core, `DELETE` all `spoke-*` | `src/config/` | **14 of 38 config modules are Spoke-specific**; `loader.ts` / `schema.ts` may embed Spoke types | Load one Entity manifest; typecheck shows zero Spoke refs |
| `src/config/efs/{manifest,owner,request-path}.ts` | Manifest schema (`EfsEntityDeclaration`…`EfsPublicationDeclaration`), publication ownership, `EFS_REQUEST_PATH_HEADER` | `ADAPT` | `src/config/efs/` | `owner.ts` returns Spoke-scoped ownership (§4.2) | Unit: manifest validation, single-entity binding ownership |
| `src/config/{deployment-build.mjs,deployment-root.ts,installation-runtime.ts}` | Deployment/installation detection | `DELETE` | none | `next.config.ts` calls `deploymentEnvironment(...)`; deleting needs a replacement `env` strategy | `next build` with no deployment tree |
| `src/adapters/**` (31 files) | Booking, maps, content, analytics, contact, markdown and installation adapters | `ADAPT` content/markdown/maps subset; `DELETE` the 7 installation adapters | `src/adapters/` | Installation adapters implement local release install; content adapters (`efs-content`, `json-page`, `frontmatter`, `page-sources`) are the real prize | Unit + fixture-driven content tests |
| `src/components/**` (71 files) | UI: `efs/` (2), `shell/` (6), `site/` (40), `ui/` (23) | `ADAPT` | `src/components/` | `spoke-switcher.tsx`, `site-selector.tsx`, `location-switcher.tsx` encode multi-unit switching; `sidebar-contract.ts` is asserted by an uncommitted test | Render tests; delete switching components |

### 5.4 Deployment, publication bindings, content and assets

| Path | Observed responsibility | Decision | Intended Uno path / owner | Hidden dependency or risk | Test / verification required |
| --- | --- | --- | --- | --- | --- |
| `deployment/efs/manifest.json` | 11.6 KB EFS manifest: 2 entities, facets, sites, pages, representations, and 2 publications with host/prefix bindings | `REPLACE` (re-derive for one Entity) | Uno content root (U01) | Carries `spokeId` per publication and `presentationSiteCode`; **two entities** where Uno permits exactly one | Schema validation: exactly one entity; binding ownership resolves |
| `deployment/efs/capsule/e_…01/foundation/**` | Entity 1 content: `assets/brand/{logo,favicon}.svg`, `main/pages/{about/en.md,about/de.md,contact/en.json,contact/de.json,home/en.json,home/de.json}` | `FURTHER AUDIT` (page shape `ADAPT`, **assets `DELETE`**) | Uno's single-Entity content root | **Brand SVGs are Provelopment brand assets** — a trademark/rights risk not covered by Apache-2.0 (§10) | Rights review before any asset copy; Markdown/JSON page fixtures |
| `deployment/efs/capsule/e_…02/germany/**` | Second entity's content: about, berlin, frankfurt, home | `DELETE` | none | **A second Entity.** Uno must never acquire it | Assert exactly one entity id in Uno content |
| `deployment/spokes.json` | Spoke Hub declaration: `spokes:[{foundation},{germany}]`, `inspectionSpoke:"foundation"`, `inspectionHosts:["provelopment-foundation.vercel.app"]` | `DELETE` | none | Contains a **live deployment hostname**; republishing it in Uno would be wrong | `verify-bootstrap.mjs` refuses `deployment/spokes.json` |
| `deployment/spokes/**` (154 files) | Per-Spoke config, dictionaries (`config/i18n/{de,en}.json`), content trees, `COUNTRY-CODES.md`, icon library | `DELETE` | none | Largest Hub/Spoke surface; the dictionaries are the only salvageable part | Dictionaries extracted separately and reviewed |
| `deployment/tests/**` (21 files) | Deployment suites incl. `m18-germany-spoke`, `m19-cross-spoke-discoverability`, `r1a/r1b/r1c`, `efs-reference-conversion` | `DELETE` | none | Every one asserts multi-Spoke behaviour Uno removes | n/a |
| `deployment/{README.md,AGENTS.md,foundation-baseline.json,.gitignore}` | Deployment documentation and baseline | `DELETE` | none | Baseline captures the 2-entity reference state | n/a |
| Dictionaries: `src/config/i18n/*`, `src/config/runtime-dictionaries.ts`, `deployment/spokes/*/config/i18n/*.json` | UI string dictionaries and registry | `ADAPT` | `src/config/i18n/` (U01) | `registry.ts` / `invariants.ts` are Spoke-aware; `spoke-dictionaries.ts` selects a Spoke's set | Unit: dictionary resolution for one Entity |
| Page JSON / Markdown: `deployment/efs/capsule/**/main/pages/**` + `src/adapters/content/{json-page,frontmatter,authoring-page,page-sources}.ts` | Authored page documents and their loaders | `ADAPT` | Uno content root + `src/adapters/content/` | Front-matter and JSON page shapes must stay compatible with `page-document.ts` v1 | Fixture tests for both `.json` and `.md` |
| Generated `public/**`, `src/config/generated/runtime-asset-catalog.json`, `scripts/sync-runtime-assets.mjs` | Generated asset boundary | `FURTHER AUDIT` | unresolved (§4.4) | Generator writes into the worktree on install/build; a committed artefact without its generator cannot be rebuilt | Decide generator-vs-committed before U01 writes asset code |

### 5.5 Contact / Connect / analytics and provider secret routing

| Path | Observed responsibility | Decision | Intended Uno path / owner | Hidden dependency or risk | Test / verification required |
| --- | --- | --- | --- | --- | --- |
| `src/adapters/connect/**` (4 files: `contact-direct-send`, `contact-enquiry-renderer`, `offline-mail-transport`, `public-contact`) | Contact enquiry delivery adapters | `ADAPT` | `src/adapters/connect/` | Coupled to the sibling **Connect module** (`modules/connect`, 52 files) via a pinned release checked by `scripts/connect/verify-pinned-source.mjs` | The pinned-source check must pass, or the coupling must be severed |
| `src/adapters/contact-inquiry/**` (3: `index`, `stub`, `webhook`) | Inquiry transport selection | `ADAPT` | `src/adapters/contact-inquiry/` | `webhook.ts` implies an outbound endpoint and therefore a secret | Secret-routing test: no secret read at import time |
| `src/adapters/analytics/**` (2: `index.tsx`, `vercel-analytics.tsx`) | Analytics provider | `FURTHER AUDIT` | `src/adapters/analytics/` | `@vercel/analytics` ties Uno to one provider and a platform Uno does not have | Decide provider-neutral vs provider-specific |
| `src/config/{contact-receiver,contact-form-policy,contact-form-record}.ts` | Contact delivery policy and receiver config | `ADAPT` | `src/config/` | `contact-receiver.ts` is where a provider secret would be routed; must never default to a real endpoint | Test: absent config ⇒ explicit refusal, no silent fallback |
| `modules/connect/**` (52 files) | Sibling Connect module: domain, application, adapters, memory stores, `LICENSE-CONNECT.md`, `connect-release.json` | `FURTHER AUDIT` | not copied (external dependency decision) | **Separate licensing** (`LICENSE-CONNECT.md`) — cannot be assumed Apache-2.0 | Legal review before reuse; pinned-source verification |

### 5.6 Scripts, tests and CI

| Path | Observed responsibility | Decision | Intended Uno path / owner | Hidden dependency or risk | Test / verification required |
| --- | --- | --- | --- | --- | --- |
| `scripts/sync-runtime-assets.mjs` | Generates the runtime asset catalog and writes `public/` | `FURTHER AUDIT` | unresolved (§4.4) | Runs before every build and on `postinstall`; mutates the worktree | Must not run on install in Uno |
| `scripts/efs/{convert-reference,publication-projection,validate-publications}.mjs` | EFS reference conversion and publication validation | `ADAPT` (`validate-publications` is valuable) | `scripts/efs/` | `convert-reference` migrates legacy → EFS; irrelevant once Uno starts at EFS | Unit: publication validation for one Entity |
| `scripts/release/**` (8 files) | Release construction, content policy, digest, identity, manifest | `DELETE` | none | Uno publishes no release at U01; the policy files encode Foundation release rules | n/a |
| `scripts/installation/**` (3) | Installation establishment CLI | `DELETE` | none | Implements the Installation lifecycle Uno drops | n/a |
| `scripts/{check-temp-tracking,temp-tracking-path}.mjs`, `scripts/ci/change-scope.mjs`, `scripts/generate-country-code-reference.mjs`, `scripts/connect/*` | Temp-tracking guard, CI scoping, country codes, Connect pin verification | `FURTHER AUDIT` | `scripts/` (selectively) | The country-code generator is being *retired* by PR #274; `change-scope.mjs` maps Foundation-specific scopes | Re-evaluate after PR #274 lands |
| `tests/unit/**` (161 files) | Unit suites | `FURTHER AUDIT` | `tests/` | Many assert Spoke/multi-site behaviour; volume far exceeds a first Uno slice | Port selectively, per extracted module |
| `tests/architecture/**` (24) | Architecture invariants | `FURTHER AUDIT` | `tests/architecture/` | 2 of them exist only as **untracked** dirty files — not upstream evidence | Re-derive invariants for one Entity |
| `tests/integration/**` (24), `tests/browser/**` (26), `tests/fixtures/**` (61), `tests/support/**` (16), `tests/setup/**` (3) | Integration, bespoke browser matrix, fixtures, support | `FURTHER AUDIT` | `tests/` | The browser matrix is bespoke and unstable (§3.2.3); fixtures encode the 2-entity reference | Prefer a fresh, small Uno suite over wholesale porting |
| `.github/workflows/ci.yml` | Single upstream CI workflow | `REPLACE` | `.github/workflows/` (U01) | Encodes the Foundation job graph, release gates and deployment scopes; not executable as-is by Uno | Uno CI: build + typecheck + lint + unit + one integration |
| `.github/agent-reports/*.md` (3) | Upstream agent handoff/design notes | `DELETE` | none | Internal upstream process artefacts | n/a |

---

## 6. Paths that do NOT exist — recorded so nobody invents them

Verified absent at `fa599973`. If a U01 plan references any of these, the plan is wrong.

| Assumed path | Actual status | What actually exists instead |
| --- | --- | --- |
| `next.config.mjs` | **ABSENT** | `next.config.ts` |
| `next.config.js` | **ABSENT** | `next.config.ts` |
| `src/core/efs/index.ts` | **ABSENT** | `src/core/efs/` holds exactly 5 files — `discovery`, `identity`, `locales`, `properties`, `publication`; consumers import full paths |
| `src/core/efs/site.ts`, `src/core/efs/pages.ts` | **ABSENT** | Site modelling lives in `src/core/site.ts`, `src/core/site-identity.ts`, `src/core/efs/properties.ts` |
| `src/core/efs/spoke.ts` | **ABSENT** | Spoke modelling is the directory `src/core/spoke/**` (13 files) |
| `src/features/`, `src/lib/`, `src/hooks/`, `src/utils/`, `src/types/` | **ABSENT** | Use-case code is `src/application/`; primitives are `src/core/` |
| `deployment/efs/spokes.json` | **ABSENT** | `deployment/spokes.json` (Hub level, not under `efs/`) |
| `public/` as a hand-authored tree | **Generated boundary**, not authored source | Written by `scripts/sync-runtime-assets.mjs` |
| `tests/browser/playwright.config.*` | **ABSENT** | `tests/browser/matrix.mjs` is a bespoke harness |
| `Dockerfile`, `vercel.json`, `.nvmrc` | **ABSENT** | Deployment targeting is external to the tracked tree |
| `modules/` as a generic container | Contains exactly one module | `modules/connect/**` (52 files) |

---

## 7. Bounded proposed U01 exact-write ledger (proposal only)

A proposal for the smallest defensible first extraction slice. **It is not authorisation.**
Each row is a file U01 *would* be permitted to write, and nothing outside it.

| Path | Action | Why it is in the slice |
| --- | --- | --- |
| `package.json` | create | Real Uno package: `private`, Apache-2.0, `engines.node 24.x`, `packageManager pnpm`, scripts `dev`/`build`/`start`/`test`/`typecheck`/`lint` — with **no** pre-build generator |
| `pnpm-lock.yaml` | create (generated by `pnpm install`) | Reproducible install; `--frozen-lockfile` in CI |
| `tsconfig.json` | create | One strict TypeScript project |
| `next.config.ts` | create | Minimal config; **no** `deploymentEnvironment` import |
| `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.mts` | create | Tailwind v4, lint, one test project |
| `src/core/efs/properties.ts` | copy (verify blob) | The Entity→…→representation chain |
| `src/core/efs/identity.ts` | copy (verify blob) | Entity id minting/validation |
| `src/core/efs/locales.ts` | copy (verify blob) | Locale normalisation, both functions preserved |
| `src/core/efs/publication.ts` | adapt | Binding match **minus** `EfsRuntimeSpokeIdentity` / `publicationOwnedBy(spoke)` |
| `src/core/efs/discovery.ts` | adapt | Sitemap from an entity-scoped binding |
| `src/core/page-document.ts` | copy (verify blob) | Page schema v1 |
| `src/config/efs/manifest.ts` | adapt | Manifest schema with `spokeId` removed from the publication declaration |
| `src/config/efs/owner.ts` | rewrite | Ownership resolved from the single Entity, not a Spoke |
| `src/app/[[...segments]]/{page,layout,not-found,server-composition}.tsx` | create/adapt | Minimal route rendering one Entity's Pages |
| `src/components/site/page-document-content.tsx`, `src/components/site/page-sections/*` | adapt | Render the Page document schema |
| `src/config/i18n/*` (registry, dictionary, invariants) | adapt | Entity-scoped dictionaries, two locales |
| `content/` (Uno-owned content root): `entity.json`, one site, 2–3 pages × `en`/`de` | create | Uno's own fixtures, **not** upstream brand assets |
| `tests/**` (new, small) | create | See §8 |
| `.github/workflows/ci.yml` | create | build + typecheck + lint + unit + integration |
| `.documents/Architecture/*.md` (Uno-authored) | create/update | Record the divergences from upstream |
| `README.md`, `AGENTS.md` | update | Report the real, now-existing runtime commands truthfully |

**Explicitly excluded from U01:** `deployment/**`, `deployment/spokes.json`,
`modules/**`, `scripts/release/**`, `scripts/installation/**`, all `spoke-*` modules,
`src/core/spoke/**`, all upstream brand assets, and any upstream `tests/**` file copied
without individual justification.

## 8. Proposed U01 acceptance and refusal test plan

**Acceptance (must pass):**

1. `pnpm install --frozen-lockfile` succeeds and **leaves the worktree clean**
   (`git status --porcelain` empty) — proving no install-time generator.
2. `next build` succeeds with **no** `deployment/` directory present.
3. Manifest validation accepts exactly one Entity; a manifest with two Entities is
   refused with a diagnostic naming the second id.
4. A request to a configured host resolves to the Entity's Site and renders a Page;
   `hreflang` and canonical output are correct for `en` and `de`.
5. Locale lookup is case-insensitive at the boundary but canonical in output: `EN`, `En`,
   `en-US` and `en` resolve, and produce exactly one canonical URL.
6. Binding validation refuses nested (`/a` + `/a/b`) and sibling (`/a/x` + `/a/y`)
   prefixes on the same host, and allows `/tenant-a` beside `/tenant-ab`.
7. Content adapters load both a `.json` page and a `.md` page through
   `page-document.ts` v1.

**Refusal (must fail loudly, never silently degrade):**

1. Two Entities anywhere in content/config ⇒ build or validation error.
2. Any residual Hub/Spoke term — `spoke`, `Spoke`, `spokeId`, `spokeHub`, or
   `presentationSiteCode` used as a Spoke alias — in `src/**` ⇒ failing architecture test.
3. `deployment/spokes.json` present ⇒ failing architecture test (already enforced by
   `verify-bootstrap.mjs` at U00).
4. Contact sending with no configured transport ⇒ explicit refusal, not a silent no-op
   and not a default endpoint.
5. A secret read at module import time ⇒ failing test.
6. A committed `public/` artefact with no generator, or a generator that runs on install
   ⇒ failing test.
7. A missing `LICENSE`, or a licence other than Apache-2.0 ⇒ failing test (carried
   forward from U00).

## 9. Source-pin risks

1. **Movement.** `main` is a moving target. `fa599973` is pinned; if U01 extracts later
   it must re-verify the pin and record a new one — never "latest".
2. **The local checkout is not the pin.** `8789a45` + dirty edits is what sits on disk.
   Any extraction that reads the working tree instead of `fa599973` silently imports
   unmerged PR #274 content and five uncommitted files.
3. **`8789a45` is one commit from `main`.** If the local template is ever reset or
   `git pull`ed, its object database may still contain `fa599973` — but this cannot be
   assumed. Re-verify with `git cat-file -t fa599973…` before relying on it.
4. **PR #273 reshapes the publication layer.** Freezing Uno's publication model now
   guarantees divergence from upstream. That is intended, and must be documented rather
   than later "fixed" by silently adopting the merged shape.
5. **PR #274 deletes country-code machinery.** Copying it from `main` imports code
   upstream is removing.
6. **`next.config.ts` imports deployment detection.** A naive copy makes `next build`
   depend on a `deployment/` tree Uno will not have.

## 10. Rights, trademark and third-party content concerns

| Concern | Detail | Action required before any copy |
| --- | --- | --- |
| Brand assets | `deployment/efs/capsule/**/assets/brand/{logo,favicon}.svg` are Provelopment brand marks. Apache-2.0 §6 expressly does **not** grant trademark rights beyond reasonable use in describing origin. | **Do not copy.** Uno must author or license its own identity, or obtain explicit written permission. |
| Product prose | `deployment/efs/capsule/**/pages/**` and `deployment/spokes/**/content/**` are Provelopment-written copy (English and German). Copyright in text contributed as part of the Work is licensed by Apache-2.0 — but *whether each text was so contributed* is a provenance question, not an assumption. | Provenance review per text before reuse; prefer Uno-authored copy. |
| Connect module | `modules/connect/LICENSE-CONNECT.md` is a **separate** licence instrument, not the root Apache-2.0. | Read `LICENSE-CONNECT.md` before any reuse; do not assume Apache-2.0. |
| Third-party icon library | `deployment/spokes/foundation/content/assets/icon-library/**` — upstream icon sets carry their own licence terms. | Identify and record the icon licence, or use Uno-owned icons. |
| Trademarks | "Provelopment", "Foundation", product naming and visual identity are **not** granted by Apache-2.0. | Uno must not imply endorsement or affiliation beyond truthful derivation. |
| NOTICE file | Upstream ships no `NOTICE` at `fa599973`. | Do **not** invent one, and do not assert third-party rights Uno cannot verify. |
| Generated artefacts | `src/config/generated/runtime-asset-catalog.json` is generated; copying it implies a provenance claim for every asset it indexes. | Do not copy; regenerate from Uno-owned assets. |

## 11. Architecture decisions requiring Owner acceptance before code migration

These are genuine forks in the road. Each must be decided **explicitly**; none may be
resolved by an implementation agent's preference at U01.

1. **`presentationSiteCode` fate.** With one Entity, does it become (a) a redundant alias
   for `defaultSiteId`, (b) a genuine per-binding Site selector, or (c) removed entirely?
   This determines the binding schema and therefore every page route.
2. **`siteMode: open | closed` fate.** With one Entity, "open" means "serve any Site the
   Entity has". Is that still meaningful, or does it collapse to a boolean Uno deletes?
3. **Locale set.** Upstream reference serves `en` + `de`. Does Uno ship two locales, one,
   or a configurable set? This affects the content root, dictionaries and every test.
4. **Content root shape.** Keep an EFS-style `entities/facets/sites/pages` directory tree,
   or adopt a flatter Uno-owned shape? Affects §7's ledger.
5. **Generated vs committed asset boundary.** Commit a generator (install/build mutates
   the worktree) or commit artefacts (repository cannot be rebuilt)? Pick one and enforce
   it in CI.
6. **Connect dependency.** Keep the sibling Connect module as an external pinned
   dependency, vendor a minimal contact path, or ship no contact delivery at U01?
7. **Analytics.** A provider-neutral interface with `@vercel/analytics` as one adapter, or
   no analytics at all at U01?
8. **Dependency/version pinning.** Adopt upstream's exact pins (Next 16.4.2, React 19.2.9,
   Node 24.x, pnpm 11.6.0) or choose independently and record the divergence?
9. **`src/core` breadth.** Which of the 19 `FURTHER AUDIT` domain primitives (booking,
   region, location selection, business hours, …) does a single-Entity Uno actually need?
10. **Test strategy.** Port selected upstream suites, or write a fresh minimal Uno suite
    and treat upstream tests as behavioural documentation only?

## 12. Scope statement

This inventory is **evidence and analysis**, produced read-only, and is **not**:

- an authorisation to extract, copy or migrate any Foundation source,
- an architectural decision record (the decisions in §11 are open),
- a claim that upstream CI is green (it was not executed),
- a claim that the local template equals upstream `main` (it does not — see §1.1),
- permission to create `content/`, `src/` or any runtime file at U00.

U00 copies exactly one upstream file: `LICENSE`, byte-for-byte, proven by git blob
equality. Nothing else.

## 13. Chief Architect R01 review — U01 scope clarifications

This section records the Architect's review of the **earlier U01 proposal**. It clarifies
what is *upstream Foundation behaviour* and what is *Owner-approved Uno product
behaviour*. It preserves the source-observed tables above unchanged and it implements no
U01 contract.

**Separation of the two categories.** The following upstream mechanisms are **reference
behaviour to remove or adapt**, and are explicitly **not** Uno requirements: the
Spoke-owned `EfsRuntimeSpokeIdentity`, `publicationOwnedBy`, the multi-binding host/prefix
schema, `presentationSiteCode`, and `siteMode: open | closed`.

**Uno v1 shape.** Foundation Uno v1 has **one Entity, one selected public Site, one
configured canonical address with an optional base path, and no second publisher**. Any
prior U01 proposal that assumed a multi-publication topology is superseded by this shape.

**Test proposals that are not accepted.** The previously proposed U01 tests asserting
nested or sibling **multi-publication prefix-collision** behaviour are **not accepted Uno
tests**. The U01 proposal is replaced by:

- single configured host / base-path admission,
- refusal of an invalid alias-to-canonical collision,
- refusal of an unknown host,
- refusal of any extra Entity,

and these are adopted **only when the Owner accepts the exact Uno route schema**. Until
then they remain proposals.

**Locale behaviour must not be over-asserted.** Do not assert any of the following as Uno
behaviour:

- an implicit `en-US` alias mapping to `en`,
- an unconditional fallback locale,
- Solo's region-qualified-only locale policy,
- case-sensitive Page rules.

Keep `canonicalLocaleTag` **distinct** from `localePathKey` — they are different concepts
and must not be collapsed. Test only declared and Owner-approved locale behaviour.

**Release and installation.** Upstream `scripts/release/**` and `scripts/installation/**`
are **not copied in U01**, but Uno's own separate release/installation capability remains a
**future U06 obligation** — it is deferred, not permanently deleted.

**Still required before any code moves.** U01's actual extraction ledger, its exact
dependency set and its two-host/browser gates must be **accepted separately** before any
source is copied. Rights in assets, branding, product prose and
`modules/connect/LICENSE-CONNECT.md` remain subject to source and licence review.

**Status.** This is a clarification of an earlier proposal, not an implementation of any
U01 contract. The remaining architecture options in §11 stay **open**: no option may be
chosen by an implementation agent's inference, and the source-evidence facts recorded
earlier in this document must not be rewritten to fit a decision.
---

# U01 source-adoption and U02-U07 handoff ledger (2026-11-15)

Order `UNO-WO-005 / R01`. Appended; the U00 audit above is preserved verbatim as historical
evidence.

**This appendix supersedes two obsolete U00 claims:** that no runtime source had moved into
this repository, and that bare-locale behaviour was proposed. Both are now out of date: a
bounded source kernel exists, and Uno admits a bare language ONLY through an explicit
declared full-locale mapping.

- Uno input/head for this ledger: `4f8cd53b90354032ccb29e54176c20bc667624f5`
- Pinned upstream source: GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, read only through
  `git cat-file` from committed objects. The dirty local worktree was never read.
- No local dirty-file hash, and no hash of any unpublished file, is authority here.

## Classification of adopted code

`KEEP` = copied bytes with upstream blob identity · `ADAPT` = retained pure algorithm, revised
comments/semantics · `REWRITE` = new Uno-owned file informed by upstream · `ADDITIONAL` =
Uno-authored, no upstream counterpart · `DEFER` / `REJECT` = recorded decisions.

| Uno path | Class | Upstream evidence | Upstream bytes | Uno dependencies | Note |
| --- | --- | --- | ---: | --- | --- |
| `src/core/efs/identity.ts` | KEEP | blob `7e6f8e0a4f0b9ba7b90f66c44205ff67befb7d20` | 4,439 | none | Only file in Uno carrying upstream Git blob identity |
| `src/core/page-content.ts` | ADAPT | blob `49014ecbe5152244ffb40eceee56359f0b9d55d1` | 3,896 | none | Slug grammar retained; Site/country runtime selectors NOT adopted; non-string guard added before matching |
| `src/core/page-route-path.ts` | ADAPT | blob `aed10f713c148b4190dcf744015d051cce8851ce` | 7,406 | `./page-content` | Pure algorithms and caps retained; `/ww`, Site code and country folder removed from prose and semantics |
| `src/core/efs/uno-locales.ts` | REWRITE | informed by blob `3cbe1dbe3b684c5cfc79d1df7e5fc5a61db3c24f` | 15,109 | none | Region REQUIRED; explicit mapping only. Upstream preference-prefix selection and script-only qualification deliberately excluded |
| `src/app/layout.tsx`, `page.tsx`, `not-found.tsx`, `globals.css` | ADDITIONAL | none | - | `next`, `react` | Uno-authored non-indexable technical placeholder |
| `scripts/verify-u01-http.mjs` | ADDITIONAL | none | - | Node built-ins only | Loopback production HTTP proof |
| `tests/unit/efs-identity.test.ts`, `page-route-path.test.ts`, `uno-locales.test.ts` | ADDITIONAL | upstream test blob `9edb01de6a42d5d989c82113e207dff6e8af91f9` for ROUTE behaviour evidence only | 6,035 | `vitest` | Uno-authored fixtures; no upstream test file copied |
| `tests/architecture/u01-boundaries.test.mjs` | ADDITIONAL | none | - | `node:test` | Boundary/refusal scanner with negative fixtures |
| `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.github/workflows/verify-u01.yml` | ADDITIONAL | none | - | pinned exact versions | Freshly resolved Uno-only lock; Foundation lock NOT copied |## Foundation Page section preservation matrix (17 rows)

Read-only review of the two pinned Page composer blobs: `src/core/page-document.ts`
(`a12d964c43626c6313a621bf628f5cc24b65d444`) and
`src/components/site/page-document-content.tsx` (`fc35a52d6cfc5f114e50470e8286a89916cde801`).
Shared authored fields: `...headingFields`, optional `surface` (`plain` / `muted` / `bordered`) and
optional `align` (`start` / `center`) where noted. **Nothing in this matrix is implemented in
Uno.** Ownership is primarily U04; `contactForm` delivery is U05.

| # | Section | Observed authored contract | Observed renderer | Candidate Uno module | Stage | Unimplemented acceptance test |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `hero` | type, optional `eyebrow`, `lede`, `actions`, `support`; align, surface | `HeroSection` | `hero` module | U04 | renders eyebrow+lede+support; actions resolve; exactly one page h1 |
| 2 | `prose` | heading fields, required `body` (markdown); align, surface | `ProseSection` | `prose` module | U04 | markdown body renders sanitised; heading level follows section order |
| 3 | `media` | heading fields, `image`, optional `caption`, `position` (`start` / `end`); surface | `MediaSection` | `media` module | U04 | image + caption + position render; no external provider request |
| 4 | `gallery` | heading fields, `items`, `itemColumns` (2/3/4); surface | `GallerySection` | `gallery` module | U04 | N items in declared column count; responsive reflow |
| 5 | `actions` | heading fields, required `actions`; align, surface | `ActionsSection` | `actions` module | U04 | primary/secondary/link variants render; unresolvable target degrades to label |
| 6 | `callout` | heading fields, `body`, `tone` (`note` / `info` / `warning`); align, surface | `CalloutSection` | `callout` module | U04 | each tone distinguishable and announced accessibly |
| 7 | `cards` | heading fields, `items`, `itemColumns`; surface | `CardsSection` | `cards` module | U04 | card grid renders items and columns |
| 8 | `features` | heading fields, `items`, `itemColumns`; surface | `FeaturesSection` | `features` module | U04 | feature rows render without a second h1 |
| 9 | `columns` | heading fields, `items` (2-3), `ratio` (`equal` / `start-wide` / `end-wide`); surface | `ColumnsSection` | `columns` module | U04 | 2-3 columns with declared ratio; stacks on narrow viewport |
| 10 | `steps` | heading fields, `items` (max 12); surface | `StepsSection` | `steps` module | U04 | ordered steps render; 13 items refused at authoring |
| 11 | `stats` | heading fields, `items` (max `PAGE_MAX_STATS`); surface | `StatsSection` | `stats` module | U04 | stats render as a definition-style list; overflow refused |
| 12 | `quote` | `body`, optional `attribution`, `role`; align, surface | `QuoteSection` | `quote` module | U04 | quote/attribution render inside `blockquote` with `cite` semantics |
| 13 | `table` | heading fields, `columns` (1..max labels), `rows` (each row must match column count), optional `caption`; surface | `TableSection` | `table` module | U04 | mismatched row/column count refused; caption associated with the table |
| 14 | `faq` | heading fields, `items`; surface | `FaqSection` | `faq` module | U04 | question/answer pairs render; keyboard-expandable if disclosure UI is chosen (**OPEN**) |
| 15 | `list` | heading fields, `items`, optional `ordered`; surface | `ListSection` | `list` module | U04 | ordered vs unordered honoured; nested lists refused or defined (**OPEN**) |
| 16 | `divider` | type only | `DividerSection` (no locale/link resolver) | `divider` module | U04 | renders a separator with no heading and no focusable content |
| 17 | `contactForm` | type plus `formRef` (intent only: `[a-z0-9][a-z0-9-]*`, max 64) | rendered by the CALLER behind an authorization seam; draws nothing when unauthorized | `contact-form` boundary only | U05 | absent authorization renders nothing; delivery, secrets and provider choice are U05 (**OPEN**) |

Ambiguity is marked `OPEN` rather than claimed as parity. No row asserts an implemented Uno
module, and none is silently deferred without a recorded acceptance test.

## 22 A1 capability contracts — exact approved identifiers

> **Superseded target descriptions (UNO-WO-007 / R01).** The provisional rows at the end of this
> section were R01-era placeholders awaiting confirmation of upstream identifiers. They are
> retained as history only and are **not** a target list and not an ID source. Target identity is
> fixed by canonical `BLUEPRINT.md` §5, restated exactly below and in `UNO-WO-007 / R01` §3. No
> provisional row is a registered module, an approval or a parity claim.

### Approved 22 registered A1 capability IDs (binding)

| Group | Count | Exact IDs |
| --- | ---: | --- |
| `layout` | 4 | `layout.stack`, `layout.grid`, `layout.bento`, `layout.layers` |
| `content` | 8 | `content.heading`, `content.prose`, `content.actions`, `content.hero`, `content.stats`, `content.testimonials`, `content.pricing`, `content.timeline` |
| `media` | 4 | `media.image`, `media.video`, `media.gallery`, `media.carousel` |
| `design` | 2 | `design.watermark`, `design.motion` |
| `interaction` | 4 | `interaction.tabs`, `interaction.accordion`, `interaction.modal`, `interaction.contact` |
| **Total** | **22** | 4 + 8 + 4 + 2 + 4 |

### Support classification at U01 — vocabulary only

| Layer | State | Owner |
| --- | --- | --- |
| Vocabulary: the 22 exact IDs, single group ownership, membership and refusal guard (`src/core/modules/capability-registry.ts`) | `IMPLEMENTED` — registry only | U01 |
| Renderer, authored props/envelope, composition and page integration for any of those IDs | `UNIMPLEMENTED` — no renderer, props schema, composer or route | U04 |
| Delivery behind `interaction.contact` (mail, provider, authorization adapter) | `UNIMPLEMENTED` — no adapter, secret or provider | U05 |

Registering a vocabulary is **not** module parity: 22 registered *names* are not 22 executable
modules, and the registry grants no rendering, routing or publication capability.

## 17 Foundation families → candidate approved ID, composition and gap

Families come from the pinned GEO-03 schema blob `a12d964c43626c6313a621bf628f5cc24b65d444`
(`PAGE_SECTION_TYPES`) and composer blob `fc35a52d6cfc5f114e50470e8286a89916cde801`. They are
**obligations in a separate namespace**, never registered module IDs; a shared word is not parity
and no row asserts an automatic one-to-one mapping. Every row is `UNIMPLEMENTED` for renderer parity.

| # | Family | Candidate approved ID(s) | Composition or gap | Parity | Owner | Behaviour or refusal proof needed |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `hero` | `content.hero` | direct candidate | `UNIMPLEMENTED` | U04 | eyebrow/lede/support render, actions resolve, exactly one page `h1` |
| 2 | `prose` | `content.prose` | direct candidate | `UNIMPLEMENTED` | U04 | sanitised markdown body; heading level follows section order |
| 3 | `media` | `media.image` | **gap**: media-and-text composition has no approved ID | `UNIMPLEMENTED` | U04 | caption and start/end position render; no provider request |
| 4 | `gallery` | `media.gallery` | direct candidate; 2/3/4 declared columns | `UNIMPLEMENTED` | U04 | N items in declared column count; responsive reflow |
| 5 | `actions` | `content.actions` | direct candidate | `UNIMPLEMENTED` | U04 | primary/secondary/link variants; unresolvable target degrades to label |
| 6 | `callout` | — | **gap**: no approved ID carries tone variants (`note`/`info`/`warning`); `layout.stack` composition is not parity | `UNIMPLEMENTED` | U04 | each tone distinguishable and announced accessibly |
| 7 | `cards` | — | **gap**: no approved ID; `layout.grid` + `content.*` composition is not parity | `UNIMPLEMENTED` | U04 | card grid renders items and declared columns |
| 8 | `features` | — | **gap**: no approved ID; differs from `cards` only by observed row layout | `UNIMPLEMENTED` | U04 | feature rows render without a second `h1` |
| 9 | `columns` | `layout.grid` | candidate, but observed `ratio` (`equal`/`start-wide`/`end-wide`) is a fidelity gap | `UNIMPLEMENTED` | U04 | 2-3 columns with declared ratio; stacks on narrow viewport |

| 10 | `steps` | `content.timeline` | candidate; observed `max 12` items is a gap | `UNIMPLEMENTED` | U04 | ordered steps render; 13 items refused at authoring |
| 11 | `stats` | `content.stats` | direct candidate, honouring `PAGE_MAX_STATS` | `UNIMPLEMENTED` | U04 | definition-style list; overflow refused |
| 12 | `quote` | `content.testimonials` | **gap**: one `quote` with `attribution`/`role` is not a testimonial collection | `UNIMPLEMENTED` | U04 | quote and attribution render inside `blockquote`/`cite` semantics |
| 13 | `table` | — | **gap**: no approved ID covers tabular data or row/column validation | `UNIMPLEMENTED` | U04 | mismatched row/column count refused; caption associated with the table |
| 14 | `faq` | `interaction.accordion` | candidate; FAQ semantics versus generic disclosure is a fidelity gap | `UNIMPLEMENTED` | U04 | question/answer pairs render; keyboard-expandable if disclosure UI is chosen |
| 15 | `list` | — | **gap**: ordered/unordered list has no approved ID | `UNIMPLEMENTED` | U04 | ordered versus unordered honoured; nesting defined or refused |
| 16 | `divider` | — | **gap**: no approved ID for a non-focusable separator | `UNIMPLEMENTED` | U04 | separator renders with no heading and no focusable content |
| 17 | `contactForm` | `interaction.contact` (possible future boundary) | **gap**: family is not a module ID; the registry equates nothing and supplies no delivery | `UNIMPLEMENTED` | U05 delivery · U04 surface | absent authorization renders nothing; no secret or provider in the repository |

### Historical R01 provisional descriptions (superseded — history only)

R01 requires 22 capability contracts: **4 layout · 8 content · 4 media · 2 design ·
4 interaction**. The canonical Solo-reference identifiers are **not supplied in R01**, and
Solo source is explicitly out of scope for this order, so each row records the Uno-side
target capability and marks the upstream identifier `OPEN` for Architect confirmation. No row
is an implemented module, and no count here asserts "39 independent modules".

| # | Cat. | Uno target capability contract | Upstream Solo ID | Status |
| --- | --- | --- | --- | --- |
| 1 | Layout | Responsive page shell: container, vertical rhythm, max line length | `OPEN` | not implemented |
| 2 | Layout | Site header with navigation landmarks and skip link | `OPEN` | not implemented |
| 3 | Layout | Site footer with secondary navigation and legal links | `OPEN` | not implemented |
| 4 | Layout | Section/grid system honouring 2-4 declared item columns | `OPEN` | not implemented |
| 5 | Content | Page title, eyebrow and lede | `OPEN` | not implemented |
| 6 | Content | Rich prose (markdown body) with heading discipline | `OPEN` | not implemented |
| 7 | Content | Ordered and unordered lists | `OPEN` | not implemented |
| 8 | Content | Data table with caption and aligned rows | `OPEN` | not implemented |
| 9 | Content | FAQ / disclosure groups | `OPEN` | not implemented |
| 10 | Content | Cards and feature grids | `OPEN` | not implemented |
| 11 | Content | Steps / process sequence | `OPEN` | not implemented |
| 12 | Content | Stats or metric highlights | `OPEN` | not implemented |
| 13 | Media | Single image with caption and start/end position | `OPEN` | not implemented |
| 14 | Media | Gallery with declared column count | `OPEN` | not implemented |
| 15 | Media | Media-and-text composition | `OPEN` | not implemented |
| 16 | Media | Video or third-party embed | `OPEN` | **OPEN** - rights and provider are unreviewed; likely `REJECT` or U05-gated |
| 17 | Design | Theme tokens, typography scale and colour scheme | `OPEN` | not implemented |
| 18 | Design | Surface/tone variants (`plain` / `muted` / `bordered`) | `OPEN` | not implemented |
| 19 | Interaction | Navigation behaviour and current-page indication | `OPEN` | not implemented |
| 20 | Interaction | Contact action / form seam with authorization | `OPEN` | not implemented (U05) |
| 21 | Interaction | Link and action target resolution | `OPEN` | not implemented |
| 22 | Interaction | Keyboard and focus accessibility contract | `OPEN` | not implemented |

## Later-stage owned obligations (handoff)

- **U02** - one-Entity EFS manifest and cardinality, with refusal of zero and two Entities;
  five-level additive public/internal properties; typed phone.
- **U03** - JSON/Markdown declared sources with valid-JSON precedence; full AND short locale
  routing; canonical base and aliases; unlisted/SEO behaviour; real public HTTP.
- **U04** - the full 22 module capability tests and actual 17-section parity; responsive shell;
  assets.
- **U05** - optional safe actions and provider adapters, with Foundation's Connect excluded
  absent a separate licence.
- **U06** - installation, upgrade and release.
- **U07** - browser, accessibility, security, rights and independent release gate.

## U01 author-destination security adoption (UNO-WO-008 / R02)

**Scope:** one early U01 authoring/security primitive — a pure **syntax** classifier for a
destination an author controls. It is not a link resolver, router, renderer, publisher or provider
adapter, and it decides nothing about a target's existence, visibility or permission.

| Pinned GEO-03 evidence | Blob | Bytes | Used for |
| --- | --- | ---: | --- |
| `src/core/safe-url.ts` | `d19b6c8ecb2f1bb3d3a163260ca2afeb87b89493` | 8,195 | Concept: allowlist author destinations, fail closed on obfuscation; its tolerances are NOT adopted |
| `tests/unit/safe-url.test.ts` | `13343cf06cd3dca1768edcb8ae46480325dc1391` | 3,503 | Reference case *categories* only; no fixture copied |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 | Evidence that Foundation's Page authoring validator depended on URL classification; not imported |

**Original work, not a copy.** `src/core/safe-author-url.ts` is Uno-authored with no imports, no I/O
and no global state; `tests/unit/safe-author-url.test.ts` is an independent fixture set. Deliberate
divergences from the upstream helper: an accepted `href` is the original string byte-for-byte (never
trimmed, decoded or reserialised); HTML character references are refused rather than decoded;
`tel:` is refused, so a phone action must come from a validated public property projection later;
absolute origins are validated lexically before `URL` is used only as a cross-check; a relative
reference containing `:` is refused as ambiguous.

**Admitted syntax:** root-relative single-slash paths, fragment-only, query-only, conservative
relative references, absolute `http`/`https` with a real host, and `mailto:` with a real recipient.
**Refused:** every other scheme (`javascript:`, `vbscript:`, `data:`, `blob:`, `file:`, `ftp:`, `ws:`,
`about:`, `view-source:`, `tel:`, unknown `x:` forms), protocol-relative and percent-encoded
protocol-relative forms, raw and encoded control bytes, whitespace, backslash and attribute-breaking
characters, character references, nested encodings, disguised (encoded) schemes, malformed `http(s)`
origins (userinfo, invalid port, impossible host) and mailto values carrying raw or encoded CR/LF.

**Boundary and handoff.** No Page, locale route, Site selection, EFS manifest, renderer, webhook or
provider exists behind this classifier, and an admitted category is never proof of a published
target. **U03** must add Page/locale/visibility existence checks and canonicalisation; **U05** must
supply any contact delivery or provider adapter; **U04** must prove caller-side attribute escaping.
Tests recorded for those stages: syntax acceptance of `/admin` is not authorization, and an accepted
external origin is not permission to fetch it server-side.

## U01 Page-source and visibility policy adoption (UNO-WO-009 / R01)

**Scope:** one pure, observation-only authoring policy. It decides which *declared* source answers one
already-identified representation, and which visibility vocabulary that source may carry. It reads no
file, parses no JSON/Markdown, selects no Site or locale, and publishes nothing.

| Pinned GEO-03 evidence | Blob | Bytes | Class | Note |
| --- | --- | ---: | --- | --- |
| `src/core/page-source.ts` | `8071f0a425dcbb5422d25be308ae2135cfd64219` | 12,614 | ADAPT | JSON-before-Markdown order and fail-closed idea only; site codes, bare-locale lookup and default-locale fallback **rejected** |
| `src/application/page-source-resolution.ts` | `05060f116a7f2703db42d8e7c10d57bc2e5748ed` | 4,261 | REWRITE | Resolver/provider separation rewritten as one pure policy with no provider, reader or I/O |
| `tests/unit/page-source-resolution.test.ts` | `ca3abff92116ea9157f00dd355fe5c7eda5da883` | 4,710 | reference only | Positive/refusal *categories* read; no fixture or test code copied |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 | DEFER | Full Page schema, section families and document fields not adopted; only the `public`/`unlisted` vocabulary and the reserved Home rule appear |

**Uno precedence, narrower than upstream.** A declared `json` observed `valid` wins even when Markdown
is `invalid`; a declared `json` observed `invalid` refuses outright; valid Markdown answers only when
JSON is `absent` or undeclared; zero valid candidates refuse. There is no locale, Site, directory or
Page fallback input, so none can be invented. Visibility: JSON defaults to `public` and may declare
`public`/`unlisted`, the reserved root Home may never be `unlisted`, and Markdown is `public` with no
visibility field at all (even `public` refuses). Uno-local predicates `HOME_CONTENT_SLUG` and
`isPageRoutePath` are reused; no slug grammar is redefined.

**Refusal proofs carried by `tests/unit/page-authoring-policy.test.ts` (26 cases):** non-array, 0/3
records, duplicate/unknown kind, unknown state, extra or missing keys, null/array/class candidates,
accessor and symbol fields, prototype-pollution-shaped records, hostile prototypes with
`toString`/`valueOf`/`Symbol.toPrimitive` (never invoked), throwing proxies (bounded refusal, no
throw), all malformed route paths, unknown visibility values, and non-mutation/determinism.

**Handoff.** Still owed: U02 EFS manifest ownership and cardinality; U03 locale routing, real
Page/locale/visibility composition, unlisted HTTP/SEO behaviour and Markdown sanitisation; U04 the 22
capability modules and 17-family parity; U05 provider adapters. An `unlisted` decision is a vocabulary
value only — not access control, not discovery, not a URL, header, redirect, body or sitemap entry.

## Rights

Apache-2.0 source only, subject to review. Branded images, product data, default analytics and
Foundation's separate Connect module are excluded; no licence or right is inferred for any
other path. Solo Rust source was **not** read for this ledger; its capability names are Owner
approved contracts, not imported code.

## U01 application source-resolution adoption (UNO-WO-010 / R01)

**Scope:** one application use case, `src/application/resolve-declared-page-source.ts`, that asks the
approved core policy which *declared* source answers one already-identified representation and returns
the caller's opaque winning source by reference. No manifest, reader, parser, path, locale, Site,
route, visibility or publication behaviour is added.

| Pinned GEO-03 evidence | Blob | Bytes | Class | Note |
| --- | --- | ---: | --- | --- |
| `src/application/page-source-resolution.ts` | `05060f116a7f2703db42d8e7c10d57bc2e5748ed` | 4,261 | REWRITE | Precedence-versus-reader separation kept as an idea; providers, locale fallback and Site codes rejected |
| `src/core/page-source.ts` | `8071f0a425dcbb5422d25be308ae2135cfd64219` | 12,614 | ADAPT | Declared JSON-before-Markdown order only; no on-disk roots or country selector |
| `tests/unit/page-source-resolution.test.ts` | `ca3abff92116ea9157f00dd355fe5c7eda5da883` | 4,710 | reference | Test *categories* only; no fixture or test code copied |
| Uno `src/core/page-authoring-policy.ts` (starting head) | `b9ddbee09eb776d034038dca09cad48680939512` | 12,483 | KEEP | Unchanged: still the single decision authority, called by the use case and never re-implemented |

**Semantics.** Ports are validated as data (1–2 plain records, unique exact `json`/`markdown`, function
observers) before any observer runs. A declared JSON observer runs once: a throw, rejection or malformed
observation refuses `observer-failed` / `invalid-observation` without consulting Markdown, and an
`invalid` observation refuses with the core's `invalid-json-source`. Only a declared-`absent` JSON (or no
JSON declaration) lets the declared Markdown observer run, once; the core confirms the selection from the
observed states, and a `valid` body is returned by reference, never parsed, copied or frozen.

**Exclusions.** No EFS manifest/schema/graph, Site or Page locator, source ownership, filesystem or
network access, JSON/Markdown reader, sanitiser, envelope, renderer, URL, locale mapping, redirect,
sitemap, visibility or publication decision, and no fallback to another locale, Page or Site. A `valid`
observation is a trusted dependency's report, not proof of existence.

**Handoff:** U02 owns manifest ownership and cardinality; U03 owns readers, confinement, locale routing,
unlisted HTTP/SEO behaviour and sanitisation; U04/U05 own modules and provider adapters.

## U01 English informational demonstration adoption (UNO-WO-011 / R01)

**Scope:** the `/` route becomes a visitor-readable English introduction instead of a sentence-only
placeholder. The change is presentation and proof only: `src/app/page.tsx`, `layout.tsx`,
`globals.css`, `not-found.tsx` and `scripts/verify-u01-http.mjs`. No core, application, adapter,
configuration, manifest, reader, module, route or deployment path changes, and no dependency is added.

| Surface | Boundary |
| --- | --- |
| `src/app/page.tsx` | Static server-rendered HTML: one `h1`, a hero, the planned Entity → Facets → Sites → Pages → localized-representations contract, a *works today* / *what is next* split, one public source link and the informational-demo disclosure. No client component, no fetch, no module renderer, no manifest read |
| `src/app/layout.tsx` | Truthful demo `title`/`description`, `lang="en"` for the informational page only, and the unchanged pre-publication `noindex, nofollow` policy. No canonical, alternate/hreflang, sitemap or analytics |
| `src/app/globals.css` | Original dependency-free CSS: light and dark tokens, `focus-visible` ring, `prefers-reduced-motion` and `prefers-contrast` accommodations, one-column collapse at narrow widths. No webfont, CDN, image, `url()` or `@import` |
| `src/app/not-found.tsx` | Ordinary 404 that links back to the demonstration homepage and does not imply a published Site |
| `scripts/verify-u01-http.mjs` | Real loopback production server with 51 counted HTTP assertions over the served document: status, content type, `lang`, single `h1`, served metadata, section content, anchor integrity, source link, `noindex`/`nofollow`, seven absent-fabrication markers, six 404 refusals and negative checks that the old placeholder or a publication claim would fail |

**Explicit non-claims.** This is not the P05 authored EFS Home Page, not a validated one-Entity
publication, and not evidence that the 22 modules render or the 17 capability families have been
migrated. `/en`, `/en-001`, `/about`, `/robots.txt` and `/sitemap.xml` remain 404; no locale route,
manifest, sitemap, redirect or deployment exists, and no live URL is asserted by any test.

## U01 manual-deployment readiness adoption (UNO-WO-012 / R02)

**Scope:** repository-only preparation for an **Owner-operated** manual Vercel deployment of the accepted
English demonstration. Nothing is deployed by the Implementation Agent, no provider resource is created
or inspected, and no URL, project identity or provider success is asserted here or by any test.

| Surface | Boundary |
| --- | --- |
| `.vercelignore` | Conservative **CLI-upload** exclusion: `.documents/**` (including the private ACTIVE), `.temp/`, `.git/`, `.vercel/`, `.env*`, installed/generated Node and Next output, caches and logs stay out, while `src/`, `next.config.ts`, `package.json`, `pnpm-lock.yaml` and `tsconfig.json` stay eligible. It is **not** a guarantee for a Git-imported project, where the tracked set governs what is uploaded |
| `scripts/verify-vercel-readiness.mjs` | Offline, dependency-free readiness gate over eight enumerated committed files: pinned private Apache-2.0 Node 24 / pnpm 11.6.0 / Next 16.4.2 package, nonempty lockfile, bounded `next.config.ts`, accepted English page plus `lang`/`noindex`/`nofollow`/`nocache` guards, Git ignore of the private ACTIVE, upload exclusion that keeps build inputs, and a two-host CI workflow with no bypass. Pure `analyzeReadiness()` accepts only own data properties of an in-memory snapshot and returns closed literal reason codes; the CLI reads this checkout only and emits `VERCEL_NOT_DEPLOYED_BY_AGENT` |
| `tests/deployment/verify-vercel-readiness.test.mjs` | Node-native positive fixture plus targeted refusals (metadata, pins, lock, export mode, suppressed types, obsolete page, lost guards, payload regressions, CI weakening, hostile snapshots). In-memory only: no repository read, no network, no provider tooling |
| `.github/workflows/verify-u01.yml` | Both existing hosts additionally run the readiness fixtures and the readiness CLI after the 51-assertion production HTTP gate; the stale "technical placeholder" HTTP step label is corrected to the English demonstration. Permissions stay `contents: read`, triggers unchanged, no secrets and no deployment step |
| `.documents/Deployment/vercel-manual-handoff.md` | Owner-only manual guide: source commit, framework/root/Node/build settings, the pnpm-11-on-Vercel platform risk, Git-versus-CLI payload boundaries, and the post-deployment 404/`noindex` checks the Agent cannot perform |

**Explicit non-claims.** Green CI here is **offline preparedness**, not a Vercel build, not a provider
configuration, not an access-protection state and not a live site. Provider-specific compatibility remains
`UNVERIFIED` until the Owner deploys from the exact accepted commit. This is still not the authored P05
EFS Home Page, not an EFS Site publication, and not evidence that the 22 modules render or the 17
capability families have been migrated; `/en`, `/en-001`, `/about`, `/robots.txt` and `/sitemap.xml`
remain 404 by design, and the pre-publication `noindex, nofollow` policy is unchanged.

## U02 authored graph adoption (UNO-WO-013 / R01)

**Upstream reference (read-only committed blobs only, GEO-03 `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`).**
Each pin was re-read at that commit before writing; all four blob IDs and byte counts matched.

| Pinned path | Git blob | Bytes | Decision |
| --- | --- | ---: | --- |
| `deployment/efs/manifest.json` | `074736c2578eda1abc3df8df02752158a4f5f938` | 11,607 | **ADAPT topology idea only.** Its two Entities, `publications`, Spoke bindings, hosts and geo fields are rejected |
| `src/config/efs/manifest.ts` | `e4f578fd4be3c393483f851867f605e5d216cb64` | 24,124 | **REWRITE** as an original pure Uno graph validator; no upstream filesystem or Hub/Spoke logic is imported |
| `src/core/efs/publication.ts` | `cc451462ded0ded1f3394c2fcbbd73e420e9a14f` | 25,840 | **DEFER** — the binding/provider/host/alias address model is not adopted |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | 45,106 | **DEFER** — the full document schema and section rendering belong to a later stage |

**New on-repo material (authoring only).** `deployment/efs/manifest.json` declares exactly one
demo Entity (`e_7a3knkx60eacyhca7a0cr1k6e1`) → one Facet (`foundation`) → one Site (`main`) → one
Home Page (`home`, route `["home"]`) → one `en-001` representation → one Markdown candidate
(`deployment/efs/content/home.en-001.md`, real committed English source). `src/core/efs/manifest-graph.ts`
is the closed, fail-closed validator: `validateUnoManifestGraph(input: unknown)` returns a deep-cloned,
deeply frozen graph or one reason from `REFUSAL_REASONS`; it reads only own data properties, never
invokes a getter, and performs no file, network or process access. `tests/unit/efs-manifest-graph.test.ts`
proves acceptance of the committed graph plus targeted refusals, and re-reads the committed Markdown.

**Deliberately not introduced.** No route, public Site selection, locale route, reader, JSON parser,
Markdown renderer or sanitiser, manifest filesystem reader, host, base path, SEO metadata, provider
binding or release claim. `src/app/page.tsx` and the served output are unchanged, so an accepted graph
is authorship evidence, never publication authority.

**Handoffs.** U02 continues with additive typed `properties` (once an exact vocabulary is approved) and
the separately configured selected public Site in `deployment/uno.config.json`; U03 owns path
confinement, content readers, locale routing, visibility/SEO and the publication decision; U04 owns the
presentation shell and module/family parity.

## UNO-WO-014 / R01 — Node 26, security floors and one approved analytics integration

**Runtime.** `package.json` now declares `engines.node: "26.x"` (previously `24.x`) and pins
`@types/node` to the exact stable release `26.6.6` (MIT, `types: index.d.ts`, dependency
`undici-types ~8.9.0`). Both GitHub workflows set up Node 26 and then **assert** it at runtime in the
job, so a YAML value alone cannot stand in for a real v26 process. The offline readiness verifier and
its fixtures, the architecture scanner, the new security-floor gate and the HTTP verifier all agree on
26; no Node 24 expectation survives in tracked code.

**Security provenance (reference only — no code copied).** The October advisory work in
`provelopment/provelopment-foundation` at `573859a8b2b2d4dfd95227c3018ce9d49cfb5f9c`,
`58ced2a2f8a9aff57003119c12f92a31dc4c9d39` and `65f26e8f51f96c40a1a58e1e13f3a25efcfd372c` was read
for provenance. Uno's own lockfile already resolved the patched floors it needed
(`sharp@0.35.5`, `source-map-js@1.2.2`, `brace-expansion@1.1.22` and `5.0.13`, `zod@4.6.7`), so **no**
byte, script, workspace file or override was imported from Foundation, and its `engines.node: "24.x"`
was explicitly not adopted as evidence of Node 26 compatibility. Those floors are now asserted
mechanically rather than assumed.

**Analytics (separately licensed integration).** `@vercel/analytics@2.0.1`, **MIT**, integrity
`sha512-MTQG6V9qQrt1tsDeF+2Uoo5aPjqbVPys1xvnIftXSJYG2SrwXRHnqEvVoYID7BTruDz4lCd2Z7rM1BdkUehk2g==`,
is the single provider dependency. It is imported only as `@vercel/analytics/next` in
`src/app/layout.tsx` and rendered exactly once inside `<body>`. This is a **source-level capability
only**: visitor collection additionally requires the Owner to enable Web Analytics in the Vercel
project, which no Agent action can or did change. No custom event, cookie, tag manager, advertising
script, secret or relaxed metadata was added, and `src/app/page.tsx`, the CSS and the robots policy are
unchanged.

**Boundary rules, still closed.** The former blanket refusal of the analytics dependency became a
narrow allowlist: exact package, exact version, exact App Router entry, exactly one file, exactly one
render. Any other `@vercel/*` module, any other analytics provider (Speed Insights, PostHog, Plausible,
Matomo, react-ga), any second injection, any import from another app module and any postinstall bypass
is still refused, and each refusal has a synthetic negative fixture in the architecture tests and in
`tests/deployment/node26-security-floor.test.mjs`.

**Exclusions.** No `vercel.json`, no project or dashboard setting, no deployment, promotion, alias,
domain, secret or protection change; no new route, locale, Site selection, `deployment/uno.config.json`,
workflow, provider token or release. U02 remains open and its manifest, Home Markdown and graph
validator are untouched.

## UNO-WO-015 / R01 — public copy and the Uno network-one mark

**Sourced page copy.** `src/app/page.tsx` now carries the Owner-approved visitor copy: an eyebrow
naming the initiative and stack, the headline "Foundation Uno — a focused foundation for the web", the
hero lead, the two approved calls to action, the live single-page disclosure, the three section
headings ("A clear structure for everything you publish", "Working today. Designed to grow.",
"Explore the source"), five architecture descriptions, five "Available today" bullets, four "In
development" bullets, the approved source link and note, and the footer. Structure is unchanged: one
`h1`, the skip link, `#main`, `#how-it-is-organized`, `#status`, `#explore`, the ordered architecture
list, two status cards and exactly two approved GitHub anchors. Retired and false claims — `A1`,
`P05`, "technical placeholder", "not deployed", "no live deployment", "no manifest", "only the smallest
pure primitives", "not a finished website", "no publication" — are refused by tests rather than by
memory.

**Truthfulness boundary.** The copy states the live single-page demonstration, the validated
single-Entity content graph with an authored English Home source, and the tested primitives as facts,
and states that content-driven publishing and locale-aware routes are forthcoming. It never claims the
EFS runtime is serving or that a locale route exists; the readiness verifier keeps a closed
`page:fabricated-publication` refusal for exactly those claims while permitting the Owner-verified fact
that this informational page is deployed.

**Added assets.** `public/uno-logo.svg` (header mark) and `src/app/icon.svg` (App Router favicon) are
the same 1,730 bytes, SHA-256
`19759bc29d887401dd42550304e22dc625cbd5be936f5f93d2b9fde938010162`, reproducing the order's §3 vector
exactly. The mark is an **original Uno concept** in the existing palette (`#1f6f6b` network,
`#101620` numeral, `#ffffff` keyline); it is not asserted to be official Provelopment artwork. Its
provenance, colour references and master-replacement procedure are recorded in
`.documents/Brand/uno-mark-provenance.md`.

**Design preservation.** `src/app/globals.css` gains only three declarations of layout for the mark
(`.uno-brand` becomes an inline flex row with a fixed-size image, `.uno-brand__name` sets a line
height). Every colour token, contrast preference, responsive breakpoint, focus rule and reduced-motion
rule is unchanged, and the brand/copy test refuses a recoloured token or a removed logo rule.

**Evidence.** `scripts/verify-u01-http.mjs` asserts the approved copy and both brand routes over a real
production server (95 checks), `scripts/verify-vercel-readiness.mjs` adds brand and copy checks (92
checks), `tests/deployment/verify-vercel-readiness.test.mjs` adds eight copy/brand regressions (59
tests) and `tests/deployment/uno-brand-copy.test.mjs` adds seventeen committed-input tests including
five synthetic negatives. Both new steps run on Ubuntu and Windows.

**Boundaries.** No dependency, lockfile, workflow permission, provider setting, route, locale, EFS
manifest, authored Home Markdown, release or stage closure was touched by this increment.

## UNO-WO-016 / R01 — official network emblem and benefits-led public copy

**Emblem.** `public/uno-logo.svg` and `src/app/icon.svg` are now the identical official-source
derivative: **8,250 bytes**, SHA-256
`de749e41347a043691b3dd82ced90a2d53f80c240993057388cdfaee20a0a568`, canvas `0 0 2048 2048`. It keeps
all ten original network paths and their group transforms from the Owner-supplied
`emblem.svg` (7,938 bytes, SHA-256 `0512bfa3…f5ed8e0`), recolours the single original fill `#C5161D`
to the approved `#1f6f6b`, and adds one enlarged numeral `1` in the Owner-selected charcoal `#36454f`
on a transparent canvas. The previous 128-unit concept mark and its `#101620` numeral are superseded
and are refused by tests. The header renders it through `next/image` with `unoptimized` at 30 × 30 and
`alt="Foundation Uno"`, which removes the former `@next/next/no-img-element` warning without an
optimizer round trip; the favicon is the App Router icon route.

**Copy.** `src/app/page.tsx` (9,335 bytes, SHA-256
`d86fdcf6e3d3be85b577ac4fded6e08e954f8db6f481b196df1bfe6834943876`) now explains the finished product
in direct **will** language: a headline of one organisation and one connected digital presence, a hero
lead about bringing websites, information and regional editions into one foundation, five features that
each pair a capability with a benefit (One Entity, Purposeful Facets, Deliberate Sites, Reliable Pages,
Thoughtful regional editions), two explicitly labelled illustrative examples (a community organisation,
a service provider with regional audiences) with three benefits each, an open-source and licence
section, and a footer naming the live single-page demonstration. Metadata carries the approved title
and description and keeps `noindex, nofollow, nocache` plus the single official Analytics integration.
Both scenarios are labelled illustrations, never customers, testimonials or measured results.

**Design and boundaries.** `src/app/globals.css` is untouched (blob
`8d9268c448dfa5a0a25bb14657ca450396efe59d`): palette, typography, dark mode, responsive grid, focus and
reduced-motion behaviour are preserved. No route, locale, EFS manifest, Home Markdown, dependency,
lockfile, workflow, 404 or governance file changed. Provenance, digests, colour references and the
replacement procedure are recorded in `.documents/Brand/uno-mark-provenance.md`.

**Evidence.** The HTTP verifier asserts 101 served checks including the new copy, both brand routes,
byte parity and the vector digest; the readiness verifier runs 99 checks including the pinned vector
digest, geometry and palette; the readiness fixtures carry 64 cases; and the brand/copy suite carries 24
tests with eleven synthetic negatives.

## U02 typed-property and selected-Site adoption (UNO-WO-018 / R01)

**Scope.** One bounded U02 increment: a five-level typed-property contract and one explicit
selected-Site *declaration*. Neither capability publishes anything, opens a route, selects a host or
alters the live page. U01 stays CLOSED and U02 stays OPEN.

**Source pins (read-only).** Foundation `provelopment/provelopment-foundation` at
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c`: `src/core/efs/properties.ts` blob
`c0b6346e720e1d57315a4d583ae8cd2ce92203ee` (five-level nearest-explicit cascade) and
`src/core/efs/property-contract.ts` blob `f45ec31b6e61f83b90dde1067f32e6a748633c43` (typed string
facts).

**Adaptation decisions.** `src/core/efs/properties.ts` is a **REWRITE**: the nearest-ancestor idea is
retained, but the upstream Spoke bindings, generalized property values, IANA timezone data,
opening-hours models, rendering code and file I/O are absent, and no upstream byte or blob identity is
carried. `src/core/efs/uno-config.ts` is **NEW UNO-OWNED** code with no upstream counterpart. Neither
module imports Node, a framework, a provider or an adapter; both are pure validators over caller data.

**Typed-property contract.** The closed authored vocabulary is `brand.name`, `contact.name`,
`contact.email`, `contact.phone` only, accepted at exactly Entity, Facet, Site, Page and representation
level. A declaration is `{ value }` or `{ value, public }` with a Unicode-trimmed non-blank string of
at most 240 UTF-16 code units; literal `null` is the only suppression marker; omission inherits;
`public` defaults to `false` and is authorship metadata only. Unknown keys, unknown descriptor fields,
non-strings, blank or over-long values, non-boolean flags, symbol keys, accessors (never invoked),
non-plain prototypes, throwing Proxy traps and `__proto__` pollution attempts are refused with one
closed literal code. The cascade walks a caller-supplied contiguous ancestry in the fixed order, keeps
the origin level and identifier, returns a freshly owned deep-frozen result, never searches the
manifest for nearby identifiers and never crosses a sibling Facet, Site, Page or representation.

**Selected-Site declaration.** `deployment/uno.config.json` is the Owner-approved 140-byte LF document
`{ version: 1, entityId: "e_7a3knkx60eacyhca7a0cr1k6e1", selectedSite: { facetId: "foundation",
siteId: "main" } }` (SHA-256 `794672a4…d426`). `src/core/efs/uno-config.ts` validates it against a
caller-supplied manifest, refusing an invalid manifest before any Site is considered, an Entity
mismatch, an unknown Facet or Site, a Site owned by another Facet, ambiguous Site ownership across
Facets, malformed identifiers, extra authority fields (`publication`, `host`, `basePath`, `bindings`,
`spokeId`, `release`, `canonical`, `analytics`) and hostile objects. There is no array-first fallback
and no default.

**Graph change.** `src/core/efs/manifest-graph.ts` now accepts an optional `properties` bag at exactly
the five owner tiers, validating each through the typed contract and adding the frozen declarations to
the accepted graph while leaving untouched nodes byte-identical. Its own-data snapshots were hardened
to null-prototype records so a supported property key can never reach a prototype setter. Every
pre-existing topology, source, route, locale and cardinality refusal is retained.

**Committed data.** `deployment/efs/manifest.json` adds exactly one Entity-level declaration,
`brand.name = "Foundation Uno"` with `public: false`, and no other value changed. That declaration is
inherited by the whole chain and is **not** rendered on `/`.

**Non-publication boundary.** No `src/app` file imports the config, the property resolver or the
manifest; no route, locale, sitemap, `robots.txt`, metadata alternate, host binding or Vercel setting is
created; the public page remains the same black-emblem informational landing page. The black `#000000`
numeral approved in `UNO-WO-017 / R01` supersedes the charcoal value recorded in the previous section
of this inventory; the asset, copy, CSS, Analytics and `noindex, nofollow, nocache` controls are
unchanged by this order.

**Evidence.** 44 typed-property cases, 24 selected-Site cases, 16 added graph cases (78 in that file),
architecture boundaries 16/16 with both new pure paths on the exact allowlist, plus the full unchanged
U01 gate set (HTTP 103, readiness fixtures 66, readiness 100, brand/copy 29, security 16, Vitest unit
suite, build, lint and audit).

## U03 canonical candidate-address adoption (UNO-WO-019 / R01)

**Scope.** One pure, Uno-owned candidate-address contract: the index of addresses the one selected
Site *could* eventually serve, and a byte-exact matcher over that index. It prepares public routing and
**serves nothing**. The Owner separately closed U02 and opened U03 by explicit activation; this
section records only the code and its provenance.

**Source anchor and provenance.** `src/core/efs/uno-route-address.ts` is **NEW UNO-OWNED** code. It
imports only Uno's own pure contracts — `validateUnoManifestGraph`, `validateUnoSiteSelection`,
`localePathKey`, `canonicalLocaleTag`, `localeTagIssue`, `pageRoutePath` and `HOME_CONTENT_SLUG` — and
no Foundation, Solo, Node built-in, framework, adapter or content-parsing source. The Foundation
repository remains a read-only reference from earlier stages; no upstream byte runs here.

**Schema (Owner-approved in `UNO-WO-019 / R01` §3).** One Entity `e_7a3knkx60eacyhca7a0cr1k6e1` and the
one explicitly selected Site from `deployment/uno.config.json` (`foundation` / `main`). The authored
full language-and-region locale stays the identity; the **path key** is that whole locale lowercased
through `localePathKey`. `localePathKey` and `canonicalLocaleTag` are deliberately different values for
different purposes: the former is URL spelling only (`de-de`), the latter is the authored spelling kept
for future metadata (`de-DE`). No short-language mapping, implicit fallback, host binding, Site prefix
or Facet segment is added.

**Home rule.** The reserved declaration `id: "home"` with route `["home"]` proposes
`/<locale-path-key>` (currently `/en-001`) and suppresses the literal `home` segment; no
`/en-001/home` alias exists. Any other Page proposes `/<locale-path-key>/<relative-route>`, e.g.
`/de-de/offers/web-design`, with at most four relative segments (`pageRoutePath`), a locale path key of
at most 64 characters and a whole pathname bounded to 240 ASCII characters.

**Matching and purity.** Exact string equality only: one leading slash, lowercase content-slug
segments, no query, fragment, percent escape, backslash, scheme, doubled or trailing slash, and no
visitor IP, cookie, `Accept-Language`, geolocation or inferred locale. Candidate order is a code-point
comparator, never locale collation. Every accepted result is freshly copied and deeply frozen; caller
data is never mutated; hostile manifest, selection or pathname input is refused without reading
properties or echoing values.

**Closed refusals.** `route:manifest-invalid`, `route:selection-invalid`, `route:invalid-pathname`,
`route:unmatched`, `route:unreadable` and `route:duplicate-address`, plus three narrowly justified
literals (`route:invalid-route`, `route:invalid-locale`, `route:pathname-too-long`). Four of these are
defensive guards that no *validated* input can reach, because the graph refuses the underlying defect
first (duplicate Page route, duplicate locale key, malformed route, non-canonical locale, or an
over-long derived path); the tests prove those earlier exact refusals instead of asserting an
unreachable candidate.

**Non-publication boundary.** No `src/app` file imports this module; no App Router segment, middleware,
rewrite, redirect, metadata alternate, sitemap or `robots.txt` endpoint is created; the live `/` page,
its professional copy, the black emblem, the favicon, the CSS, Analytics and `noindex, nofollow,
nocache` are unchanged; and `/en-001`, `/en`, `/en-001/home`, `/robots.txt`, `/sitemap.xml` and every
other non-existent path keep their existing 404 responses.

**Deferred (not part of this increment).** Physical source confinement and reading, document parsing,
per-Page visibility and publication controls, safe HTTP integration and error behaviour, metadata/SEO
including canonical advertising and `hreflang`, and any optional base path. A candidate address in this
index is never publication authority.

**Evidence.** 61 focused cases in `tests/unit/efs-uno-route-address.test.ts` (49 of them refusal cases),
the exact kernel list in `tests/architecture/u01-boundaries.test.mjs` extended by this one pure path,
and the unchanged U01 gates including `pnpm test:http` at 103 checks with its six 404 refusals.

## U03 confined source loading (UNO-WO-020 / R01)

**Scope.** The first **real** Node-side read of authored EFS sources. `src/adapters/efs/uno-confined-source-reader.ts`
composes the accepted candidate-address matcher with the existing declared-source use case and performs one
bounded, physically confined filesystem read. The committed `deployment/efs/content/home.en-001.md` is
genuinely opened and returned as a **non-serving, non-publication** text payload; the address `/en-001`
remains a real HTTP 404.

**Provenance.** NEW UNO-OWNED code. It imports only `node:fs` and `node:path` plus Uno's own contracts —
`matchUnoCandidateRoute`, and `resolveDeclaredPageSource` (which owns `selectDeclaredPageSource`). No
Foundation or Solo reader, layout, site code or fallback is adopted, and no upstream byte runs here. The
confinement and UTF-8 rules are Uno's own.

**Trust boundary.** `repoRoot` is a trusted absolute argument supplied by the caller; it is never
`process.cwd()`, never a request value, and a missing, relative, non-string or non-directory value is
refused. The `pathname` is untrusted and is used only as an address lookup, so no cookie, header,
hostname, query string or country can ever become a filename. `loadUnoCandidateSource` validates the
graph and the Site selection and obtains the candidate itself; a caller-supplied object that merely
resembles a candidate reads nothing.

**Physical confinement.** Every path component below the trusted root is checked with `lstat` and a
symlink, junction or reparse alias is refused — a linked content root, a linked intermediate folder and a
linked final component alike. The content root and the target are re-resolved with `realpath` and accepted
only by real path-relative containment, so a sibling whose name merely starts with `content` is not
inside it. The file must be an ordinary regular file; `O_NOFOLLOW` is used where the platform supports
it, and identity is re-verified after open. Reads are bounded as they happen (manifest 128 KiB, selection
8 KiB, content 64 KiB), so a file that grows after the first stat is still refused at the cap. Decoding is
strict UTF-8 with no replacement characters, and no refusal echoes a path, a body or a system message.

**Source validation and precedence.** Markdown must be non-empty, start with one `# ` heading and carry a
body, with no raw HTML and no NUL/control characters; the text stays opaque and is never rendered. JSON
must parse to an ordinary top-level object, free of prototype-polluting keys, within bounded depth and
width — syntax and safety only, with no Page-document schema, canonical, visibility or `published` field
accepted. Precedence is decided by the **existing** `resolveDeclaredPageSource` use case: a valid declared
JSON wins even when Markdown was listed first, an invalid declared JSON refuses before Markdown is opened,
an absent declared JSON may let declared Markdown answer, and an undeclared file is never probed.

**Non-publication boundary.** No `src/app` file imports the adapter; no route, dynamic segment,
middleware, redirect, metadata alternate, sitemap or `robots.txt` endpoint is created; the landing page,
its copy, the black emblem, the favicon, the CSS, Analytics and `noindex, nofollow, nocache` are unchanged.
An accepted payload carries no URL, host, visibility, release, cache or index authority, and a JSON
`public: true` grants nothing.

**Honest limitations.** Portable Node cannot prove absolute race freedom on every filesystem; Windows
lacks POSIX file-symlink semantics without elevation, so symlink refusal is proved with junctions
(intermediate, final and content-root), which are real reparse aliases rather than a simulated check. No
Page document, rendering, routing or publication is implemented, and the adapter is exercised only by
tests.

**Evidence.** 81 new Vitest cases across `tests/unit/efs-confined-source-reader.test.ts` (48) and
`tests/unit/efs-source-resolution-pipeline.test.ts` (33), the architecture suite at 20 checks including
four new adapter-boundary assertions, and the unchanged U01 gates including `pnpm test:http` at 103 checks.

## U03 selected Page-header projection (UNO-WO-021 / R01)

**Mapping.** `src/core/efs/uno-page-header.ts` (pure core) projects one already-loaded authored source into a
bounded, non-serving header: `kind`, `title`, optional `description`, `visibility`, and — for Markdown only —
the raw unrendered `markdownBody`. `src/application/resolve-uno-page-header.ts` consumes the accepted
non-serving `loadUnoCandidateSource` result, maps the reserved Home candidate `{pageId: "home", routePath: ""}`
to the authoring route `home`, and forwards an existing loader refusal unchanged. Visibility is decided by the
existing `decideSelectedPageVisibility`; route validity by the existing `isPageRoutePath`. Neither file reads a
file, resolves precedence, creates a candidate, imports an adapter or a `node:` built-in, or adds a URL,
canonical, `hreflang`, rendered HTML, sitemap, redirect, provider or publication field.

**Rights and provenance.** Class **REWRITE concept / DEFER**, original **Uno-owned** code. The read-only
comparator was Foundation GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`, `src/core/page-document.ts`
(Git blob `a12d964c43626c6313a621bf628f5cc24b65d444`, 45,106 bytes), inspected for concept only: **no code,
fixture, prose or schema is copied**, no dirty or unpublished upstream was read, no branch was switched, and no
Foundation or Solo Rust, Connect module, media, brand asset or package was imported. Only the approved
`public | unlisted` vocabulary and the reserved Home rule appear, and both are called from the existing policy
rather than restated. Apache-2.0 notices and source history are unchanged; the omitted runtime powers — routing,
rendering, publication, indexing and the module AST — remain deliberately absent.

**Deferred to U04 and beyond.** The full Page-document schema, the 17 module families, module validation and
composition, rendering, per-Page publication authorization, HTTP/status behaviour, canonical and `hreflang`
policy, sitemap and any base path. A successful header projection states none of these: the JSON `modules`
array and every other key stay opaque, unvalidated and non-authoritative.

**Limitations.** Titles and descriptions are single-line plain text with fixed code-point caps (160 / 320) and
no markup; Markdown must begin with one `# ` heading and is always `public`; repeated top-level `title`,
`description` or `visibility` keys refuse the whole source rather than allowing a last-wins value; and no
projection proves a Page is routed, public or indexable.


## U03 clean Vercel build and bounded payload (UNO-WO-033 / R01)

**The defect.** The confined EFS reader built its content-root prefix at runtime — `join(root.root, ...UNO_CONTENT_ROOT.split("/"))`
— and joined declared file segments dynamically. Turbopack's static analysis cannot see a scope in that shape, so it
reported `Dynamic filesystem access causes tracing of the whole project` twice and traced **the entire repository** into
the server payload: the site route's `.nft.json` listed `AGENTS.md`, `README.md`, `LICENSE`, `eslint.config.mjs`,
`tsconfig.json`, `pnpm-lock.yaml`, `public/uno-logo.svg`, eight `scripts/` files and thirty `tests/` files — 228 entries,
including the private work-order directory's siblings and the whole test harness.

**The treatment.** Uno-owned, in two halves, with no publication, routing, locale or refusal semantics changed:

1. **A static tracing boundary in the reader.** Both joins now spell the prefix with literal components
   (`join(root.root, "deployment", "efs", "content", ...contentRelativeSegments(...))`). The declared-path rule already
   confines every source to `deployment/efs/content/`, so the final path is byte-identical to before; what changes is
   that the bundler can now see the scope. `UNO_CONTENT_ROOT_COMPONENTS` states the literals in source, a unit test pins
   it to `UNO_CONTENT_ROOT`, and the architecture test pins the literal join and forbids the runtime-split form.
2. **An explicit, narrow include list in `next.config.ts`.** With the prefix static, the two fixed declarations are no
   longer discovered by static analysis, and the site route is prerendered (`SSG`) so Next applies per-route includes
   only to the dynamic routes. `outputFileTracingIncludes` therefore lists exactly four project-relative globs —
   `deployment/efs/manifest.json`, `deployment/uno.config.json`, `deployment/efs/content/**/*.md`,
   `deployment/efs/content/**/*.json` — for exactly the three routes that read them (`/[locale]/[[...segments]]`,
   `/sitemap.xml`, `/robots.txt`). No `outputFileTracingRoot`, no `outputFileTracingExcludes`, no root-wide glob, no
   `turbopackIgnore` annotation, no `--webpack` escape, no warning filter and no logger override.

**Result.** The build prints **zero** Next/Turbopack warnings and zero errors, and the whole server payload's
project-owned content is four entries: `deployment/efs/manifest.json`, `deployment/uno.config.json`,
`deployment/efs/content/home.en-001.md` and `src/config/uno-serving.ts` — down from 228.

**The inspector.** `scripts/verify-u03-trace.mjs` is original Uno-owned, dependency-free, read-only test tooling. It reads
every `.nft.json` under a given build, resolves each entry against that manifest's own directory, normalizes Windows and
POSIX separators, and refuses: a missing or empty trace, malformed or unreadable evidence, any path outside the physical
root, any private prefix (`.documents/`, `.temp/`, `.git/`, `tests/`, `scripts/`, `public/`), any root documentation or
lockfile, an undeclared deployment file, an unexpected project path, a payload beyond the ceilings, and any published
source the declarations name but the build does not ship. It never reads source bytes, never decides publication and
never re-implements the reader's authorization: it compares what was traced against what the declarations name, so it
serves both the committed unpublished build (`--expect committed`) and the synthetic publication build
(`--expect fixture`) without new authority. `tests/deployment/u03-trace.test.mjs` proves each refusal with a synthetic
root, including a root-wide trace with **no warning text at all** and a fake empty-output success.

**Gates added.** The positive publication gate now fails on any build warning or error and runs the inspector against
both the fixture build and the restored rebuild; the U01 workflow gains a blocking `Bounded output tracing (committed
build)` step on both hosts; the readiness gate refuses a lost inspector step, a widened or root-wide include, a tracing
root override, an exclude list or a dropped include block; the architecture gate confines `node:fs` to the reader and
the serving composition and forbids the runtime-split prefix.

**Rights.** All of the above is original Uno work under Apache-2.0. No Foundation GEO-03 source or asset was copied; the
reference provenance stays pinned at `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`. No dependency was added or upgraded, no
provider, domain or deployment setting was touched, and `deployment/site.config.json` remains absent.

**Still not verified, and not claimed.** A screen-reader audit, a live HTTPS origin's warning-free build (that is the
Owner's Vercel observation), real search-engine indexing and any U04 JSON rendering.


**One fixture, one production build.** The positive gate now declares a custom multi-segment Page (`events`, route
`["programmes","events"]`, published, authored `en-001` and `de-DE` Markdown) and a Page whose preferred JSON is
declared and **malformed** with a valid Markdown alternative (`broken`). Nine task-owned sources
`deployment/efs/content/wo032-*.{md,json}` are created and removed by the existing transaction, which still arms before
the first destructive write and restores in an unconditional `finally`. Six public addresses are asserted — Home, About
and the custom Page, each in two authored full locales — each serving its own source text under its own title, with one
`h1`, truthful `<html lang>`, exact canonical and OG, same-Page alternates and the accepted `x-default` policy (present
on both Home representations, pointing at the default-locale Home; absent on About and the custom Page).
`/sitemap.xml` lists exactly six `<loc>` values with same-Page alternates; `/robots.txt` names the test-only sitemap and
reveals nothing unlisted; `/en` stays a 307 to the test-only canonical Home. Fifteen refusal addresses are real 404s with
no canonical, alternate or OG, including the malformed-JSON Page, a cross-Page route, an extra segment, a short locale, a
bare locale and the previous fixture URL.

**Crawler parity.** Two distinct user agents — an ordinary browser and a Googlebot-shaped one — receive identical
statuses, byte-identical documents and identical canonical/robots/OG/alternate policy for all six Pages and for the
malformed-source refusal, and a forged cookie changes nothing. This is a no-authority proof, **not** an indexing claim.

**A real browser, not a substitute.** `scripts/verify-u03-browser.mjs` is original Uno-owned, test-only code with one
bounded export, `verifyUnoU03Browser({ base, pages, refusedPaths })`. It refuses any non-loopback base before launching,
drives the pinned headless Chromium against the same running production server, and closes pages, contexts and browser in
`finally`. Observed facts come from the rendered DOM: document status, a unique visible `h1` with the authored text, the
own-source paragraph, `<html lang>`, `document.title`, canonical and `og:url`, indexability, same-Page public alternates,
the `x-default` policy, list semantics where the Markdown declares a list, heading hierarchy, no horizontal overflow
(2 px tolerance), no page error, no console error and no request outside loopback. It repeats the essential visibility
checks under `prefers-reduced-motion: reduce`, proves the demonstration's skip link is reachable by keyboard `Tab`, and
proves the global refusal is a real 404 document with one `h1`, a language, `noindex`, no canonical, no alternate, no
leaked authored text and a keyboard-focusable return link.

**Measured evidence.** In one run of the same build: 530 checks pass and none fail — the preserved 195 baseline
assertions expanded with the custom Page, the six-entry sitemap, the additional refusals, 33 crawler-parity checks and the
whole browser suite (104 desktop assertions, 104 mobile assertions, 2 reduced-motion, 11 refusal-document and 2 keyboard
assertions, plus a successful Chromium launch). Every one of the six Pages therefore carries at least 17 independent
desktop and 17 independent mobile browser assertions. The gate then restores the declarations byte-for-byte, rebuilds the
**unpublished** configuration and re-runs the original U01 (103/0) and U03 (91/0) fail-closed suites.

**Dependency provenance and rights.** Exactly one dependency is added, `playwright@1.65.1`, **Apache-2.0**, under
`devDependencies` only, resolved by pnpm to `playwright-core@1.65.1` and nothing else (19 lockfile lines, no other
resolution changed). It is never in `dependencies`, `src/**`, a production page, the client bundle or the Vercel runtime,
it adds no analytics or provider, and it introduces no postinstall script. The Chromium **headless shell** is fetched by
`pnpm exec playwright install --only-shell chromium` into the repository-local ignored `.temp/uno-u03-browsers`, in CI
and locally alike, so no shared user cache and no OS package is touched; the dependency-installing variants are never
used. Browser distribution downloads are tool setup, not provider operations. No screenshot, video or trace is
committed. The browser helper, the fixture text and the assertions are original Uno work under Apache-2.0; no Foundation,
Geo, Solo or Connect source, asset or capability was imported, and no brand, licence or provider authority changed.

**Still not verified, and not claimed.** A screen-reader audit, a live HTTPS origin, real search-engine indexing, a
production provider, browser behaviour on real devices and any U04 JSON rendering remain outside this evidence.


**Why.** The transaction armed its recovery correctly but recorded a fixture as its own *before* the exclusive create
succeeded. If an unrelated file appeared between the successful preflight and that create, `wx` failed `EEXIST` and the
rollback still unlinked the stranger. A second weakness was containment by string prefix, which would accept a sibling
directory named `<root>-other`.

**Ownership is now the exclusive create.** `install()` calls `openExclusive()`, and only a granted handle produces an
ownership record. The record is captured from `fstat()` on that handle — device and inode as the OS reports them — and
written before any content byte, so an owned file whose write fails mid-way is still cleaned up while a file the OS
refused to grant is never recorded, never removed and never reported as owned. Content is written through the granted
handle, not through the path.

**Restore removes only proven ownership.** For each record, `restore()` re-`lstat`s the path and unlinks the file only
when it is not a link, still carries the claimed device/inode pair, **and** still holds exactly the bytes this
transaction wrote there. Identity alone is not a proof on a POSIX host: a freed inode can be handed straight back to the
next file created at the same path, so content is the second, independent check. A replacement file, a symlink, a reused
inode carrying foreign bytes, or an identity the platform cannot prove is left untouched and turns the restore into a
fail-closed result: `preserveScratch`, both recovery copies kept, `dispose()` refused, and a bounded reason list naming
no absolute path. `prepare()` proves the platform can even distinguish two files at one path — an identity probe in
private scratch — and refuses with `identity:unprovable` rather than ever unlinking by pathname alone.

**Containment is component-aware.** `componentsWithin()` expresses each target as `path.relative()` from the verified
root and rejects empty, absolute or `..`-bearing results before the physical `lstat`/`realpath` walk, so a sibling whose
name extends the root, a literal `../` traversal and any unknown reparse outcome are refused before mutation. The root
itself must be a real directory that is its own canonical path. Duplicate fixture paths and any fixture colliding with a
declaration are refused.

**The proof.** Twenty-seven named cases drive the same exported operations in isolated `.temp/wo031-*` roots: the original
nineteen (happy path, idempotence, five preflight refusals including both symlink fixtures, all seven write positions,
caller exception, mid-fixture refusal, fail-closed retention and recovery, scratch hygiene, exported surface) plus seven
ownership cases — an intervening `EEXIST` at the first path, an `EEXIST` at the fifth after four owned files were
created, a partial content write after a granted claim, an owned file replaced before restore, a root-prefix sibling
escape, a literal `..` traversal, and duplicate/colliding declarations. Each asserts the real bytes *and* the real
identity on disk, not an intention counter.

**Unchanged.** No route, component, core rule, application use case, declaration, content file, dependency or provider
setting changed. The positive gate still proves the same four published Pages, alias redirect, canonical/hreflang/OG,
`robots.txt`, `sitemap.xml`, the preserved `/` demonstration and ten strict refusals at 195/0, then rebuilds the
unpublished configuration and re-runs the original U01 103 and U03 91 gates.

## U03 fixture transaction safety (UNO-WO-030 / R01)

**Why.** The positive HTTP gate's first version armed its recovery flag only after the whole fixture had been installed,
so an exception between the first destructive write and that assignment skipped restoration and then discarded the
backups. That failure window is now closed.

**The module.** `scripts/uno-u03-fixture-transaction.mjs` owns the entire fixture lifecycle as one armed transaction:
`prepareUnoU03FixtureTransaction()` proves the physical root and every target (no symlink, junction or reparse escape),
the pinned SHA-256 of each declaration, the `lstat`-proven absence of every fixture source, the unique private scratch and
the verified recovery copies — then returns an **armed** transaction. `install()` records its intent *before* each write,
so a failure during or after the manifest, the config or any of the five creations rolls back in place; `restore()` is
idempotent, re-verifies the original bytes, removes only what it created, and on failure **preserves** the recovery
copies and reports a bounded, path-free reason while never claiming success. The `writer` seam exists only so an isolated
fault suite can fail a specific filesystem call; production always uses the real operations, and no serving code may
import the module at all.

**The proof.** `tests/deployment/u03-fixture-transaction.test.mjs` runs nineteen named cases against isolated
`.temp/wo030-*` roots and drives the same exported operations: the happy path, idempotent restore, a wrong original
digest, a pre-existing fixture path (whose unknown bytes survive), a dangling symlink, a symlinked parent, an absent
scratch root, a write failure at **every** write position (before the first write, after the manifest, after the config,
and at each of the five creations), a caller exception after a complete install, a second transaction refusing a
mid-fixture root, a restore that cannot write (fail-closed with both backups retained and only transaction-owned scratch
removed once the fault is gone), scratch hygiene, and the exported surface. Both symlink fixtures report `NOT
APPLICABLE` on a host without symlink privilege while the rest of the suite still runs. A blocking CI step and a narrow
architecture assertion ("importable only by the sanctioned runner and its suite") keep it that way.

**Unchanged.** No route, component, core rule, application use case, declaration, content file, dependency or provider
setting changed. The positive gate still proves the same four published Pages, the alias redirect, canonical/hreflang/OG,
`robots.txt`, `sitemap.xml`, the preserved `/` demonstration and ten strict refusals, and it still rebuilds the
unpublished configuration and re-runs the original U01 and U03 gates afterwards.

## U03 positive publication, locale documents and SEO (UNO-WO-029 / R01)

**Two root layouts.** `src/app/(demo)/page.tsx` and `src/app/(demo)/layout.tsx` (moved, content byte-identical apart
from one CSS import depth) keep the English demonstration at `/` with its metadata, `lang="en"`, noindex/nofollow and
the one approved Analytics component. The published Site lives in its own root, `src/app/(site)/[locale]/…`, so the two
surfaces can carry different, truthful documents. `src/app/global-not-found.tsx` is the complete HTML 404 for an
address that matches no route — the same visible copy, one `h1`, `lang="en"`, `noindex, nofollow`, the same stylesheet
and no analytics — enabled by the one approved Next 16 flag `experimental.globalNotFound` in `next.config.ts`.

**Truthful language.** `src/app/(site)/[locale]/layout.tsx` owns `<html lang>` for a published Page and resolves the
requested path key through `resolveUnoServingLocaleTag` in `src/config/uno-serving.ts`: the stored, validated locale
authority maps `de-de` back to the authored `de-DE` and `en-001` to `en-001`, and only an explicitly stored short alias
(`en`) is reported as an alias for a redirect-only request. No Host, cookie, `Accept-Language`, environment value or raw
path is authority, and an unknown key is a genuine 404.

**One SEO source of truth.** A published **public** Page takes its canonical URL, its same-Page public locale
alternates and its `x-default` from `planUnoServingDiscovery()` — the same plan behind `robots.txt` and
`sitemap.xml` — so HTML and sitemap cannot disagree. A published **unlisted** Page keeps its own canonical and
`noindex,nofollow` with no alternate, and a JSON body is still refused for serving until U04's renderer exists. An exact
discovery entry is required: a public Page that cannot be found in the plan is refused rather than served with invented
links.

**Address set.** The `[locale]` layout enumerates the locales the declaration publishes and the `[[...segments]]` page
enumerates the published route shapes, both from the same publication gate; `dynamicParams = false` on the page means an
address that was never enumerated is refused by the router with the global 404 document, never streamed as a shell.

**Positive proof.** `scripts/verify-u03-published-http.mjs` installs a temporary, physically confined synthetic
publication fixture (two declarations plus five short original documents), validates it through the **real** loader,
planner and serving composition, builds and serves the real production output on loopback, asserts published Pages with
truthful `lang`, canonical/OG/`hreflang`, one `x-default` on the default Home only, the alias 307, `robots.txt`,
`sitemap.xml` with exactly four public URLs, the untouched `/` demonstration and ten strict refusals, then restores both
declarations byte-for-byte in a `finally`, proves the restoration, rebuilds the unpublished configuration and re-runs the
two original HTTP gates.

**Limits.** The fixture base is the literal test-only `http://localhost:3000`; no production origin exists, no committed
Page is published, no provider was contacted and U03 remains open. Publishing a Page requires a rebuild, exactly as a
file-based site does. Browser, accessibility and real crawler behaviour are not claimed.

**Rights.** Original **Uno-owned** implementation, class **NEW / REWRITE concept**; the pinned Foundation GEO-03 commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` stays read-only context with **no code copied**. No dependency, asset,
secret or licence change; Apache-2.0 notices and the 17-family / 22-module obligations are unchanged and undelivered.

## U03 publication, serving and discovery (UNO-WO-028 / R01)

**Publication authority.** The manifest Page now accepts one optional own-data key, `publication`, whose only
literals are `"draft"` and `"published"`. Absent and `"draft"` are not published; `"published"` alone lets a Page be
*considered* after every other contract accepts. It is Page-scoped, has no Site default, no `public` property and
no inference from a file, route candidate, selected Site, host or environment; an invalid literal refuses as one
new closed code, `page:invalid-publication`. The committed `deployment/efs/manifest.json` declares none, so the one
authored Home remains unpublished and no committed file was edited.

**Planners.** `src/application/plan-uno-published-page.ts` composes the graph, the committed locale authority, the
selection, a caller-proposed base, the matched candidate, the accepted delivery candidate and the header/discovery
classifications into one deeply frozen `{identity, document, delivery}` — or one of fourteen closed `publication:`
literals. Only the candidate's own validated Page with `publication: "published"` can be accepted.
`src/application/plan-uno-public-discovery.ts` turns a complete, validated collection of those accepted decisions
into sorted canonical sitemap entries and same-Page locale alternates, refusing duplicate URLs (case-insensitively),
duplicate Page locales, mixed Sites, undeclared locales and unusable URLs, and excluding every `unlisted` Page.

**Serving boundary.** `src/config/uno-serving.ts` is the only server-side IO boundary: it reads the two fixed
declarations from `process.cwd()` (used once, never as a request value), resolves the committed base, loads one
address through the confined loader and refuses to serve without a base, a published Page, a renderable body and a
consistent authority. `src/app/[locale]/[[...segments]]/page.tsx`, `src/app/robots.txt/route.ts` and
`src/app/sitemap.xml/route.ts` are thin consumers: a refused decision is a genuine 404, never an empty 200, and a
JSON Page is refused for serving until its versioned document contract and renderer exist in U04.

**Presentation.** `src/components/uno-safe-markdown-page.tsx` renders a small Markdown subset as React text nodes:
no `dangerouslySetInnerHTML`, no raw HTML, image, link, table, block quote or second `h1`. Anything unsupported
fails the whole document.

**Non-binding.** No canonical domain was chosen, no committed Page was published, no `basePath`, rewrite, proxy,
tenant gateway or provider setting changed, and U03 remains open.

**Rights.** Original **Uno-owned** implementation, class **NEW / REWRITE concept**; the pinned Foundation GEO-03
commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` (`src/core/page-document.ts`, blob `a12d964c…`) is read-only
comparison context only and **no code was copied**. No dependency, SDK, secret, asset or licence change; the
17-family / 22-module map and Apache-2.0 notices are intact.

**Limitations.** The frozen root layout renders `<html lang="en">`, so a served `en-001` Page cannot carry a truthful
language attribute; that gate is **UNVERIFIED**, not passed. No positive public HTTP response exists in the committed
deployment, which is why the new HTTP gate proves only fail-closed 404 behaviour.

## U03 declared canonical base (UNO-WO-027 / R02)

**Mapping.** `src/core/efs/uno-config.ts` now accepts exactly one additional optional top-level key, `base`, on the
existing selected-Site declaration. When it is absent the validated config is unchanged and carries no `base`
property; when it is present the module calls `validateUnoCanonicalBase(base)` and stores that policy's own
answer, re-expressed as `canonical = origin + pathPrefix` and one string per alias in validated order. Every URL,
scheme, credential, query, fragment, percent-encoding, host, prefix, alias-count, duplicate and overlap rule
stays in the canonical-base contract; this validator restates none of them. A policy refusal becomes the single
new closing code `config:invalid-base`, the policy's own unreadable outcome keeps the existing
`config:unreadable`, and no rejected value is returned or echoed.

**Reader.** `src/application/resolve-uno-committed-base.ts` is a pure use case over the caller's own `{manifest,
selection}` data: it delegates to `validateUnoSiteSelection`, translates that validator's closed codes onto five
`committed-base:` literals (`input-invalid`, `unreadable`, `selection-invalid`, `missing`, `invalid`) and returns a
fresh, deeply frozen `{site, base}`. The committed declaration states no base, and the reader answers
`committed-base:missing` — it never supplies, infers or defaults a domain.

**Non-binding.** A declared base binds no host, sets no runtime `basePath`, performs no redirect, adds no
metadata, chooses no production domain and publishes nothing; `src/app/**` does not import the reader and the
pure kernel never depends on it.

**Rights.** Original **Uno-owned** implementation, class **NEW**; the pinned Foundation GEO-03 commit
`c05c55ea…` remains conceptual context with **no code imported**. No dependency, workflow, asset, deployment file
or committed declaration changed; Apache-2.0 notices and the 17-family / 22-module map are intact.

**Limitations.** A validated declaration is not a selected production domain. No Owner domain exists, no route is
activated and U03 remains open; `committed-base:missing` is the committed reality, not a defect.

## U03 prepared Page-delivery candidate (UNO-WO-026 / R01)
## U03 prepared Page-delivery candidate (UNO-WO-026 / R01)

**Mapping.** `src/application/prepare-uno-page-delivery-candidate.ts` is the first use case that gathers what the
repository already knows about one address into a single record. It reads the stored Site locale policy through
`resolveUnoCommittedLocales`, hands that **stored** policy — never a caller-supplied one — to
`validateUnoSitePublicationInputs` together with the proposed canonical base, takes the authoritative candidate
from `matchUnoCandidateRoute`, and accepts the supplied confined-source load only when it describes that
candidate field for field with the same declared sources in the same order. Header and discoverability then come
from `resolveUnoPageHeader` and `classifyUnoPageDiscoverability`; this use case copies their answers and
re-implements neither policy.

**Shape.** The accepted record is `{accepted, identity, document, ifServed}`: identity carries the one Entity,
Facet, Site, Page, authored locale tag and exact pathname; document carries the projected header and raw,
deliberately unrendered Markdown; `ifServed` carries a **hypothetical** canonical URL built from the validated
proposed base, the robots intent and the six eligibility booleans. Ten closed `delivery:` refusals cover request
shape, hostile structure, stored authority, base, route, load, candidate identity, header, discovery and the
384-byte canonical cap; no refusal echoes caller text.

**Non-serving.** No route, redirect, response, status, rendered HTML, `hreflang` tag, sitemap entry, metadata or
publication flag is produced; `src/app/**` does not import the use case and the pure kernel does not depend on it.

**Rights.** Original **Uno-owned** implementation, class **NEW**; the pinned Foundation GEO-03 commit
`c05c55ea…` remains conceptual context only. No Foundation, Solo or Connect code, media or brand imported; no
dependency, workflow, asset or deployment file touched; Apache-2.0 notices intact.

**Limitations.** A prepared candidate is not a served Page. No production origin is chosen, no route is
activated and U03 remains open; `delivery:header-invalid` is the reachable Home/unlisted guard, while
`delivery:discovery-invalid` stays a defensive code whose reachability through the accepted precedences is
**UNVERIFIED**.

## U03 stored Site-locale policy (UNO-WO-025 / R01)
## U03 stored Site-locale policy (UNO-WO-025 / R01)

**Mapping.** The locale contract is now stored rather than only proposed. `src/core/efs/manifest-graph.ts`
accepts one optional `locales` record on a Site — `{supportedLocales, defaultLocale}`, 1..32 unique canonical
full-region tags with the default inside the list — reusing `localePolicyIssue` on a descriptor-checked copy
with an empty mapping, refusing as the closed `site:invalid-locales`, and additionally refusing a Page locale
the declaring Site does not support. `src/core/efs/uno-config.ts` accepts one optional top-level
`languagePreferences` mapping (0..16 short keys to canonical full-region tags), refuses it as the closed
`config:invalid-language-preferences`, and refuses it as `config:locale-authority-missing` when the selected
Site declares no locale authority to check it against. `src/application/resolve-uno-committed-locales.ts`
composes the two stored authorities into one fresh, deeply frozen policy using seven closed
`committed-locales:` codes, refusing a missing Site policy, a missing mapping and any policy the accepted
locale contract rejects.

**Committed data.** `deployment/efs/manifest.json` declares `locales` for the one `main` Site
(`["en-001"]`, default `en-001`); `deployment/uno.config.json` adds only
`languagePreferences: { "en": "en-001" }`. No base, publication flag, second Site or `schemaVersion` was
introduced, and `validateUnoSiteSelection` remains a selection validator rather than a publication decision.

**Authored Home.** `deployment/efs/content/home.en-001.md` was replaced with the Owner-approved copy (UTF-8 LF,
no BOM, one final LF, 1,165 bytes); its title, source declaration and single representation are unchanged and
`/en-001` still returns 404.

**Rights.** Original **Uno-owned** implementation and prose, class **NEW / REWRITE concept**; the pinned
Foundation GEO-03 commit `c05c55ea…` remains conceptual context only. No Foundation, Solo or Connect code,
media or brand imported; no dependency, workflow or asset added; Apache-2.0 notices intact.

**Limitations.** Stored locales and mapped aliases are declarations, not publication: no production base is
chosen, no route, redirect, canonical URL, `hreflang` or sitemap is emitted, and U03 remains open.

## U03 publication-inputs composition (UNO-WO-024 / R01)
## U03 publication-inputs composition (UNO-WO-024 / R01)

**Mapping.** `src/application/validate-uno-site-publication-inputs.ts` (application layer) composes four
already-validated inputs — the manifest graph, the selected Site, a *proposed* canonical base and an explicit
full-locale policy — into one consistency verdict: the same single Site authors every locale the policy
promises, and it authors a reserved Home at the declared default. It adds no fifth validator; it calls
`validateUnoManifestGraph`, `validateUnoSiteSelection`, `validateUnoCanonicalBase`, `localePolicyIssue` and
`buildUnoCandidateRouteIndex` and re-states none of their rules.

**Result.** Either a freshly copied, deeply frozen `{accepted: true, site, canonicalBase, aliases, localePolicy,
candidateCount}` or one of eleven closed `publication-inputs:` codes. `candidateCount` counts declared candidate
addresses, never published Pages, and the result carries no `published`, `ready`, redirect, canonical URL,
`hreflang`, sitemap, visibility, body or secret field.

**Boundaries.** Both directions of the locale comparison are refused rather than inferred: an authored locale the
policy omits, and a promised locale the selected Site never authors. A missing default Home refuses instead of
falling back to another locale or manufacturing a Page, no language is guessed from geography, and the only
short-language alias is an explicit `en: "en-001"` mapping. The proposed base and policy are caller data, not a
committed configuration file; no migration, route, redirect, metadata, provider access or publication is implied.

**Rights and provenance.** Original **Uno-owned** implementation, class **NEW / REWRITE concept**; informed by,
never copied from, the read-only Foundation GEO-03 commit `c05c55ea…`. No Foundation, Solo Rust, GEO-04, Connect,
mark or asset imported; no dependency, schema, workflow or asset added; Apache-2.0 obligations preserved.

**Limitations.** A consistent composition is **not** publication: it does not select a production origin, admit
Site locale authorities the manifest still lacks, correct the stale Home Markdown, publish a Page or serve a
route. Those remain open U03 gates requiring later Owner orders.

## U03 canonical base validation (UNO-WO-023 / R01)

**Mapping.** `src/core/efs/uno-canonical-base.ts` (pure core) validates one *proposed* Owner-declared
canonical HTTP(S) base as `{canonical, aliases}` and returns either `{accepted: true, canonical: {origin,
pathPrefix}, aliases: [...]}` or one closed refusal code. It is a building block for a future single-Site
configuration; it reads, writes and activates nothing.

**Rules.** HTTPS with lowercase DNS labels only; plain HTTP only for the exact loopback hosts with an optional
explicit port; 1..255 ASCII bytes; no credentials, query, fragment, percent escape, backslash, Unicode,
control, whitespace or trailing slash; an optional prefix of 1..8 lowercase content-slug segments (max 160
characters) reusing `isContentSlug`; at most eight distinct aliases with no self-alias, duplicate or
whole-segment origin overlap. The platform `URL` parser only *confirms* the accepted spelling — any
normalization it would perform is a refusal, and a bare-origin root is read as an empty prefix.

**Rights and provenance.** Original **Uno-owned** implementation, class **NEW / ABSTRACT DESIGN**; no upstream
source, fixture, schema or prose is copied. The historical Foundation GEO-03 commit `c05c55ea…` is read-only
design context for the *idea* of an absolute base, never an import or a write permission. No dependency,
asset, workflow or schema was added; the 17-family / 22-ID capability mapping is unchanged.

**Omitted powers.** No production domain selection, no `deployment/uno.config.json` migration, no second
configuration authority, no Site or Page publication, no route, redirect, canonical tag, sitemap, robots or
`hreflang` emission, no locale interpretation, no DNS or TLS claim, no provider access and no access control.
`validateUnoSiteSelection`, the manifest graph, the locale matcher, the Page-header projector and the
discoverability classifier remain untouched and authoritative in their own scopes.

**Limitations.** Validation proves only that a declaration is well-formed, unambiguous and lexically safe. It
does not prove any origin is reachable, owned by Uno, approved by the Owner, deployed, indexed or serving a
Page, and an accepted alias authorises no redirect.

## U03 discoverability intent (UNO-WO-022 / R01)

**Mapping.** `src/core/efs/uno-discovery-policy.ts` (pure core) classifies the discoverability **intent** of
an already-validated Page header. Its input is exactly `{kind, routePath, visibility}` — the validated
authoring route, not a candidate address — and it delegates every visibility decision to the existing
`decideSelectedPageVisibility`. An accepted result lists six conditional flags (`navigation`, `sitemap`,
`hreflang`, `xDefault`, `languageSwitch`, `automaticLocaleRedirectTarget`) plus
`robotsIfDirectlyServed`, and nothing else: no URL, path, canonical, locale target, body or `published` field.

**Rights and provenance.** Original **Uno-owned** code, class **NEW / REWRITE concept**; no upstream text,
fixture, schema or prose is copied. The historical Foundation GEO-03 commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains read-only provenance for the *idea* of
visibility-conditional discoverability only, never an import or a write permission. Solo Rust and separately
licensed Connect are excluded, and no package, media or brand asset was added. Apache-2.0 notices and source
history are unchanged.

**Omitted powers.** No publication, routing, rendering, sitemap generation, robots emission, canonical or
`hreflang` output, automatic locale redirect, provider call or access control. A `public` classification is a
constraint for a later Owner-authorized pipeline, not a publication; `unlisted` withholds intent signals and
is explicitly not access control. No `src/app` source imports the classifier, and no manifest field, JSON
property or visibility value can authorize publication by itself.

**Deferred.** The validated Page document and module schema, the 17 module families, real HTTP/status
behaviour, metadata emission, locale routing and the 22 registered capability IDs remain U04 obligations and
are untouched here.

**Limitations.** The classifier proves only what a future publisher would be *eligible* to do. It does not
prove a Page is served, indexed, linked, translated or redirectable, and a forged `visibility` on a Markdown
projection refuses as a mismatch rather than being reclassified.

## U04 first JSON Page slice — `UNO-WO-035 / R01`

**Coverage, measured rather than promised: 5 / 22 module renderers, 0 / 17 Foundation family compositions.**

**New Uno-owned sources.** `src/core/page-document.ts` (the version-1 document contract) and
`src/components/uno-page-sections.tsx` (the server renderer). Class **NEW / COMPOSE**; the read-only Foundation
GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` (`src/core/page-document.ts`, blob
`a12d964c43626c6313a621bf628f5cc24b65d444`, and the composer `src/components/site/page-document-content.tsx`,
blob `fc35a52d6cfc5f114e50470e8286a89916cde801`) was read for semantics and bounds only. No code, markup, class
name, fixture, asset or family vocabulary was copied.

**The closed envelope.** `{ version: 1, title, description?, visibility?, sections }` — nothing else. `title`
is required, nonempty and bounded to 160 code points; `description` is optional and bounded to 320;
`visibility` is `public` (the default) or `unlisted`, and the reserved Home Page can never be `unlisted`;
`sections` holds 1–32 nodes, at most 128 nodes in total, at most four levels deep, with 1–8 typed children per
layout. A section is exactly `{ id, module, props }` plus `children` for the two layouts. Identifiers are
`[a-z][a-z0-9-]{0,47}`, unique across the document, and every `content.actions` target must resolve to a section
in the same document. Text is capped at 4,000 code points; a JSON source is capped at 64 KiB.

Documented refusals, all closed literals: `document:input-not-plain`, `text-not-a-string`, `text-too-large`,
`json-parse`, `json-duplicate-key`, `json-unsafe`, `not-an-object`, `unexpected-key`, `unsupported-version`,
`invalid-title`, `invalid-description`, `invalid-visibility`, `invalid-sections`, `unknown-module`,
`renderer-unavailable`, `invalid-section`, `invalid-section-id`, `duplicate-section-id`, `invalid-props`,
`invalid-children`, `too-deep`, `too-many-nodes`, `too-many-sections`, `heading-order`, `unsafe-text`,
`unsafe-link`, `unresolved-target`, `home-cannot-be-unlisted`, `cyclic`, `unreadable`. `unknown-module` (not one
of the immutable 22 IDs) and `renderer-unavailable` (registered but outside this five-module slice) are
deliberately distinct, and both refuse the entire Page before any renderer or discovery plan sees it.

**Authority is untouched.** The document carries no Entity, Facet, Site, Page, locale, route, canonical, host,
base path, publication, robots, analytics or provider field, and any such key refuses as `unexpected-key`.
Publication remains the manifest Page's own `publication: "published"`; visibility is the selected source's own
intent; presentation is a later authority. A valid **unlisted** JSON Page is served only at its exact full-locale
address with its own canonical and `noindex,nofollow`, and is absent from the sitemap, `hreflang`, `x-default`,
navigation and alias redirects. A present-but-invalid JSON source refuses the Page outright; Markdown answers only
when no JSON is declared at all.

**Rights.** All code, CSS, tests and fixture text in this slice are original Uno-owned Apache-2.0. No Rukita,
Foundation, Solo or Connect implementation, brand, screenshot, image, listing data or marketplace integration is
included; the cited reference contributed only the general listing-card, information-hierarchy and
responsive-grid pattern. No dependency, font, CDN or remote asset was added, and the renderer emits no client
JavaScript.

**Evidence.** `scripts/verify-u04-json-slice.mjs` installs a restore-in-finally synthetic fixture through the
accepted U03 transaction helper, builds and serves the real production output on loopback, and asserts over real
HTTP and a real headless Chromium DOM: one `h1`, two semantic `<article>` cards with unique headings and bodies,
real same-page anchors, exact canonical/OG, truthful `<html lang>`, the unlisted Page's own privacy with zero
discovery leakage, sixteen distinct refusals as genuine 404s with no metadata echo, crawler parity, no console
error, no page error, no external request, and no horizontal overflow at 320, 390, 768 and 1280 CSS pixels in
light and dark with reduced motion (239 checks, 0 failed), then restores the committed declarations byte for byte
and re-runs the committed build, the bounded trace inspection and the original U03 gate.

**Still deferred, and still mandatory.** The typed 17-family composition layer, the remaining 17 module
renderers (including the single tabs/modal/carousel client island and the honest display-only contact state),
`deployment/site.config.json` and the presentation shell, and the four-zone owned-asset policy and reader. This
run does not close U04 and does not claim 22/22 or 17/17 parity.

## U04 hero, statistics and testimonials — `UNO-WO-037 / R01`

**What landed.** Three further approved IDs become renderable — `content.hero`, `content.stats` and
`content.testimonials` — raising live module coverage from 5 to **8 of the immutable 22**. Each has closed typed
props, bounded caps, a unique closed negative refusal, several accepted variants, and real production HTTP plus
real Chromium proof. The fourteen remaining registered IDs still refuse as `document:renderer-unavailable`, the
root version-1 envelope and every existing cap are unchanged, and the family-composition layer is still **0 of 17**.

**Audit-first reuse, as the Owner required.** The read-only source of potential reuse was
`provelopment/provelopment-foundation` at the approved GEO-03 pin `c05c55ea61b5347cf5032211dd0bf37f2cc5083c`. The
pin and every audited blob fingerprint were verified through the read-only API and each decoded file re-hashed to
its pinned SHA-1 before any concept was adopted:

| Audited Foundation file | Pinned blob | Verified |
| --- | --- | --- |
| `LICENSE` (Apache License 2.0) | `d645695673349e3947e8e5ae42332d0ac3164cd7` | round-trip |
| `src/core/page-document.ts` | `a12d964c43626c6313a621bf628f5cc24b65d444` | round-trip |
| `src/components/site/page-sections/media-sections.tsx` (hero) | `e3f3a12e5e26cb6af9133bef79f5fa2dc0680bb2` | round-trip |
| `src/components/site/page-sections/items-sections.tsx` (stats) | `bc729d6a2e6484dc2c26ed997e65ee644bc8a7e6` | round-trip |
| `src/components/site/page-sections/text-sections.tsx` (quote) | `caeee57798bdd533867e5bef350422618187612f` | round-trip |
| `src/components/site/page-sections/section-support.tsx` | `19c9bee3b3b200af2455813e5f842c30b062a6ac` | round-trip |
| `src/components/site/page-document-content.tsx` | `fc35a52d6cfc5f114e50470e8286a89916cde801` | round-trip |

**Adoption decision per target.** `KEEP`, `ADAPT`, `REWRITE` and `REJECT` are recorded with the dependency chain
that decides it, not with a preference:

| Target | Decision | Dependency chain and reason |
| --- | --- | --- |
| Foundation `hero` presentation order (eyebrow → lede → actions → support) | **ADAPT** | The *ordering* and the closed `align`/`surface` vocabulary are adopted as behaviour. Foundation renders `lede`/`support` through `MarkdownField` with a link resolver and actions through `ActionLinks` (`locale` + `PageLinkIdResolver`); Uno's contract refuses authored Markdown/HTML and allows only same-document section anchors, so the markup is rewritten in Uno's own CSS and React text. |
| Foundation `stats` item shape (`{value,label,detail?}`) and the six-item bound | **ADAPT** | The bounded shape, the six-item ceiling and the closed `surface` value are adopted. Foundation renders `<ul>` with Tailwind classes and Markdown `detail`; the order requires `<dl>/<dt>/<dd>` with `aria-labelledby`, so the element semantics, heading-order rule and styling are rewritten. |
| Foundation `quote` semantics (`<figure>` + `<blockquote>` + optional `<figcaption>`) | **ADAPT** | The semantic skeleton is adopted, including an optional caption that appears only when attribution data exists. Foundation concatenates `attribution` and `role` into one Markdown-free string and routes the body through `MarkdownField`; Uno keeps the two values as separate inert nodes and never fabricates either. |
| Foundation `page-document.ts` section schemas (`hero`, `stats`, `quote`) | **REWRITE** | Foundation validates with `zod` inside a Markdown/link-aware document model. Uno's contract is framework-free, dependency-free and closed, and must refuse the whole Page with one literal; the bounds are re-expressed as Uno caps (`heroActions: 3`, `statItems: 6`, `testimonialItems: 6`, `statValueCodePoints: 48`), and no schema text is copied. |
| `section-support.tsx` (`SectionHeading`, `MarkdownField`, `ActionLinks`, `columnsClass`, `sectionClassName`) | **REJECT** | It hard-depends on Markdown rendering, an application-link resolver, the Tailwind design system and Foundation's heading objects. None of those exist in Uno's A1 boundary, and importing the dependency chain would be a larger change than rewriting the five small presentation cases. |
| `page-document-content.tsx` family dispatch | **REJECT as a registry** | It is an exhaustive *source-family* dispatcher, not a module-ID registry. Adopting it would duplicate the immutable 22-ID vocabulary and pre-empt the separately authorised 17-family composition layer, which this order explicitly does not implement. |
| Rukita property-listing page | **REJECT** | Visual-composition reference only. No source, design, asset, copy, trademark, login, inventory, booking, payment or search-provider code was read into Uno. |

**Rights.** The audited repository's root `LICENSE` is the Apache License, Version 2.0, covering its `src/`
tree. Because this run adopted *behaviour, bounds and semantic structure* and copied **no source text, markup,
class name, schema, fixture or asset**, no Foundation file is redistributed here and no additional notice is
required; the attribution above records the provenance and the audit trail anyway. No `modules/connect/**`,
Solo, Rust, Hub/Spoke, proprietary brand asset or provider integration was consulted or copied, and no
dependency, font, CDN or remote resource was added on account of this audit.

**Exact contract added.** `content.hero` accepts closed keys `{eyebrow?,lede?,support?,align?,surface?,actions?}`,
requires at least one authored body field, caps `actions` at three same-document targets and refuses a heading,
title, level, raw markup, an empty body, a fourth action, an unresolved or unsafe target and any extra key.
`content.stats` accepts `{items,heading?,level?,surface?}`, 1–6 items of exactly `{value,label,detail?}`, and
requires `level` 2–6 exactly when a heading is present, obeying the same incremental heading-order contract as
`content.heading`; a stray level, an empty value or label, a seventh item, an extra item key and authored markup
each refuse. `content.testimonials` accepts `{items,align?,surface?}` with 1–6 items of exactly
`{quote,attribution?,role?}`; an empty quote, a seventh item, an invented `author` key, an empty attribution, an
unknown props key and authored markup each refuse. Every one of those refusals is a closed literal from the
existing vocabulary — no new reason was invented for this increment.

**Renderer and style.** Three exhaustive server cases in `src/components/uno-page-sections.tsx`: a `<section>`
hero with inert eyebrow/lede/support text and accessible same-document anchors; a `<section>` statistics block
whose heading is linked by `aria-labelledby` and whose figures are a real `<dl>` of `<dt>` labels and `<dd>`
values with an optional detail span; and a `<section>` of `<figure>`/`<blockquote>` quotations with one optional
`<figcaption>` that appears only when authored attribution or role data exists. No `"use client"`, no
`dangerouslySetInnerHTML`, no inline style, no `<main>` and no second `<h1>`. `.uno-json-hero`,
`.uno-json-stats` and `.uno-json-testimonials` rules in `src/app/globals.css` use only the existing `--uno-*`
palette tokens, handle 320/390/768/1280 without horizontal overflow, keep the shared focus ring and add no motion
beyond the reduced-motion guard.

**Evidence.** `scripts/verify-u04-json-slice.mjs` keeps its accepted synthetic two-locale publication, exclusive
fixture claims, `finally` restoration and post-restore committed rebuild, and now also proves the three modules
with the real contract in-process, over real production HTTP and in a real Chromium DOM: authored eyebrow/lede/
support text, the same-document hero action and its keyboard focus, the statistics `<dt>`/`<dd>` structure and
`aria-labelledby` link, three distinct quoted figures with exactly one caption, one `h1`, one `main`, two article
cards, 4.5:1 dark-mode contrast for the statistic value, and no horizontal overflow at all four widths. Three
task-owned negative Pages (`/en-001/herobody`, `/en-001/statslevel`, `/en-001/quotemarkup`) answer genuine 404s
with `invalid-props`, `heading-order` and `unsafe-text` respectively, alongside the retained sixteen. The gate
reports **308 checks, 0 failed**, and `tests/deployment/u04-json-slice.test.mjs` carries **9** hermetic guards
including the retained dark-context contract and new drift checks that fail if any added evidence is removed.

**Still deferred, and still mandatory.** The typed 17-family composition layer (**0 of 17**), the remaining
fourteen module renderers (including the single tabs/modal/carousel client island and the honest display-only
contact state), `deployment/site.config.json` and the presentation shell, and the four-zone owned-asset policy and
reader. This increment does not close U04 and does not claim 22/22 or 17/17 parity.
