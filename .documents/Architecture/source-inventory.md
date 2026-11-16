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
