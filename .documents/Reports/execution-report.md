# UNO-WO-025 / R01 — Persisted Site locales and corrected Home

**Work order:** `UNO-WO-025 / R01` · **Edition:** FINAL — EXECUTE · **Stage:** U03, **OPEN**.
**Installed ACTIVE:** 17,007 bytes, SHA-256 `cb8628bd147b4c88821b8890f580a738691d3bce635ca9a2d300550dd313257b`,
heading `UNO-WO-025 / R01`, verified byte-for-byte before any write; ignored, untracked, unstaged, never printed,
never committed.
**Owner decision:** the activation approves the exact Site-locale configuration contract (§3) and the Home
content replacement (§4).
**Push authorization:** the activation contains **`AUTHORIZE_GIT_PUSH_TRIGGERED_PRODUCTION_DEPLOYMENTS=YES`**,
covering only an incidental Git-linked build — never a manual provider action.
**Required start = actual start:** `9f829e710f1972a164a7b0ceaffe569aa9e1a718`.

## 1. Status

| Fact | Status | Evidence |
| --- | --- | --- |
| `SITE_LOCALE_AUTHORITY` | **PASS** | optional Site `locales` in `src/core/efs/manifest-graph.ts`, blob `d08d213e…`, closed `site:invalid-locales` |
| `SHORT_LANGUAGE_MAPPING` | **PASS** | optional `languagePreferences` in `src/core/efs/uno-config.ts`, blob `b1b6a2fb…`, closed `config:invalid-language-preferences` / `config:locale-authority-missing` |
| `COMMITTED_POLICY_READER` | **PASS** | `src/application/resolve-uno-committed-locales.ts`, blob `c7306266…`, 8,772 B, seven closed codes |
| `COMMITTED_DECLARATIONS` | **PASS** | manifest `locales` for the one `main` Site; config adds only `languagePreferences` — no base, flag, second Site or `schemaVersion` |
| `HOME_COPY_REPLACED` | **PASS** | 1,165 bytes, UTF-8 LF, no BOM, exactly one final LF, ASCII only, title unchanged |
| `FOCUSED_TESTS` | **PASS** | **32** added cases (15 + 8 + 7 + 2), **27** distinct refusal assertions, no existing test dropped |
| `BASELINE_PRESERVED` | **PASS** | 652 unit tests over 19 files (620 + 32); 31 architecture checks (29 + 2) |
| `PUBLIC_BEHAVIOUR_UNCHANGED` | **PASS** | `/` 200 with the approved headline; `/en`, `/en-001`, `/about`, unknown, `robots.txt`, `sitemap.xml` 404; build still three routes |
| `HOSTED_CI_AT_PRODUCT_HEAD` | **PASS** | four jobs, two hosts, zero non-success steps (§6) |
| `PROVIDER_ACTIONS` | **ZERO** | no provider call, manual deploy, alias, domain or settings change |
| `STAGE` | U03 **OPEN** | no closure, release, merge or publication authority asserted |

## 2. Authorized commits and the exact ledger

| Role | Commit | Content |
| --- | --- | --- |
| Product | **`b33ad76365fa7e12b3cee4c6a0d4686b0eb0f35a`** | exactly fourteen ledger paths; direct child of `9f829e7` |
| Report | the report-only child of the product commit; its SHA is returned privately to the Owner | `.documents/Reports/execution-report.md` only |

| # | Path | Op | Blob | Bytes |
| ---: | --- | --- | --- | ---: |
| 1 | `src/core/efs/manifest-graph.ts` | EDIT | `6aac111b…` → `d08d213e…` | 28,081 |
| 2 | `src/core/efs/uno-config.ts` | EDIT | `c1d0e8db…` → `b1b6a2fb…` | 12,014 |
| 3 | `src/application/resolve-uno-committed-locales.ts` | CREATE | ABSENT → `c7306266…` | 8,772 |
| 4 | `deployment/efs/manifest.json` | EDIT | `13d38f20…` → `84866290…` | 1,029 |
| 5 | `deployment/uno.config.json` | EDIT | `71147d24…` → `fda8188c…` | 185 |
| 6 | `deployment/efs/content/home.en-001.md` | OVERWRITE | `1b062fb3…` → `ef4254a3…` | 1,165 |
| 7 | `tests/unit/efs-manifest-graph.test.ts` | EDIT | `fc4f7d54…` → `2b166c66…` | 35,311 |
| 8 | `tests/unit/efs-uno-config.test.ts` | EDIT | `b1f5ee9e…` → `a3ac711f…` | 16,153 |
| 9 | `tests/unit/efs-uno-committed-locales.test.ts` | CREATE | ABSENT → `5eb2d7a0…` | 12,781 |
| 10 | `tests/unit/efs-uno-site-publication-inputs.test.ts` | EDIT | `b3c618dd…` → `ad5999c9…` | 24,089 |
| 11 | `tests/architecture/u01-boundaries.test.mjs` | EDIT | `fce74d54…` → `b030201d…` | 43,115 |
| 12 | `.documents/Architecture/source-inventory.md` | EDIT (additive) | `b9b02294…` → `7b6a6c02…` | 111,930 |
| 13 | `.documents/WIP/plan-roadmap.md` | EDIT | `94fb3b1c…` → `3329dcc1…` | 10,070 |
| 14 | `.documents/WIP/plan-next.md` | OVERWRITE | `5b33bd48…` → `99d0298c…` | 1,110 |

Both CREATE paths were absent at start. The three conditional repair paths
(`efs-confined-source-reader.test.ts`, `efs-source-resolution-pipeline.test.ts`,
`efs-page-header-pipeline.test.ts`) were **not** needed and were **not** touched: no obsolete exact Home-text
assertion existed. `git diff --cached --check` was clean; no other tracked path changed.

## 3. Guards (sanitized)

| Guard | Result |
| --- | --- |
| Physical root | the single Uno checkout resolved physically; Git toplevel equal; no symlink, junction or reparse alias |
| Parent and siblings | the parent anchored `/00.foundation-uno/` ignore rule verified and untouched; parent, Foundation, Solo and every sibling strictly read-only |
| Worktrees / remotes | one worktree, `main`, one remote `origin` for `provelopment/provelopment-foundation-uno` (fetch and push), no mirror; no reset, rebase, force, clean or amend |
| Head and remote | `HEAD` = `origin/main` = `9f829e7` at start, re-read immediately before the push; clean index and worktree |
| ACTIVE | one private file at the expected path, matching bytes and digest, ignored, untracked, unstaged, absent from every diff |
| WIP slots | exactly four: `plan-roadmap.md`, `plan-next.md`, the ignored private ACTIVE, `plan-outlook.md` |
| Pins | **14 / 14** immutable blobs byte-identical; **12 / 12** editable starting blobs matched; both CREATE destinations ABSENT |
| Runtime | Node 26.x and pnpm 11.6.0; in-root install `--frozen-lockfile --ignore-scripts --store-dir .pnpm-store`; `package.json` and `pnpm-lock.yaml` blobs unchanged |

## 4. What was built

**Site locale authority.** A Site may declare one optional `locales` record —
`{supportedLocales, defaultLocale}` — bounded to 1..32 unique canonical full-region tags with the default inside
the list. The tag rules stay the accepted locale contract's: a descriptor-checked copy is handed to
`localePolicyIssue` with an empty short-language mapping, so a Site declares no alias of its own. The value is
validated **before** its Pages, and a Page locale the Site does not support refuses, because it would promise a
locale the Site never declared. Every failure is the one closed `site:invalid-locales`; hostile structure
(accessor, symbol, exotic prototype, sparse or accessor array) refuses as `input:unreadable` without reading it.
An **absent** declaration stays valid for older in-memory fixtures — a legacy authoring declaration — and the
committed reader refuses that absence instead of inventing a default.

**Explicit short-language mapping.** The declaration may carry one optional top-level `languagePreferences`
mapping of 0..16 lowercase short keys to canonical full-region tags. When a mapping is stated, the selected Site
must own a declared `locales` authority to check it against — otherwise `config:locale-authority-missing` — and
the accepted locale contract then decides key spelling, membership, target canonicality and the single approved
`en → en-001` alias: `config:invalid-language-preferences`. An empty `{}` is an explicit "no mapping"; an absent
field means the declaration states none, and no alias is ever inferred. `version:1`, `entityId`, `selectedSite`
and every legacy call are unchanged, and no `schemaVersion`, `publicSite`, `base` or second Site selection was
introduced.

**Committed policy reader.** `resolveUnoCommittedLocales({manifest, selection})` accepts exactly those two keys,
composes `validateUnoManifestGraph` and `validateUnoSiteSelection`, finds the Site in the validated frozen graph
only, refuses a missing Site policy or a missing mapping, assembles one fresh policy, re-confirms it through
`localePolicyIssue`, and returns it deeply frozen. Its seven closed codes are
`input-invalid`, `unreadable`, `manifest-invalid`, `selection-invalid`, `site-locales-missing`,
`mapping-missing` and `policy-invalid`. It imports no `fs`, network, environment, framework, adapter or provider,
re-implements no source precedence, selection or canonical-base rule, and echoes no caller value.

**Committed data.** The committed manifest declares for the one `main` Site exactly
`{"supportedLocales":["en-001"],"defaultLocale":"en-001"}`; the committed selection adds exactly
`"languagePreferences": { "en": "en-001" }`.

**Authored Home.** The stale prose was replaced with the Owner-approved copy; the title `Foundation Uno`, the
source declaration and the single representation are unchanged, the file is 1,165 bytes of UTF-8 LF with exactly
one final line feed, and `/en-001` still returns **404**. The file remains an authored source, not a served Page.


## 5. Test evidence

**Real committed integration (PASS).** The committed manifest and selection are read as data, resolved by
`resolveUnoCommittedLocales`, and the resulting policy is fed to `validateUnoSitePublicationInputs` with the
**test-only** loopback base `http://localhost:3000`: the result identifies the one Entity / `foundation` / `main`
with `en-001`, mapping `en → en-001`, `candidateCount: 1`, deep-frozen output, and no `published`, `authorized`,
`ready`, canonical URL, `hreflang` or sitemap field. Deleting the Site `locales` or the selection mapping makes
the read fail, and no `en` alias is invented. Digests of manifest, selection and Home source are unchanged
across validation.

**Focused suites — 32 added cases, all passing, 27 distinct refusals.**

| Suite | Added | Coverage |
| --- | ---: | --- |
| `efs-uno-committed-locales.test.ts` (new) | 15 | committed policy read, freshness/freezing, no mutation, empty mapping, non-first Site, missing Site policy, missing mapping, seven invalid Site declarations, Page locale outside the Site, unsatisfiable/invalid/prototype-keyed/over-long mappings, wrong version and absent Site, two-Entity manifest, six non-object roots, missing/extra keys, accessor with zero reads, symbol, exotic prototype, throwing Proxy, nested hostile manifest, vocabulary completeness, no-echo |
| `efs-manifest-graph.test.ts` | 8 | accepted Site policy frozen and copied; list covering every authored locale; absent declaration still valid; empty/duplicate/non-canonical/bare/script-only locales; default outside list; incomplete or unknown declaration; over-limit; Page locale outside the Site; hostile getter (zero reads) and sparse array |
| `efs-uno-config.test.ts` | 7 | committed mapping read and frozen; legacy mapping-free declaration unchanged; explicit empty mapping; valid alias; `en`→non-approved target, unlisted target, non-canonical target, uppercase key, prototype key and array; over-long mapping; mapping without Site authority; mapping accessor (zero reads); unknown config key still refused |
| `efs-uno-site-publication-inputs.test.ts` | 2 | derived committed policy composes with the loopback base; either deleted authority fails |

No existing test was dropped, skipped, weakened or mocked; the committed fixtures are read as data, never
replaced by substitutes.

**Broad local gates.**

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` | PASS — lockfile and `package.json` blobs unchanged |
| Four focused suites | **32 / 32** added cases passing |
| `node scripts/verify-governance-docs.mjs` | PASS — three frozen files match Owner-frozen bytes |
| `node --test tests/governance-docs.test.mjs` | **9 / 9** |
| `pnpm test:bootstrap` | **19 / 19**; CLI: 11 required files, licence verified, four-slot discipline, no credential or private-path leak |
| `pnpm test:architecture` | **31 / 31** (29 preserved + 2 new) |
| `pnpm lint` | exit 0 — 0 errors, 0 warnings |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **652 passed / 652**, 19 files — 620 previous + **32 new** |
| `pnpm build` | PASS — exactly `/`, `/_not-found`, `/icon.svg`; no `en-001` route |
| `pnpm test:http` | **103 passed, 0 failed** — `/` 200 with the approved headline; `/en`, `/en-001`, `/about`, unknown, `/robots.txt`, `/sitemap.xml` 404 |
| readiness fixtures / CLI | 66 pass / **100 checks, 0 failed** (`VERCEL_NOT_DEPLOYED_BY_AGENT`) |
| security floors / brand contract | 16 pass / 29 pass |
| `pnpm audit --audit-level high` | exit 0 — **0 high, 0 critical, 2 moderate** |
| `git diff --check` | clean before the commit and after |
| Protected pins | 14 immutable blobs byte-identical; 12 starting blobs matched |

**Warnings, disclosed.** Two **moderate** advisories remain, both the same dev-only `minimatch` denial-of-service
family (`>=7.0.0 <11.0.1`, patched `>=11.0.1`), reached only through the ESLint toolchain
(`eslint-config-next` → `eslint-import-resolver-typescript` / `eslint-plugin-import` → `@typescript-eslint/*` →
`minimatch`), never through a runtime or production dependency path. They are recorded, not waived or silenced;
the blocking threshold is zero high or critical, and zero is what the gate reports. Local Windows execution is
**PASS**; WSL was not used and is **NOT APPLICABLE**.

**Nonpublication.** No canonical tag, `hreflang`, sitemap, robots header, redirect, alias, base or config
migration was created; no `src/app` source consumes the new reader; the landing page, logo, favicon, CSS, root
noindex, analytics and both workflows are byte-identical; no dependency, asset or schema was added.


## 6. Hosted CI

**Product head `b33ad76365fa7e12b3cee4c6a0d4686b0eb0f35a` — four jobs, all `success`:**

| Workflow | Run | ubuntu-24.04 | windows-2025 | Steps / non-success |
| --- | --- | --- | --- | --- |
| Verify U01 baseline | `44011266332` | success | success | 24 / **0** |
| Uno Bootstrap Verify | `44011266324` | success | success | 10 / **0** |

Both hosts ran the governance verifier, the architecture suite and the blocking unit step that includes the four
focused suites. **Full log text is UNVERIFIED** — this client reads job and step conclusions only. The report-only
head repeats the same four jobs; its run IDs are returned privately to the Owner.

## 7. Rights and cleanup

**Provenance.** All new implementation and the replaced Home prose are original **Uno-owned** work, class
**NEW / REWRITE concept**. The pinned read-only Foundation GEO-03 commit `c05c55ea…` remains conceptual context
only; no Foundation, Solo or Connect code, media or brand was copied. Apache-2.0 notices are intact and the
licence files are unchanged.

**Privacy.** No secret, token, absolute personal path, private ACTIVE byte or unpublished external content
appears in either commit, in CI or in this report. No guard was weakened, no threshold raised, no workflow edited
and no test skipped.

**Provider actions: zero.** No provider API call, manual deployment, promotion, alias, domain or settings change;
the only external effect was the authorized non-force Git push and any build the existing Git integration starts
from it.

**Cleanup.** Task scratch under the ignored `.temp/` directory removed; build and store outputs stay ignored; no
unknown file was deleted; `git status` is clean at the product head; the private ACTIVE remains ignored and
unstaged.

## 8. What remains unimplemented — U03 stays OPEN

1. **A real canonical base.** No production origin has been chosen or installed; `deployment/uno.config.json`
   deliberately still carries no base, so the proposed-base validator has nothing live to bind.
2. **An explicit publication decision.** Stored locales and mapped aliases are declarations: no Site or Page is
   published, no route is activated and no address is served.
3. **Real production proof.** Status and error behaviour for unmatched, invalid and unlisted addresses, emitted
   metadata with canonical advertising and `hreflang`, locale routing for the declared locales, and sitemap and
   robots policy are all still unimplemented.
4. **Provider state.** Production SHA, build log and analytics remain **UNVERIFIED** by this Agent.

Requesting the Chief Master Architect's single **`ACCEPT` / `REVISE` / `STOP`** for this bounded U03 checkpoint:
an optional validated Site locale authority, an optional explicit short-language mapping, one pure committed
policy reader, two exact committed declarations, the Owner-approved Home replacement, 32 added focused cases with
27 exact-code refusals, a preserved baseline of 652 unit tests and 31 architecture checks, unchanged public
behaviour, zero provider actions and U03 still open.
