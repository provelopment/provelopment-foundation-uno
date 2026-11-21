# Execution Report — UNO-WO-077 / R01

**PRODUCT + REPORT RECORD / AWAITING INDEPENDENT ARCHITECT REVIEW**

This document replaces the previous contents of this path under one new Owner-authorized overwrite. It records the
`UNO-WO-077 / R01` committed neutral three-Page starter, the exact local and product-head hosted evidence, and the
report-head checks that were still pending when it was committed. It is not an acceptance, closes no stage and grants
no parity credit.

## 1. Authority, start and preflight

| Item | Observed |
| --- | --- |
| Order | `UNO-WO-077 / R01`, Edition `FINAL — EXECUTE`, stage focus U06 neutral starter / U03 serving assurance, not a release or deployment |
| Owner activation identity | ACTIVE `.documents/WIP/workorder-active.md` measured **39,335 bytes**, SHA-256 `24383056b1ebfd3fc9eecb7c43692426924a7066541e2977bd3b9085fd99f331`; both matching the Owner activation. The ACTIVE text, the activation message, private paths and credentials are deliberately not reproduced. |
| Required start | `065761324c3e35d9936adf74a33eaa090c210be2`, matched by local `HEAD`, local `main`, `origin/main` and the remote `main` ref before any write; its parent remains `32cc350b36b8fabd94ad7430ea4956e6c52f729b` |
| Product commit | **`e38e0e6cd210570e7895da8b33ffec3638fd43e5`**, parent exactly `065761324c3e…`, subject `UNO-WO-077 / R01: committed neutral three-page starter`, **24** tracked paths changed (20 modified, 4 added) |
| Report overwrite | exactly one tracked overwrite of `.documents/Reports/execution-report.md` (`R01_WRITE_COUNT=1`), after the complete ignored-scratch draft passed format and privacy validation |
| Preceding stopped run (context, not repaired or backdated) | `UNO-WO-076 / R01` is reported by the preceding Agent to have stopped before a product commit after 19 committed-baseline assertion failures across ten unlisted unit files, restoring both declarations, removing its three exclusively created candidates, preserving its own evidence under ignored scratch and leaving this report untouched. GitHub independently confirmed the required start and this report's Git blob were unchanged. That local STOP log and physical restoration are **Agent-observed only, not independently certified here**; this successor migrates the obsolete baseline under its own U01–U10 ledger instead of accepting the stopped run. |
| Agent-observed local conditions (not independently certified) | the authorized physical checkout and every inspected ancestor resolve to one physical location with no junction, symlink or reparse escape; the parent-owned anchored ignore entry for this checkout is present and was not modified; exactly one worktree, one local `main` tracking `origin/main`, one remote whose fetch and push URLs resolve only to the Uno repository; clean index and worktree at the start, no stash, no conflict, no hook-path override and no active hook; `.documents/WIP/` held exactly the three tracked plan files and the one ignored private ACTIVE |
| Read-only pins | all **forty-two** pinned Git blobs of this order recomputed with `git rev-parse HEAD:<path>` at the required start; every one matched before any edit and again before the product commit |
| New-file targets | the three Page paths and `.documents/Architecture/u06-starter.md` were proven absent before creation and were created exclusively |
| Baseline declaration digests | manifest `ba232d46…` and selection `4f656c93…` before the edit; after the authorized edit manifest **`b6213ed6ee2dfdf350acf98de969928b4fc61e51173a23ad35b55d0ff63c9925`** and selection **`58011c4324f537414ed3a581fa832a2991cf94572a65cf693da4aad431e8c952`**, re-verified after every stateful runner and after both commits |
| Host and toolchain | Windows, Node `v26.13.1`, pnpm `11.6.0`, Next `16.4.6`, repo-local Playwright Chromium cache; no install, dependency, lockfile, workflow, config or hook change |

## 2. Changed paths and operations (A01–A05, T01–T04/T06/T07, G01/G03, U01–U10, E01)

| ID | Path | Start blob | Product blob | Operation |
| --- | --- | --- | --- | --- |
| A01 | `deployment/efs/manifest.json` | `848662904b351bc111551c76bcfaedde79efe3f0` | `f1670864c643644ba9cb660d251f34bb32676ea7` | selected Site's `pages` list now declares exactly three `en-001` Pages, each `publication:"published"` with one source: Home JSON, About Markdown, Components JSON; graph IDs, locales and Entity properties unchanged |
| A02 | `deployment/uno.config.json` | `fda8188c75027aff7a10493d64c60eb6a656d7c4` | `bff0e86523465fa84c75686548eb123e91a7ec35` | only `base:{"canonical":"https://uno-starter.example","aliases":[]}` added; `version`, Entity/Facet/Site and language preferences preserved |
| A03 | `deployment/efs/content/home.en-001.json` | NEW | `3d639b060238a620874bc90a9d17ddba95adca40` | exclusive-create v1 JSON Home: `visibility:"public"`, four text-only sections (`content.hero`, `content.heading` level 2, `content.prose`, `content.stats` with three facts); no asset, link, provider or delivery claim |
| A04 | `deployment/efs/content/about.en-001.md` | NEW | `55c13316dede24bcfcc419b70d26085fa92f15d7` | exclusive-create safe Markdown About: one `#` title, two `##` sections, one bullet list; no HTML, image, link, blockquote or second `h1` |
| A05 | `deployment/efs/content/components.en-001.json` | NEW | `f215b094918be97f85b5d9c9a5a6ac16845fec0d` | exclusive-create v1 JSON Components: six sections (`content.heading`, `content.prose`, list variant, `layout.stack` with heading/prose children, `interaction.accordion` with two native disclosure panels, callout variant); text-only, no provider |
| T01 | `scripts/verify-u01-http.mjs` | `220b1fb7c46c4824a032ac7e733ef9ba05fcba17` | `0be82d749cee27544f0ec80bebed2e1d1d335546` | obsolete committed-site 404 expectations replaced by explicit positives for `/en-001`, the `/en` redirect to the published root, `/robots.txt` and `/sitemap.xml`; `/about` and the unknown path stay real 404s and every demonstration, negative and route-security gate is unchanged |
| T02 | `scripts/verify-u03-http.mjs` | `efb9ff48b9ee5d9aca44eae494089213f6ca62ef` | `74e67209ab2c1323e5c238fcde9cbe0cf3e98a4a` | committed 3-Page HTTP assertions added (one `main`, one `h1`, authored title, reserved canonical, `og:url`, `en-001` alternate, `x-default` only on the default Page, `index, follow`, `HEAD`/`GET` parity, redirect, robots, three-loc sitemap); six genuine 404 paths and a percent-escaped segment retained; malicious locale/query/redirect refusals untouched |
| T03 | `scripts/verify-u03-browser.mjs` | `9955228756d0daa7ad748e100243a2e095396968` | `5fb2b1e2b0ba9ba165263873c553e0faa6c0df88` | optional `keyboardPage` proof added: keyboard-reachable control, page errors, foreign requests and native disclosure toggling; every existing case preserved |
| T04 | `scripts/verify-u03-published-http.mjs` | `0aa2c6b39c7d49dece37fca87610435d4c4c4552` | `0d478edd73a64619270a6f837d5350176ed90301` | new committed-starter phase (real build, trace, loopback HTTP, SEO agreement, sitemap, refusals, real Chromium) executed **before** the reversible fixture; declaration pins re-pinned; the pre/post deployment-tree guards now refuse any change outside the five authorized starter paths while still refusing everything else; fixture transaction, malformed-JSON-no-fallback, unlisted non-discovery and byte-exact restoration retained |
| T06 | `scripts/verify-u04-json-slice.mjs` | `258b395fe39427d090f9f727f216a625d207b5ff` | `96099c105bd347644a96c3d5463b82436048738c` | declaration pins re-pinned; the two deployment-tree guards now tolerate exactly the five authorized starter paths and still refuse any other deployment change; production HTTP/Chromium, JSON selection, owned media, malformed preferred JSON and reversible restoration unchanged |
| T07 | `scripts/verify-u04-22-module-consent.mjs` | `5a00664924651fc68aec3c786523dca0b938e37d` | `81784950434a1df7852d0597ca6bf7b322215687` | declaration pins re-pinned only; all 733 executable predicates, 17-family mapping, 22 modules, four asset zones, browser matrix and provider-OFF proof intact |
| G01 | `tests/deployment/u03-trace.test.mjs` | `8064260aae9241ea8b7042fe2950e75b371516a8` | `5a0d67cc3b54a7703dbefa8668b044e6b8e967a3` | committed fixture migrated to the three declared starter sources; added proofs that the declared sources and no legacy file are accepted, and that a trace shipping only the undeclared legacy Markdown refuses with `source:not-traced`; the previous unpublished-shape guard kept as a separate synthetic fixture; traversal/unknown-source guards unchanged |
| G03 | `tests/deployment/u04-22-module-consent.test.mjs` | `33bd5f9b70497ce6a85e84b3682c060ba783e001` | `7ad1ab66099bf0532cd3924747293f51d039e8a7` | only the two pinned declaration digests updated; every previous guard and mutant preserved |
| U01 | `tests/unit/efs-confined-source-reader.test.ts` | `2ed497aefa5dad41aacf1c0931f87ad2ceb03ccd` | `97e610821f3b0932d18f1613413ee1bde870f828` | committed Home now read as the declared JSON candidate with byte-exact text; direct observation of the preserved legacy Markdown retained; a JSON declaration naming the Markdown path refuses; every real-path, UTF-8, symlink/traversal, malformed and type-mismatch refusal kept |
| U02 | `tests/unit/efs-manifest-graph.test.ts` | `3891e4b0c6dd0e32e4b1ef711e9cbe547455da2a` | `a94008eb6a39f949c9df4f2e0827a26ac211213c` | committed graph asserts exact one Entity/Facet/Site, three published `en-001` Page identities, one source kind each and the three declared candidate paths; the preserved Markdown Home is asserted as existing but undeclared; all synthetic malformed/duplicate/collision/ownership refusals kept |
| U03 | `tests/unit/efs-page-header-pipeline.test.ts` | `87a98b407d14e297cc44987406ad14562180fa17` | `7449812dfa41536f4f8a0a9838f22402661b22bd` | `/en-001` now projects the JSON header (`kind:"json"`, validated title, description, public, no `markdownBody`); About Markdown projection added; the kind-mismatch refusal now uses Markdown against the JSON candidate; all synthetic header/smuggling tests kept |
| U04 | `tests/unit/efs-source-resolution-pipeline.test.ts` | `3877007de6247ce2070712696de117ad0d73702a` | `3cf7d30fc80264407f2b939c9cf956c1d5789909` | committed Home read as JSON with exact identity and no rescue by the legacy Markdown; About read added; observed kinds asserted `["json"]` and `["markdown"]`; confined-read, matching and malicious path/locale negatives kept |
| U05 | `tests/unit/efs-uno-committed-base.test.ts` | `64d272d3f6ff2c0726abbf1f554fedeec12291c8` | `999386d7a8b1f4d836e3b28804149e701d12862f` | committed base now accepts `https://uno-starter.example` with no aliases and the exact Site identity; a separate synthetic base-free fixture still refuses `committed-base:missing`; invalid hostname/alias/path/credential cases kept |

| U06 | `tests/unit/efs-uno-discovery-policy.test.ts` | `5f4f8d536d872d96b79cc28c721adb35a30b27f7` | `9356079ee234819c2578177a38634d981accfef5` | committed Home is public JSON and an unlisted claim still refuses `home-cannot-be-unlisted`; About Markdown and Components JSON are proven public with no robots suppression; forged Markdown visibility still refuses `discovery:projection-mismatch`; unlisted non-discovery kept |
| U07 | `tests/unit/efs-uno-page-delivery-candidate.test.ts` | `65e414de23c458a58da6a65bf8a1ee09554482cb` | `5408c20ebeeeeb0875079e56d8f15d92e334cc4f` | committed Home candidate now carries a validated JSON document and no raw authored text, with the test-only loopback base preserved; candidate-is-not-publication, malformed JSON and unlisted refusals kept |
| U08 | `tests/unit/efs-uno-published-page.test.ts` | `376581a248b757bae4e0809d5811d5bfbaf4fb76` | `e6e8fbe0c7b2241e89c6db7781023950d0f7454f` | the obsolete "committed deployment serves nothing" suite replaced by exact three-Page serve/discovery/robots/sitemap positives, canonical and SEO agreement, out-of-set 404s and a separate unpublished/base-free synthetic refusal; scratch fixture refusal suite untouched |
| U09 | `tests/unit/efs-uno-route-address.test.ts` | `c197a96b64f48b2ef13cbc96412145d35df38de4` | `c2bcbd39f7c53f82b2aa5f4410e5be67a69924e3` | committed index now yields exactly three candidates at `/en-001`, `/en-001/about`, `/en-001/components` with one source kind each and no publication authority; candidate-vs-serving distinction and all case/duplicate/locale/foreign-Site/malicious-path refusals kept |
| U10 | `tests/unit/efs-uno-site-publication-inputs.test.ts` | `ad5999c9db1af8434c520cba5d8f4c40751de82c` | `7a65aecc7e49b3820b78b6dc349a378ce8b83c10` | committed composition reports three candidates and the reserved stored canonical with exact Site and locale mapping; test-only alternate-base proposals preserved; duplicate/owner/locale/alias/forged-property/hostile-input refusals kept |
| E01 | `.documents/Architecture/u06-starter.md` | NEW | `a0ef2cc128dabf7ec0a3b4e6d0b3cecc83376ad6` | new evidence ledger: declared graph and three sources, selection/canonical, preserved undeclared Markdown, visibility/SEO rules, proven positives/refusals, ownership/rights and the still-open U04/U05/U06/U07 gaps |

**Not changed:** `deployment/efs/content/home.en-001.md` remains byte-identical at Git blob
`ef4254a37778c38a575c4924901760a36650ad05` and is undeclared; `scripts/verify-u03-trace.mjs`,
`tests/deployment/u04-json-slice.test.mjs` and `tests/deployment/u03-fixture-transaction.test.mjs` were authorised but
required no change once the runners were re-pinned, so they keep their exact start blobs. No source implementation,
schema, parser, renderer, CSS, dependency, workflow, hook or provider file changed.

## 3. The committed starter contract

| Page | Route | Served address | Source | Publication | Visibility |
| --- | --- | --- | --- | --- | --- |
| `home` | `["home"]` reserved | `/en-001` | `deployment/efs/content/home.en-001.json` (JSON) | `published` | `public` |
| `about` | `["about"]` | `/en-001/about` | `deployment/efs/content/about.en-001.md` (Markdown) | `published` | public by policy (Markdown may not declare one) |
| `components` | `["components"]` | `/en-001/components` | `deployment/efs/content/components.en-001.json` (JSON) | `published` | `public` |

Selection: Entity `e_7a3knkx60eacyhca7a0cr1k6e1`, Facet `foundation`, Site `main`, supported/default locale `en-001`,
language preference `en → en-001`, reserved `base.canonical` `https://uno-starter.example` with `aliases: []`. The
`.example` origin is inert illustrative metadata approved by the Owner for local and hosted proof only: no owned
domain, DNS, TLS, environment binding, provider setting, deployment or ownership claim exists, and nothing here proves
a live website. Publication authority remains the manifest Page's own flag combined with the selected Site, the
committed base, the confined declared source and the validated visibility. The preserved `home.en-001.md` is neither
declared nor used as fallback: removing or corrupting the selected Home JSON refuses the whole Page.

## 4. Local evidence (Agent-observed, Windows, this checkout)

| Gate | Result | Observed |
| --- | --- | --- |
| `pnpm test:bootstrap` | PASS | bootstrap contract and scaffold verify |
| `node --test tests/governance-docs.test.mjs` / `node scripts/verify-governance-docs.mjs` | PASS / PASS | frozen governance bytes intact, positive and refusal cases |
| `pnpm test:architecture` | PASS | boundary suite |
| Focused ten U suites | PASS | 10 files, **386** tests |
| `pnpm test` | PASS | 30 files, **1,118** tests (from 1,107; the migration added assertions and deleted none) |
| `pnpm typecheck` / `pnpm lint` / `pnpm exec eslint . --max-warnings 0` | PASS / PASS / PASS | zero errors, zero warnings |
| Deployment suites (trace, fixture transaction, JSON slice, 22-module consent, Node 26 floor, security exception, brand copy, Vercel readiness) | PASS | eight suites |
| `node scripts/verify-vercel-readiness.mjs` / `node scripts/verify-u04-security-exception.mjs` | PASS / PASS | offline, no provider action |
| `node scripts/verify-u03-published-http.mjs` | PASS | **754 passed, 0 failed**; committed-starter build, loopback HTTP, SEO, sitemap, refusals and real Chromium ran before the reversible fixture, which restored byte-exact and rebuilt the committed head |
| `node scripts/verify-u04-json-slice.mjs` | PASS | **464 passed, 0 failed** |
| `node scripts/verify-u04-22-module-consent.mjs` | PASS | **733 passed, 0 failed**, unchanged predicate count, `FAMILY_BROWSER` and `DIVIDER_PARITY` pass |
| `pnpm build` / `node scripts/verify-u03-trace.mjs --expect committed` | PASS / PASS | bounded trace; the three declared sources shipped, nothing else from the repository |
| `pnpm test:http` (`verify-u01-http`) | PASS | **105 passed, 0 failed** |
| `node scripts/verify-u03-http.mjs` | PASS | **135 passed, 0 failed** |
| Declaration digests after every stateful runner and after both commits | PASS | manifest `b6213ed6…3c9925`, selection `58011c43…e8c952`; legacy Markdown unchanged |

Real committed behaviour observed locally: `/en-001`, `/en-001/about`, `/en-001/components` answer `200` with exactly
one `main` and one `h1`, the authored titles, `index, follow`, the reserved canonical and matching `og:url`, an
`en-001` alternate, and `x-default` only on the default Page; `HEAD` agrees with `GET`; `/en` answers one `307` to the
published root; `robots.txt` names `https://uno-starter.example/sitemap.xml`; `sitemap.xml` lists exactly three
canonical URLs; Chromium at 390px and 1280px shows no overflow, a keyboard-reachable control and a native disclosure
that toggles without script, with zero requests outside loopback. `/en-001/home`, `/de-001`, `/en-001/about/extra`,
`/en-001/components/extra`, an unknown segment and a percent-escaped segment remain genuine 404s. No outbound provider,
webhook, analytics event, geolocation, unsafe scheme or delivery claim was introduced.

## 5. Hosted evidence at the exact product commit

| Workflow | Commit | Result | Jobs |
| --- | --- | --- | --- |
| `Verify U01 baseline` (run `44913557489`) | `e38e0e6cd210570e7895da8b33ffec3638fd43e5` | PASS | `windows-2025` and `ubuntu-24.04`, every executed step success, no skipped mandatory step |
| `Uno Bootstrap Verify` (run `44913557531`) | `e38e0e6cd210570e7895da8b33ffec3638fd43e5` | PASS | `windows-2025` and `ubuntu-24.04`, governance, bootstrap tests and scaffold verify success |

Both hosted logs contain, on both operating systems: the committed-starter production build, `/en-001/components`
`200`, the three-address committed sitemap, the Components keyboard control, all `FAMILY_TEXT_FIVE_HTTP` labels, the
seventeen-section family browser matrix, `DIVIDER_PARITY`, and the issued counts `105/0`, `135/0`, `754/0`, `464/0`,
`733/0` with `1,118` unit tests. The Windows job visibly reports the pre-existing `DEP0190` deprecation warning and the
unwaived `1 moderate` development advisory; the production dependency graph audits clean and the high/critical counts
are zero. No hosted run was red, and no step was skipped for a mandatory gate.

## 6. Report-head checks (as at the moment of this overwrite)

| Item | Status |
| --- | --- |
| Frozen bootstrap against the newly written report | PASS (run before the report commit) |
| `tests/bootstrap.test.mjs`, `verify-bootstrap`, governance test and `verify-governance-docs` against the new report | PASS |
| Report-only staging (exactly one `M`), `git diff --check` and `git diff --cached --check` | PASS |
| Exact report-head `Verify U01 baseline` / `Uno Bootstrap Verify` on Ubuntu and Windows | **UNVERIFIED at write time** — deliberately not claimed here; observed separately after the report-only push |
| Independent Architect `ACCEPT / REVISE / STOP` | PENDING, not self-granted |

## 7. Rights, privacy and standing disclosures

Donor reference remains the pinned read-only `provelopment/provelopment-foundation` commit
`c05c55ea61b5347cf5032211dd0bf37f2cc5083c` with its Apache-2.0 `LICENSE` blob
`d645695673349e3947e8e5ae42332d0ac3164cd7`. This order used no donor implementation, no Foundation Solo Rust, no
separately licensed `modules/connect/**`, no brand, art or donor copy, and added no dependency, notice exception or
licence waiver. All authored copy is neutral Uno starter text; no private path, machine-specific profile path,
credential, token, ACTIVE text, activation message or runtime secret appears in the rendered HTML, static output,
logs, commit subject or this report. No release, domain purchase, DNS, TLS, Vercel setting, provider operation,
history rewrite, log purge or deployment occurred. Historical private-path exposure remains **unresolved — Owner
decision required**, and the earlier `UNO-WO-071`, `UNO-WO-072` and `UNO-WO-073` `REVISE` findings stand unchanged.

## 8. Accounting and what remains open

Unchanged: 22/22 modules, 4/4 asset zones, 16/16 browser matrix, 17/17 bounded donor family mappings, **1/17** fully
evidenced donor parity (`divider`), 16/17 below parity, 43/59 = 72.88% proxy. This run earns committed starter and
publication evidence only; it cannot raise 1/17 to 2/17 and closes no stage.

| Remaining gap | Status |
| --- | --- |
| U03 serving/publication assurance closure | NOT APPLICABLE to this order; serving evidence added, closure is Owner-controlled |
| U04 sixteen family parity gaps | OPEN, unchanged |
| U05 safe actions and provider gating | OPEN, outside this order |
| U06 two independent installs, clean-room/upgrade/rollback | OPEN; NOT DONE here |
| U07 security and release audit | OPEN, outside this order |
| Historical exposure remediation | OPEN, Owner decision required |
