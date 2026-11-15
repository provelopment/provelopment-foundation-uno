# UNO-WO-002 / R01 — READ-ONLY WIP INVENTORY

**Order:** `UNO-WO-002` · **Edition:** `R01` · **Type:** read-only audit (AUDIT ONLY)
**Execution date:** 2026-11-15
**Execution role:** Foundation Uno Implementation Agent
**Review role:** Chief Master Architect (independent evidence review)
**Outcome:** `COMPLETE`

> This is **evidence**, not source approval. It is not an implementation, a branch, a commit,
> a product test, U00 closure, a U01 extraction pin, a release or a deployment. Every path
> below is a **review candidate** only. Definitive KEEP / ADAPT / REWRITE / DEFER / REJECT
> decisions belong to the Architect's consolidated review with the Owner.

Paths are recorded **symbolically** — `<UNO_ROOT>`, `<FOUNDATION_REF>`, `<PARENT>`. No
physical personal path is published here, and no private order bytes, raw source excerpt,
diff hunk or credential is reproduced.

---

## 1. Authorisation and order identity

| Fact | Value |
| --- | --- |
| Order ID / edition | `UNO-WO-002 / R01` |
| Owner activation wording | separate Owner activation naming exactly `UNO-WO-002 / R01`, AUDIT ONLY |
| Installed order path (symbolic) | `<UNO_ROOT>/.documents/WIP/workorder-active.md` |
| Installed order SHA-256 (observed) | `EFCE92543630DB8A6D3EA78C4A594BB675C00865C0D1EE0C9AA6838D8C51E5CC` |
| Required SHA-256 | identical — **exact match** |
| Order size | 18,922 bytes |
| Order tracked / ignored | **untracked**; ignored via `.gitignore:12` |
| Order modified by this run | **no** |
| Root-level alternate order | **absent** |

The order was read in full (§1–§8) before any action. Its write ledger contains exactly two
locations: the single report at `<UNO_ROOT>/.documents/Reports/execution-report.md` and
metadata-only scratch at `<UNO_ROOT>/.temp/uno-wo-002/`. Nothing else in this run was writable.

## 2. Environment identity

| Role | Resolution | Integrity |
| --- | --- | --- |
| Uno sole working checkout | `<UNO_ROOT>` | ordinary directory chain; no reparse point, junction or symlink in any ancestor |
| Protected Foundation reference | `<FOUNDATION_REF>` | ordinary directory chain; **distinct** physical directory from Uno; real `.git` **directory** (not a gitfile) |
| Parent Provelopment checkout | `<PARENT>` | read-only in this run |
| Containment | Uno is not inside the reference; the reference is not inside Uno | confirmed both directions |

## 3. Preflight results

| Check | Result |
| --- | --- |
| Owner activation names `UNO-WO-002 / R01` | `PASS` |
| Installed order SHA-256 matches required bytes | `PASS` — `EFCE9254…8C51E5CC` |
| Local Uno `main` HEAD is exactly `b067b6519fab69dfc3d3e2fcb8e33884b5ff8078` | `PASS` |
| `origin/main` at the same revision | `PASS` |
| Exactly one remote, being Uno only | `PASS` |
| Exactly one Uno worktree | `PASS` |
| Uno worktree clean before the run | `PASS` |
| No root-level alternate ACTIVE, no duplicate report | `PASS` |
| Parent anchored `/00.foundation-uno/` guard, **from the parent's own root** | `PASS` — `.gitignore:138`, exit 0 |
| Parent guard not treated as a nested-file false positive | `PASS` — rule read from the parent root file |
| Parent working content still carries the Owner's separate agency entry | `PASS` — uncommitted, untouched |
| Foundation is a separate valid Git working tree with no linkage to Uno | `PASS` |
| Reference dirty state treated as **expected**, never repaired | `PASS` |
| Read operations run with optional locks disabled and fsmonitor/untracked-cache off | `PASS` |
| No task ledger competing with the four WIP slots | `PASS` |

Public `AGENTS.md`, the local SOP, the private order, the report slot and the four WIP file
names were read as the order requires. Foundation was **not** edited, staged, reset, cleaned,
fetched, built, tested or formatted.

## 4. Foundation baseline fingerprint

| Fact | Value |
| --- | --- |
| HEAD | `8789a450525d44dc8f60ea572ad84fcf64f2ace5` |
| Branch | `feat/foundation-geo-04-legacy-retirement` |
| Remotes | 1 |
| Porcelain entries (before) | **5** |
| Staged entries | **0** |
| Tracked modified | **3** |
| Untracked | **2** |
| Working-tree path | verified privately as a distinct physical directory; recorded symbolically only |
| `.git/index` last-write | 2026-11-04T03:45:08Z — predates this run and unchanged by it |

Total candidates: **5**, against a cap of 200 changed/untracked paths. Cap not approached.

### 4.1 Candidate paths, sizes and SHA-256 (sanitized; all non-secret source/tests)

| # | Category | Relative path | Bytes | SHA-256 (prefix) |
| --- | --- | --- | --- | --- |
| 1 | tracked modified | `src/app/[[...segments]]/server-composition.tsx` | 88,886 | `ABFDD3084906B2F9…` |
| 2 | tracked modified | `tests/browser/matrix.mjs` | 508,254 | `1C3F2422F3C942BC…` |
| 3 | tracked modified | `tests/unit/efs-context-nav-links.test.tsx` | 11,305 | `F7A9B05AEBA24C34…` |
| 4 | untracked | `tests/architecture/efs-connect-method-icon-contract.test.ts` | 3,688 | `A1E7A3F9A664C152…` |
| 5 | untracked | `tests/architecture/efs-shell-aside-contract.test.ts` | 4,567 | `9F03374B08E7F286…` |

Unstaged line volume (`--numstat`, counts only, no hunks):

| Path | Added | Removed |
| --- | --- | --- |
| `src/app/[[...segments]]/server-composition.tsx` | 42 | 1 |
| `tests/browser/matrix.mjs` | 170 | 19 |
| `tests/unit/efs-context-nav-links.test.tsx` | 6 | 0 |

Items counted as **excluded / sensitive** without inspection: `.env*`, keys and tokens,
`.git` object and index internals (Git metadata read only through safe read-only commands),
credentials, customer data, personal documents, `node_modules`, `.next`, ignored caches,
build artifacts and unknown binary or untracked documents. No such item was read, hashed or
enumerated.

## 5. Committed-object availability and lineage

All three commits exist **locally**. **Nothing was fetched.** `UNAVAILABLE` does not apply.

| Role | Commit | Type | Local |
| --- | --- | --- | --- |
| Selected reference (GEO-03), curated WIP — *not* import authority | `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` | commit | available |
| Released comparison (historical main baseline) | `fa599973a88ff77f6a8e012f3266c3c139b52c17` | commit | available |
| Unfinished candidate (GEO-04, this dirty working tree) | `8789a450525d44dc8f60ea572ad84fcf64f2ace5` | commit | available |

Proven committed relationships (read-only ancestry tests):

| Relationship | Result |
| --- | --- |
| `fa599973` is an ancestor of `8789a450` | **yes** (rc 0) |
| `c05c55ea` is an ancestor of `8789a450` | **yes** (rc 0) |
| `8789a450` is an ancestor of `c05c55ea` | **no** (rc 1) |
| merge-base of `fa599973` and `c05c55ea` | `fa599973` — GEO-03 descends from the released baseline |
| Commits `fa599973..8789a450` | 33 |
| Commits `c05c55ea..8789a450` | 19 |
| Commits `8789a450..c05c55ea` | 0 |
| Files changed `fa599973` → `8789a450` | 251 |

So the working tree is **ahead of both** reference points: GEO-03 is 19 commits behind, and the
released baseline is 33 behind. The dirty HEAD is **not** a published baseline and carries
work that neither curated reference contains.

### 5.1 Distribution of the 251 changes from the released baseline

Concentrated in tests and multi-tenant deployment data: `tests/unit` 48, `deployment/spokes`
28, `tests/fixtures` 25, `src/app` 23, `tests/browser` 17, `deployment/tests` 16,
`src/components` 16, `deployment/efs` 15, `tests/architecture` 14, `tests/integration` 13,
`src/core` 11, `tests/support` 9, `src/config` 6.

### 5.2 Eligible-group coverage at HEAD (file counts)

| Group | Files | Note |
| --- | --- | --- |
| `src/core/efs` | 8 | discovery, identity, locales, opening-schedule, properties, property-contract, public-facts, publication |
| `src/core/page-document` | 1 | `src/core/page-document.ts` present |
| `src/adapters/content` | 8 | authoring-page, authoring-source-discovery, efs-content, frontmatter, json-page, page-availability, page-link-integrity, page-sources |
| `src/app` | 32 | includes the Spoke-bound render graph |
| `src/components/site` | 40 | presentation shell |
| `src/config` | 39 | includes 14 `spoke-*` / hub modules |
| `deployment/efs` | 19 | 2 capsule directories |
| `scripts` | 18 | |
| `tests` | 353 | full suite size |

## 6. Reviewed candidate families and relevance against the approved filters

Reviewed within cap: **14 files** (limit 20), each inspected transiently at ≤60 relevant
lines. **No raw excerpt is persisted.** Findings are paraphrased.

### 6.1 Filter-by-filter result

| # | Approved architectural filter | Verdict | Evidence summary |
| --- | --- | --- | --- |
| 1 | one-Entity EFS graph, one selected public Site, explicit source declarations | **CONFLICT / REVIEW** | Explicit declarations exist and are strong, but the graph is shaped for **many** tenants (§6.2) |
| 2 | canonical URL and real full locale incl. `en → en-001` | **SUPPORTS** | Leaf-only localization; canonical BCP 47 case vs lowercase path key kept distinct; `en-001` documented as a valid regional key and *not* a worldwide Site identity |
| 3 | five-level additive public/private properties with `contact.phone` | **SUPPORTS** | Typed property contract over a generic five-level cascade; string-fact keys are exactly `brand.name`, `contact.name`, `contact.email`, `contact.phone`; malformed declarations refused before serving |
| 4 | versioned typed safe modules, all 22 targets, 17-family parity | **PARTIAL / UNVERIFIED** | Safe typed module discipline is real and framework-free; the 22-target and 17-family counts were **not** verified in this pass |
| 5 | effective localized JSON-body-only unlisted visibility | **SUPPORTS** | Sitemap derives from one effective binding; only `public` is advertised; `unlisted` is served but never advertised; visibility is carried by the **representation's source**, not the Page |
| 6 | neutral rights-safe authored/generated assets | **REVIEW** | Assets exist and are SVG, but provenance of the icon library and brand marks is **not** established here |
| 7 | provider-disabled-by-default; Connect reuse needs separate Uno rights | **REVIEW / BLOCKER** | Analytics dependency is present; Connect is a separately licensed private module (§7) |

### 6.2 The one-Entity conflict, stated precisely

The local WIP is architecturally **multi-tenant**, not single-Entity. Three independent
observations:

1. `src/core/spoke/model.ts` defines **four** containers that are deliberately not collapsed —
   a Spoke Hub coordinating Spokes, a Spoke as a domain boundary, a Site Hub as an internal
   grouping (type `Hub`), and a Site as Foundation's own context — plus a `legacy` / `explicit`
   declaration switch.
2. `src/core/spoke/` carries 13 modules including hostname resolution, hub membership, site
   ownership, coherence and collection logic; `src/config/` carries 14 further `spoke-*` / hub
   modules.
3. `src/app/[[...segments]]/server-composition.tsx` binds the whole server render graph to an
   explicit `SpokeRuntimeContext` selected per request at the boundary.

This is exactly the surface **U02** must remove. It is also why U01 must be treated as a
baseline stage and not as a hidden cutover: importing this tree as-is would import the
Hub/Spoke domain.

### 6.3 Single-Site and publication shape

`publication.ts` is favourable and worth preserving conceptually: a public URL is built from a
binding's **authored public base**, never from an EntityID, SiteID, inherited website/contact
URL, `site.url`, source directory or hostname inference. A binding selects one Facet and a
declared set of eligible Sites, with whole-segment prefix claims that fail closed on duplicate,
ambiguous, nested or unclaimed routes. A `closed` / `open` Site mode exists — this is the
`siteMode` decision item and it is **live code**, not a stub.

### 6.4 Deployment fixture shape (classification only)

| Signal | Value |
| --- | --- |
| `deployment/efs/manifest.json` top-level keys | `entities`, `publications` |
| Entities declared | **8** |
| `deployment/spokes.json` keys | `spokes`, `inspectionSpoke`, `inspectionHosts` |
| Spokes declared | **8** |
| Capsule directories present | **2** (`…0001` foundation, `…0002` germany) |

Eight declared tenants against two materialised capsules. The authored fixture is
multi-tenant; the content on disk covers two. Relevant to U02's zero/two-Entity refusal, and a
reason not to adopt the fixture shape wholesale.

### 6.5 Locale and page-document findings worth carrying forward

- Locale resolution order is explicit-only: a valid explicit locale wins exactly; otherwise a
  valid visitor cookie, then a supported `Accept-Language` preference, then the declared
  default. **No** geo-IP, location or Site-name inference, and no synthesized, extended,
  truncated or inferred locale.
- Publication **qualification** is deliberately separate from tag **syntax** — a valid tag can
  still be unfit to name a published representation, and the module never repairs one into
  qualification. A missing translation yields a truthful temporary redirect to the real
  representation or a 404 — never a phantom `hreflang`, canonical tag or content-language.
- The declarative page document is data-only: no JavaScript, expressions, imports, JSX,
  author-supplied component names, `eval`, event handlers, raw HTML, `style`, class names,
  pixel values or unclassified URLs; one schema; an **undeclared property is refused, not
  ignored**, so a typo fails the build naming the file.
- The JSON page reader reads `<content-root>/pages/json/<locale>/<route-path>.json`, treats
  nothing as optional except `description`, distinguishes syntax from schema errors, is pure,
  and never renders, resolves a locale or touches the filesystem.

### 6.6 The five dirty candidates

| # | Path | What it appears to be | Note |
| --- | --- | --- | --- |
| 1 | `src/app/[[...segments]]/server-composition.tsx` | Spoke-context render graph; the modification moves composition facts off module-global state onto the rendering context | Touches the **U02 removal surface**; +42/−1 |
| 2 | `tests/browser/matrix.mjs` | Large browser matrix suite | +170/−19; the exact delta was **not** reconstructed (raw hunks prohibited) |
| 3 | `tests/unit/efs-context-nav-links.test.tsx` | Unit test for context nav links | +6/−0 |
| 4 | `tests/architecture/efs-connect-method-icon-contract.test.ts` | New **source-shape** contract test reading `src/` text and asserting on exported function bodies | Untracked; asserts source text, does not import the module |
| 5 | `tests/architecture/efs-shell-aside-contract.test.ts` | New source-shape contract test of the same style | Untracked |

Candidates 4 and 5 are notable as *technique*: they read source files as text from the process
working directory and assert on function bodies. Such tests are brittle against refactors and
would need re-basing under Uno's own layout — a review decision, not an adoption recommendation.

## 7. Rights, licence and dependency blockers

| Item | Finding |
| --- | --- |
| Repository licence | Foundation carries an Apache-2.0 `LICENSE`; Apache-2.0 grants **software** rights, not trademark rights |
| Connect module | `modules/connect/LICENSE-CONNECT.md` is an explicit **separate licence record**, not the repository licence. Source is carried from the private `provelopment-module-connect` at a pinned release and commit, as a 49-file subtree verified by a local script |
| Consequence | Connect source cannot be reused in Uno on the repository notice alone; **separately negotiated Uno rights are required**. This is a blocker, not a formality |
| Brand assets | `favicon.svg` / `logo.svg` per capsule are brand marks; neutrality is **not** established |
| Icon library | A large SVG icon set under a per-Spoke content assets tree; provenance and licence status **UNVERIFIED** |
| Product prose | Authored page content exists per capsule and locale; reuse requires a provenance review |
| Analytics | `@vercel/analytics` is a declared runtime dependency — a provider decision that conflicts with a strict provider-disabled-by-default stance unless deliberately approved |
| Runtime dependencies | `next 16.4.2`, `react` / `react-dom 19.2.9`, `zod 4.6.7`, `marked`, `sanitize-html`, `@vercel/analytics` — 7 runtime, 11 dev. Pinning policy remains an Owner decision |

## 8. Historical evidence — labelled `HISTORICAL`, not re-run

This audit ran **no** tests, builds, typecheck, lint or browser suite, and therefore makes **no**
claim about current green or red status.

| Evidence | Status |
| --- | --- |
| GEO-04 prior browser / validation red | `HISTORICAL` — asserted by the order and prior reports; **not independently verified** in this pass |
| Released baseline `fa599973` was the published main line | `HISTORICAL` |
| `tests` tree contains 353 files at HEAD | `VERIFIED` — tree listing only, not executed |

## 9. Before/after no-write check on the protected reference

Taken at the end of the audit and compared with the preflight baseline. **No source, index or
history object was touched to obtain either reading.**

| Signal | Before | After | Match |
| --- | --- | --- | --- |
| HEAD | `8789a450…64f2ace5` | `8789a450…64f2ace5` | **yes** |
| Branch | `feat/foundation-geo-04-legacy-retirement` | same | **yes** |
| Porcelain entries | 5 | 5 | **yes** |
| Staged | 0 | 0 | **yes** |
| `src/app/[[...segments]]/server-composition.tsx` | `ABFDD3084906B2F9…` | `ABFDD3084906B2F9…` | **yes** |
| `tests/browser/matrix.mjs` | `1C3F2422F3C942BC…` | `1C3F2422F3C942BC…` | **yes** |
| `tests/unit/efs-context-nav-links.test.tsx` | `F7A9B05AEBA24C34…` | `F7A9B05AEBA24C34…` | **yes** |
| `tests/architecture/efs-connect-method-icon-contract.test.ts` | `A1E7A3F9A664C152…` | `A1E7A3F9A664C152…` | **yes** |
| `tests/architecture/efs-shell-aside-contract.test.ts` | `9F03374B08E7F286…` | `9F03374B08E7F286…` | **yes** |
| `.git/index` last-write | 2026-11-04T03:45:08Z | same | **yes** |

**Result: `PASS`.** The Foundation reference is byte-preserved and status-identical. Its dirty
state was observed, never repaired.

## 10. Acceptance matrix

| Requirement | Mark | Evidence |
| --- | --- | --- |
| Physical root and junction confinement, Uno and reference distinct | `PASS` | No reparse point in either ancestry; distinct toplevels and git-dirs; real `.git` directory (§2) |
| Owner order identity and handoff | `PASS` | SHA-256 exact match to the required bytes; untracked and ignored; unmodified (§1) |
| Uno HEAD / origin / worktree identity | `PASS` | `b067b65…` on `main`, one remote, one worktree, clean (§3) |
| Parent guard recorded from the parent's own root | `PASS` | `.gitignore:138`, not a nested-file false positive (§3) |
| Reference read-only integrity | `PASS` | Before/after identical, index mtime unchanged (§9) |
| Candidate cap and coverage | `PASS` | 5 of 200 paths; 14 of 20 reviewed files; ≤60 lines each (§4, §6) |
| Secret and privacy redaction | `PASS` | No secret read, hashed or enumerated; no raw excerpt, diff hunk or physical path persisted (§4, §6) |
| Committed object availability for all three SHAs | `PASS` | All present locally; nothing fetched (§5) |
| Source / blob hash evidence | `PASS` | Five file SHA-256 values plus sizes, stable across the run (§4.1, §9) |
| Rights and dependency evidence | `PASS` | Separate Connect licence record identified as a blocker; dependency set recorded (§7) |
| No external writes | `PASS` | No GitHub, provider, package-manager or deployment operation (§12) |
| Scratch cleanup | `PASS` | `.temp/uno-wo-002/` removed; only task-owned metadata existed (§11) |
| Prohibited mutations (source, index, history, parent, siblings) | `PASS` | Nothing staged, committed, pushed, reset, cleaned or fetched anywhere |
| Product tests / build / runtime proof | `NOT APPLICABLE` | Read-only inventory; explicitly out of scope |

## 11. Scratch and report disposition

| Item | Disposition |
| --- | --- |
| `.temp/uno-wo-002/inventory.json` | metadata only (order hash, HEADs, counts, hash prefixes); **removed at the end of the run** |
| `.temp/uno-wo-002/` directory | **removed** |
| `.documents/Reports/execution-report.md` | overwritten **once** with this sanitized report |
| Report Git state | **modified, not staged, not committed, not pushed** — an authorised known local modification for the next separately issued order |

Per the order, the report is deliberately **not** published: no commit, no push, and the
standing report-only push exception was **not** invoked.

## 12. Boundaries honoured

No checkout, switch, reset, clean, add, stage, commit, tag, push, hook, patch, install,
typecheck, lint, unit test, browser test, build, serve, generator, formatter, package manager or
fetch ran anywhere. No script from the protected tree was executed. No source was copied into
Uno. No GitHub, credential, provider, release or deployment operation occurred. The parent and
every sibling repository were read-only. U00 was not closed and U01 was not begun.

## 13. Review candidates for the Architect — no disposition assigned

Offered as evidence only, in the order the Architect may wish to examine them:

1. **`src/core/efs/property-contract.ts` + `properties.ts`** — the five-level cascade and
   `contact.phone` string-fact contract. Directly matches filter 3.
2. **`src/core/efs/locales.ts`** — leaf-only localization, canonical-vs-path key split,
   `en-001` semantics, no inference. Matches filter 2.
3. **`src/core/efs/publication.ts`** — explicit bindings and the `closed` / `open` Site mode.
   Matches filters 1 and 2; carries the live `siteMode` decision.
4. **`src/core/efs/discovery.ts`** — sitemap-from-one-binding, `public` vs `unlisted`, and
   per-representation visibility. Matches filter 5.
5. **`src/core/page-document.ts` + `src/adapters/content/json-page.ts`** — data-only page
   document and its validated reader. Matches filters 4 and 5.
6. **`src/adapters/content/page-availability.ts`, `page-sources.ts`, `page-link-integrity.ts`**
   — identified but **not** body-reviewed within the cap; content `UNVERIFIED`.
7. **`src/core/spoke/**` and the 14 `spoke-*` config modules** — the surface U02 must remove.
   Listed for **scoping**, not for adoption.
8. **`tests/architecture/` source-shape contract tests** — technique noted; re-basing needed.

## 14. Unresolved risks and unknowns

| # | Risk / unknown | Mark |
| --- | --- | --- |
| 1 | The 22 safe-module targets and 17-family parity were **not** enumerated; filter 4 is only partially evidenced | `UNVERIFIED` |
| 2 | Asset provenance (brand marks, icon library, prose) is not established; rights review outstanding | `UNVERIFIED` |
| 3 | Connect reuse requires separately negotiated Uno rights — an Owner decision, not an engineering one | `BLOCKER` |
| 4 | The exact content delta of `tests/browser/matrix.mjs` (+170/−19) and the other dirty files was not reconstructed, because raw hunks are prohibited | `UNVERIFIED` (by design) |
| 5 | 8 declared entities / 8 spokes against 2 materialised capsules leaves the fixture's intended topology ambiguous | `REVIEW` |
| 6 | No green or red status is claimed for anything; GEO-04's red state is historical only | `HISTORICAL` |
| 7 | `page-availability.ts`, `page-sources.ts`, `page-link-integrity.ts`, `efs-content.ts` and other eligible files were listed but not body-reviewed | `UNVERIFIED` |
| 8 | Files excluded as sensitive or as caches were counted, never opened, so their content is unknown by intent | `NOT APPLICABLE` |
| 9 | Canonical Drive documents were not consulted in this run — no Drive connector exists in this environment | `UNVERIFIED` |

## 15. Outcome

**`COMPLETE`.**

A bounded, reproducible, non-destructive inventory of the protected Foundation WIP checkout was
produced: physical identity, branch/HEAD/status, five sanitized candidates with sizes and
SHA-256, all three committed-object relationships proven from local objects, narrowly reviewed
non-secret families mapped against the seven approved architectural filters, rights and
dependency blockers, and a before/after no-write proof showing the reference is byte-preserved.

The dominant finding is that the local WIP is **multi-tenant by construction** — four Hub/Spoke
containers, 13 Spoke core modules, 14 Spoke config modules and a Spoke-bound render graph — which
is precisely the U02 removal surface, and the reason this tree cannot be adopted as a U01
baseline wholesale.

**No disposition is assigned. This report does not close U00, does not authorise U01, and does
not constitute acceptance.** The Architect's consolidated evidence review, and a separately
Owner-installed and activated U01 order after that, come next.
