# UNO-WO-018 / R01 — U02 typed properties and one explicit selected-Site declaration

**Order:** `UNO-WO-018 / R01` · FINAL — EXECUTE · **Activated order bytes:** 22,328 bytes, SHA-256
`e64d9d92b13ed73b51cb852a53dd91e254e17bbe181a9a4b554a520e7f7b6a35` (verified before any work).
**Required start:** `929984a80cb0c1c55b445e316164b88320408aa5` — matched `origin/main`, clean tree,
one worktree.
**Stage:** U00 and U01 **CLOSED**; **U02 OPEN**. No closure, release, route, publication, locale or
provider change is claimed.
**Provider write actions by the Agent: ZERO.**

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `TYPED_PROPERTY_CONTRACT` | **PASS** | `src/core/efs/properties.ts` — closed four-key vocabulary, five levels, bounded values, `null` suppression, nearest-ancestor cascade, origin provenance, deep-frozen results |
| `SELECTED_SITE_DECLARATION` | **PASS** | `deployment/uno.config.json` — 140 LF bytes, SHA-256 `794672a4…d426`, blob `71147d24…`; validated by pure `validateUnoSiteSelection`, selects exactly `foundation/main` |
| `GRAPH_ACCEPTS_PROPERTIES` | **PASS** | `manifest-graph.ts` accepts `properties` at exactly five tiers; all 25 pre-existing refusal codes retained; null-prototype own-data hardening |
| `MANIFEST_DATA_ADDITION` | **PASS** | Exactly one Entity `brand.name = "Foundation Uno"` (`public: false`); blob `b077520f…` → `13d38f20…`; no other value changed |
| `NON_PUBLICATION_BOUNDARY` | **PASS** | No `src/app` import of config/properties/manifest; no route, locale, sitemap, robots, metadata alternate, host binding or provider setting added |
| `EXISTING_SITE_PRESERVED` | **PASS** | Page `837aad87…`, layout `c7dc9392…`, CSS `8d9268c4…`, both SVGs `204b4d12…`, Home Markdown `1b062fb3…`, `package.json`, lockfile and both workflows byte-identical |
| `LOCAL_GATES` | **PASS** | §5 — 313 unit tests, HTTP 103, readiness 100, fixtures 66, brand 29, security 16, architecture 16, bootstrap 19, governance 6, lint 0/0, build 4 routes |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | §6 — four jobs, both hosts, zero non-success steps |
| `PROVIDER_EVIDENCE` | **UNVERIFIED** | No Vercel inspection tool was available in this session; no deployment, build log, alias or Analytics state was read |
| `PROVIDER_WRITE_ACTIONS_BY_AGENT` | **ZERO** | No provider tool was called |
| `STAGE` | U02 **OPEN** | Declarations only; nothing earned until independent acceptance |

## 2. The two authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`225f0c01af475d2469fb7eb40233740144af8395`** | exactly ten ledger paths; direct child of `929984a` |
| Report | the report-only child of the product commit; its SHA is in the Owner handback | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Before → after blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/core/efs/properties.ts` | CREATE | *(absent)* → `7770d93b…` | 17,545 |
| 2 | `src/core/efs/uno-config.ts` | CREATE | *(absent)* → `c1d0e8db…` | 8,703 |
| 3 | `src/core/efs/manifest-graph.ts` | EDIT | `753709ee…` → `6aac111b…` | 24,069 |
| 4 | `deployment/efs/manifest.json` | EDIT | `b077520f…` → `13d38f20…` | 895 |
| 5 | `deployment/uno.config.json` | CREATE | *(absent)* → `71147d24…` | 140 |
| 6 | `tests/unit/efs-properties.test.ts` | CREATE | *(absent)* → `9171b615…` | 17,923 |
| 7 | `tests/unit/efs-uno-config.test.ts` | CREATE | *(absent)* → `b1f5ee9e…` | 11,814 |
| 8 | `tests/unit/efs-manifest-graph.test.ts` | EDIT | `805d1191…` → `fc4f7d54…` | 30,960 |
| 9 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | `18808f20…` → `27fb081d…` | 23,120 |
| 10 | `.documents/Architecture/source-inventory.md` | EDIT | `4624a07a…` → `14fd2663…` | 91,975 |

No other tracked path changed in the product commit; the private ACTIVE stayed ignored, untracked and
unstaged. One compatibility edit inside ledger path 8 was required and is disclosed: the pre-existing
"extra field on a facet" case used `properties`, which this order makes a supported tier field, so it
now proves the same `shape:unsupported-field` refusal with `publication` — its meaning, count and
assertion strength are unchanged.

## 3. The selected-Site declaration

`deployment/uno.config.json` is the Owner-approved document, LF-canonical with one terminal newline,
byte-for-byte the §3 JSON (140 bytes, SHA-256 `794672a4b0a625e7f587517d56d6f3b9359cef08f407eef08a163fd83b74d426`):

| Field | Value |
| --- | --- |
| `version` | `1` (integer; any other value refuses) |
| `entityId` | `e_7a3knkx60eacyhca7a0cr1k6e1` (the one Entity, unchanged) |
| `selectedSite.facetId` | `foundation` |
| `selectedSite.siteId` | `main` |

`validateUnoSiteSelection(input, manifest)` is a pure function: the manifest is caller-supplied data,
never read from disk. It validates the declaration shape, refuses a non-integer or wrong version,
validates both identifiers against the authored contracts, then runs `validateUnoManifestGraph` and
fails closed on **any** manifest refusal before a Site is considered. It then requires the Entity to
match, the Facet to exist, the Site to be owned by exactly one Facet and the ownership to be
unambiguous. There is no default, no `sites[0]` fallback and no repair. Refusals carry one closed
literal and nothing else:

`config:unreadable`, `config:invalid-shape`, `config:unknown-field`, `config:missing-field`,
`config:version`, `config:invalid-entity`, `config:invalid-site`, `config:manifest-invalid`,
`config:entity-mismatch`, `config:facet-not-found`, `config:site-not-found`, plus the one narrowly
justified addition `config:ambiguous-site` (reporting ambiguity as "not found" would misdescribe a
manifest that declares the same Site id under two Facets).

**The file authorises nothing.** No `src/app` file imports it, no build hook or runtime adapter reads
it, and no route, sitemap, `robots.txt`, metadata alternate, host binding or Vercel setting derives
from it. `https://uno.provelopment.com/` remains the same informational landing page.

## 4. How typed properties are modelled and validated

**Vocabulary and shape.** Only `brand.name`, `contact.name`, `contact.email`, `contact.phone` are
authorable, at exactly Entity → Facet → Site → Page → representation. A declaration is `{ value }` or
`{ value, public }`; `value` is a non-blank, Unicode-trimmed string of at most 240 UTF-16 code units,
or literal `null` as the **only** suppression marker. A bag is a plain object of at most four allowed
keys. `public` must be a real boolean, defaults to `false`, and is authorship metadata only: it
projects nowhere in U02.

**Cascade.** `resolveUnoProperties` accepts a caller-supplied contiguous ancestry in the fixed order,
rejects out-of-order, skipped, repeated or over-deep chains, and resolves each key by the nearest
explicit declaration. It records the origin `{ level, id }`, the exact status `declared | inherited |
suppressed`, the authored `public` flag, and only non-suppressed values in `projectUnoPropertyValues`.
A suppression cannot be undone from above, a descendant override cannot reach a sibling, and the
result is a freshly owned, deeply frozen copy.

**Refusal evidence (specific codes, no vacuous passes).** Unknown key, unknown descriptor field,
missing value, non-string, blank, over-long, non-boolean `public`, non-object bag, over-key-bound bag,
symbol key, accessor (**never invoked**), non-plain prototype, throwing Proxy trap and `__proto__`
pollution are each refused with their exact literal, and each refusal is proved to belong to
`PROPERTY_REFUSAL_REASONS`. The graph maps those onto three new closed graph codes
(`property:invalid-bag`, `property:unknown-key`, `property:invalid-declaration`) while all 25
pre-existing graph codes keep their meaning.

**Committed declaration.** The manifest carries exactly one Entity-level
`"brand.name": { "value": "Foundation Uno", "public": false }`. It validates, is inherited by the whole
chain with origin `entity/e_7a3knkx60eacyhca7a0cr1k6e1`, and **does not render on `/`** — the public
page has no import path to it.

**Provenance.** Foundation `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` is the read-only reference:
`properties.ts` blob `c0b6346e720e1d57315a4d583ae8cd2ce92203ee` suggested the nearest-explicit cascade
and `property-contract.ts` blob `f45ec31b6e61f83b90dde1067f32e6a748633c43` the typed
string fact. Both Uno modules are original code (`REWRITE` / `NEW UNO-OWNED`), carry no upstream blob
identity, and contain no Spoke binding, generalized value, timezone, opening-hours, rendering or file
I/O machinery.


## 5. Local gates (Node 26, pnpm 11.6.0) — all executed before the product commit

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — lockfile unchanged |
| Governance verifier + `tests/governance-docs.test.mjs` | PASS — frozen bytes, **6 / 6** |
| `tests/bootstrap.test.mjs` + `verify-bootstrap.mjs` | PASS — **19 / 19**, script OK |
| Architecture boundaries | PASS — **16 / 16** (kernel list now includes both new pure paths) |
| `pnpm lint` | PASS — exit 0, **0 errors, 0 warnings** |
| `pnpm typecheck` | PASS — exit 0 |
| `pnpm test` (Vitest) | PASS — **313 / 313** (was 229; +44 properties, +24 selected-Site, +16 graph) |
| `pnpm build` | PASS — four static routes including `/icon.svg` |
| `pnpm test:http` | PASS — **103 / 103**, six 404 refusals retained |
| Readiness fixtures | PASS — **66 / 66** |
| Readiness CLI | PASS — **100 checks, 0 failed** |
| `node26-security-floor.test.mjs` | PASS — **16 / 16** |
| `uno-brand-copy.test.mjs` | PASS — **29 / 29** |
| `pnpm audit --audit-level high` | PASS — exit 0; **0 high, 0 critical**; one dev-only moderate `minimatch` advisory (GHSA-g3hv-75wg-m249) unchanged and not waived |
| `git diff --check` | clean |

Suite composition: 44 typed-property cases, 24 selected-Site cases, 78 graph cases (62 pre-existing
+ 16 added), every refusal asserting `accepted === false` with its exact closed literal.

## 6. Hosted CI

**Product head `225f0c01af475d2469fb7eb40233740144af8395` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Uno Bootstrap Verify | `43863805685` | success | success | 10 / **0** |
| Verify U01 baseline | `43863805734` | success | success | 24 / **0** |

Per-step `success` on both hosts in `Verify U01 baseline`: governance, bootstrap, architecture, lint,
typecheck, unit tests, production build, production HTTP, both readiness steps, brand/copy contract,
dependency audit and the Node 26 security floors. The report-only head repeats the same four jobs; its
run identities are in the Owner handback.

**Log text is UNVERIFIED** for both runs: the GitHub API returned no log-download capability to this
client, so only job and step conclusions are claimed.

## 7. Warnings, limitations and non-claims

| Item | Disposition |
| --- | --- |
| Dev-only `minimatch` moderate advisory | Transparently recorded; production graph remains 0 high/critical |
| Provider state | **UNVERIFIED** — no Vercel tool available; the SHA serving `uno.provelopment.com`, READY state and Analytics are unread and unclaimed |
| Live visual/route confirmation | **UNVERIFIED** — the unchanged page and black emblem are proved by blob identity and the local production HTTP run, not by a public browser check |
| Deployment side effect | The authorized push may trigger the automatic Vercel build; no provider setting, alias, protection, secret or Analytics action was taken by the Agent |
| Property `public` flag | Authorship metadata only; nothing is projected, indexed or served in U02 |
| Stage | U02 **OPEN**; no closure, credit or release follows from this report |
| Trademark | The emblem remains the Owner-supplied Provelopment derivative; no claim is made |

## 8. Request

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for the substantive
U02 boundary: one Entity, a closed four-key typed-property vocabulary enforced across all five
ownership levels with deterministic nearest-ancestor inheritance, explicit suppression and no sibling
crossing, plus one explicit, validated `foundation/main` selected-Site *declaration* that no route,
host, build step or public surface consumes. The live page, professional copy, black emblem, favicon,
CSS, Analytics, metadata and `noindex, nofollow, nocache` controls are byte-identical to the required
start, and nothing in this increment publishes content or closes U02.
