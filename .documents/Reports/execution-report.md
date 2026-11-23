# Execution Report — UNO-WO-087 / R01

**STOPPED — P1 AND P2 DELIVERED; P3–P6 NOT EXECUTED; NO PRODUCT COMMIT, NO PUSH**

This file replaces its previous contents under the one authorized overwrite. It reports one bounded execution that
verified every mandatory guard, corrected the M09 locale ceiling and completed the M10/M11 proofs, and then stopped
before the consumer migration, the App Router route proof and the governance guard groups. It is not an Architect
acceptance, a stage closure, a release or a deployment, and it claims no U04 parity change.

## 1. Authority and activation

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-087 / R01`, Edition `FINAL — EXECUTE` |
| ACTIVE identity | `.documents/WIP/workorder-active.md` measured **34,012 bytes**, SHA-256 `a275e39ad113dfd9dccb96a9a1d57a3d7d05f6f6ff074021696279f4341f7a33`; ignored at `.gitignore:12`, untracked, unstaged. Order ID, edition, start SHA, byte count and digest matched the Owner activation exactly. Its text and the activation message are deliberately not reproduced. |
| Required and actual start | `53fe36284936b76b57c0abf9074c5cb5e814ffce` — local `HEAD`, local `main`, `origin/main` and `git ls-remote origin refs/heads/main` all matched before any write and again before staging decisions |
| Prior report | blob at the start of this run: **14,111 bytes**, SHA-256 `48f7a852f4112e9efa71b9eae37672042d78d28a81c67503594a8fa7b49ce723` (`UNO-WO-081 / R01`); a copy is retained at `.temp/uno-m1-087/report-prior-wo081.md` with the same digest |

## 2. Zero-write physical and authority preflight — all guards PASS

| Guard | Observed |
| --- | --- |
| Physical root | `git rev-parse --show-toplevel` = verified physical Uno checkout (private absolute path withheld); `--show-prefix` empty |
| Ancestor reparse points | all checkout ancestors checked; no junction, symlink or reparse escape (private ancestor names withheld) |
| Worktrees | exactly one: this checkout, `HEAD 53fe3628…`, `branch refs/heads/main` |
| Remotes | exactly one, `origin`, fetch and push both `https://github.com/provelopment/provelopment-foundation-uno.git`; no second push URL |
| Parent protections | parent `.gitignore:138` still carries `/00.foundation-uno/` (verified read-only with `--no-index`); parent `HEAD` read `e17fd96` read-only; no parent write |
| ACTIVE slot | `.documents/WIP/` contains exactly `plan-next.md`, `plan-outlook.md`, `plan-roadmap.md`, `workorder-active.md`; no top-level order |
| Frozen governance | `AGENTS.md` 2,730 B `6c6d5dcba44c9769df8a18db00d4791b38fc804759cb1da14e20daf9de31ca6f`; `README.md` 2,681 B `97f93bdaf710bac53e3be48be0365c414042e89ef4461e55e98852cd0fd1995a`; `.documents/SOP/sop-implementation.md` 4,796 B `6d790ad43349c434297d4d8a1e98311a822d4ec31df67aa882542aeab21cb388` — all unmodified |
| Committed declarations | `deployment/efs/manifest.json` `b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925` (2,148 B); `deployment/uno.config.json` `58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952` (258 B) — unchanged throughout |
| Absent path | `deployment/site.config.json` does not exist in this tree; no presentation authority was invented and no file was created |

Thirteen tracked paths were dirty at the start and **every one** is an exact §3.1 or §3.3 ledger entry of the same M1
correction: `manifest-graph.ts`, `uno-config.ts`, `uno-canonical-base.ts`, `uno-route-address.ts`,
`resolve-uno-committed-base.ts`, `resolve-uno-committed-locales.ts`, `validate-uno-site-publication-inputs.ts`, and their
six unit files. No untracked code path, staged byte, unknown change or A2 overlap was present; nothing was discarded.

Preserved, byte-identical, never re-applied: A2 patch `.temp/uno-u04-086/A2-tracked.patch` 90,536 B
`5e40963895d266874d5445225090dbb67f8d361a4528f9e609aaae0980ffaf87`; its new-file copy
`.temp/uno-u04-086/A2-new/tests/unit/uno-family-links.test.ts` 17,405 B
`1cdddb38a91b7b76dc92d113c8def11e8a26f9f39d0c92d463b0cd58070cf70f`; the earlier M1 diff artefacts
(`M09-T10.diff` `fb651a1d…`, `M10-M11-T06-T07.diff` `0e5dc811…`).

## 3. P1 — the locale ceiling is eliminated, not raised

`src/application/validate-uno-site-publication-inputs.ts`: the independent 512 v2 supported-locale ceiling is **gone**.
The only bound is `UNO_SITE_PUBLICATION_LOCALE_BUDGET`, which is defined as — not equal to a new literal but taken from —
`MANIFEST_GRAPH_LIMITS.hierarchyDeclarations` (`100_000`, verified in local source, read before use). The manifest
validator already applies that same budget to a Site's own `supportedLocales`, so a policy can never exceed a document
the manifest could accept. The v1 compatibility limit of 32 is untouched and still asserted.

`tests/unit/efs-uno-site-publication-inputs.test.ts` (T10, **48** tests, was 47) now proves:

- `accepts 513 distinct authored full locales under the shared manifest budget` — 27 real ISO 639-1 languages × 19 real
  ISO 3166-1 alpha-2 regions = 513 distinct authored full locales, each with its own declared source, accepted through
  the full v2 path with `supportedLocales` length 513 and `candidateCount` 513; identity with
  `MANIFEST_GRAPH_LIMITS.hierarchyDeclarations` asserted, and v1's 32 asserted unchanged.
- `refuses a policy at the shared budget boundary before per-entry validation` — a policy of
  `UNO_SITE_PUBLICATION_LOCALE_BUDGET + 1` entries refuses as `publication-inputs:locale-policy-invalid`. The count guard
  provably precedes tag and membership validation (it runs before `localePolicyIssue`), which is the bounded, safe
  mechanism used instead of authoring 100,001 distinct locales. No locale validity rule was weakened to pass a count.

## 4. P2 — qualified Site authority in M10 and M11

`src/application/resolve-uno-committed-base.ts` (M10): v1 preserved behind `resolveCommittedBaseV1`; the v2 request is
exactly `{manifest,selection,site}` with its own exact-key validation, `site` an exact plain own-data `{facetId,siteId}`
pair, and the answer is that binding's own `origin + pathPrefix` plus copied aliases. No `sites[0]`, `selectedSite`,
unrelated default, raw Host, forwarded header, environment variable or inferred domain is consulted; a v2 binding already
stores each alias as a joined string, so aliases are copied rather than re-joined. Refusals keep the closed vocabulary.

`src/application/resolve-uno-committed-locales.ts` (M11): v1 preserved behind `resolveCommittedLocalesV1`, including
`site-locales-missing` and `mapping-missing`. The v2 branch resolves the same qualified pair against both the validated
declaration and the validated manifest graph, then takes only that Site's supported and default full locales, sorted and
re-frozen, and confirms the assembled policy through `localePolicyIssue` rather than a second tag validator. An
installation-level mapping applies only through entries whose target is one of *this* Site's declared locales; an absent
mapping yields no aliases; a sibling-targeted alias is dropped rather than inherited.

`tests/unit/efs-uno-committed-base.test.ts` (T06, **22**) and `tests/unit/efs-uno-committed-locales.test.ts` (T07, **26**)
now prove, on a three-Site, one-Entity fixture (`corporate/main` → `https://abc.example`, `corporate/docs` →
`https://abc.example/docs`, `services/main` → `https://xyz.example`, real full locales `en-001`, `de-DE`, `fr-FR`, unique
owned sources):

- all three canonical bases resolve independently; `/docs` is preserved **without** a trailing slash; canonical and
  aliases come only from the requested binding; two Sites named `main` stay distinct by Facet; a default naming another
  Site changes nothing;
- wrong Site/Facet pairs, v1 declarations used as v2 selections, a missing `site`, unknown keys, symbol keys, getters
  (never invoked), non-plain prototypes and malformed ids all refuse with the closed code and no partial base;
- each Site resolves only its own locales and default; a mapping applies per Site across **shared and disjoint** locale
  ownership (`corporate/main` owns `en-001`+`de-DE` and receives both mappings; `corporate/docs` shares only `en-001` and
  receives only that one; `services/main` shares nothing and receives none); a Site with no `locales` refuses as
  `site-locales-missing` while its sibling still resolves; 33 authored locales pass; duplicate or malformed declarations
  and wrongly descended pairs refuse; results are deeply frozen, deterministic and never mutate caller data.

## 5. Local evidence — Agent-observed on Windows, this checkout

| Command | Exit | Observed |
| --- | --- | --- |
| `pnpm exec vitest run` on `efs-manifest-graph`, `efs-uno-config`, `efs-uno-route-address`, `efs-uno-committed-base`, `efs-uno-committed-locales`, `efs-uno-site-publication-inputs` | **0** | `Test Files 6 passed (6)` |
| per-file recount | **0** each | T06 22/22, T07 26/26, T10 48/48 |
| `pnpm typecheck` | **0** | no `error TS` |
| `pnpm exec eslint` on the six touched source/test files with `--max-warnings 0` | **0** | no output |
| `git diff --check` | **0** | clean |

Re-inspection artefact: `.temp/uno-m1-087/P1-P2.diff` 38,035 B
`d86853638be92f46c23f3045e2ed70c3ad4fb878d998238f322d6ec4f022b65a`; the full M09/T10 and M10/M11 diffs remain at
`.temp/uno-u04-086/`. No local result is independently verified and none is an Architect acceptance.

## 6. Not executed — exact remaining M1 scope

- **P3 consumer migration.** `selectedSite` still binds in `src/application/plan-uno-published-page.ts` and in the v1
  branches of the three corrected modules and `uno-config.ts`. Not migrated: published-page planning, public discovery,
  delivery candidate, page assets, discovery policy, `src/config/uno-serving.ts`, and the `robots.txt`, `sitemap.xml` and
  `uno-media` routes. The policy layer was corrected in M09/M11; the consumer layer was not.
- **P4 route and host proof.** The `[locale]/[[...segments]]` pair is present and the `[...segments]` pair does not yet
  exist; there is no `/docs/en-001` versus `[locale]` proof, no two-host HTTP or real-Chromium evidence and no per-Site
  `<html lang>` proof.
- **P5 discovery/visibility proof** and the large safe-graph stress fixtures.
- **P6 G01–G05**, the §6 battery (bootstrap, governance, architecture, lint, full `pnpm test`, deployment suites, audits,
  build, trace, HTTP and browser runners) and every hosted workflow observation.

## 7. Git, index and worktree — final state of this execution

No product commit, no report-only commit, no push, no tag, no branch, no merge, no force operation, no A2 re-application
and no M2 work. `HEAD` is still `53fe36284936b76b57c0abf9074c5cb5e814ffce`; the index holds **zero** staged paths; the
working tree holds the same thirteen ledger paths plus this report. `.temp/uno-m1-087/` holds only task-owned scratch.
Nothing outside the ledger was created, deleted or modified, and the committed declarations are byte-identical to their
recorded baselines.

## 8. Hosted CI

Not run for this execution: there is no product commit to verify, so no `Verify U01 baseline` or `Uno Bootstrap Verify`
run exists at a new head. This is reported as **not applicable**, not as passing, and no future result is predicted.

## 9. Residual blockers

1. P3–P6 are a multi-file architectural migration with a mandatory route-tree replacement, a production HTTP and real
   Chromium proof, five governance guard groups and a full gate battery on two operating systems. They did not fit one
   bounded execution window and were not started rather than left half-applied.
2. `deployment/site.config.json` is absent from this tree although the order names it as a presentation authority. No
   current consumer depends on it, but P3/P4 will need the Owner to resolve it rather than the Agent inventing it.
3. U04 remains at the hosted A1 figure (3/17 files, 45/59 proxies). A2 stays preserved and unapplied; M2 is not authorized
   and is not hosted green.

## 10. Disposition requested

**`REVISE` with a successor order scoping P3–P6 as one bounded, ordered execution** — consumer migration and serving
first, then the route/host/browser proof, then discovery and visibility, then G01–G05 and the full battery, then one
product commit and both workflows — together with a decision on `site.config.json`. Nothing in this run is offered as
verification, and no stage, release or parity state is claimed.
## WO-089 / R01 — Owner-authorized privacy correction

This section is the single factual execution record of the bounded report-only correction run.

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-089 / R01` — report-only record correction; product, route, discovery and parity scope not authorized |
| ACTIVE measured | 19,697 bytes; SHA-256 `b16a103ac8eed7ddbe49fe6d37fae2a9733ee61ab3bf7046b48cd31ef9d53194` (contents not reproduced) |
| Owner activation | matched this order, edition, starting SHA, byte count and SHA-256 exactly; activation text not quoted |
| Predecessor record | the WO-087 STOPPED report, 12,604 bytes, SHA-256 `27cc48213638a70c52b0b281e527ef57c19deffa7dc0b8bab24cbb38b07e4244` |
| Correction scope | exactly two report lines — the `--show-toplevel` value and the verbatim ancestor chain — redacted for privacy only |
| Encoding and line endings | unchanged: UTF-8, no BOM, CRLF, one trailing newline |
| WO-087 findings | unchanged: P1 and P2 local-only; P3–P6 not executed; zero product commit, zero push, zero CI at WO-087 time |
| Source changes this run | zero; the 13 dirty M1 source and test paths were not modified, staged, checked out or reapplied |
| Source Git staging | zero; the index held only the report at commit time |
| Publication | one report-only commit and a non-force `origin/main` push of this file alone |
| `tests/governance-docs.test.mjs` | `PASS` — exit 0, 9 tests, 0 fail |
| `scripts/verify-governance-docs.mjs` | `PASS` — exit 0, frozen bytes match |
| `tests/bootstrap.test.mjs` | `PASS` — exit 0 after the single replacement |
| `scripts/verify-bootstrap.mjs` | `PASS` — exit 0 after the single replacement |
| Hosted workflows | `UNVERIFIED at report-write time`; not claimed as `PASS` |

Baseline note: immediately before the replacement the two native bootstrap gates failed solely on the user-profile path inside the report, which is the defect corrected here. The same four commands were re-run unchanged afterwards and returned the results recorded above. No product, parity, stage, release or deployment state is claimed.
